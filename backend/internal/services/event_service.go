package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"daftarin-backend/internal/models"
	"daftarin-backend/internal/repositories"
)

type CreateEventRequest struct {
	Title                string  `json:"title" binding:"required,min=3,max=200"`
	Description          string  `json:"description" binding:"required"`
	Location             string  `json:"location" binding:"required,max=255"`
	ImageURL             *string `json:"image_url"`
	StartsAt             string  `json:"starts_at" binding:"required"`
	EndsAt               string  `json:"ends_at" binding:"required"`
	RegistrationOpensAt  string  `json:"registration_opens_at" binding:"required"`
	RegistrationClosesAt string  `json:"registration_closes_at" binding:"required"`
	Quota                uint32  `json:"quota" binding:"required,gt=0"`
	Status               string  `json:"status"`
}

type UpdateEventRequest struct {
	Title                string  `json:"title" binding:"required,min=3,max=200"`
	Description          string  `json:"description" binding:"required"`
	Location             string  `json:"location" binding:"required,max=255"`
	ImageURL             *string `json:"image_url"`
	StartsAt             string  `json:"starts_at" binding:"required"`
	EndsAt               string  `json:"ends_at" binding:"required"`
	RegistrationOpensAt  string  `json:"registration_opens_at" binding:"required"`
	RegistrationClosesAt string  `json:"registration_closes_at" binding:"required"`
	Quota                uint32  `json:"quota" binding:"required,gt=0"`
	Status               string  `json:"status" binding:"required"`
}

type EventDetailResponse struct {
	models.Event
	RegisteredCount int64 `json:"registered_count"`
	RemainingQuota  int64 `json:"remaining_quota"`
	IsOpen          bool  `json:"is_open"`
}

type AdminDashboardStats struct {
	TotalEvents        int64 `json:"total_events"`
	PublishedEvents    int64 `json:"published_events"`
	TotalRegistrations int64 `json:"total_registrations"`
	PendingCount       int64 `json:"pending_count"`
	ConfirmedCount     int64 `json:"confirmed_count"`
	RejectedCount      int64 `json:"rejected_count"`
}

type EventService interface {
	CreateEvent(userID uint64, req CreateEventRequest) (*models.Event, error)
	UpdateEvent(eventID uint64, req UpdateEventRequest) (*models.Event, error)
	DeleteEvent(eventID uint64) error
	GetPublicEvents(search string, page, limit int) ([]EventDetailResponse, int64, error)
	GetPublicEventBySlug(slug string) (*EventDetailResponse, error)
	GetAdminEvents(search, status string, page, limit int) ([]EventDetailResponse, int64, error)
	GetAdminEventByID(id uint64) (*EventDetailResponse, error)
	GetAdminDashboardStats() (*AdminDashboardStats, error)
}

type eventService struct {
	eventRepo repositories.EventRepository
	regRepo   repositories.RegistrationRepository
}

func NewEventService(eventRepo repositories.EventRepository, regRepo repositories.RegistrationRepository) EventService {
	return &eventService{
		eventRepo: eventRepo,
		regRepo:   regRepo,
	}
}

func parseTime(s string) (time.Time, error) {
	formats := []string{
		time.RFC3339,
		time.RFC3339Nano,
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02T15:04:05",
		"2006-01-02T15:04",
		"2006-01-02 15:04:05",
		"2006-01-02 15:04",
	}
	trimmed := strings.TrimSpace(s)
	for _, f := range formats {
		if t, err := time.Parse(f, trimmed); err == nil {
			return t, nil
		}
	}
	return time.Time{}, errors.New("cannot parse time: " + s)
}

