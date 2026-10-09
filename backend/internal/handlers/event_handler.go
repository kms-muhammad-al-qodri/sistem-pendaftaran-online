package handlers

import (
	"net/http"
	"strconv"

	"daftarin-backend/internal/middleware"
	"daftarin-backend/internal/response"
	"daftarin-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type EventHandler struct {
	eventService services.EventService
}

func NewEventHandler(eventService services.EventService) *EventHandler {
	return &EventHandler{eventService: eventService}
}

func (h *EventHandler) GetPublicEvents(c *gin.Context) {
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	events, total, err := h.eventService.GetPublicEvents(search, page, limit)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar event publik.")
		return
	}

	response.SuccessWithMeta(c, http.StatusOK, events, gin.H{
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *EventHandler) GetPublicEventBySlug(c *gin.Context) {
	slug := c.Param("slug")
	event, err := h.eventService.GetPublicEventBySlug(slug)
	if err != nil {
		if err.Error() == "EVENT_NOT_FOUND" || err.Error() == "EVENT_NOT_PUBLISHED" {
			response.NotFound(c, "Event tidak ditemukan atau belum dipublikasikan.")
			return
		}
		response.InternalServerError(c, "Gagal mengambil detail event.")
		return
	}

	response.Success(c, http.StatusOK, event)
}

func (h *EventHandler) GetAdminEvents(c *gin.Context) {
	search := c.Query("search")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	events, total, err := h.eventService.GetAdminEvents(search, status, page, limit)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar event admin.")
		return
	}

	response.SuccessWithMeta(c, http.StatusOK, events, gin.H{
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *EventHandler) GetAdminEventByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "ID event harus berupa angka."})
		return
	}

	event, err := h.eventService.GetAdminEventByID(id)
	if err != nil {
		if err.Error() == "EVENT_NOT_FOUND" {
			response.NotFound(c, "Event tidak ditemukan.")
			return
		}
		response.InternalServerError(c, "Gagal mengambil detail event admin.")
		return
	}

	response.Success(c, http.StatusOK, event)
}

func (h *EventHandler) CreateEvent(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		response.Unauthorized(c, "Identitas tidak ditemukan.")
		return
	}

	var req services.CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, map[string]string{
			"body": "Format data event tidak valid. Periksa judul, tanggal, dan kuota.",
		})
		return
	}

	event, err := h.eventService.CreateEvent(user.ID, req)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "CREATE_EVENT_FAILED", err.Error(), nil)
		return
	}

	response.Success(c, http.StatusCreated, event)
}

func (h *EventHandler) UpdateEvent(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "ID event harus berupa angka."})
		return
	}

	var req services.UpdateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, map[string]string{
			"body": "Format data update event tidak valid.",
		})
		return
	}

	event, err := h.eventService.UpdateEvent(id, req)
	if err != nil {
		if err.Error() == "EVENT_NOT_FOUND" {
			response.NotFound(c, "Event tidak ditemukan.")
			return
		}
		response.Error(c, http.StatusBadRequest, "UPDATE_EVENT_FAILED", err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, event)
}

func (h *EventHandler) DeleteEvent(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "ID event harus berupa angka."})
		return
	}

	err = h.eventService.DeleteEvent(id)
	if err != nil {
		if err.Error() == "EVENT_NOT_FOUND" {
			response.NotFound(c, "Event tidak ditemukan.")
			return
		}
		if err.Error() == "CANNOT_DELETE_EVENT_WITH_REGISTRATIONS" {
			response.Conflict(c, "Event tidak dapat dihapus karena sudah memiliki peserta terdaftar. Silakan ubah status menjadi dibatalkan (cancelled).")
			return
		}
		response.InternalServerError(c, "Gagal menghapus event.")
		return
	}

	response.Success(c, http.StatusOK, gin.H{
		"message": "Event berhasil dihapus.",
	})
}

func (h *EventHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.eventService.GetAdminDashboardStats()
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil statistik dashboard admin.")
		return
	}
	response.Success(c, http.StatusOK, stats)
}
