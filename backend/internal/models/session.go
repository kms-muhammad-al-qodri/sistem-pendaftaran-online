package models

import (
	"time"
)

type Session struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint64    `gorm:"not null;index:idx_sessions_user_id" json:"user_id"`
	TokenHash string    `gorm:"type:char(64);not null;uniqueIndex:uq_sessions_token_hash" json:"-"`
	ExpiresAt time.Time `gorm:"type:datetime(3);not null;index:idx_sessions_expires_at" json:"expires_at"`
	CreatedAt time.Time `gorm:"type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)" json:"created_at"`

	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}

func (Session) TableName() string {
	return "sessions"
}
