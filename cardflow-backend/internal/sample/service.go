package sample

import (
	"context"

	"github.com/google/uuid"

	"github.com/bangdinh/go-kit/domain"
	apperrors "github.com/bangdinh/go-kit/errors"
)

// Service owns entity creation, business rules, and Entity->DTO mapping.
// Nhận Command (CreateInput), KHÔNG biết HTTP. Khi lỗi trả typed
// *apperrors.AppError (mang Code); HTTP status do central error handler suy ra.
type Service struct{ repo Repository }

// NewService creates a new Sample service.
func NewService(repo Repository) *Service { return &Service{repo: repo} }

// Create validate nghiệp vụ, tạo Entity, lưu, và trả DTO của resource vừa tạo.
func (s *Service) Create(ctx context.Context, in CreateInput) (Response, error) {
	if in.Name == "" {
		return Response{}, apperrors.ValidationFailed("name is required") // -> 422
	}

	e := Sample{
		ID:         uuid.Must(uuid.NewV7()).String(),
		Name:       in.Name,
		Timestamps: domain.NewTimestamps(),
	}
	// TODO: áp thêm business rule

	if err := s.repo.Create(ctx, e); err != nil {
		return Response{}, err // propagate typed error từ store
	}
	return toResponse(e), nil
}

// GetByID lấy sample theo id và map sang DTO.
func (s *Service) GetByID(ctx context.Context, id string) (Response, error) {
	e, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return Response{}, err // vd store trả apperrors.NotFound -> 404
	}
	return toResponse(e), nil
}

// toResponse map domain entity -> DTO cho client (chỗ cắt gọt field expose).
func toResponse(e Sample) Response {
	return Response{
		ID:   e.ID,
		Name: e.Name,
	}
}
