package app

import (
	"time"

	"go.uber.org/fx"
	"go.uber.org/fx/fxevent"
	"go.uber.org/zap"
)

type Option interface {
	apply(*App)
}

type optionFunc func(*App)

func (f optionFunc) apply(a *App) { f(a) }

func WithName(name string) Option {
	return optionFunc(func(a *App) {
		a.name = name
	})
}

func WithStartTimeout(d time.Duration) Option {
	return optionFunc(func(a *App) {
		a.startTimeout = d
	})
}

func WithStopTimeout(d time.Duration) Option {
	return optionFunc(func(a *App) {
		a.stopTimeout = d
	})
}

func WithLogger(logger *zap.Logger) Option {
	return optionFunc(func(a *App) {
		a.logger = logger
		a.fxLogger = &fxevent.ZapLogger{Logger: logger}
		// Also supply into the fx graph so modules can inject *zap.Logger.
		a.options = append(a.options, fx.Supply(logger))
	})
}

func WithFxLogger(l fxevent.Logger) Option {
	return optionFunc(func(a *App) {
		a.fxLogger = l
	})
}

func WithModule(name string, opts ...fx.Option) Option {
	return optionFunc(func(a *App) {
		a.options = append(a.options, fx.Module(name, opts...))
	})
}

func WithFxModule(module fx.Option) Option {
	return optionFunc(func(a *App) {
		a.options = append(a.options, module)
	})
}

func WithProviders(constructors ...any) Option {
	return optionFunc(func(a *App) {
		a.options = append(a.options, fx.Provide(constructors...))
	})
}

func WithInvokers(funcs ...any) Option {
	return optionFunc(func(a *App) {
		a.options = append(a.options, fx.Invoke(funcs...))
	})
}

func WithFxOption(opts ...fx.Option) Option {
	return optionFunc(func(a *App) {
		a.extraOptions = append(a.extraOptions, opts...)
	})
}

func WithConfig(cfg any) Option {
	return optionFunc(func(a *App) {
		a.options = append(a.options, fx.Supply(cfg))
	})
}

func Options(opts ...Option) Option {
	return optionGroup(opts)
}

type optionGroup []Option

func (og optionGroup) apply(a *App) {
	for _, opt := range og {
		opt.apply(a)
	}
}

// WithDrainDelay sets a delay before shutdown starts, giving load balancers
// (e.g. Kubernetes) time to deregister the pod. The service continues serving
// during this window. Default: 0 (no delay). Production default: 5s.
func WithDrainDelay(d time.Duration) Option {
	return optionFunc(func(a *App) {
		a.drainDelay = d
	})
}

func Production() Option {
	return Options(
		WithStartTimeout(30*time.Second),
		WithStopTimeout(30*time.Second),
		WithDrainDelay(5*time.Second),
	)
}

func Development() Option {
	return Options(
		WithStartTimeout(60*time.Second),
		WithStopTimeout(5*time.Second),
	)
}
