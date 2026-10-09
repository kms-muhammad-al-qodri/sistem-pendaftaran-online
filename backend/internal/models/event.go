package models

import (
	"time"
)

type EventStatus string

const (
	EventStatusDraft     EventStatus = "draft"
	EventStatusPublished EventStatus = "published"
	EventStatusCancelled EventStatus = "cancelled"
	EventStatusCompleted EventStatus = "completed"
)

type Event struct {
	ID                   uint64      `gorm:"primaryKey;autoIncrement" json:"id"`
	CreatedBy            uint64      `gorm:"not null" json:"created_by"`
	Slug                 string      `gorm:"type:varchar(180);not null;uniqueIndex:uq_events_slug" json:"slug"`
	Title                string      `gorm:"type:varchar(200);not null" json:"title"`
	Description          string      `gorm:"type:text;not null" json:"description"`
	Location             string      `gorm:"type:varchar(255);not null" json:"location"`
	ImageURL             *string     `gorm:"type:varchar(500)" json:"image_url"`
	StartsAt             time.Time   `gorm:"type:datetime(3);not null" json:"starts_at"`
	EndsAt               time.Time   `gorm:"type:datetime(3);not null" json:"ends_at"`
	RegistrationOpensAt  time.Time   `gorm:"type:datetime(3);not null" json:"registration_opens_at"`
	RegistrationClosesAt time.Time   `gorm:"type:datetime(3);not null" json:"registration_closes_at"`
	Quota                uint32      `gorm:"not null" json:"quota"`
	Status               EventStatus `gorm:"type:enum('draft','published','cancelled','completed');not null;default:'draft'" json:"status"`
	CreatedAt            time.Time   `gorm:"type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)" json:"created_at"`
	UpdatedAt            time.Time   `gorm:"type:datetime(3);not null;default:CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)" json:"updated_at"`

	Creator       User           `gorm:"foreignKey:CreatedBy;constraint:OnDelete:RESTRICT" json:"creator,omitempty"`
	Registrations []Registration `gorm:"foreignKey:EventID" json:"registrations,omitempty"`
}

func (Event) TableName() string {
	return "events"
}
