package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

var (
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	phoneRegex = regexp.MustCompile(`^0(3|5|7|8|9)[0-9]{8}$`)
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Register(ctx context.Context, req RegisterRequest) (*AuthResponse, error) {
	email := strings.TrimSpace(strings.ToLower(req.Email))
	if email == "" || !emailRegex.MatchString(email) {
		return nil, errors.New("định dạng email không hợp lệ (VD: user@example.com)")
	}

	phone := strings.TrimSpace(req.Phone)
	phone = strings.ReplaceAll(phone, " ", "")
	phone = strings.ReplaceAll(phone, "-", "")
	phone = strings.ReplaceAll(phone, ".", "")
	if strings.HasPrefix(phone, "+84") {
		phone = "0" + phone[3:]
	}

	if phone == "" {
		return nil, errors.New("vui lòng nhập số điện thoại")
	}
	if !phoneRegex.MatchString(phone) {
		return nil, errors.New("số điện thoại không hợp lệ (yêu cầu 10 số đầu 03, 05, 07, 08, 09)")
	}

	if len(req.Password) < 6 {
		return nil, errors.New("mật khẩu phải có ít nhất 6 ký tự")
	}

	fullName := strings.TrimSpace(req.FullName)
	if fullName == "" {
		return nil, errors.New("vui lòng nhập họ và tên của bạn")
	}

	// 1. Check if email already used
	existingEmail, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if existingEmail != nil {
		return nil, errors.New("email này đã được sử dụng")
	}

	// 2. Check if phone already used
	existingPhone, err := s.repo.FindByPhone(ctx, phone)
	if err != nil {
		return nil, err
	}
	if existingPhone != nil {
		return nil, errors.New("số điện thoại này đã được đăng ký tài khoản khác")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("không thể mã hóa mật khẩu")
	}

	randomBytes := make([]byte, 4)
	_, _ = rand.Read(randomBytes)
	newUserID := fmt.Sprintf("usr-%s", hex.EncodeToString(randomBytes))

	user := &User{
		ID:           newUserID,
		Email:        email,
		PasswordHash: string(hashed),
		FullName:     fullName,
		Phone:        phone,
		Role:         "cardholder",
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, err
	}

	token := fmt.Sprintf("tok_%s_%d", user.ID, time.Now().Unix())

	return &AuthResponse{
		Token: token,
		User: UserDTO{
			ID:       user.ID,
			Email:    user.Email,
			FullName: user.FullName,
			Phone:    user.Phone,
			Role:     user.Role,
		},
	}, nil
}

func (s *Service) Login(ctx context.Context, req LoginRequest) (*AuthResponse, error) {
	identifier := strings.TrimSpace(req.Identifier)
	if identifier == "" {
		identifier = strings.TrimSpace(req.Email)
	}

	if identifier == "" || req.Password == "" {
		return nil, errors.New("vui lòng nhập email hoặc số điện thoại và mật khẩu")
	}

	// Clean up if it looks like a phone number
	cleanIdentifier := identifier
	cleanedPhone := strings.ReplaceAll(identifier, " ", "")
	cleanedPhone = strings.ReplaceAll(cleanedPhone, "-", "")
	cleanedPhone = strings.ReplaceAll(cleanedPhone, ".", "")
	if strings.HasPrefix(cleanedPhone, "+84") {
		cleanedPhone = "0" + cleanedPhone[3:]
	}

	var user *User
	var err error

	// If contains @, treat as email
	if strings.Contains(cleanIdentifier, "@") {
		user, err = s.repo.FindByEmail(ctx, strings.ToLower(cleanIdentifier))
	} else if phoneRegex.MatchString(cleanedPhone) {
		user, err = s.repo.FindByPhone(ctx, cleanedPhone)
	} else {
		// Fallback to searching both
		user, err = s.repo.FindByEmailOrPhone(ctx, strings.ToLower(cleanIdentifier))
	}

	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("tài khoản hoặc mật khẩu không chính xác")
	}

	if user.PasswordHash == "" {
		return nil, errors.New("tài khoản này được đăng ký qua Google, vui lòng đăng nhập bằng Google")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("tài khoản hoặc mật khẩu không chính xác")
	}

	token := fmt.Sprintf("tok_%s_%d", user.ID, time.Now().Unix())

	return &AuthResponse{
		Token: token,
		User: UserDTO{
			ID:        user.ID,
			Email:     user.Email,
			FullName:  user.FullName,
			Phone:     user.Phone,
			AvatarURL: user.AvatarURL,
			Role:      user.Role,
		},
	}, nil
}


func (s *Service) GetMe(ctx context.Context, userID string) (*UserDTO, error) {
	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("không tìm thấy người dùng")
	}

	return &UserDTO{
		ID:        user.ID,
		Email:     user.Email,
		FullName:  user.FullName,
		Phone:     user.Phone,
		AvatarURL: user.AvatarURL,
		Role:      user.Role,
	}, nil
}

func (s *Service) GoogleAuth(ctx context.Context, req GoogleAuthRequest) (*AuthResponse, error) {
	req.GoogleID = strings.TrimSpace(req.GoogleID)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.FullName = strings.TrimSpace(req.FullName)

	if req.GoogleID == "" && req.Email == "" {
		return nil, errors.New("thông tin tài khoản Google không hợp lệ")
	}

	// 1. Check if user with google_id already exists
	var user *User
	var err error
	if req.GoogleID != "" {
		user, err = s.repo.FindByGoogleID(ctx, req.GoogleID)
		if err != nil {
			return nil, err
		}
	}

	// 2. If not found by google_id, check by email to link account
	if user == nil && req.Email != "" {
		user, err = s.repo.FindByEmail(ctx, req.Email)
		if err != nil {
			return nil, err
		}

		if user != nil {
			// Update existing account with google_id and avatar_url
			if err := s.repo.UpdateGoogleAuth(ctx, user.ID, req.GoogleID, req.AvatarURL); err != nil {
				return nil, err
			}
			user.GoogleID = req.GoogleID
			if req.AvatarURL != "" {
				user.AvatarURL = req.AvatarURL
			}
		}
	}

	// 3. If account does not exist, create a new user (Auto-registration)
	if user == nil {
		randomBytes := make([]byte, 4)
		_, _ = rand.Read(randomBytes)
		newUserID := fmt.Sprintf("usr-%s", hex.EncodeToString(randomBytes))

		fullName := req.FullName
		if fullName == "" {
			parts := strings.Split(req.Email, "@")
			if len(parts) > 0 && parts[0] != "" {
				fullName = parts[0]
			} else {
				fullName = "Khách Hàng Google"
			}
		}

		user = &User{
			ID:        newUserID,
			Email:     req.Email,
			FullName:  fullName,
			GoogleID:  req.GoogleID,
			AvatarURL: req.AvatarURL,
			Role:      "cardholder",
		}

		if err := s.repo.Create(ctx, user); err != nil {
			return nil, err
		}
	}

	token := fmt.Sprintf("tok_%s_%d", user.ID, time.Now().Unix())

	return &AuthResponse{
		Token: token,
		User: UserDTO{
			ID:        user.ID,
			Email:     user.Email,
			FullName:  user.FullName,
			Phone:     user.Phone,
			AvatarURL: user.AvatarURL,
			Role:      user.Role,
		},
	}, nil
}

