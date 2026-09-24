package app

import (
	"context"
	"fmt"
	"os"
	"time"

	"go.uber.org/fx"
	"go.uber.org/fx/fxevent"
	"go.uber.org/zap"
)

type App struct {
	fxApp        *fx.App
	options      []fx.Option
	name         string
	startTimeout time.Duration
	stopTimeout  time.Duration
	drainDelay   time.Duration // delay before shutdown to let LB drain connections
	logger       *zap.Logger
	fxLogger     fxevent.Logger
	extraOptions []fx.Option
}

func New(opts ...Option) (*App, error) {
	a := &App{
		name:         "app",
		startTimeout: 15 * time.Second,
		stopTimeout:  15 * time.Second,
	}

	for _, opt := range opts {
		opt.apply(a)
	}

	// Supply DrainDelay into the fx graph so server modules can inject it.
	a.extraOptions = append(a.extraOptions, fx.Supply(DrainDelay(a.drainDelay)))

	fxOpts := a.buildFxOptions()

	a.fxApp = fx.New(fxOpts...)

	if err := a.fxApp.Err(); err != nil {
		return nil, fmt.Errorf("framework: failed to initialize app: %w", err)
	}

	return a, nil
}

func (a *App) buildFxOptions() []fx.Option {
	base := []fx.Option{
		fx.StartTimeout(a.startTimeout),
		fx.StopTimeout(a.stopTimeout),
	}

	if a.fxLogger != nil {
		base = append(base, fx.WithLogger(func() fxevent.Logger {
			return a.fxLogger
		}))
	}

	base = append(base, a.options...)
	base = append(base, a.extraOptions...)

	return base
}

func (a *App) Run() {
	a.fxApp.Run()
}

// DrainDelay is a named type supplied into the fx graph.
// Server modules sleep this duration after receiving SIGTERM before
// starting graceful shutdown, giving load balancers time to deregister.
type DrainDelay time.Duration

func (a *App) Start(ctx context.Context) error {
	return a.fxApp.Start(ctx)
}

func (a *App) Stop(ctx context.Context) error {
	return a.fxApp.Stop(ctx)
}

func (a *App) Done() <-chan os.Signal {
	return a.fxApp.Done()
}

func (a *App) Err() error {
	return a.fxApp.Err()
}
