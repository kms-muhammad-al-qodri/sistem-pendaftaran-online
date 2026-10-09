package handlers

import (
	"net/http"
	"strconv"

	"daftarin-backend/internal/middleware"
	"daftarin-backend/internal/response"
	"daftarin-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type RegistrationHandler struct {
	regService services.RegistrationService
}

func NewRegistrationHandler(regService services.RegistrationService) *RegistrationHandler {
	return &RegistrationHandler{regService: regService}
}

func (h *RegistrationHandler) RegisterForEvent(c *gin.Context) {
	idStr := c.Param("id")
	eventID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "ID event harus berupa angka."})
		return
	}

	var req services.RegisterEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, map[string]string{
			"body": "Format data pendaftaran tidak valid. Lengkapi nama, email, nomor HP, dan persetujuan syarat.",
		})
		return
	}

	// Current user can be nil if registrant is a Guest
	currentUser := middleware.GetCurrentUser(c)

	registration, err := h.regService.RegisterForEvent(eventID, currentUser, req)
	if err != nil {
		switch err.Error() {
		case "TERMS_NOT_ACCEPTED":
			response.Error(c, http.StatusBadRequest, "TERMS_NOT_ACCEPTED", "Anda harus menyetujui syarat dan ketentuan pendaftaran.", nil)
		case "EVENT_NOT_FOUND":
			response.NotFound(c, "Event tidak ditemukan.")
		case "EVENT_NOT_PUBLISHED":
			response.Error(c, http.StatusBadRequest, "EVENT_NOT_PUBLISHED", "Event belum dipublikasikan atau sudah ditutup.", nil)
		case "REGISTRATION_NOT_YET_OPEN":
			response.Error(c, http.StatusBadRequest, "REGISTRATION_NOT_YET_OPEN", "Pendaftaran untuk event ini belum dibuka.", nil)
		case "REGISTRATION_CLOSED":
			response.Error(c, http.StatusBadRequest, "REGISTRATION_CLOSED", "Pendaftaran untuk event ini sudah ditutup.", nil)
		case "ALREADY_REGISTERED_FOR_EVENT":
			response.Conflict(c, "Email Anda sudah pernah terdaftar pada event ini.")
		case "EVENT_QUOTA_FULL":
			response.Conflict(c, "Mohon maaf, kuota pendaftaran untuk event ini sudah penuh.")
		default:
			response.InternalServerError(c, "Gagal memproses pendaftaran event.")
		}
		return
	}

	response.Success(c, http.StatusCreated, registration)
}

func (h *RegistrationHandler) GetParticipantRegistrations(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		response.Unauthorized(c, "Sesi tidak ditemukan.")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	list, total, err := h.regService.GetParticipantRegistrations(user.ID, page, limit)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil data pendaftaran milik Anda.")
		return
	}

	response.SuccessWithMeta(c, http.StatusOK, list, gin.H{
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *RegistrationHandler) GetAdminRegistrations(c *gin.Context) {
	eventID, _ := strconv.ParseUint(c.Query("event_id"), 10, 64)
	search := c.Query("search")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	list, total, err := h.regService.GetAdminRegistrations(eventID, search, status, page, limit)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar pendaftaran admin.")
		return
	}

	response.SuccessWithMeta(c, http.StatusOK, list, gin.H{
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *RegistrationHandler) GetAdminRegistrationByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "ID pendaftaran harus berupa angka."})
		return
	}

	reg, err := h.regService.GetRegistrationByID(id)
	if err != nil {
		if err.Error() == "REGISTRATION_NOT_FOUND" {
			response.NotFound(c, "Data pendaftaran tidak ditemukan.")
			return
		}
		response.InternalServerError(c, "Gagal mengambil data pendaftaran.")
		return
	}

	response.Success(c, http.StatusOK, reg)
}

func (h *RegistrationHandler) UpdateRegistrationStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "ID pendaftaran harus berupa angka."})
		return
	}

	var req services.UpdateRegistrationStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, map[string]string{
			"body": "Format data status tidak valid.",
		})
		return
	}

	reg, err := h.regService.UpdateStatus(id, req)
	if err != nil {
		switch err.Error() {
		case "REGISTRATION_NOT_FOUND":
			response.NotFound(c, "Data pendaftaran tidak ditemukan.")
		case "REJECTION_REASON_REQUIRED":
			response.ValidationError(c, map[string]string{"rejection_reason": "Alasan penolakan harus diisi saat menolak pendaftaran."})
		case "INVALID_REGISTRATION_STATUS":
			response.ValidationError(c, map[string]string{"status": "Status pendaftaran harus berupa confirmed, rejected, atau cancelled."})
		default:
			response.InternalServerError(c, "Gagal mengubah status pendaftaran.")
		}
		return
	}

	response.Success(c, http.StatusOK, reg)
}
