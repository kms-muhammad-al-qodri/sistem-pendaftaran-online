package main

import (
	"log"

	"daftarin-backend/internal/config"
	"daftarin-backend/internal/database"
	"daftarin-backend/internal/models"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	log.Println("Starting Admin Seeder...")

	cfg := config.LoadConfig()
	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database for seeding: %v", err)
	}

	var existingAdmin models.User
	err = db.Where("email = ? OR role = ?", cfg.AdminEmail, models.RoleAdmin).First(&existingAdmin).Error
	if err == nil {
		log.Printf("Admin user already exists with email: %s. Skipping seeding.", existingAdmin.Email)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(cfg.AdminPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash admin password: %v", err)
	}

	adminUser := models.User{
		Name:         cfg.AdminName,
		Email:        cfg.AdminEmail,
		PasswordHash: string(hashedPassword),
		Role:         models.RoleAdmin,
	}

	if err := db.Create(&adminUser).Error; err != nil {
		log.Fatalf("Failed to create admin user: %v", err)
	}

	log.Printf("SUCCESS: Initial Admin Created! Email: %s", adminUser.Email)
}
