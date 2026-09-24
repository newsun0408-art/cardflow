package validation

import (
	"bytes"
	"context"
	"encoding/json"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// NewGRPCInterceptor returns a unary server interceptor that marshals the request
// message to JSON and validates it against cfg.Schema before calling the handler.
// If cfg.Schema is nil, validation is skipped.
func NewGRPCInterceptor(cfg GRPCConfig) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		if err := validateGRPCMessage(req, cfg); err != nil {
			return nil, err
		}
		return handler(ctx, req)
	}
}

// NewGRPCStreamInterceptor returns a stream server interceptor that validates each
// received message against cfg.Schema before forwarding it to the handler.
// If cfg.Schema is nil, validation is skipped.
func NewGRPCStreamInterceptor(cfg GRPCConfig) grpc.StreamServerInterceptor {
	return func(srv any, ss grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
		return handler(srv, &validatingStream{ServerStream: ss, cfg: cfg})
	}
}

type validatingStream struct {
	grpc.ServerStream
	cfg GRPCConfig
}

func (s *validatingStream) RecvMsg(m any) error {
	if err := s.ServerStream.RecvMsg(m); err != nil {
		return err
	}
	return validateGRPCMessage(m, s.cfg)
}

// validateGRPCMessage marshals msg to JSON, then validates against cfg.Schema
// using the global schema cache. Returns a gRPC status error on failure.
func validateGRPCMessage(msg any, cfg GRPCConfig) error {
	if cfg.Schema == nil {
		return nil
	}

	b, err := json.Marshal(msg)
	if err != nil {
		return status.Errorf(codes.Internal, "marshal request for validation: %v", err)
	}

	dec := json.NewDecoder(bytes.NewReader(b))
	dec.UseNumber()
	var v any
	if err := dec.Decode(&v); err != nil {
		return status.Errorf(codes.Internal, "decode request for validation: %v", err)
	}

	errs, err := validateNamespace(v, cfg.Schema)
	if err != nil {
		return status.Errorf(codes.Internal, "schema validation: %v", err)
	}
	if len(errs) > 0 {
		return status.Errorf(codes.InvalidArgument, "validation failed: %v", errs)
	}
	return nil
}
