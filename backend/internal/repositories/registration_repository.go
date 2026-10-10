package repositories

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"daftarin-backend/internal/models"

	"gorm.io/gorm"
)

type RegistrationFilter struct {
	EventID uint64
	UserID  uint64
	Status  string
	Search  string
	Limit   int
	Offset  int
}

type RegistrationRepository interface {
	CreateTx(tx *gorm.DB, registration *models.Registration) error
	Update(registration *models.Registration) error
	FindByID(id uint64) (*models.Registration, error)
	FindByRegistrationNumber(num string) (*models.Registration, error)
	FindByEmail(email string) ([]models.Registration, error)
	FindByEventAndEmail(eventID uint64, email string) (*models.Registration, error)
	FindByEventAndEmailTx(tx *gorm.DB, eventID uint64, email string) (*models.Registration, error)
	FindAll(filter RegistrationFilter) ([]models.Registration, int64, error)
	CascadeCancelByEventID(eventID uint64) error
	GenerateRegistrationNumber() string
}

type registrationRepository struct {
	db *gorm.DB
}

func NewRegistrationRepository(db *gorm.DB) RegistrationRepository {
	return &registrationRepository{db: db}
}

func (r *registrationRepository) CreateTx(tx *gorm.DB, registration *models.Registration) error {
	registration.Email = strings.ToLower(strings.TrimSpace(registration.Email))
	return tx.Create(registration).Error
}

func (r *registrationRepository) Update(registration *models.Registration) error {
	return r.db.Save(registration).Error
}

func (r *registrationRepository) FindByID(id uint64) (*models.Registration, error) {
	var reg models.Registration
	err := r.db.Preload("Event").Preload("User").First(&reg, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &reg, nil
}

func (r *registrationRepository) FindByRegistrationNumber(num string) (*models.Registration, error) {
	var reg models.Registration
	err := r.db.Preload("Event").Preload("User").Where("registration_number = ?", num).First(&reg).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &reg, nil
}

func (r *registrationRepository) FindByEmail(email string) ([]models.Registration, error) {
	var list []models.Registration
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	err := r.db.Preload("Event").Preload("User").Where("email = ?", normalizedEmail).Order("id DESC").Find(&list).Error
	if err != nil {
		return nil, err
	}
	return list, nil
}

func (r *registrationRepository) FindByEventAndEmail(eventID uint64, email string) (*models.Registration, error) {
	var reg models.Registration
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	err := r.db.Where("event_id = ? AND email = ?", eventID, normalizedEmail).First(&reg).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &reg, nil
}

func (r *registrationRepository) FindByEventAndEmailTx(tx *gorm.DB, eventID uint64, email string) (*models.Registration, error) {
	var reg models.Registration
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	err := tx.Where("event_id = ? AND email = ?", eventID, normalizedEmail).First(&reg).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &reg, nil
}

func (r *registrationRepository) FindAll(filter RegistrationFilter) ([]models.Registration, int64, error) {
	var list []models.Registration
	var total int64

	query := r.db.Model(&models.Registration{})

	if filter.EventID > 0 {
		query = query.Where("event_id = ?", filter.EventID)
	}

	if filter.UserID > 0 {
		query = query.Where("user_id = ?", filter.UserID)
	}

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}

	if filter.Search != "" {
		searchTerm := "%" + strings.ToLower(filter.Search) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(registration_number) LIKE ? OR LOWER(institution) LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if filter.Limit > 0 {
		query = query.Limit(filter.Limit).Offset(filter.Offset)
	}

	err := query.Preload("Event").Preload("User").Order("id DESC").Find(&list).Error
	if err != nil {
		return nil, 0, err
	}

	return list, total, nil
}

func (r *registrationRepository) CascadeCancelByEventID(eventID uint64) error {
	return r.db.Model(&models.Registration{}).
		Where("event_id = ? AND status IN (?, ?)", eventID, models.RegistrationStatusPending, models.RegistrationStatusConfirmed).
		Update("status", models.RegistrationStatusCancelled).Error
}

func (r *registrationRepository) GenerateRegistrationNumber() string {
	now := time.Now().Format("20060102")
	n, _ := rand.Int(rand.Reader, big.NewInt(899999))
	randNum := n.Int64() + 100000
	return fmt.Sprintf("REG-%s-%d", now, randNum)
}
