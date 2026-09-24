package mqtt

import (
	"context"
	"fmt"
	"time"

	paho "github.com/eclipse/paho.mqtt.golang"
	"github.com/prometheus/client_golang/prometheus"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

const (
	defaultConnectTimeout       = 10 * time.Second
	defaultMaxReconnectInterval = 2 * time.Minute
)

// mqttConnect is a variable so tests can inject a mock without a real broker.
var mqttConnect = func(opts *paho.ClientOptions, connectTimeout time.Duration) (paho.Client, error) {
	c := paho.NewClient(opts)
	token := c.Connect()
	if !token.WaitTimeout(connectTimeout) {
		return nil, fmt.Errorf("mqtt: connect timeout after %s", connectTimeout)
	}
	if err := token.Error(); err != nil {
		return nil, fmt.Errorf("mqtt: connect failed: %w", err)
	}
	return c, nil
}

var Module = fx.Module("mqtt",
	fx.Provide(NewHandler),
)

func NewHandler(lc fx.Lifecycle, cfg *Config, logger *zap.Logger, reg prometheus.Registerer) (MqttHandler, error) {
	connectTimeout := cfg.ConnectTimeout
	if connectTimeout == 0 {
		connectTimeout = defaultConnectTimeout
	}
	maxReconnect := cfg.MaxReconnectInterval
	if maxReconnect == 0 {
		maxReconnect = defaultMaxReconnectInterval
	}

	h := &mqttHandler{
		cfg:        cfg,
		logger:     logger,
		subs:       make(map[string]subscription),
		rpcWaiters: make(map[string][]*rpcWaiter),
	}
	h.initMetrics(reg)

	opts := paho.NewClientOptions().
		AddBroker(cfg.BrokerURL).
		SetClientID(cfg.ClientID).
		SetCleanSession(cfg.CleanSession).
		SetAutoReconnect(true).
		SetMaxReconnectInterval(maxReconnect).
		SetConnectTimeout(connectTimeout).
		SetOnConnectHandler(func(c paho.Client) {
			h.mu.RLock()
			subs := make(map[string]subscription, len(h.subs))
			for k, v := range h.subs {
				subs[k] = v
			}
			h.mu.RUnlock()

			for topic, sub := range subs {
				c.Subscribe(topic, sub.qos, h.pahoHandlerFor(topic, sub.handler))
			}
			if len(subs) > 0 {
				logger.Info("mqtt reconnected, re-subscribed topics", zap.Int("count", len(subs)))
			}
		}).
		SetConnectionLostHandler(func(_ paho.Client, err error) {
			logger.Warn("mqtt connection lost", zap.Error(err))
		})

	if cfg.Username != "" {
		opts.SetUsername(cfg.Username)
	}
	if cfg.Password != "" {
		opts.SetPassword(cfg.Password)
	}
	if cfg.KeepAlive > 0 {
		opts.SetKeepAlive(cfg.KeepAlive)
	}
	if cfg.TLS {
		tlsCfg, err := buildTLSConfig(cfg)
		if err != nil {
			return nil, err
		}
		opts.SetTLSConfig(tlsCfg)
	}

	client, err := mqttConnect(opts, connectTimeout)
	if err != nil {
		return nil, err
	}
	h.client = client

	logger.Info("mqtt connected", zap.String("addr", cfg.Addr()), zap.String("client_id", cfg.ClientID))

	lc.Append(fx.Hook{
		OnStop: func(_ context.Context) error {
			logger.Info("disconnecting mqtt client")
			h.Disconnect()
			return nil
		},
	})

	return h, nil
}
