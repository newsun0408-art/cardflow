# messaging/kafka

Kafka producer/consumer for fx apps (segmentio/kafka-go).

## Consumer ack modes

| `consumer.ack_mode` | Handler returns nil | Handler returns error |
|---|---|---|
| `auto` (default) | commit | log + **commit** (legacy) |
| `manual` | commit | retry with backoff; `kafka.ErrDeadLetter` or `max_retries` reached → publish `DeadLetter` to `dead_letter_topic`, then commit. No `dead_letter_topic` → keep retrying forever (never lose a message). |

Manual mode implements "do not ack until effects are durable": run your DB transaction inside the handler and return nil only after commit.

### Retry semantics in manual mode

`max_retries: 0` (or omitting it) uses the default of 5 in manual mode — it does not mean unbounded. To retry a message indefinitely without ever dead-lettering it, leave `dead_letter_topic` empty; that is the only way to get unbounded retries, regardless of the `max_retries` setting. If `dead_letter_topic` is set but `max_retries` is 0, the message will be dead-lettered after 5 attempts.

```json
"kafka": {
  "brokers": ["kafka:9092"],
  "consumer": {
    "group_id": "decision-brain-matcher",
    "topics": ["perception.iva.observation.v1.created"],
    "ack_mode": "manual",
    "retry_backoff": "500ms",
    "max_retry_backoff": "30s",
    "max_retries": 5,
    "dead_letter_topic": "decision.brain.dlq.v1"
  }
}
```

`dead_letter_topic` requires a `kafka.Producer` in the fx graph (`kafka.Module` provides one). Handlers signal permanent failure with `errors.Join(kafka.ErrDeadLetter, cause)`.

## API

- `NewConsumer(ConsumerParams) (Consumer, error)` — fx constructor; `ConsumerParams.DeadLetter` is optional.
- `Consumer.Subscribe(ctx, MessageHandler) error` — blocks until ctx is cancelled.
- `NewProducer(lc, *Config, *zap.Logger) (Producer, error)`; `Producer.Publish(ctx, topic, key, value)`.
- `DeadLetter` — JSON envelope: topic, partition, offset, key, headers, value, error, attempts, failedAt.
