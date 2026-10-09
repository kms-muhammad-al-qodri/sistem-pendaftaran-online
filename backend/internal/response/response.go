package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorResponseBody struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

type ErrorResponseEnvelope struct {
	Error ErrorResponseBody `json:"error"`
}

type SuccessResponseEnvelope struct {
	Data interface{} `json:"data"`
	Meta interface{} `json:"meta,omitempty"`
}

func Success(c *gin.Context, statusCode int, data interface{}) {
	c.JSON(statusCode, SuccessResponseEnvelope{
		Data: data,
	})
}

func SuccessWithMeta(c *gin.Context, statusCode int, data interface{}, meta interface{}) {
	c.JSON(statusCode, SuccessResponseEnvelope{
		Data: data,
		Meta: meta,
	})
}

func Error(c *gin.Context, statusCode int, code string, message string, details interface{}) {
	c.JSON(statusCode, ErrorResponseEnvelope{
		Error: ErrorResponseBody{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}

func ValidationError(c *gin.Context, details interface{}) {
	Error(c, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Data yang dikirim tidak valid.", details)
}

func Unauthorized(c *gin.Context, message string) {
	if message == "" {
		message = "Anda harus login untuk mengakses sumber daya ini."
	}
	Error(c, http.StatusUnauthorized, "UNAUTHORIZED", message, nil)
}

func Forbidden(c *gin.Context, message string) {
	if message == "" {
		message = "Anda tidak memiliki hak akses untuk tindakan ini."
	}
	Error(c, http.StatusForbidden, "FORBIDDEN", message, nil)
}

func NotFound(c *gin.Context, message string) {
	if message == "" {
		message = "Data yang dicari tidak ditemukan."
	}
	Error(c, http.StatusNotFound, "NOT_FOUND", message, nil)
}

func Conflict(c *gin.Context, message string) {
	Error(c, http.StatusConflict, "CONFLICT", message, nil)
}

func InternalServerError(c *gin.Context, message string) {
	if message == "" {
		message = "Terjadi kesalahan pada server."
	}
	Error(c, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", message, nil)
}
