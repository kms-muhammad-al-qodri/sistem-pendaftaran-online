package handlers

import (
	"net/http"

	"daftarin-backend/internal/config"
	"daftarin-backend/internal/middleware"
	"daftarin-backend/internal/response"
	"daftarin-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService services.AuthService
	cfg         *config.Config
}

func NewAuthHandler(authService services.AuthService, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		cfg:         cfg,
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req services.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, map[string]string{
			"body": "Format data registrasi tidak valid. Periksa nama, email, dan minimal password (6 karakter).",
		})
		return
	}

	user, token, err := h.authService.Register(req)
	if err != nil {
		if err.Error() == "EMAIL_ALREADY_REGISTERED" {
			response.Conflict(c, "Email ini sudah terdaftar. Silakan gunakan email lain atau login.")
			return
		}
		response.InternalServerError(c, "Gagal memproses registrasi akun.")
		return
	}

	// Set HttpOnly Cookie
	maxAge := h.cfg.SessionMaxAgeHour * 3600
	c.SetCookie(
		middleware.CookieSessionName,
		token,
		maxAge,
		"/",
		"",
		h.cfg.Env == "production", // secure
		true,                      // httpOnly
	)

	response.Success(c, http.StatusCreated, user)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req services.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, map[string]string{
			"body": "Format email atau password tidak valid.",
		})
		return
	}

	user, token, err := h.authService.Login(req)
	if err != nil {
		if err.Error() == "INVALID_CREDENTIALS" {
			response.Error(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Email atau password yang Anda masukkan salah.", nil)
			return
		}
		response.InternalServerError(c, "Gagal melakukan proses login.")
		return
	}

	// Set HttpOnly Cookie
	maxAge := h.cfg.SessionMaxAgeHour * 3600
	c.SetCookie(
		middleware.CookieSessionName,
		token,
		maxAge,
		"/",
		"",
		h.cfg.Env == "production", // secure
		true,                      // httpOnly
	)

	response.Success(c, http.StatusOK, user)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	cookieToken, err := c.Cookie(middleware.CookieSessionName)
	if err == nil && cookieToken != "" {
		_ = h.authService.Logout(cookieToken)
	}

	// Clear HttpOnly Cookie
	c.SetCookie(
		middleware.CookieSessionName,
		"",
		-1,
		"/",
		"",
		h.cfg.Env == "production",
		true,
	)

	response.Success(c, http.StatusOK, gin.H{
		"message": "Berhasil logout.",
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		response.Unauthorized(c, "Tidak dapat menemukan data akun.")
		return
	}
	response.Success(c, http.StatusOK, user)
}
