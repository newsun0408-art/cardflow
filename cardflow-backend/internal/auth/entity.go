package auth

import "time"

type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	FullName     string    `json:"fullName"`
	Phone        string    `json:"phone,omitempty"`
	GoogleID     string    `json:"googleId,omitempty"`
	AvatarURL    string    `json:"avatarUrl,omitempty"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}
