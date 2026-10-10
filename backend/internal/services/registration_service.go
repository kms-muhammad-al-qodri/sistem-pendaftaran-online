package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"daftarin-backend/internal/models"
	"daftarin-backend/internal/repositories"

	"gorm.io/gorm"
)

type RegisterEventRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=120"`
	Email       string `json:"email" binding:"required,email,max=254"`
	Phone       string `json:"phone" binding:"required,min=6,max=30"`
	Institution string `json:"institution" binding:"max=180"`
	AcceptTerms bool   `json:"accept_terms"`
}

type UpdateRegistrationStatusRequest struct {
	Status          string `json:"status" binding:"required"`
	RejectionReason string `json:"rejection_reason"`
}

type RegistrationService interface {
	RegisterForEvent(eventID uint64, currentUser *models.User, req RegisterEventRequest) (*models.Registration, error)
	UpdateStatus(registrationID uint64, req UpdateRegistrationStatusRequest) (*models.Registration, error)
	GetParticipantRegistrations(userID uint64, page, limit int) ([]models.Registration, int64, error)
	GetAdminRegistrations(eventID uint64, search, status string, page, limit int) ([]models.Registration, int64, error)
	GetRegistrationByID(id uint64) (*models.Registration, error)
	GetRegistrationByNumber(num string) (*models.Registration, error)
	LookupRegistration(query string) ([]models.Registration, error)
}

type registrationService struct {
	eventRepo repositories.EventRepository
	regRepo   repositories.RegistrationRepository
}

func NewRegistrationService(eventRepo repositories.EventRepository, regRepo repositories.RegistrationRepository) RegistrationService {
	return &registrationService{
		eventRepo: eventRepo,
		regRepo:   regRepo,
	}
}

func (s *registrationService) RegisterForEvent(eventID uint64, currentUser *models.User, req RegisterEventRequest) (*models.Registration, error) {
	if !req.AcceptTerms {
		return nil, errors.New("TERMS_NOT_ACCEPTED")
	}

	normalizedEmail := strings.ToLower(strings.TrimSpace(req.Email))
	db := s.eventRepo.GetDB()

	var createdRegistration *models.Registration

	// Perform all validation & creation inside a strict GORM DB Transaction with Row Locking
	err := db.Transaction(func(tx *gorm.DB) error {
		// 1. Lock event row to prevent race conditions during concurrent registration requests
		event, err := s.eventRepo.FindByIDForUpdate(tx, eventID)
		if err != nil || event == nil {
			return errors.New("EVENT_NOT_FOUND")
		}

		// 2. Validate Event Publication Status
		if event.Status != models.EventStatusPublished {
			return errors.New("EVENT_NOT_PUBLISHED")
		}

		// 3. Validate Registration Open Period
		now := time.Now().UTC()
		if now.Before(event.RegistrationOpensAt) {
			return errors.New("REGISTRATION_NOT_YET_OPEN")
		}
		if now.After(event.RegistrationClosesAt) {
			return errors.New("REGISTRATION_CLOSED")
		}

		// 4. Check Duplicate Registration for this Email & Event
		existingReg, err := s.regRepo.FindByEventAndEmailTx(tx, eventID, normalizedEmail)
		if err != nil {
			return fmt.Errorf("failed to query duplicate registration: %w", err)
		}
		if existingReg != nil {
			return errors.New("ALREADY_REGISTERED_FOR_EVENT")
		}

		// 5. Atomic Quota Verification (Count active pending + confirmed registrations)
		activeCount, err := s.eventRepo.CountRegistrationsTx(tx, eventID)
		if err != nil {
			return fmt.Errorf("failed to count active registrations: %w", err)
		}

		if activeCount >= int64(event.Quota) {
			return errors.New("EVENT_QUOTA_FULL")
		}

		// 6. Associate user_id if participant is logged in
		var userIDPtr *uint64
		if currentUser != nil {
			userIDPtr = &currentUser.ID
		}

		regNum := s.regRepo.GenerateRegistrationNumber()

		var inst *string
		if strings.TrimSpace(req.Institution) != "" {
			trimmedInst := strings.TrimSpace(req.Institution)
			inst = &trimmedInst
		}

		newReg := &models.Registration{
			EventID:            eventID,
			UserID:             userIDPtr,
			RegistrationNumber: regNum,
			Name:               strings.TrimSpace(req.Name),
			Email:              normalizedEmail,
			Phone:              strings.TrimSpace(req.Phone),
			Institution:        inst,
			Status:             models.RegistrationStatusPending,
		}

		if err := s.regRepo.CreateTx(tx, newReg); err != nil {
			return fmt.Errorf("failed to insert registration: %w", err)
		}

		createdRegistration = newReg
		return nil
	})

	if err != nil {
		return nil, err
	}

	return s.regRepo.FindByID(createdRegistration.ID)
}

