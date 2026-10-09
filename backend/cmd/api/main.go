package main

import (
	"fmt"
	"log"

	"daftarin-backend/internal/config"
	"daftarin-backend/internal/database"
	"daftarin-backend/internal/handlers"
	"daftarin-backend/internal/repositories"
	"daftarin-backend/internal/routes"
	"daftarin-backend/internal/services"
)

func main() {
	log.Println("Starting DaftarIn API Backend Server...")

	// 1. Load Configuration
	cfg := config.LoadConfig()

	// 2. Connect to Database (MySQL via GORM)
	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// 3. Initialize Repositories
	userRepo := repositories.NewUserRepository(db)
	sessionRepo := repositories.NewSessionRepository(db)
	eventRepo := repositories.NewEventRepository(db)
	regRepo := repositories.NewRegistrationRepository(db)

	// 4. Initialize Services
	authService := services.NewAuthService(userRepo, sessionRepo, cfg)
	eventService := services.NewEventService(eventRepo, regRepo)
	regService := services.NewRegistrationService(eventRepo, regRepo)

	// 5. Initialize Handlers
	authHandler := handlers.NewAuthHandler(authService, cfg)
	eventHandler := handlers.NewEventHandler(eventService)
	regHandler := handlers.NewRegistrationHandler(regService)

	// 6. Setup Routes
	r := routes.SetupRouter(cfg, authHandler, eventHandler, regHandler, authService)

	// 7. Start HTTP Server
	serverAddr := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Printf("🚀 Server is running on http://localhost%s (ENV: %s)", serverAddr, cfg.Env)

	if err := r.Run(serverAddr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
