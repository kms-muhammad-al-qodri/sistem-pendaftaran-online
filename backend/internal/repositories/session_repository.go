package repositories

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"daftarin-backend/internal/models"

	"gorm.io/gorm"
)

type SessionRepository interface {
	Create(session *models.Session) error
	FindByTokenHash(tokenHash string) (*models.Session, error)
	DeleteByTokenHash(tokenHash string) error
	DeleteByUserID(userID uint64) error
	LinkGuestRegistrations(email string, userID uint64) error
	HashToken(rawToken string) string
}

type sessionRepository struct {
	db *gorm.DB
}

func NewSessionRepository(db *gorm.DB) SessionRepository {
	return &sessionRepository{db: db}
}

func (r *sessionRepository) HashToken(rawToken string) string {
	hasher := sha256.New()
	hasher.Write([]byte(rawToken))
	return hex.EncodeToString(hasher.Sum(nil))
}

func (r *sessionRepository) Create(session *models.Session) error {
	return r.db.Create(session).Error
}

func (r *sessionRepository) FindByTokenHash(tokenHash string) (*models.Session, error) {
	var session models.Session
	err := r.db.Preload("User").Where("token_hash = ? AND expires_at > ?", tokenHash, time.Now().UTC()).First(&session).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &session, nil
}

func (r *sessionRepository) DeleteByTokenHash(tokenHash string) error {
	return r.db.Where("token_hash = ?", tokenHash).Delete(&models.Session{}).Error
}

func (r *sessionRepository) DeleteByUserID(userID uint64) error {
	return r.db.Where("user_id = ?", userID).Delete(&models.Session{}).Error
}

// LinkGuestRegistrations updates older guest registrations matching this email to the new user_id
func (r *sessionRepository) LinkGuestRegistrations(email string, userID uint64) error {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	return r.db.Model(&models.Registration{}).
		Where("email = ? AND user_id IS NULL", normalizedEmail).
		Update("user_id", userID).Error
}
