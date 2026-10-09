package middleware

import (
	"strings"

	"daftarin-backend/internal/models"
	"daftarin-backend/internal/response"
	"daftarin-backend/internal/services"

	"github.com/gin-gonic/gin"
)

const (
	CookieSessionName = "daftarin_session"
	UserContextKey    = "currentUser"
)

func AuthMiddleware(authService services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var token string

		// 1. Try reading from HttpOnly Cookie
		cookieToken, err := c.Cookie(CookieSessionName)
		if err == nil && cookieToken != "" {
			token = cookieToken
		}

		// 2. Fallback to Authorization Header (Bearer token) for flexibility
		if token == "" {
			authHeader := c.GetHeader("Authorization")
			if strings.HasPrefix(authHeader, "Bearer ") {
				token = strings.TrimPrefix(authHeader, "Bearer ")
			}
		}

		if token == "" {
			response.Unauthorized(c, "Silakan login terlebih dahulu.")
			c.Abort()
			return
		}

		user, err := authService.ValidateSession(token)
		if err != nil || user == nil {
			response.Unauthorized(c, "Sesi Anda telah berakhir. Silakan login kembali.")
			c.Abort()
			return
		}

		// Store user in request context
		c.Set(UserContextKey, user)
		c.Next()
	}
}

func RequireRole(roles ...models.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		userVal, exists := c.Get(UserContextKey)
		if !exists {
			response.Unauthorized(c, "Sesi tidak valid.")
			c.Abort()
			return
		}

		user, ok := userVal.(*models.User)
		if !ok || user == nil {
			response.Unauthorized(c, "Identitas pengguna tidak valid.")
			c.Abort()
			return
		}

		roleAllowed := false
		for _, role := range roles {
			if user.Role == role {
				roleAllowed = true
				break
			}
		}

		if !roleAllowed {
			response.Forbidden(c, "Anda tidak memiliki akses ke halaman atau aksi ini.")
			c.Abort()
			return
		}

		c.Next()
	}
}

func GetCurrentUser(c *gin.Context) *models.User {
	userVal, exists := c.Get(UserContextKey)
	if !exists {
		return nil
	}
	user, ok := userVal.(*models.User)
	if !ok {
		return nil
	}
	return user
}
