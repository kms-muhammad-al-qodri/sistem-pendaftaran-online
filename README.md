# 🚀 DaftarIn — Sistem Pendaftaran Seminar & Event Online

**DaftarIn** adalah platform pendaftaran seminar dan event online modern berbasis **Full-Stack** dengan arsitektur **React (Vite) + Golang (Gin) + MySQL (GORM)**. Aplikasi ini dirancang untuk menangani pendaftaran publik (Guest) maupun peserta berakun dengan jaminan kontrol kuota yang aman dari *race condition* melalui transaksi *database row locking*.

---

## ✨ Fitur Utama

- 🔐 **Autentikasi Session Cookie HttpOnly**: Pengamanan autentikasi berbasis session token terenkripsi.
- 👥 **Dual Registration Mode**: 
  - **Pengunjung (Guest)**: Mendaftar seminar tanpa membuat akun.
  - **Peserta Login**: Pendaftaran otomatis terhubung ke dashboard akun.
- ⚡ **Auto-Link Guest Registrations**: Ketika pengunjung membuat akun baru, seluruh riwayat pendaftaran lamanya dengan email sama otomatis terhubung ke akunnya.
- 🛡️ **Atomic Quota Control (`SELECT ... FOR UPDATE`)**: Transaksi database dengan *row locking* untuk memastikan kuota tidak akan terlampaui saat ribuan request masuk bersamaan.
- 🚫 **Cascade Cancellation**: Jika Admin membatalkan event, status seluruh pendaftaran otomatis berubah menjadi `cancelled`.
- 📊 **Executive Admin Dashboard**:
  - Statistik event, jumlah pendaftar, dan filter verifikasi.
  - CRUD Event lengkap dengan poster gambar dari Unsplash.
  - Verifikasi pendaftaran peserta (`confirmed` / `rejected` + alasan penolakan).
- 🎫 **Participant Dashboard**: Halaman tiket pendaftaran milik peserta beserta status verifikasi.

---

## 🛠️ Stack Teknologi

### Frontend
- **Framework**: React 19 + Vite 8
- **Styling**: Vanilla CSS (Custom Design System with Variables, Dark Mode, & Glassmorphic Blur)
- **Icons**: Lucide React

### Backend
- **Language & Framework**: Golang 1.22+ & Gin Web Framework
- **ORM & Database**: GORM & MySQL 8.0+ (Laragon Compatible)
- **Security**: BCrypt Password Hashing, SHA-256 Session Token Hashing, Cookie HttpOnly, CORS Middleware

---

## 📁 Struktur Folder Project

```text
sistem-pendaftaran-online/
├── backend/
│   ├── cmd/
│   │   ├── api/main.go          # Main API Server Entrypoint
│   │   ├── migrate/main.go      # Auto Migration & Admin Seeder Tool
│   │   └── seed_events/main.go  # Sample Event Seeder Tool
│   ├── internal/
│   │   ├── config/              # Environment Variable Loader
│   │   ├── database/            # GORM MySQL Connection Pool
│   │   ├── handlers/            # HTTP Handlers (Auth, Event, Registration)
│   │   ├── middleware/          # Cookie Auth & Role Access Control (RBAC)
│   │   ├── models/              # GORM Database Models
│   │   ├── repositories/        # Database Access Layer
│   │   ├── response/            # Standardized API JSON Envelopes
│   │   ├── routes/              # Gin Router Setup
│   │   └── services/            # Business Logic & Transactions
│   ├── migrations/              # SQL Migration Files (001_init.up.sql)
│   ├── .env.example             # Template Environment Variables
│   ├── .env                     # Local Environment Config
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── api/client.js        # Fetch API Client with Credentials
│   │   ├── components/
│   │   │   ├── forms/           # AuthModal, EventFormModal, RegisterEventModal, VerifyModal
│   │   │   └── ui/              # Navbar, Modal, Toast
│   │   ├── context/AuthContext.jsx # Global User State Provider
│   │   ├── pages/
│   │   │   ├── admin/AdminDashboard.jsx
│   │   │   ├── participant/ParticipantDashboard.jsx
│   │   │   └── public/LandingPage.jsx
│   │   ├── App.jsx
│   │   └── index.css            # Glassmorphism Design System
│   └── vite.config.js
└── README.md
```

---

## 💻 Cara Menjalankan Project secara Lokal

### 1. Prasyarat Sistem
- **Node.js** (v18+) & **npm**
- **Go** (v1.22+)
- **MySQL Database** (misal Laragon / XAMPP di `localhost:3306`)

---

### 2. Setup Backend (Golang)

1. Masuk ke folder backend:
   ```bash
   cd backend
   ```
2. Buat file `.env` dari `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Pastikan service MySQL (Laragon/XAMPP) sudah aktif di port `3306`.
4. Jalankan migrasi tabel dan seeder Admin pertama kali:
   ```bash
   go run cmd/migrate/main.go
   ```
5. (Opsional) Jalankan seeder contoh event publik:
   ```bash
   go run cmd/seed_events/main.go
   ```
6. Jalankan backend API Server:
   ```bash
   go run cmd/api/main.go
   ```
   *Backend REST API akan berjalan di `http://localhost:8080`.*

---

### 3. Setup Frontend (React Vite)

1. Buka terminal baru dan masuk ke folder frontend:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan Vite:
   ```bash
   npm run dev
   ```
4. Buka browser dan akses **`http://localhost:5173`**.

---

## 🔑 Credential Default untuk Pengujian

- **Admin Account**:
  - **Email**: `admin@daftarin.com`
  - **Password**: `AdminStrongPass123!`

---

## 📄 Lisensi

Distributed under the MIT License. See `LICENSE` for more information.
