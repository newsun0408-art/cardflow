package scylladb

import (
	"context"
	"crypto/tls"

	"github.com/gocql/gocql"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

var Module = fx.Module("scylladb",
	fx.Provide(NewHandler),
)

func NewHandler(lc fx.Lifecycle, cfg *Config, logger *zap.Logger) (ScyllaHandler, error) {
	cluster := gocql.NewCluster(cfg.Hosts...)
	cluster.Keyspace = cfg.Keyspace
	cluster.Consistency = parseConsistency(cfg.Consistency)
	cluster.Timeout = cfg.Timeout
	cluster.NumConns = cfg.NumConns
	cluster.Authenticator = buildAuthenticator(cfg)

	if cfg.TLS {
		cluster.SslOpts = &gocql.SslOptions{
			Config: &tls.Config{
				InsecureSkipVerify: !cfg.TLSHostVerification,
			},
		}
	}

	session, err := cluster.CreateSession()
	if err != nil {
		return nil, err
	}

	logger.Info("scylladb connected", zap.String("hosts", cfg.Addrs()))

	lc.Append(fx.Hook{
		OnStop: func(ctx context.Context) error {
			logger.Info("closing scylladb session")
			session.Close()
			return nil
		},
	})

	return &scyllaHandler{session: session}, nil
}

func parseConsistency(s string) gocql.Consistency {
	switch s {
	case "ANY":
		return gocql.Any
	case "ONE":
		return gocql.One
	case "TWO":
		return gocql.Two
	case "THREE":
		return gocql.Three
	case "QUORUM":
		return gocql.Quorum
	case "ALL":
		return gocql.All
	case "LOCAL_QUORUM":
		return gocql.LocalQuorum
	case "EACH_QUORUM":
		return gocql.EachQuorum
	case "LOCAL_ONE":
		return gocql.LocalOne
	default:
		return gocql.LocalQuorum
	}
}

func parseSerialConsistency(s string) gocql.SerialConsistency {
	switch s {
	case "SERIAL":
		return gocql.Serial
	case "LOCAL_SERIAL":
		return gocql.LocalSerial
	default:
		return gocql.Serial
	}
}
