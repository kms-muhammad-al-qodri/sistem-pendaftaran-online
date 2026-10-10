package routes

import (
	"time"

	"daftarin-backend/internal/config"
	"daftarin-backend/internal/handlers"
	"daftarin-backend/internal/middleware"
	"daftarin-backend/internal/models"
	"daftarin-backend/internal/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(
	cfg *config.Config,
	authHandler *handlers.AuthHandler,
	eventHandler *handlers.EventHandler,
	regHandler *handlers.RegistrationHandler,
	authService services.AuthService,
) *gin.Engine {
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// 1. Recoverer & Logger Middleware
	r.Use(gin.Recovery())
	r.Use(gin.Logger())

	// 2. CORS Middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.CORSOrigin, "http://localhost:5173", "http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// API Group /api/v1
	v1 := r.Group("/api/v1")
	{
		// A. Auth Public Endpoints
		authGroup := v1.Group("/auth")
		{
			authGroup.POST("/register", authHandler.Register)
			authGroup.POST("/login", authHandler.Login)
			authGroup.POST("/logout", authHandler.Logout)

			// Authenticated Auth Endpoint
			authGroup.GET("/me", middleware.AuthMiddleware(authService), authHandler.Me)
		}

		// B. Public Events Endpoints
		eventsGroup := v1.Group("/events")
		{
			eventsGroup.GET("", eventHandler.GetPublicEvents)
			eventsGroup.GET("/:slug", eventHandler.GetPublicEventBySlug)

			// Registration endpoint allows guest OR authenticated users (Optional Auth Check)
			eventsGroup.POST("/:id/registrations", optionalAuthMiddleware(authService), regHandler.RegisterForEvent)
		}

		// Public Registrations Lookup (No Login Required for participants/guests)
		regGroup := v1.Group("/registrations")
		{
			regGroup.GET("/check", regHandler.LookupRegistrations)
			regGroup.GET("/lookup", regHandler.LookupRegistrations)
			regGroup.GET("/check/:number", regHandler.CheckRegistrationByNumber)
		}

		// C. Participant Dashboard Endpoints
		participantGroup := v1.Group("/participant")
		participantGroup.Use(middleware.AuthMiddleware(authService))
		participantGroup.Use(middleware.RequireRole(models.RoleParticipant, models.RoleAdmin))
		{
			participantGroup.GET("/registrations", regHandler.GetParticipantRegistrations)
		}

		// D. Admin Management Endpoints
		adminGroup := v1.Group("/admin")
		adminGroup.Use(middleware.AuthMiddleware(authService))
		adminGroup.Use(middleware.RequireRole(models.RoleAdmin))
		{
			adminGroup.GET("/dashboard", eventHandler.GetDashboardStats)

			adminGroup.GET("/events", eventHandler.GetAdminEvents)
			adminGroup.POST("/events", eventHandler.CreateEvent)
			adminGroup.GET("/events/:id", eventHandler.GetAdminEventByID)
			adminGroup.PUT("/events/:id", eventHandler.UpdateEvent)
			adminGroup.DELETE("/events/:id", eventHandler.DeleteEvent)

			adminGroup.GET("/registrations", regHandler.GetAdminRegistrations)
			adminGroup.GET("/registrations/:id", regHandler.GetAdminRegistrationByID)
			adminGroup.PATCH("/registrations/:id/status", regHandler.UpdateRegistrationStatus)
		}
	}

	return r
}

// optionalAuthMiddleware populates user context if Cookie/Header present, but does NOT abort if unauthenticated
func optionalAuthMiddleware(authService services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var token string

		cookieToken, err := c.Cookie(middleware.CookieSessionName)
		if err == nil && cookieToken != "" {
			token = cookieToken
		}

		if token == "" {
			authHeader := c.GetHeader("Authorization")
			if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
				token = authHeader[7:]
			}
		}

		if token != "" {
			user, err := authService.ValidateSession(token)
			if err == nil && user != nil {
				c.Set(middleware.UserContextKey, user)
			}
		}

		c.Next()
	}
}
