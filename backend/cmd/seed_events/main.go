package main

import (
	"log"
	"time"

	"daftarin-backend/internal/config"
	"daftarin-backend/internal/database"
	"daftarin-backend/internal/models"
)

func main() {
	log.Println("Seeding Sample Events...")

	cfg := config.LoadConfig()
	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}

	var adminUser models.User
	if err := db.Where("role = ?", models.RoleAdmin).First(&adminUser).Error; err != nil {
		log.Fatalf("Admin user not found. Please run cmd/migrate/main.go first.")
	}

	now := time.Now().UTC()

	sampleEvents := []models.Event{
		{
			CreatedBy:            adminUser.ID,
			Slug:                 "seminar-nasional-ai-dan-web-development-2026",
			Title:                "Seminar Nasional AI & Web Development 2026",
			Description:          "Pelajari tren terbaru kecerdasan buatan, modern React, Golang Gin microservices, dan strategi pengembangan sistem scalable berstandar industri.",
			Location:             "Online via Zoom & YouTube Live",
			ImageURL:             strPtr("https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80"),
			StartsAt:             now.Add(7 * 24 * time.Hour),
			EndsAt:               now.Add(7*24*time.Hour + 3*time.Hour),
			RegistrationOpensAt:  now.Add(-24 * time.Hour),
			RegistrationClosesAt: now.Add(6 * 24 * time.Hour),
			Quota:                150,
			Status:               models.EventStatusPublished,
		},
		{
			CreatedBy:            adminUser.ID,
			Slug:                 "workshop-golang-microservices-masterclass",
			Title:                "Masterclass Golang Microservices & MySQL Tuning",
			Description:          "Workshop hands-on membangun backend REST API berperforma tinggi menggunakan Golang, Gin, GORM, dan optimasi database MySQL.",
			Location:             "Gedung Innovation Center Palembang / Zoom",
			ImageURL:             strPtr("https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80"),
			StartsAt:             now.Add(14 * 24 * time.Hour),
			EndsAt:               now.Add(14*24*time.Hour + 4*time.Hour),
			RegistrationOpensAt:  now.Add(-24 * time.Hour),
			RegistrationClosesAt: now.Add(13 * 24 * time.Hour),
			Quota:                50,
			Status:               models.EventStatusPublished,
		},
	}

	for _, ev := range sampleEvents {
		var count int64
		db.Model(&models.Event{}).Where("slug = ?", ev.Slug).Count(&count)
		if count == 0 {
			if err := db.Create(&ev).Error; err != nil {
				log.Printf("Failed to seed event %s: %v", ev.Title, err)
			} else {
				log.Printf("✓ Sample event created: %s", ev.Title)
			}
		}
	}

	log.Println("Sample events seeding completed.")
}

func strPtr(s string) *string {
	return &s
}
