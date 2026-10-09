package repositories

import (
	"errors"
	"fmt"
	"strings"

	"daftarin-backend/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type EventFilter struct {
	Status    string
	Search    string
	Limit     int
	Offset    int
	IsPublic  bool
}

type EventRepository interface {
	Create(event *models.Event) error
	Update(event *models.Event) error
	Delete(id uint64) error
	FindByID(id uint64) (*models.Event, error)
	FindBySlug(slug string) (*models.Event, error)
	FindByIDForUpdate(tx *gorm.DB, id uint64) (*models.Event, error)
	FindAll(filter EventFilter) ([]models.Event, int64, error)
	CountRegistrations(eventID uint64) (int64, error)
	CountRegistrationsTx(tx *gorm.DB, eventID uint64) (int64, error)
	GenerateUniqueSlug(title string, eventID uint64) string
	GetDB() *gorm.DB
}

type eventRepository struct {
	db *gorm.DB
}

func NewEventRepository(db *gorm.DB) EventRepository {
	return &eventRepository{db: db}
}

func (r *eventRepository) GetDB() *gorm.DB {
	return r.db
}

func (r *eventRepository) Create(event *models.Event) error {
	return r.db.Create(event).Error
}

func (r *eventRepository) Update(event *models.Event) error {
	return r.db.Save(event).Error
}

func (r *eventRepository) Delete(id uint64) error {
	return r.db.Delete(&models.Event{}, id).Error
}

func (r *eventRepository) FindByID(id uint64) (*models.Event, error) {
	var event models.Event
	err := r.db.Preload("Creator").First(&event, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &event, nil
}

func (r *eventRepository) FindBySlug(slug string) (*models.Event, error) {
	var event models.Event
	err := r.db.Preload("Creator").Where("slug = ?", slug).First(&event).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &event, nil
}

// FindByIDForUpdate performs row locking (SELECT ... FOR UPDATE) inside a DB transaction to prevent quota race conditions
func (r *eventRepository) FindByIDForUpdate(tx *gorm.DB, id uint64) (*models.Event, error) {
	var event models.Event
	err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&event, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &event, nil
}

func (r *eventRepository) FindAll(filter EventFilter) ([]models.Event, int64, error) {
	var events []models.Event
	var total int64

	query := r.db.Model(&models.Event{})

	if filter.IsPublic {
		query = query.Where("status = ?", models.EventStatusPublished)
	} else if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}

	if filter.Search != "" {
		searchTerm := "%" + strings.ToLower(filter.Search) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(location) LIKE ? OR LOWER(description) LIKE ?", searchTerm, searchTerm, searchTerm)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if filter.Limit > 0 {
		query = query.Limit(filter.Limit).Offset(filter.Offset)
	}

	err := query.Preload("Creator").Order("starts_at ASC, id DESC").Find(&events).Error
	if err != nil {
		return nil, 0, err
	}

	return events, total, nil
}

func (r *eventRepository) CountRegistrations(eventID uint64) (int64, error) {
	var count int64
	err := r.db.Model(&models.Registration{}).
		Where("event_id = ? AND status IN (?, ?)", eventID, models.RegistrationStatusPending, models.RegistrationStatusConfirmed).
		Count(&count).Error
	return count, err
}

func (r *eventRepository) CountRegistrationsTx(tx *gorm.DB, eventID uint64) (int64, error) {
	var count int64
	err := tx.Model(&models.Registration{}).
		Where("event_id = ? AND status IN (?, ?)", eventID, models.RegistrationStatusPending, models.RegistrationStatusConfirmed).
		Count(&count).Error
	return count, err
}

func (r *eventRepository) GenerateUniqueSlug(title string, eventID uint64) string {
	baseSlug := slugify(title)
	if baseSlug == "" {
		baseSlug = "event"
	}

	slug := baseSlug
	counter := 1

	for {
		var existing models.Event
		query := r.db.Where("slug = ?", slug)
		if eventID > 0 {
			query = query.Where("id != ?", eventID)
		}

		err := query.First(&existing).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			break
		}

		slug = fmt.Sprintf("%s-%d", baseSlug, counter)
		counter++
	}

	return slug
}

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	var result strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			result.WriteRune(r)
		} else if r == ' ' || r == '-' || r == '_' {
			if result.Len() > 0 && result.String()[result.Len()-1] != '-' {
				result.WriteRune('-')
			}
		}
	}
	return strings.Trim(result.String(), "-")
}
