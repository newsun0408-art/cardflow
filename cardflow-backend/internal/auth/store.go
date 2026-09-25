package auth

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

type Store struct {
	pool   *pgxpool.Pool
	logger *zap.Logger
}

func NewStore(pool *pgxpool.Pool, logger *zap.Logger) *Store {
	return &Store{pool: pool, logger: logger}
}

func (s *Store) Create(ctx context.Context, u *User) error {
	query := `
		INSERT INTO users (id, email, password_hash, full_name, phone, role, google_id, avatar_url, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	now := time.Now()
	u.CreatedAt = now
	u.UpdatedAt = now

	var pwdHash *string
	if u.PasswordHash != "" {
		pwdHash = &u.PasswordHash
	}
	var phone *string
	if u.Phone != "" {
		phone = &u.Phone
	}
	var googleID *string
	if u.GoogleID != "" {
		googleID = &u.GoogleID
	}
	var avatarURL *string
	if u.AvatarURL != "" {
		avatarURL = &u.AvatarURL
	}

	_, err := s.pool.Exec(ctx, query, u.ID, u.Email, pwdHash, u.FullName, phone, u.Role, googleID, avatarURL, u.CreatedAt, u.UpdatedAt)
	return err
}

func (s *Store) FindByEmail(ctx context.Context, email string) (*User, error) {
	query := `
		SELECT id, email, COALESCE(password_hash, ''), full_name, COALESCE(phone, ''), role, COALESCE(google_id, ''), COALESCE(avatar_url, ''), created_at, updated_at
		FROM users
		WHERE email = $1
	`
	var u User
	err := s.pool.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Phone, &u.Role, &u.GoogleID, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (s *Store) FindByPhone(ctx context.Context, phone string) (*User, error) {
	query := `
		SELECT id, email, COALESCE(password_hash, ''), full_name, COALESCE(phone, ''), role, COALESCE(google_id, ''), COALESCE(avatar_url, ''), created_at, updated_at
		FROM users
		WHERE phone = $1
	`
	var u User
	err := s.pool.QueryRow(ctx, query, phone).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Phone, &u.Role, &u.GoogleID, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (s *Store) FindByEmailOrPhone(ctx context.Context, identifier string) (*User, error) {
	query := `
		SELECT id, email, COALESCE(password_hash, ''), full_name, COALESCE(phone, ''), role, COALESCE(google_id, ''), COALESCE(avatar_url, ''), created_at, updated_at
		FROM users
		WHERE email = $1 OR phone = $1
	`
	var u User
	err := s.pool.QueryRow(ctx, query, identifier).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Phone, &u.Role, &u.GoogleID, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}


func (s *Store) FindByID(ctx context.Context, id string) (*User, error) {
	query := `
		SELECT id, email, COALESCE(password_hash, ''), full_name, COALESCE(phone, ''), role, COALESCE(google_id, ''), COALESCE(avatar_url, ''), created_at, updated_at
		FROM users
		WHERE id = $1
	`
	var u User
	err := s.pool.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Phone, &u.Role, &u.GoogleID, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (s *Store) FindByGoogleID(ctx context.Context, googleID string) (*User, error) {
	query := `
		SELECT id, email, COALESCE(password_hash, ''), full_name, COALESCE(phone, ''), role, COALESCE(google_id, ''), COALESCE(avatar_url, ''), created_at, updated_at
		FROM users
		WHERE google_id = $1
	`
	var u User
	err := s.pool.QueryRow(ctx, query, googleID).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Phone, &u.Role, &u.GoogleID, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (s *Store) UpdateGoogleAuth(ctx context.Context, userID, googleID, avatarURL string) error {
	query := `
		UPDATE users
		SET google_id = $1, avatar_url = $2, updated_at = $3
		WHERE id = $4
	`
	now := time.Now()
	_, err := s.pool.Exec(ctx, query, googleID, avatarURL, now, userID)
	return err
}