func (s *registrationService) UpdateStatus(registrationID uint64, req UpdateRegistrationStatusRequest) (*models.Registration, error) {
	reg, err := s.regRepo.FindByID(registrationID)
	if err != nil || reg == nil {
		return nil, errors.New("REGISTRATION_NOT_FOUND")
	}

	newStatus := models.RegistrationStatus(req.Status)
	switch newStatus {
	case models.RegistrationStatusConfirmed, models.RegistrationStatusPending, models.RegistrationStatusCancelled:
		reg.Status = newStatus
		reg.RejectionReason = nil
	case models.RegistrationStatusRejected:
		if strings.TrimSpace(req.RejectionReason) == "" {
			return nil, errors.New("REJECTION_REASON_REQUIRED")
		}
		reason := strings.TrimSpace(req.RejectionReason)
		reg.Status = newStatus
		reg.RejectionReason = &reason
	default:
		return nil, errors.New("INVALID_REGISTRATION_STATUS")
	}

	if err := s.regRepo.Update(reg); err != nil {
		return nil, fmt.Errorf("failed to update registration status: %w", err)
	}

	return reg, nil
}

func (s *registrationService) GetParticipantRegistrations(userID uint64, page, limit int) ([]models.Registration, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}
	offset := (page - 1) * limit

	filter := repositories.RegistrationFilter{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	}

	return s.regRepo.FindAll(filter)
}

func (s *registrationService) GetAdminRegistrations(eventID uint64, search, status string, page, limit int) ([]models.Registration, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	filter := repositories.RegistrationFilter{
		EventID: eventID,
		Status:  status,
		Search:  search,
		Limit:   limit,
		Offset:  offset,
	}

	return s.regRepo.FindAll(filter)
}

func (s *registrationService) GetRegistrationByID(id uint64) (*models.Registration, error) {
	reg, err := s.regRepo.FindByID(id)
	if err != nil || reg == nil {
		return nil, errors.New("REGISTRATION_NOT_FOUND")
	}
	return reg, nil
}

func (s *registrationService) GetRegistrationByNumber(num string) (*models.Registration, error) {
	trimmedNum := strings.TrimSpace(num)
	if trimmedNum == "" {
		return nil, errors.New("REGISTRATION_NOT_FOUND")
	}
	reg, err := s.regRepo.FindByRegistrationNumber(trimmedNum)
	if err != nil || reg == nil {
		return nil, errors.New("REGISTRATION_NOT_FOUND")
	}
	return reg, nil
}

func (s *registrationService) LookupRegistration(query string) ([]models.Registration, error) {
	trimmed := strings.TrimSpace(query)
	if trimmed == "" {
		return []models.Registration{}, nil
	}

	// 1. Try finding by registration number
	reg, err := s.regRepo.FindByRegistrationNumber(trimmed)
	if err == nil && reg != nil {
		return []models.Registration{*reg}, nil
	}

	// 2. Try finding by email
	if strings.Contains(trimmed, "@") {
		return s.regRepo.FindByEmail(trimmed)
	}

	// 3. Fallback search
	list, _, err := s.regRepo.FindAll(repositories.RegistrationFilter{
		Search: trimmed,
		Limit:  20,
	})
	if err != nil {
		return nil, err
	}
	return list, nil
}