func (s *eventService) CreateEvent(userID uint64, req CreateEventRequest) (*models.Event, error) {
	startsAt, err := parseTime(req.StartsAt)
	if err != nil {
		return nil, errors.New("INVALID_STARTS_AT_FORMAT")
	}
	endsAt, err := parseTime(req.EndsAt)
	if err != nil {
		return nil, errors.New("INVALID_ENDS_AT_FORMAT")
	}
	regOpensAt, err := parseTime(req.RegistrationOpensAt)
	if err != nil {
		return nil, errors.New("INVALID_REGISTRATION_OPENS_AT_FORMAT")
	}
	regClosesAt, err := parseTime(req.RegistrationClosesAt)
	if err != nil {
		return nil, errors.New("INVALID_REGISTRATION_CLOSES_AT_FORMAT")
	}

	if !endsAt.After(startsAt) {
		return nil, errors.New("ENDS_AT_MUST_BE_AFTER_STARTS_AT")
	}
	if !regClosesAt.After(regOpensAt) {
		return nil, errors.New("REGISTRATION_CLOSES_AT_MUST_BE_AFTER_OPENS_AT")
	}

	status := models.EventStatusDraft
	if req.Status != "" {
		status = models.EventStatus(req.Status)
	}

	slug := s.eventRepo.GenerateUniqueSlug(req.Title, 0)

	event := &models.Event{
		CreatedBy:            userID,
		Slug:                 slug,
		Title:                strings.TrimSpace(req.Title),
		Description:          strings.TrimSpace(req.Description),
		Location:             strings.TrimSpace(req.Location),
		ImageURL:             req.ImageURL,
		StartsAt:             startsAt.UTC(),
		EndsAt:               endsAt.UTC(),
		RegistrationOpensAt:  regOpensAt.UTC(),
		RegistrationClosesAt: regClosesAt.UTC(),
		Quota:                req.Quota,
		Status:               status,
	}

	if err := s.eventRepo.Create(event); err != nil {
		return nil, fmt.Errorf("failed to create event: %w", err)
	}

	return event, nil
}

func (s *eventService) UpdateEvent(eventID uint64, req UpdateEventRequest) (*models.Event, error) {
	existing, err := s.eventRepo.FindByID(eventID)
	if err != nil || existing == nil {
		return nil, errors.New("EVENT_NOT_FOUND")
	}

	startsAt, err := parseTime(req.StartsAt)
	if err != nil {
		return nil, errors.New("INVALID_STARTS_AT_FORMAT")
	}
	endsAt, err := parseTime(req.EndsAt)
	if err != nil {
		return nil, errors.New("INVALID_ENDS_AT_FORMAT")
	}
	regOpensAt, err := parseTime(req.RegistrationOpensAt)
	if err != nil {
		return nil, errors.New("INVALID_REGISTRATION_OPENS_AT_FORMAT")
	}
	regClosesAt, err := parseTime(req.RegistrationClosesAt)
	if err != nil {
		return nil, errors.New("INVALID_REGISTRATION_CLOSES_AT_FORMAT")
	}

	if !endsAt.After(startsAt) {
		return nil, errors.New("ENDS_AT_MUST_BE_AFTER_STARTS_AT")
	}
	if !regClosesAt.After(regOpensAt) {
		return nil, errors.New("REGISTRATION_CLOSES_AT_MUST_BE_AFTER_OPENS_AT")
	}

	// Update slug if title changed meaningfully
	if existing.Title != req.Title {
		existing.Slug = s.eventRepo.GenerateUniqueSlug(req.Title, existing.ID)
	}

	newStatus := models.EventStatus(req.Status)
	oldStatus := existing.Status

	existing.Title = strings.TrimSpace(req.Title)
	existing.Description = strings.TrimSpace(req.Description)
	existing.Location = strings.TrimSpace(req.Location)
	existing.ImageURL = req.ImageURL
	existing.StartsAt = startsAt.UTC()
	existing.EndsAt = endsAt.UTC()
	existing.RegistrationOpensAt = regOpensAt.UTC()
	existing.RegistrationClosesAt = regClosesAt.UTC()
	existing.Quota = req.Quota
	existing.Status = newStatus

	if err := s.eventRepo.Update(existing); err != nil {
		return nil, fmt.Errorf("failed to update event: %w", err)
	}

	// Auto-Cascade Cancellation: If event was changed to cancelled, update all active registrations to cancelled
	if newStatus == models.EventStatusCancelled && oldStatus != models.EventStatusCancelled {
		_ = s.regRepo.CascadeCancelByEventID(existing.ID)
	}

	return existing, nil
}

