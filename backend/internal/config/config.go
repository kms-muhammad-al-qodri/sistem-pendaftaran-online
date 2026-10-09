package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerPort        string
	Env               string
	DBHost            string
	DBPort            string
	DBUser            string
	DBPassword        string
	DBName            string
	AdminName         string
	AdminEmail        string
	AdminPassword     string
	SessionSecret     string
	SessionMaxAgeHour int
	CORSOrigin        string
}

func LoadConfig() *Config {
	// Load .env if present
	if err := godotenv.Load(); err != nil {
		log.Println("Note: .env file not found, reading from system environment")
	}

	maxAgeHours, err := strconv.Atoi(getEnv("SESSION_MAX_AGE_HOURS", "24"))
	if err != nil {
		maxAgeHours = 24
	}

	return &Config{
		ServerPort:        getEnv("SERVER_PORT", "8080"),
		Env:               getEnv("ENV", "development"),
		DBHost:            getEnv("DB_HOST", "localhost"),
		DBPort:            getEnv("DB_PORT", "3306"),
		DBUser:            getEnv("DB_USER", "root"),
		DBPassword:        getEnv("DB_PASSWORD", ""),
		DBName:            getEnv("DB_NAME", "daftarin"),
		AdminName:         getEnv("ADMIN_NAME", "Super Admin"),
		AdminEmail:        getEnv("ADMIN_EMAIL", "admin@daftarin.com"),
		AdminPassword:     getEnv("ADMIN_PASSWORD", "AdminStrongPass123!"),
		SessionSecret:     getEnv("SESSION_SECRET", "daftarin-secret-key-2026"),
		SessionMaxAgeHour: maxAgeHours,
		CORSOrigin:        getEnv("CORS_ORIGIN", "http://localhost:5173"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}
