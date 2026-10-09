package models

import (
	"time"
)

type RegistrationStatus string

const (
	RegistrationStatusPending   RegistrationStatus = "pending"
	RegistrationStatusConfirmed RegistrationStatus = "confirmed"
	RegistrationStatusRejected  RegistrationStatus = "rejected"
	RegistrationStatusCancelled RegistrationStatus = "cancelled"
)

type Registration struct {
	ID                 uint64             `gorm:"primaryKey;autoIncrement" json:"id"`
	EventID            uint64             `gorm:"not null;uniqueIndex:uq_event_email" json:"event_id"`
	UserID             *uint64            `gorm:"index:idx_registration_user" json:"user_id"`
	RegistrationNumber string             `gorm:"type:varchar(40);not null;uniqueIndex:uq_registration_number" json:"registration_number"`
	Name               string             `gorm:"type:varchar(120);not null" json:"name"`
	Email              string             `gorm:"type:varchar(254);not null;uniqueIndex:uq_event_email" json:"email"`
	Phone              string             `gorm:"type:varchar(30);not null" json:"phone"`
	Institution        *string            `gorm:"type:varchar(180)" json:"institution"`
	Status             RegistrationStatus `gorm:"type:enum('pending','confirmed','rejected','cancelled');not null;default:'pending'" json:"status"`
	RejectionReason    *string            `gorm:"type:varchar(500)" json:"rejection_reason"`
	CreatedAt          time.Time          `gorm:"type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)" json:"created_at"`
	UpdatedAt          time.Time          `gorm:"type:datetime(3);not null;default:CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)" json:"updated_at"`

	Event Event `gorm:"foreignKey:EventID;constraint:OnDelete:RESTRICT" json:"event,omitempty"`
	User  *User `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL" json:"user,omitempty"`
}

func (Registration) TableName() string {
	return "registrations"
}
