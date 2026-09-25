package auth

import "context"

type Repository interface {
	Create(ctx context.Context, user *User) error
	FindByEmail(ctx context.Context, email string) (*User, error)
	FindByPhone(ctx context.Context, phone string) (*User, error)
	FindByEmailOrPhone(ctx context.Context, identifier string) (*User, error)
	FindByID(ctx context.Context, id string) (*User, error)
	FindByGoogleID(ctx context.Context, googleID string) (*User, error)
	UpdateGoogleAuth(ctx context.Context, userID, googleID, avatarURL string) error
}

