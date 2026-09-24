package domain

import "context"

type UseCase[Input any, Output any] interface {
	Execute(ctx context.Context, input Input) (Output, error)
}

type CommandUseCase[Input any] interface {
	Execute(ctx context.Context, input Input) error
}

type QueryUseCase[Output any] interface {
	Execute(ctx context.Context) (Output, error)
}
