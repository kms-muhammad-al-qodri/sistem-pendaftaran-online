package models

import (
	"time"
)

type UserRole string

const (
	RoleAdmin       UserRole = "admin"
	RoleParticipant UserRole = "participant"
)

type User struct {
	ID           uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name         string    `gorm:"type:varchar(120);not null" json:"name"`
	Email        string    `gorm:"type:varchar(254);not null;uniqueIndex:uq_users_email" json:"email"`
	PasswordHash string    `gorm:"type:varchar(255);not null" json:"-"`
	Role         UserRole  `gorm:"type:enum('admin','participant');not null;default:'participant'" json:"role"`
	CreatedAt    time.Time `gorm:"type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)" json:"created_at"`
	UpdatedAt    time.Time `gorm:"type:datetime(3);not null;default:CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)" json:"updated_at"`
}

func (User) TableName() string {
	return "users"
}
