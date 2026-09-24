package mqtt

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"os"
	"sync"
	"time"

	paho "github.com/eclipse/paho.mqtt.golang"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"go.uber.org/zap"
)

// MessageHandler is called when a message arrives on a subscribed topic.
type MessageHandler func(topic string, payload []byte)

// MqttHandler is the MQTT interface exposed by this package.
type MqttHandler interface {
	// Check implements observability.HealthChecker.
	Check(ctx context.Context) error
	// Publish sends payload to topic with the given QoS level (0, 1, or 2).
	Publish(ctx context.Context, topic string, qos byte, retained bool, payload []byte) error
	// Subscribe registers handler for topic (supports wildcards + and #).
	// The subscription is re-registered automatically after a reconnect.
	Subscribe(topic string, qos byte, handler MessageHandler) error
	// Unsubscribe removes the subscription for topic.
	Unsubscribe(topic string) error
	// Disconnect cleanly closes the connection.
	Disconnect()
	// RPC publishes payload to topic and waits for a correlated reply on replyTopic.
	// The correlation ID is derived from the JSON payload's "MessageType" and "Serial" fields.
	RPC(ctx context.Context, topic, replyTopic string, qos byte, payload []byte, timeout time.Duration) ([]byte, error)
	// RPCWithCorrelationID is like RPC but uses an explicit correlation ID.
	// The response must still contain "MessageType" and "Serial" JSON fields for matching.
	RPCWithCorrelationID(ctx context.Context, topic, replyTopic, correlationID string, qos byte, payload []byte, timeout time.Duration) ([]byte, error)
}

type subscription struct {
	qos     byte
	handler MessageHandler
}

type rpcWaiter struct {
	correlationID string
	ch            chan []byte
}

type mqttHandler struct {
	cfg    *Config
	client paho.Client
	logger *zap.Logger

	mu         sync.RWMutex
	subs       map[string]subscription
	rpcWaiters map[string][]*rpcWaiter

	publishTotal    *prometheus.CounterVec
	publishDuration *prometheus.HistogramVec
	subscribeTotal  *prometheus.CounterVec
	rpcTotal        *prometheus.CounterVec
	rpcDuration     *prometheus.HistogramVec
}

func (h *mqttHandler) initMetrics(reg prometheus.Registerer) {
	factory := promauto.With(reg)
	h.publishTotal = factory.NewCounterVec(prometheus.CounterOpts{
		Name: "mqtt_publish_total",
		Help: "Total MQTT publish operations",
	}, []string{"topic", "status"})
	h.publishDuration = factory.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "mqtt_publish_duration_seconds",
		Help:    "MQTT publish latency in seconds",
		Buckets: prometheus.DefBuckets,
	}, []string{"topic"})
	h.subscribeTotal = factory.NewCounterVec(prometheus.CounterOpts{
		Name: "mqtt_subscribe_total",
		Help: "Total MQTT subscribe operations",
	}, []string{"topic"})
	h.rpcTotal = factory.NewCounterVec(prometheus.CounterOpts{
		Name: "mqtt_rpc_total",
		Help: "Total MQTT RPC calls",
	}, []string{"topic", "result"})
	h.rpcDuration = factory.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "mqtt_rpc_duration_seconds",
		Help:    "MQTT RPC latency in seconds",
		Buckets: prometheus.DefBuckets,
	}, []string{"topic"})
}

func (h *mqttHandler) Check(_ context.Context) error {
	if !h.client.IsConnected() {
		return fmt.Errorf("mqtt: not connected")
	}
	return nil
}

func (h *mqttHandler) Publish(ctx context.Context, topic string, qos byte, retained bool, payload []byte) error {
	start := time.Now()
	token := h.client.Publish(topic, qos, retained, payload)

	if dl, ok := ctx.Deadline(); ok {
		if !token.WaitTimeout(time.Until(dl)) {
			h.publishTotal.WithLabelValues(topic, "timeout").Inc()
			return fmt.Errorf("mqtt publish: timeout")
		}
	} else {
		token.Wait()
	}

	if err := token.Error(); err != nil {
		h.publishTotal.WithLabelValues(topic, "error").Inc()
		return fmt.Errorf("mqtt publish: %w", err)
	}

	h.publishTotal.WithLabelValues(topic, "ok").Inc()
	h.publishDuration.WithLabelValues(topic).Observe(time.Since(start).Seconds())
	return nil
}

func (h *mqttHandler) Subscribe(topic string, qos byte, handler MessageHandler) error {
	h.mu.Lock()
	h.subs[topic] = subscription{qos: qos, handler: handler}
	h.mu.Unlock()

	token := h.client.Subscribe(topic, qos, h.pahoHandlerFor(topic, handler))
	token.Wait()
	if err := token.Error(); err != nil {
		h.mu.Lock()
		delete(h.subs, topic)
		h.mu.Unlock()
		return fmt.Errorf("mqtt subscribe: %w", err)
	}

	h.subscribeTotal.WithLabelValues(topic).Inc()
	return nil
}

func (h *mqttHandler) pahoHandlerFor(topic string, handler MessageHandler) paho.MessageHandler {
	return func(_ paho.Client, msg paho.Message) {
		handler(msg.Topic(), msg.Payload())
	}
}

