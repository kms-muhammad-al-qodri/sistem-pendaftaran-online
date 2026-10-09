package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"daftarin-backend/internal/config"
	"daftarin-backend/internal/models"
	"daftarin-backend/internal/repositories"

	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=120"`
	Email    string `json:"email" binding:"required,email,max=254"`
	Password string `json:"password" binding:"required,min=6,max=100"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthService interface {
	Register(req RegisterRequest) (*models.User, string, error)
	Login(req LoginRequest) (*models.User, string, error)
	Logout(rawToken string) error
	ValidateSession(rawToken string) (*models.User, error)
}

type authService struct {
	userRepo    repositories.UserRepository
	sessionRepo repositories.SessionRepository
	cfg         *config.Config
}

func NewAuthService(userRepo repositories.UserRepository, sessionRepo repositories.SessionRepository, cfg *config.Config) AuthService {
	return &authService{
		userRepo:    userRepo,
		sessionRepo: sessionRepo,
		cfg:         cfg,
	}
}

func (s *authService) generateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func (s *authService) Register(req RegisterRequest) (*models.User, string, error) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(req.Email))

	// Check if email already registered
	existingUser, err := s.userRepo.FindByEmail(normalizedEmail)
	if err != nil {
		return nil, "", fmt.Errorf("failed to query user: %w", err)
	}
	if existingUser != nil {
		return nil, "", errors.New("EMAIL_ALREADY_REGISTERED")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", fmt.Errorf("failed to hash password: %w", err)
	}

	newUser := &models.User{
		Name:         strings.TrimSpace(req.Name),
		Email:        normalizedEmail,
		PasswordHash: string(hashedPassword),
		Role:         models.RoleParticipant,
	}

	if err := s.userRepo.Create(newUser); err != nil {
		return nil, "", fmt.Errorf("failed to create user: %w", err)
	}

	// Auto-link previous guest registrations with this email to new user ID
	_ = s.sessionRepo.LinkGuestRegistrations(normalizedEmail, newUser.ID)

	// Create session
	rawToken, err := s.generateToken()
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	tokenHash := s.sessionRepo.HashToken(rawToken)
	expiresAt := time.Now().UTC().Add(time.Duration(s.cfg.SessionMaxAgeHour) * time.Hour)

	session := &models.Session{
		UserID:    newUser.ID,
		TokenHash: tokenHash,
		ExpiresAt: expiresAt,
	}

	if err := s.sessionRepo.Create(session); err != nil {
		return nil, "", fmt.Errorf("failed to create session: %w", err)
	}

	return newUser, rawToken, nil
}

func (s *authService) Login(req LoginRequest) (*models.User, string, error) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(req.Email))

	user, err := s.userRepo.FindByEmail(normalizedEmail)
	if err != nil {
		return nil, "", fmt.Errorf("database query error: %w", err)
	}

	// Standard security: do not leak whether email or password was wrong
	if user == nil {
		return nil, "", errors.New("INVALID_CREDENTIALS")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, "", errors.New("INVALID_CREDENTIALS")
	}

	// Generate session
	rawToken, err := s.generateToken()
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate session token: %w", err)
	}

	tokenHash := s.sessionRepo.HashToken(rawToken)
	expiresAt := time.Now().UTC().Add(time.Duration(s.cfg.SessionMaxAgeHour) * time.Hour)

	session := &models.Session{
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: expiresAt,
	}

	if err := s.sessionRepo.Create(session); err != nil {
		return nil, "", fmt.Errorf("failed to save session: %w", err)
	}

	return user, rawToken, nil
}

func (s *authService) Logout(rawToken string) error {
	if rawToken == "" {
		return nil
	}
	tokenHash := s.sessionRepo.HashToken(rawToken)
	return s.sessionRepo.DeleteByTokenHash(tokenHash)
}

func (s *authService) ValidateSession(rawToken string) (*models.User, error) {
	if rawToken == "" {
		return nil, errors.New("TOKEN_MISSING")
	}

	tokenHash := s.sessionRepo.HashToken(rawToken)
	session, err := s.sessionRepo.FindByTokenHash(tokenHash)
	if err != nil {
		return nil, err
	}
	if session == nil {
		return nil, errors.New("SESSION_EXPIRED_OR_INVALID")
	}

	return &session.User, nil
}
