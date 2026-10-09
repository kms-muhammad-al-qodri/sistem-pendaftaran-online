package main

import (
	"database/sql"
	"fmt"
	"log"
	"strings"

	"daftarin-backend/internal/config"
	"daftarin-backend/internal/database"
	"daftarin-backend/internal/models"

	_ "github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	log.Println("=== DAFTARIN DATABASE MIGRATION & SEEDER ===")

	cfg := config.LoadConfig()

	// 1. Ensure Database Exists (Connect to MySQL server without DB name first)
	rootDSN := fmt.Sprintf("%s:%s@tcp(%s:%s)/?charset=utf8mb4&parseTime=True&loc=UTC",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort)

	dbConn, err := sql.Open("mysql", rootDSN)
	if err != nil {
		log.Fatalf("Failed to open connection to MySQL server: %v", err)
	}
	defer dbConn.Close()

	createDBSQL := fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;", cfg.DBName)
	if _, err := dbConn.Exec(createDBSQL); err != nil {
		log.Fatalf("Failed to create database `%s`: %v", cfg.DBName, err)
	}
	log.Printf("✓ Database `%s` is ready (Created or already exists).", cfg.DBName)

	// 2. Connect to GORM DB
	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize GORM database connection: %v", err)
	}

	// 3. Auto Migrate Models
	log.Println("Migrating database schemas...")
	err = db.AutoMigrate(
		&models.User{},
		&models.Session{},
		&models.Event{},
		&models.Registration{},
	)
	if err != nil {
		log.Fatalf("Failed to auto-migrate database tables: %v", err)
	}
	log.Println("✓ Database tables (users, sessions, events, registrations) migrated successfully.")

	// 4. Seed Initial Admin Account from .env
	log.Println("Checking Admin User Seeder...")
	var existingAdmin models.User
	err = db.Where("email = ? OR role = ?", strings.ToLower(cfg.AdminEmail), models.RoleAdmin).First(&existingAdmin).Error
	if err == nil {
		log.Printf("✓ Admin user already exists: %s (%s)", existingAdmin.Name, existingAdmin.Email)
	} else {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(cfg.AdminPassword), bcrypt.DefaultCost)
		if err != nil {
			log.Fatalf("Failed to hash admin password: %v", err)
		}

		admin := models.User{
			Name:         cfg.AdminName,
			Email:        strings.ToLower(cfg.AdminEmail),
			PasswordHash: string(hashedPassword),
			Role:         models.RoleAdmin,
		}

		if err := db.Create(&admin).Error; err != nil {
			log.Fatalf("Failed to seed initial admin user: %v", err)
		}
		log.Printf("🎉 SUCCESS: Initial Admin created!")
		log.Printf("   Email: %s", admin.Email)
		log.Printf("   Role : %s", admin.Role)
	}

	log.Println("=== MIGRATION & SEEDER COMPLETED SUCCESSFULLY ===")
}