func (h *mqttHandler) Unsubscribe(topic string) error {
	h.mu.Lock()
	delete(h.subs, topic)
	h.mu.Unlock()

	token := h.client.Unsubscribe(topic)
	token.Wait()
	if err := token.Error(); err != nil {
		return fmt.Errorf("mqtt unsubscribe: %w", err)
	}
	return nil
}

func (h *mqttHandler) Disconnect() {
	h.client.Disconnect(250)
}

func (h *mqttHandler) RPC(ctx context.Context, topic, replyTopic string, qos byte, payload []byte, timeout time.Duration) ([]byte, error) {
	var msg struct {
		MessageType string `json:"MessageType"`
		Serial      string `json:"Serial"`
	}
	if err := json.Unmarshal(payload, &msg); err != nil || msg.MessageType == "" || msg.Serial == "" {
		return nil, fmt.Errorf("mqtt rpc: missing MessageType or Serial in payload")
	}
	return h.rpc(ctx, topic, replyTopic, msg.MessageType+"-"+msg.Serial, qos, payload, timeout)
}

func (h *mqttHandler) RPCWithCorrelationID(ctx context.Context, topic, replyTopic, correlationID string, qos byte, payload []byte, timeout time.Duration) ([]byte, error) {
	return h.rpc(ctx, topic, replyTopic, correlationID, qos, payload, timeout)
}

func (h *mqttHandler) rpc(ctx context.Context, topic, replyTopic, correlationID string, qos byte, payload []byte, timeout time.Duration) ([]byte, error) {
	ch := make(chan []byte, 1)
	waiter := &rpcWaiter{correlationID: correlationID, ch: ch}

	var needSubscribe bool
	h.mu.Lock()
	if h.rpcWaiters[replyTopic] == nil {
		h.rpcWaiters[replyTopic] = make([]*rpcWaiter, 0)
		needSubscribe = true
	}
	h.rpcWaiters[replyTopic] = append(h.rpcWaiters[replyTopic], waiter)
	h.mu.Unlock()

	if needSubscribe {
		h.client.Subscribe(replyTopic, 2, h.rpcReplyHandlerFor(replyTopic)).Wait()
	}

	start := time.Now()
	if err := h.Publish(ctx, topic, qos, false, payload); err != nil {
		h.removeRPCWaiter(replyTopic, waiter)
		return nil, fmt.Errorf("mqtt rpc: %w", err)
	}

	select {
	case resp := <-ch:
		h.rpcTotal.WithLabelValues(topic, "success").Inc()
		h.rpcDuration.WithLabelValues(topic).Observe(time.Since(start).Seconds())
		return resp, nil
	case <-time.After(timeout):
		h.removeRPCWaiter(replyTopic, waiter)
		h.rpcTotal.WithLabelValues(topic, "timeout").Inc()
		return nil, fmt.Errorf("mqtt rpc: timeout")
	case <-ctx.Done():
		h.removeRPCWaiter(replyTopic, waiter)
		return nil, fmt.Errorf("mqtt rpc: %w", ctx.Err())
	}
}

func (h *mqttHandler) rpcReplyHandlerFor(replyTopic string) paho.MessageHandler {
	return func(_ paho.Client, msg paho.Message) {
		var resp struct {
			MessageType string `json:"MessageType"`
			Serial      string `json:"Serial"`
		}
		body := msg.Payload()
		if err := json.Unmarshal(body, &resp); err != nil {
			return
		}
		correlationID := resp.MessageType + "-" + resp.Serial

		h.mu.RLock()
		waiters := make([]*rpcWaiter, len(h.rpcWaiters[replyTopic]))
		copy(waiters, h.rpcWaiters[replyTopic])
		h.mu.RUnlock()

		for _, w := range waiters {
			if w.correlationID == correlationID {
				select {
				case w.ch <- body:
				default:
				}
				return
			}
		}
	}
}

func (h *mqttHandler) removeRPCWaiter(replyTopic string, waiter *rpcWaiter) {
	h.mu.Lock()
	defer h.mu.Unlock()
	waiters := h.rpcWaiters[replyTopic]
	for i, w := range waiters {
		if w == waiter {
			h.rpcWaiters[replyTopic] = append(waiters[:i], waiters[i+1:]...)
			break
		}
	}
	if len(h.rpcWaiters[replyTopic]) == 0 {
		delete(h.rpcWaiters, replyTopic)
		h.client.Unsubscribe(replyTopic)
	}
}

func buildTLSConfig(cfg *Config) (*tls.Config, error) {
	tlsCfg := &tls.Config{}

	if cfg.CACert != "" {
		ca, err := os.ReadFile(cfg.CACert)
		if err != nil {
			return nil, fmt.Errorf("mqtt tls: read CA cert: %w", err)
		}
		pool := x509.NewCertPool()
		if !pool.AppendCertsFromPEM(ca) {
			return nil, fmt.Errorf("mqtt tls: invalid CA cert")
		}
		tlsCfg.RootCAs = pool
	}

	if cfg.ClientCert != "" && cfg.ClientKey != "" {
		cert, err := tls.LoadX509KeyPair(cfg.ClientCert, cfg.ClientKey)
		if err != nil {
			return nil, fmt.Errorf("mqtt tls: load client cert/key: %w", err)
		}
		tlsCfg.Certificates = []tls.Certificate{cert}
	}

	return tlsCfg, nil
}
