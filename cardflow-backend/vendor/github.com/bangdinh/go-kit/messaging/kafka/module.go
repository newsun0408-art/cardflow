package kafka

import "go.uber.org/fx"

// Module wires the Kafka producer and consumer into the fx dependency graph.
// Both NewProducer and NewConsumer consume *Config, which is provided by
// config.ExtractProviders() via extractKafkaConfig in config/providers.go.
// fx instantiates each constructor only when something in the graph requests
// the corresponding type, so a producer-only service still won't construct a
// Consumer. The reverse is not true: ConsumerParams.DeadLetter is an optional
// Producer dependency (for the dead-letter-topic feature), so requesting a
// Consumer also constructs a Producer — a real broker dial and Writer, plus
// its OnStop lifecycle hook — even when no dead_letter_topic is configured.
var Module = fx.Module("kafka",
	fx.Provide(NewProducer),
	fx.Provide(NewConsumer),
)
