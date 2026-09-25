package auth

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"fullName"`
	Phone    string `json:"phone,omitempty"`
}

type LoginRequest struct {
	Identifier string `json:"identifier"` // Email or Phone number
	Email      string `json:"email"`      // Fallback
	Password   string `json:"password"`
}


type GoogleAuthRequest struct {
	GoogleID  string `json:"googleId"`
	Email     string `json:"email"`
	FullName  string `json:"fullName"`
	AvatarURL string `json:"avatarUrl,omitempty"`
}

type UserDTO struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	FullName  string `json:"fullName"`
	Phone     string `json:"phone,omitempty"`
	AvatarURL string `json:"avatarUrl,omitempty"`
	Role      string `json:"role"`
}

type AuthResponse struct {
	Token string  `json:"token"`
	User  UserDTO `json:"user"`
}