func (s *eventService) DeleteEvent(eventID uint64) error {
	existing, err := s.eventRepo.FindByID(eventID)
	if err != nil || existing == nil {
		return errors.New("EVENT_NOT_FOUND")
	}

	// Rule: Cannot delete event if it already has registrations!
	count, err := s.eventRepo.CountRegistrations(eventID)
	if err != nil {
		return err
	}
	if count > 0 {
		return errors.New("CANNOT_DELETE_EVENT_WITH_REGISTRATIONS")
	}

	return s.eventRepo.Delete(eventID)
}

func (s *eventService) enrichEventDetail(event models.Event) EventDetailResponse {
	registeredCount, _ := s.eventRepo.CountRegistrations(event.ID)
	remainingQuota := int64(event.Quota) - registeredCount
	if remainingQuota < 0 {
		remainingQuota = 0
	}

	now := time.Now().UTC()
	isOpen := event.Status == models.EventStatusPublished &&
		now.After(event.RegistrationOpensAt) &&
		now.Before(event.RegistrationClosesAt) &&
		remainingQuota > 0

	return EventDetailResponse{
		Event:           event,
		RegisteredCount: registeredCount,
		RemainingQuota:  remainingQuota,
		IsOpen:          isOpen,
	}
}

func (s *eventService) GetPublicEvents(search string, page, limit int) ([]EventDetailResponse, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}
	offset := (page - 1) * limit

	filter := repositories.EventFilter{
		IsPublic: true,
		Search:   search,
		Limit:    limit,
		Offset:   offset,
	}

	events, total, err := s.eventRepo.FindAll(filter)
	if err != nil {
		return nil, 0, err
	}

	var responseList []EventDetailResponse
	for _, ev := range events {
		responseList = append(responseList, s.enrichEventDetail(ev))
	}

	return responseList, total, nil
}

func (s *eventService) GetPublicEventBySlug(slug string) (*EventDetailResponse, error) {
	event, err := s.eventRepo.FindBySlug(slug)
	if err != nil || event == nil {
		return nil, errors.New("EVENT_NOT_FOUND")
	}
	if event.Status != models.EventStatusPublished {
		return nil, errors.New("EVENT_NOT_PUBLISHED")
	}
	res := s.enrichEventDetail(*event)
	return &res, nil
}

func (s *eventService) GetAdminEvents(search, status string, page, limit int) ([]EventDetailResponse, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	filter := repositories.EventFilter{
		IsPublic: false,
		Status:   status,
		Search:   search,
		Limit:    limit,
		Offset:   offset,
	}

	events, total, err := s.eventRepo.FindAll(filter)
	if err != nil {
		return nil, 0, err
	}

	var responseList []EventDetailResponse
	for _, ev := range events {
		responseList = append(responseList, s.enrichEventDetail(ev))
	}

	return responseList, total, nil
}

func (s *eventService) GetAdminEventByID(id uint64) (*EventDetailResponse, error) {
	event, err := s.eventRepo.FindByID(id)
	if err != nil || event == nil {
		return nil, errors.New("EVENT_NOT_FOUND")
	}
	res := s.enrichEventDetail(*event)
	return &res, nil
}

func (s *eventService) GetAdminDashboardStats() (*AdminDashboardStats, error) {
	events, totalEvents, err := s.eventRepo.FindAll(repositories.EventFilter{})
	if err != nil {
		return nil, err
	}

	var publishedEvents int64
	for _, ev := range events {
		if ev.Status == models.EventStatusPublished {
			publishedEvents++
		}
	}

	regs, totalRegistrations, err := s.regRepo.FindAll(repositories.RegistrationFilter{})
	if err != nil {
		return nil, err
	}

	var pendingCount, confirmedCount, rejectedCount int64
	for _, r := range regs {
		switch r.Status {
		case models.RegistrationStatusPending:
			pendingCount++
		case models.RegistrationStatusConfirmed:
			confirmedCount++
		case models.RegistrationStatusRejected:
			rejectedCount++
		}
	}

	return &AdminDashboardStats{
		TotalEvents:        totalEvents,
		PublishedEvents:    publishedEvents,
		TotalRegistrations: totalRegistrations,
		PendingCount:       pendingCount,
		ConfirmedCount:     confirmedCount,
		RejectedCount:      rejectedCount,
	}, nil
}
