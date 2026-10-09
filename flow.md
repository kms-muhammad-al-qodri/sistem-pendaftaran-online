Gas, bre! 🔥 Kita matangkan DaftarIn — Sistem Pendaftaran Seminar & Event Online dengan React, Golang, Gin, dan MySQL. Kali ini kita bikin spesifikasi yang bisa langsung dijadikan pedoman coding, bukan sekadar gambaran fitur.

Keputusan arsitektur utamanya:

* Frontend: React + Vite + JavaScript.

* Backend: Golang + Gin REST API.

* Database: MySQL + GORM.

* Autentikasi: session berbasis cookie HttpOnly untuk admin dan peserta yang memiliki akun.

* Pendaftaran publik: pengunjung bisa mendaftar event tanpa membuat akun.

* UI: light modern, responsif, dashboard bersih dan profesional.

* Upload berkas: belum termasuk versi pertama.

# 1. Spesifikasi final DaftarIn

![QR Pasok - The all-in-one Event Management with seamless QR check-in](https://images.openai.com/static-rsc-4/C1Q6URh0TrWn4M7kC10jmt_H2XiEUEEh-fRXpcoUNBaXh-lVAMfXWdw75IXEdN3aLUX5sm39kX4HcDdqMskXfM_gJByWmXcF-7KNqDgCrQFqBGQ3_abr2TT1i-CmFFhLptJdZCXkGBU9YiK9VIS7Jpk_WkNGovEmkRGBVBVlhOg?purpose=inline)

Tambahkan ke Favorit

Event Management

Admin membuat dan mengelola seminar.

Registrasi Peserta

Form publik dan pendaftaran dari akun peserta.

Verifikasi

Admin mengatur status pendaftaran.

Laporan

Statistik peserta dan kapasitas event.

## Peran dan hak akses

| Fitur                             | Pengunjung | Peserta | Admin |
| --------------------------------- | ---------- | ------- | ----- |
| Melihat event publik              | Ya         | Ya      | Ya    |
| Mendaftar tanpa akun              | Ya         | Ya      | Ya    |
| Melihat pendaftaran milik sendiri | Tidak      | Ya      | Ya    |
| Mengelola event                   | Tidak      | Tidak   | Ya    |
| Melihat seluruh data peserta      | Tidak      | Tidak   | Ya    |
| Mengubah status pendaftaran       | Tidak      | Tidak   | Ya    |
| Mengelola akun dan peran          | Tidak      | Tidak   | Ya    |

Pendaftaran publik tetap diperbolehkan. Namun, guest tidak otomatis memperoleh akun. Jika ingin peserta memantau status pendaftaran melalui dashboard, peserta perlu memiliki akun dan pendaftaran tersebut harus terhubung ke akun itu.

## Ruang lingkup versi pertama (MVP)

Termasuk:

* Login, logout, dan registrasi akun.

* CRUD event.

* Form pendaftaran publik.

* Pendaftaran oleh peserta yang login.

* Nomor pendaftaran unik.

* Pengecekan kuota.

* Verifikasi dan penolakan oleh admin.

* Pencarian, filter, pagination, dan statistik.

* Validasi input, otorisasi, serta pengujian dasar.

Belum termasuk: pembayaran, QR check-in, upload dokumen, email otomatis, sertifikat, dan integrasi WhatsApp. Fitur-fitur tersebut dapat ditambahkan setelah alur inti stabil.

# 2. ERD — Entity Relationship Diagram

Kita gunakan empat tabel inti: `users`, `sessions`, `events`, dan `registrations`.

users

MASTER

`id` — PK

`name`, `email`, `password_hash`

`role`, `created_at`, `updated_at`

1 user memiliki banyak sesi

sessions

`id` — PK

`user_id` — FK → users.id

`token_hash`, `expires_at`, `created_at`

events

MASTER

`id` — PK

`created_by` — FK → users.id

`slug`, `title`, `description`, `location`

`starts_at`, `ends_at`, `registration_opens_at`, `registration_closes_at`

`quota`, `status`, `created_at`, `updated_at`

1 event memiliki banyak pendaftaran

registrations

`id` — PK

`event_id` — FK → events.id

`user_id` — FK → users.id, nullable

`registration_number`, `name`, `email`, `phone`, `institution`

`status`, `rejection_reason`, `created_at`, `updated_at`

`user_id` pada tabel `registrations` boleh `NULL` karena pendaftar tamu tidak harus memiliki akun. Kalau peserta login saat mendaftar, backend menghubungkan pendaftaran tersebut dengan akun yang sedang aktif.

Relasi lengkap:

* `users 1:N sessions`

* `users 1:N events` melalui `created_by`

* `users 1:N registrations`, opsional untuk guest

* `events 1:N registrations`

Constraint penting: satu email hanya boleh mendaftar satu kali untuk event yang sama. Kita tegakkan menggunakan unique index pada `(event_id, email)`, bukan hanya pengecekan di React.

# 3. Migrasi database MySQL

Gunakan MySQL 8.0+ dan database bernama `daftarin`. Jalankan SQL berikut sebagai migrasi awal, misalnya `001_init.up.sql`.

SQL

```
CREATE DATABASE IF NOT EXISTS daftarin
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE daftarin;

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'participant') NOT NULL DEFAULT 'participant',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    expires_at DATETIME(3) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE KEY uq_sessions_token_hash (token_hash),
    KEY idx_sessions_user_id (user_id),
    KEY idx_sessions_expires_at (expires_at),

    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    created_by BIGINT UNSIGNED NOT NULL,
    slug VARCHAR(180) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    starts_at DATETIME(3) NOT NULL,
    ends_at DATETIME(3) NOT NULL,
    registration_opens_at DATETIME(3) NOT NULL,
    registration_closes_at DATETIME(3) NOT NULL,
    quota INT UNSIGNED NOT NULL,
    status ENUM('draft', 'published', 'cancelled', 'completed')
        NOT NULL DEFAULT 'draft',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE KEY uq_events_slug (slug),
    KEY idx_events_status_start (status, starts_at),

    CONSTRAINT fk_events_creator
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_events_quota CHECK (quota > 0),
    CONSTRAINT chk_events_time CHECK (ends_at > starts_at),
    CONSTRAINT chk_events_registration_time
        CHECK (registration_closes_at > registration_opens_at)
) ENGINE=InnoDB;

CREATE TABLE registrations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    registration_number VARCHAR(40) NOT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    institution VARCHAR(180) NULL,
    status ENUM('pending', 'confirmed', 'rejected', 'cancelled')
        NOT NULL DEFAULT 'pending',
    rejection_reason VARCHAR(500) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE KEY uq_registration_number (registration_number),
    UNIQUE KEY uq_event_email (event_id, email),
    KEY idx_registration_status (event_id, status, created_at),
    KEY idx_registration_user (user_id, created_at),

    CONSTRAINT fk_registrations_event
        FOREIGN KEY (event_id) REFERENCES events(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_registrations_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;
```

## Catatan implementasi database

1. Simpan email yang sudah dinormalisasi, misalnya diubah menjadi huruf kecil dan di-trim, sebelum menyimpan atau memeriksa duplikasi.

2. Gunakan waktu UTC pada backend dan database; tampilkan waktu lokal di frontend.

3. `DATETIME` MySQL tidak menyimpan informasi zona waktu. Konsistensi UTC harus dijaga oleh aplikasi.

4. `registration_number` dibuat di backend dengan generator yang aman terhadap tabrakan dan dilindungi unique index.

5. Gunakan tabel migrasi berversi untuk perubahan berikutnya. Jangan menjalankan migrasi `DROP TABLE` pada database produksi.

6. Hapus event yang sudah memiliki pendaftaran sebaiknya dilarang. Gunakan status `cancelled` atau `completed`.

Satu hal penting soal kuota: jangan menghitung jumlah peserta lalu menyimpan pendaftaran tanpa transaksi. Dua request bersamaan bisa melewati kuota. Nanti proses pendaftaran perlu transaksi database dan mekanisme penguncian yang tepat, misalnya mengunci baris event menggunakan `SELECT ... FOR UPDATE`.

# 4. Kontrak REST API

Semua endpoint memakai prefix `/api/v1`, respons JSON, dan format tanggal ISO 8601 pada API. Contoh di bawah merupakan rancangan kontrak yang akan diimplementasikan.

## A. Format respons standar

Berhasil:

JSON

```
{
  "data": {
    "id": 12,
    "title": "Seminar Teknologi 2026"
  }
}
```

Gagal validasi:

JSON

```
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirim tidak valid.",
    "details": {
      "email": "Format email tidak valid."
    }
  }
}
```

Gunakan status HTTP dengan konsisten: `200` untuk berhasil membaca atau memperbarui data, `201` untuk membuat data, `204` untuk berhasil menghapus, `400` untuk request yang salah, `401` untuk belum login, `403` untuk tidak berhak, `404` untuk data yang tidak ditemukan, `409` untuk konflik seperti email ganda atau kuota penuh, `422` untuk data yang gagal validasi bisnis, dan `429` untuk rate limit.

## B. Daftar endpoint

Auth dan akun

| Method | Endpoint                     | Akses   |
| ------ | ---------------------------- | ------- |
| `POST` | `/auth/register`             | Publik  |
| `POST` | `/auth/login`                | Publik  |
| `POST` | `/auth/logout`               | Login   |
| `GET`  | `/auth/me`                   | Login   |
| `GET`  | `/participant/registrations` | Peserta |

Event publik

| Method | Endpoint                    | Akses                           |
| ------ | --------------------------- | ------------------------------- |
| `GET`  | `/events`                   | Publik                          |
| `GET`  | `/events/:slug`             | Publik                          |
| `POST` | `/events/:id/registrations` | Publik, dengan atau tanpa login |

Manajemen admin

| Method   | Endpoint                          | Akses |
| -------- | --------------------------------- | ----- |
| `GET`    | `/admin/dashboard`                | Admin |
| `GET`    | `/admin/events`                   | Admin |
| `POST`   | `/admin/events`                   | Admin |
| `GET`    | `/admin/events/:id`               | Admin |
| `PUT`    | `/admin/events/:id`               | Admin |
| `DELETE` | `/admin/events/:id`               | Admin |
| `GET`    | `/admin/registrations`            | Admin |
| `GET`    | `/admin/registrations/:id`        | Admin |
| `PATCH`  | `/admin/registrations/:id/status` | Admin |

Untuk konsistensi, endpoint `/admin/events` mendukung pagination dan pencarian. Endpoint publik `/events` hanya menampilkan event `published` yang layak ditampilkan, bukan event draft atau event internal.

## C. Kontrak request dan respons utama

### 1. Registrasi akun

`POST /api/v1/auth/register`

JSON

```
{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "password": "contoh-password-yang-kuat"
}
```

Validasi nama, email,


server membuat session acak yang aman, menyimpan hash token session di database, lalu mengirim cookie `HttpOnly`. Password tidak pernah dikirim kembali ke frontend. Pesan login gagal sebaiknya tidak membocorkan apakah email atau password yang salah.

### 3. Membuat pendaftaran event

`POST /api/v1/events/:id/registrations`

JSON

```
{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "phone": "081234567890",
  "institution": "SMK Teknologi",
  "accept_terms": true
}
```

Alur backend:

1. Memeriksa event dan status publikasinya.

2. Memeriksa waktu pembukaan dan penutupan pendaftaran.

3. Memvalidasi seluruh data peserta.

4. Memeriksa apakah email sudah mendaftar pada event yang sama.

5. Memeriksa kuota dalam transaksi database.

6. Membuat nomor pendaftaran unik dan menyimpan status `pending`.

7. Mengembalikan nomor pendaftaran kepada peserta.

Jika berhasil, API mengembalikan `201 Created`. Jika kuota penuh atau email sudah terdaftar, server mengembalikan konflik yang sesuai tanpa membuat pendaftaran duplikat.

### 4. Verifikasi pendaftaran oleh admin

`PATCH /api/v1/admin/registrations/:id/status`

Untuk menerima peserta:

JSON

```
{
  "status": "confirmed"
}
```

Untuk menolak peserta:

JSON

```
{
  "status": "rejected",
  "rejection_reason": "Data pendaftaran belum memenuhi ketentuan."
}
```

Backend wajib memvalidasi transisi status, menyimpan perubahan, dan memastikan hanya admin yang dapat melakukan verifikasi. Jika nantinya diperlukan audit lengkap, kita tambahkan tabel riwayat perubahan status.

### 5. Membuat event

`POST /api/v1/admin/events`

JSON

```
{
  "title": "Seminar Teknologi 2026",
  "description": "Seminar pengembangan teknologi dan karier digital.",
  "location": "Palembang",
  "starts_at": "2026-11-15T09:00:00Z",
  "ends_at": "2026-11-15T12:00:00Z",
  "registration_opens_at": "2026-10-15T00:00:00Z",
  "registration_closes_at": "2026-11-14T12:00:00Z",
  "quota": 100,
  "status": "draft"
}
```

Event dibuat sebagai `draft` secara default. Admin dapat memeriksa informasi dan menerbitkannya ketika sudah siap. Tanggal di atas hanya contoh payload untuk dokumentasi, bukan event yang benar-benar dibuat.

# 5. Flow sistem secara keseluruhan

Ini alur utama yang menjadi dasar implementasi DaftarIn.

Opsi diagram

![](data\:image/svg+xml;utf8,%3Csvg%20id%3D%22mermaid-_r_j9_%22%20width%3D%221071.81103515625%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20class%3D%22flowchart%22%20height%3D%221495.5999755859375%22%20viewBox%3D%224%204%201071.81103515625%201495.5999755859375%22%20role%3D%22graphics-document%20document%22%20aria-roledescription%3D%22flowchart-v2%22%3E%3Cstyle%3E%23mermaid-_r_j9_%7Bfont-family%3A%22-apple-system%22%2C%22BlinkMacSystemFont%22%2C%22Segoe%20UI%22%2C%22Roboto%22%2C%22Oxygen%22%2C%22Ubuntu%22%2C%22Cantarell%22%2C%22Helvetica%20Neue%22%2C%22Arial%22%2C%22sans-serif%22%3Bfont-size%3A14px%3Bfill%3Argb\(255%2C%20255%2C%20255\)%3B%7D%40keyframes%20edge-animation-frame%7Bfrom%7Bstroke-dashoffset%3A0%3B%7D%7D%40keyframes%20dash%7Bto%7Bstroke-dashoffset%3A0%3B%7D%7D%23mermaid-_r_j9_%20.edge-animation-slow%7Bstroke-dasharray%3A9%2C5!important%3Bstroke-dashoffset%3A900%3Banimation%3Adash%2050s%20linear%20infinite%3Bstroke-linecap%3Around%3B%7D%23mermaid-_r_j9_%20.edge-animation-fast%7Bstroke-dasharray%3A9%2C5!important%3Bstroke-dashoffset%3A900%3Banimation%3Adash%2020s%20linear%20infinite%3Bstroke-linecap%3Around%3B%7D%23mermaid-_r_j9_%20.error-icon%7Bfill%3Argb\(33%2C%2033%2C%2033\)%3B%7D%23mermaid-_r_j9_%20.error-text%7Bfill%3Argb\(255%2C%20255%2C%20255\)%3Bstroke%3Argb\(255%2C%20255%2C%20255\)%3B%7D%23mermaid-_r_j9_%20.edge-thickness-normal%7Bstroke-width%3A1px%3B%7D%23mermaid-_r_j9_%20.edge-thickness-thick%7Bstroke-width%3A3.5px%3B%7D%23mermaid-_r_j9_%20.edge-pattern-solid%7Bstroke-dasharray%3A0%3B%7D%23mermaid-_r_j9_%20.edge-thickness-invisible%7Bstroke-width%3A0%3Bfill%3Anone%3B%7D%23mermaid-_r_j9_%20.edge-pattern-dashed%7Bstroke-dasharray%3A3%3B%7D%23mermaid-_r_j9_%20.edge-pattern-dotted%7Bstroke-dasharray%3A2%3B%7D%23mermaid-_r_j9_%20.marker%7Bfill%3Argb\(205%2C%20205%2C%20205\)%3Bstroke%3Argb\(205%2C%20205%2C%20205\)%3B%7D%23mermaid-_r_j9_%20.marker.cross%7Bstroke%3Argb\(205%2C%20205%2C%20205\)%3B%7D%23mermaid-_r_j9_%20svg%7Bfont-family%3A%22-apple-system%22%2C%22BlinkMacSystemFont%22%2C%22Segoe%20UI%22%2C%22Roboto%22%2C%22Oxygen%22%2C%22Ubuntu%22%2C%22Cantarell%22%2C%22Helvetica%20Neue%22%2C%22Arial%22%2C%22sans-serif%22%3Bfont-size%3A14px%3B%7D%23mermaid-_r_j9_%20p%7Bmargin%3A0%3B%7D%23mermaid-_r_j9_%20.label%7Bfont-family%3A%22-apple-system%22%2C%22BlinkMacSystemFont%22%2C%22Segoe%20UI%22%2C%22Roboto%22%2C%22Oxygen%22%2C%22Ubuntu%22%2C%22Cantarell%22%2C%22Helvetica%20Neue%22%2C%22Arial%22%2C%22sans-serif%22%3Bcolor%3Argb\(255%2C%20255%2C%20255\)%3B%7D%23mermaid-_r_j9_%20.cluster-label%20text%7Bfill%3Argb\(255%2C%20255%2C%20255\)%3B%7D%23mermaid-_r_j9_%20.cluster-label%20span%7Bcolor%3Argb\(255%2C%20255%2C%20255\)%3B%7D%23mermaid-_r_j9_%20.cluster-label%20span%20p%7Bbackground-color%3Atransparent%3B%7D%23mermaid-_r_j9_%20.label%20text%2C%23mermaid-_r_j9_%20span%7Bfill%3Argb\(255%2C%20255%2C%20255\)%3Bcolor%3Argb\(255%2C%20255%2C%20255\)%3B%7D%23mermaid-_r_j9_%20.node%20rect%2C%23mermaid-_r_j9_%20.node%20circle%2C%23mermaid-_r_j9_%20.node%20ellipse%2C%23mermaid-_r_j9_%20.node%20polygon%2C%23mermaid-_r_j9_%20.node%20path%7Bfill%3Argb\(9%2C%2023%2C%2044\)%3Bstroke%3Argb\(31%2C%2078%2C%20148\)%3Bstroke-width%3A1px%3B%7D%23mermaid-_r_j9_%20.rough-node%20.label%20text%2C%23mermaid-_r_j9_%20.node%20.label%20text%2C%23mermaid-_r_j9_%20.image-shape%20.label%2C%23mermaid-_r_j9_%20.icon-shape%20.label%7Btext-anchor%3Amiddle%3B%7D%23mermaid-_r_j9_%20.node%20.katex%20path%7Bfill%3A%23000%3Bstroke%3A%23000%3Bstroke-width%3A1px%3B%7D%23mermaid-_r_j9_%20.rough-node%20.label%2C%23mermaid-_r_j9_%20.node%20.label%2C%23mermaid-_r_j9_%20.image-shape%20.label%2C%23mermaid-_r_j9_%20.icon-shape%20.label%7Btext-align%3Acenter%3B%7D%23mermaid-_r_j9_%20.node.clickable%7Bcursor%3Apointer%3B%7D%23mermaid-_r_j9_%20.root%20.anchor%20path%7Bfill%3Argb\(205%2C%20205%2C%20205\)!important%3Bstroke-width%3A0%3Bstroke%3Argb\(205%2C%20205%2C%20205\)%3B%7D%23mermaid-_r_j9_%20.arrowheadPath%7Bfill%3Argb\(205%2C%20205%2C%20205\)%3B%7D%23mermaid-_r_j9_%20.edgePath%20.path%7Bstroke%3Argb\(205%2C%20205%2C%20205\)%3Bstroke-width%3A2.0px%3B%7D%23mermaid-_r_j9_%20.flowchart-link%7Bstroke%3Argb\(205%2C%20205%2C%20205\)%3Bfill%3Anone%3B%7D%23mermaid-_r_j9_%20.edgeLabel%7Bbackground-color%3Argb\(0%2C%200%2C%200\)%3Btext-align%3Acenter%3B%7D%23mermaid-_r_j9_%20.edgeLabel%20p%7Bbackground-color%3Argb\(0%2C%200%2C%200\)%3B%7D%23mermaid-_r_j9_%20.edgeLabel%20rect%7Bopacity%3A0.5%3Bbackground-color%3Argb\(0%2C%200%2C%200\)%3Bfill%3Argb\(0%2C%200%2C%200\)%3B%7D%23mermaid-_r_j9_%20.labelBkg%7Bbackground-color%3Argba\(0%2C%200%2C%200%2C%200.5\)%3B%7D%23mermaid-_r_j9_%20.cluster%20rect%7Bfill%3Argb\(33%2C%2033%2C%2033\)%3Bstroke%3Argba\(255%2C%20255%2C%20255%2C%200.05\)%3Bstroke-width%3A1px%3B%7D%23mermaid-_r_j9_%20.cluster%20text%7Bfill%3Argb\(255%2C%20255%2C%20255\)%3B%7D%23mermaid-_r_j9_%20.cluster%20span%7Bcolor%3Argb\(255%2C%20255%2C%20255\)%3B%7D%23mermaid-_r_j9_%20div.mermaidTooltip%7Bposition%3Aabsolute%3Btext-align%3Acenter%3Bmax-width%3A200px%3Bpadding%3A2px%3Bfont-family%3A%22-apple-system%22%2C%22BlinkMacSystemFont%22%2C%22Segoe%20UI%22%2C%22Roboto%22%2C%22Oxygen%22%2C%22Ubuntu%22%2C%22Cantarell%22%2C%22Helvetica%20Neue%22%2C%22Arial%22%2C%22sans-serif%22%3Bfont-size%3A12px%3Bbackground%3Argb\(33%2C%2033%2C%2033\)%3Bborder%3A1px%20solid%20rgba\(255%2C%20255%2C%20255%2C%200.05\)%3Bborder-radius%3A2px%3Bpointer-events%3Anone%3Bz-index%3A100%3B%7D%23mermaid-_r_j9_%20.flowchartTitleText%7Btext-anchor%3Amiddle%3Bfont-size%3A18px%3Bfill%3Argb\(255%2C%20255%2C%20255\)%3B%7D%23mermaid-_r_j9_%20rect.text%7Bfill%3Anone%3Bstroke-width%3A0%3B%7D%23mermaid-_r_j9_%20.icon-shape%2C%23mermaid-_r_j9_%20.image-shape%7Bbackground-color%3Argb\(0%2C%200%2C%200\)%3Btext-align%3Acenter%3B%7D%23mermaid-_r_j9_%20.icon-shape%20p%2C%23mermaid-_r_j9_%20.image-shape%20p%7Bbackground-color%3Argb\(0%2C%200%2C%200\)%3Bpadding%3A2px%3B%7D%23mermaid-_r_j9_%20.icon-shape%20rect%2C%23mermaid-_r_j9_%20.image-shape%20rect%7Bopacity%3A0.5%3Bbackground-color%3Argb\(0%2C%200%2C%200\)%3Bfill%3Argb\(0%2C%200%2C%200\)%3B%7D%23mermaid-_r_j9_%20.label-icon%7Bdisplay%3Ainline-block%3Bheight%3A1em%3Boverflow%3Avisible%3Bvertical-align%3A-0.125em%3B%7D%23mermaid-_r_j9_%20.node%20.label-icon%20path%7Bfill%3AcurrentColor%3Bstroke%3Arevert%3Bstroke-width%3Arevert%3B%7D%23mermaid-_r_j9_%20.node%20text%7Bfont-size%3A16px%3Bfont-weight%3A600%3Bletter-spacing%3A-0.32px%3Bfill%3A%2399ceff%3B%7D%23mermaid-_r_j9_%20.edgeLabels%20text%7Bfont-size%3A13px%3Bfont-weight%3A600%3Bletter-spacing%3A-0.08px%3Bfill%3A%2399ceff%3B%7D%23mermaid-_r_j9_%20.node%20tspan%5Bfont-weight%3D%22normal%22%5D%2C%23mermaid-_r_j9_%20.edgeLabels%20tspan%5Bfont-weight%3D%22normal%22%5D%7Bfont-weight%3A600%3B%7D%23mermaid-_r_j9_%20.edgeLabel%20.label%20rect%7Bopacity%3A1%3Brx%3A13px%3Bry%3A13px%3Bfill%3A%23000e1a%3Bstroke%3Argb\(26%2C%2062%2C%2095\)%3Bstroke-width%3A1px%3B%7D%23mermaid-_r_j9_%20.node%20rect%2C%23mermaid-_r_j9_%20.node%20circle%2C%23mermaid-_r_j9_%20.node%20ellipse%2C%23mermaid-_r_j9_%20.node%20polygon%2C%23mermaid-_r_j9_%20.node%20path%7Bfill%3Argb\(0%2C%2040%2C%2077\)%3Bstroke%3Argba\(255%2C%20255%2C%20255%2C%200.1\)%3Bstroke-width%3A1px%3B%7D%23mermaid-_r_j9_%20.node%20rect%7Brx%3A16px%3Bry%3A16px%3B%7D%23mermaid-_r_j9_%20.node.mermaid-decision%20.label-container%7Bfill%3A%23000e1a%3Bstroke%3Argb\(26%2C%2062%2C%2095\)%3Bstroke-dasharray%3A2%202%3B%7D%23mermaid-_r_j9_%20.edgePaths%20.flowchart-link%7Bstroke%3Argb\(26%2C%2062%2C%2095\)%3Bstroke-width%3A1px%3Bstroke-linecap%3Around%3Bstroke-linejoin%3Around%3B%7D%23mermaid-_r_j9_%20.marker%7Bfill%3Argb\(26%2C%2062%2C%2095\)%3Bstroke%3Argb\(26%2C%2062%2C%2095\)%3B%7D%23mermaid-_r_j9_%20.node%7Bcolor-scheme%3Adark%3B%7D%23mermaid-_r_j9_%20%3Aroot%7B--mermaid-font-family%3A%22-apple-system%22%2C%22BlinkMacSystemFont%22%2C%22Segoe%20UI%22%2C%22Roboto%22%2C%22Oxygen%22%2C%22Ubuntu%22%2C%22Cantarell%22%2C%22Helvetica%20Neue%22%2C%22Arial%22%2C%22sans-serif%22%3B%7D%3C%2Fstyle%3E%3Cg%3E%3Cmarker%20id%3D%22mermaid-_r_j9__flowchart-v2-pointEnd%22%20class%3D%22marker%20flowchart-v2%22%20viewBox%3D%22-5%20-5%2010%2010%22%20refX%3D%220%22%20refY%3D%220%22%20markerUnits%3D%22userSpaceOnUse%22%20markerWidth%3D%2210%22%20markerHeight%3D%2210%22%20orient%3D%22auto%22%3E%3Cpath%20d%3D%22M%200%200%20L%204%200%20M%200.8180194846605362%20-3.181980515339464%20L%204%200%20L%200.8180194846605362%203.181980515339464%22%20class%3D%22arrowMarkerPath%22%20style%3D%22stroke-width%3A%201%3B%20stroke-dasharray%3A%20none%3B%20fill%3A%20none%3B%20stroke-linecap%3A%20round%3B%20stroke-linejoin%3A%20round%3B%22%3E%3C%2Fpath%3E%3C%2Fmarker%3E%3Cmarker%20id%3D%22mermaid-_r_j9__flowchart-v2-pointStart%22%20class%3D%22marker%20flowchart-v2%22%20viewBox%3D%22-5%20-5%2010%2010%22%20refX%3D%220%22%20refY%3D%220%22%20markerUnits%3D%22userSpaceOnUse%22%20markerWidth%3D%2210%22%20markerHeight%3D%2210%22%20orient%3D%22auto%22%3E%3Cpath%20d%3D%22M%200%200%20L%20-4%200%20M%20-0.8180194846605362%20-3.181980515339464%20L%20-4%200%20L%20-0.8180194846605362%203.181980515339464%22%20class%3D%22arrowMarkerPath%22%20style%3D%22stroke-width%3A%201%3B%20stroke-dasharray%3A%20none%3B%20fill%3A%20none%3B%20stroke-linecap%3A%20round%3B%20stroke-linejoin%3A%20round%3B%22%3E%3C%2Fpath%3E%3C%2Fmarker%3E%3Cmarker%20id%3D%22mermaid-_r_j9__flowchart-v2-circleEnd%22%20class%3D%22marker%20flowchart-v2%22%20viewBox%3D%220%200%2010%2010%22%20refX%3D%2211%22%20refY%3D%225%22%20markerUnits%3D%22userSpaceOnUse%22%20markerWidth%3D%2211%22%20markerHeight%3D%2211%22%20orient%3D%22auto%22%3E%3Ccircle%20cx%3D%225%22%20cy%3D%225%22%20r%3D%225%22%20class%3D%22arrowMarkerPath%22%20style%3D%22stroke-width%3A%201%3B%20stroke-dasharray%3A%201%2C%200%3B%22%3E%3C%2Fcircle%3E%3C%2Fmarker%3E%3Cmarker%20id%3D%22mermaid-_r_j9__flowchart-v2-circleStart%22%20class%3D%22marker%20flowchart-v2%22%20viewBox%3D%220%200%2010%2010%22%20refX%3D%22-1%22%20refY%3D%225%22%20markerUnits%3D%22userSpaceOnUse%22%20markerWidth%3D%2211%22%20markerHeight%3D%2211%22%20orient%3D%22auto%22%3E%3Ccircle%20cx%3D%225%22%20cy%3D%225%22%20r%3D%225%22%20class%3D%22arrowMarkerPath%22%20style%3D%22stroke-width%3A%201%3B%20stroke-dasharray%3A%201%2C%200%3B%22%3E%3C%2Fcircle%3E%3C%2Fmarker%3E%3Cmarker%20id%3D%22mermaid-_r_j9__flowchart-v2-crossEnd%22%20class%3D%22marker%20cross%20flowchart-v2%22%20viewBox%3D%220%200%2011%2011%22%20refX%3D%2212%22%20refY%3D%225.2%22%20markerUnits%3D%22userSpaceOnUse%22%20markerWidth%3D%2211%22%20markerHeight%3D%2211%22%20orient%3D%22auto%22%3E%3Cpath%20d%3D%22M%201%2C1%20l%209%2C9%20M%2010%2C1%20l%20-9%2C9%22%20class%3D%22arrowMarkerPath%22%20style%3D%22stroke-width%3A%202%3B%20stroke-dasharray%3A%201%2C%200%3B%22%3E%3C%2Fpath%3E%3C%2Fmarker%3E%3Cmarker%20id%3D%22mermaid-_r_j9__flowchart-v2-crossStart%22%20class%3D%22marker%20cross%20flowchart-v2%22%20viewBox%3D%220%200%2011%2011%22%20refX%3D%22-1%22%20refY%3D%225.2%22%20markerUnits%3D%22userSpaceOnUse%22%20markerWidth%3D%2211%22%20markerHeight%3D%2211%22%20orient%3D%22auto%22%3E%3Cpath%20d%3D%22M%201%2C1%20l%209%2C9%20M%2010%2C1%20l%20-9%2C9%22%20class%3D%22arrowMarkerPath%22%20style%3D%22stroke-width%3A%202%3B%20stroke-dasharray%3A%201%2C%200%3B%22%3E%3C%2Fpath%3E%3C%2Fmarker%3E%3C%2Fg%3E%3Cg%20class%3D%22subgraphs%22%3E%3C%2Fg%3E%3Cg%20class%3D%22nodes%22%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-A-0%22%20transform%3D%22translate\(307.3811162312825%2C%20639.7000007629395\)%22%3E%3Cg%20class%3D%22basic%20label-container%20outer-path%22%3E%3Cpath%20d%3D%22M-13.463135004043579%20-18.300000190734863%20C-3.5947635580501878%20-18.300000190734863%2C%206.273607887943204%20-18.300000190734863%2C%2013.463135004043579%20-18.300000190734863%20C13.463135004043579%20-18.300000190734863%2C%2013.463135004043579%20-18.300000190734863%2C%2013.463135004043577%20-18.300000190734863%20C13.844294966083307%20-18.287777132635107%2C%2014.225454928123037%20-18.275554074535354%2C%2014.635620041911048%20-18.262400877674132%20C15.02282604475998%20-18.225047580262647%2C%2015.410032047608913%20-18.18769428285116%2C%2015.80328708726067%20-18.149757442134337%20C16.11974766455134%20-18.098594550186412%2C%2016.436208241842014%20-18.047431658238487%2C%2016.961337945739306%20-17.962532760154048%20C17.274373906112352%20-17.891084344949448%2C%2017.5874098664854%20-17.819635929744845%2C%2018.105013937968334%20-17.701496178111093%20C18.528781811089683%20-17.575724097771634%2C%2018.952549684211032%20-17.449952017432175%2C%2019.22961545397796%20-17.367720351313253%20C19.532394823995357%20-17.256294744285036%2C%2019.835174194012755%20-17.14486913725682%2C%2020.330521264912626%20-16.962576836227537%20C20.572248051268204%20-16.85557155847827%2C%2020.813974837623785%20-16.748566280729%2C%2021.403207512651647%20-16.487730454460443%20C21.771313450692034%20-16.29568982236788%2C%2022.139419388732417%20-16.10364919027532%2C%2022.443266299312583%20-15.945132451648883%20C22.697935665997175%20-15.790750384961363%2C%2022.95260503268177%20-15.636368318273844%2C%2023.446423800249143%20-15.337012479373305%20C23.64915664429669%20-15.19559482352911%2C%2023.851889488344234%20-15.054177167684912%2C%2024.408557826113363%20-14.665869433041124%20C24.761952880866467%20-14.384046281112884%2C%2025.115347935619567%20-14.102223129184646%2C%2025.32571476181586%20-13.934461183389454%20C25.6628143705001%20-13.628316237949313%2C%2025.999913979184345%20-13.322171292509175%2C%2026.194125812778296%20-13.14579324380268%20C26.358041410193753%20-12.976536931750395%2C%2026.521957007609206%20-12.80728061969811%2C%2027.01022249171867%20-12.30310642001332%20C27.263380459617384%20-12.005732665823043%2C%2027.516538427516092%20-11.708358911632764%2C%2027.770651282331045%20-11.409863492936067%20C27.911428606429432%20-11.22123470372229%2C%2028.05220593052782%20-11.032605914508514%2C%2028.47228741960331%20-10.469734989358303%20C28.696792606437576%20-10.12483473429708%2C%2028.92129779327184%20-9.779934479235859%2C%2029.11224773014695%20-9.486584098958145%20C29.258766113948006%20-9.226425871924183%2C%2029.405284497749065%20-8.966267644890223%2C%2029.687902479774877%20-8.464450799629462%20C29.81776623469924%20-8.194785933889799%2C%2029.9476299896236%20-7.925121068150135%2C%2030.19688617964331%20-7.407535256346107%20C30.315772353869477%20-7.113884107499669%2C%2030.43465852809564%20-6.820232958653232%2C%2030.63710730655284%20-6.320180561783094%20C30.742318076935547%20-6.003302484450166%2C%2030.847528847318255%20-5.686424407117237%2C%2031.00675689746585%20-5.2068548896172295%20C31.119263462726597%20-4.777818595624169%2C%2031.231770027987345%20-4.34878230163111%2C%2031.304315982923693%20-4.072133133843056%20C31.373349346633123%20-3.7176614014017284%2C%2031.44238271034255%20-3.3631896689604015%2C%2031.528561828818%20-2.9206781095521106%20C31.56876347547629%20-2.608882076783483%2C%2031.608965122134578%20-2.2970860440148555%2C%2031.678572960867406%20-1.7572213924255182%20C31.698360909292216%20-1.449008123164617%2C%2031.718148857717026%20-1.1407948539037158%2C%2031.753732951153033%20-0.5865438756746428%20C31.753732951153033%20-0.13214074038028017%2C%2031.753732951153033%200.3222623949140825%2C%2031.753732951153033%200.5865438756746384%20C31.738348862851982%200.8261634687760623%2C%2031.722964774550935%201.0657830618774862%2C%2031.678572960867406%201.7572213924255058%20C31.625857991177526%202.1660682875920205%2C%2031.57314302148765%202.5749151827585357%2C%2031.528561828818%202.920678109552098%20C31.443521970260655%203.3573398100635994%2C%2031.358482111703307%203.794001510575101%2C%2031.304315982923693%204.072133133843051%20C31.227178359186166%204.366292324811853%2C%2031.150040735448638%204.660451515780654%2C%2031.006756897465852%205.206854889617217%20C30.91778042667253%205.4748378431712865%2C%2030.82880395587921%205.742820796725356%2C%2030.637107306552842%206.320180561783083%20C30.508212316254156%206.638553679835946%2C%2030.37931732595547%206.9569267978888085%2C%2030.196886179643315%207.407535256346102%20C30.027217344617117%207.7598562226095%2C%2029.857548509590924%208.112177188872897%2C%2029.68790247977488%208.464450799629459%20C29.46528269008953%208.859734778913953%2C%2029.242662900404177%209.255018758198446%2C%2029.112247730146954%209.486584098958142%20C28.881838082041593%209.84055519210162%2C%2028.651428433936232%2010.194526285245098%2C%2028.47228741960332%2010.469734989358292%20C28.204443202334268%2010.82862183938865%2C%2027.936598985065217%2011.187508689419005%2C%2027.77065128233105%2011.409863492936063%20C27.595928389002406%2011.615102945454163%2C%2027.42120549567376%2011.820342397972263%2C%2027.01022249171868%2012.30310642001331%20C26.783048632651266%2012.537682080821112%2C%2026.55587477358385%2012.772257741628916%2C%2026.1941258127783%2013.145793243802677%20C25.930610233455436%2013.38511112070354%2C%2025.667094654132573%2013.624428997604404%2C%2025.325714761815874%2013.934461183389441%20C24.996509330095027%2014.19699375466236%2C%2024.667303898374183%2014.459526325935277%2C%2024.408557826113366%2014.665869433041122%20C24.11345814546281%2014.871718195603666%2C%2023.818358464812253%2015.07756695816621%2C%2023.446423800249153%2015.3370124793733%20C23.17602429580629%2015.500930248010434%2C%2022.905624791363422%2015.664848016647568%2C%2022.443266299312587%2015.94513245164888%20C22.228331254964402%2016.057263926612862%2C%2022.01339621061622%2016.169395401576843%2C%2021.40320751265165%2016.487730454460443%20C21.15124099297631%2016.599268558399476%2C%2020.899274473300963%2016.710806662338506%2C%2020.330521264912633%2016.962576836227537%20C19.899529128552118%2017.12118592645584%2C%2019.4685369921916%2017.279795016684147%2C%2019.22961545397797%2017.36772035131325%20C18.905865454500706%2017.463807651759677%2C%2018.582115455023445%2017.559894952206104%2C%2018.10501393796835%2017.70149617811109%20C17.81548035517163%2017.76758032900124%2C%2017.52594677237491%2017.833664479891393%2C%2016.961337945739313%2017.962532760154048%20C16.70285366687513%2018.00432249378529%2C%2016.44436938801094%2018.04611222741653%2C%2015.803287087260681%2018.149757442134334%20C15.359321344509956%2018.192586283390572%2C%2014.91535560175923%2018.23541512464681%2C%2014.635620041911048%2018.262400877674132%20C14.22490231970725%2018.275571795611658%2C%2013.81418459750345%2018.288742713549187%2C%2013.463135004043583%2018.300000190734863%20C13.46313500404358%2018.300000190734863%2C%2013.46313500404358%2018.300000190734863%2C%2013.463135004043579%2018.300000190734863%20C4.213912176831869%2018.300000190734863%2C%20-5.0353106503798415%2018.300000190734863%2C%20-13.463135004043576%2018.300000190734863%20C-13.925894741941718%2018.285160386647657%2C%20-14.388654479839861%2018.27032058256045%2C%20-14.635620041911043%2018.262400877674132%20C-14.941480348382848%2018.232894901759632%2C%20-15.247340654854654%2018.203388925845136%2C%20-15.803287087260674%2018.149757442134334%20C-16.083157240180086%2018.104510206235776%2C%20-16.363027393099497%2018.059262970337215%2C%20-16.961337945739306%2017.962532760154048%20C-17.211627354696763%2017.90540583585054%2C%20-17.46191676365422%2017.848278911547034%2C%20-18.10501393796833%2017.701496178111093%20C-18.40737390378617%2017.611757327376207%2C%20-18.70973386960401%2017.52201847664132%2C%20-19.22961545397795%2017.36772035131326%20C-19.54531813328785%2017.25153884700364%2C%20-19.86102081259775%2017.135357342694018%2C%20-20.330521264912626%2016.962576836227537%20C-20.726935591673264%2016.787095972983803%2C%20-21.123349918433902%2016.611615109740068%2C%20-21.403207512651647%2016.487730454460447%20C-21.758584865274415%2016.30233031722721%2C%20-22.11396221789718%2016.116930179993968%2C%20-22.44326629931258%2015.945132451648885%20C-22.700912474434446%2015.788945826193022%2C%20-22.958558649556313%2015.632759200737159%2C%20-23.446423800249136%2015.33701247937331%20C-23.830229980268637%2015.069285902893458%2C%20-24.21403616028814%2014.801559326413605%2C%20-24.40855782611336%2014.665869433041125%20C-24.725454904954496%2014.413152445650752%2C%20-25.04235198379563%2014.160435458260379%2C%20-25.32571476181586%2013.934461183389455%20C-25.626983628045497%2013.660856770217093%2C%20-25.928252494275135%2013.38725235704473%2C%20-26.19412581277829%2013.145793243802688%20C-26.40680237978187%2012.926187227300609%2C%20-26.61947894678545%2012.70658121079853%2C%20-27.01022249171868%2012.303106420013316%20C-27.26162665551172%2012.00779278391984%2C%20-27.51303081930476%2011.712479147826363%2C%20-27.770651282331045%2011.409863492936068%20C-28.04972872234518%2011.035925147794945%2C%20-28.328806162359314%2010.661986802653821%2C%20-28.47228741960331%2010.469734989358304%20C-28.644903649785043%2010.204550105851197%2C%20-28.81751987996677%209.939365222344092%2C%20-29.112247730146944%209.486584098958154%20C-29.24217334120747%209.255888020125443%2C%20-29.372098952267994%209.025191941292734%2C%20-29.687902479774877%208.464450799629464%20C-29.84969255275992%208.128490251323024%2C%20-30.01148262574496%207.792529703016584%2C%20-30.19688617964331%207.407535256346109%20C-30.293637391336286%207.168557892907036%2C%20-30.390388603029262%206.929580529467963%2C%20-30.63710730655284%206.320180561783097%20C-30.7841368927518%205.87735087413507%2C%20-30.93116647895076%205.434521186487043%2C%20-31.00675689746585%205.206854889617224%20C-31.11371903322522%204.7989619082838635%2C%20-31.220681168984587%204.391068926950502%2C%20-31.30431598292369%204.0721331338430575%20C-31.369832271108717%203.735720840885371%2C%20-31.43534855929374%203.3993085479276846%2C%20-31.528561828818%202.920678109552113%20C-31.56263812653026%202.656389073621908%2C%20-31.59671442424252%202.3921000376917028%2C%20-31.678572960867402%201.7572213924255287%20C-31.704675502570797%201.3506532358026988%2C%20-31.730778044274196%200.9440850791798688%2C%20-31.753732951153033%200.586543875674645%20C-31.753732951153033%200.3470971126711949%2C%20-31.753732951153033%200.10765034966774473%2C%20-31.753732951153033%20-0.5865438756746362%20C-31.725357328736788%20-1.0285170991978227%2C%20-31.696981706320543%20-1.4704903227210093%2C%20-31.678572960867406%20-1.7572213924255036%20C-31.621686080451695%20-2.198424803344632%2C%20-31.56479920003598%20-2.6396282142637597%2C%20-31.528561828818%20-2.9206781095521044%20C-31.44017800655206%20-3.3745103569602426%2C%20-31.351794184286124%20-3.8283426043683804%2C%20-31.304315982923693%20-4.0721331338430495%20C-31.199161887086564%20-4.473131275343448%2C%20-31.094007791249435%20-4.8741294168438465%2C%20-31.006756897465852%20-5.206854889617215%20C-30.908876146507307%20-5.501656116324551%2C%20-30.810995395548765%20-5.7964573430318875%2C%20-30.637107306552846%20-6.320180561783073%20C-30.547727014396518%20-6.540951611459593%2C%20-30.45834672224019%20-6.761722661136114%2C%20-30.196886179643315%20-7.4075352563461%20C-30.046827588582797%20-7.719135131422763%2C%20-29.89676899752228%20-8.030735006499425%2C%20-29.68790247977488%20-8.464450799629457%20C-29.543934818094122%20-8.720079961250207%2C%20-29.399967156413364%20-8.975709122870954%2C%20-29.11224773014695%20-9.486584098958149%20C-28.884882290115897%20-9.835878471015164%2C%20-28.657516850084843%20-10.18517284307218%2C%20-28.47228741960331%20-10.469734989358297%20C-28.238977214015772%20-10.782349409848615%2C%20-28.005667008428237%20-11.094963830338934%2C%20-27.770651282331052%20-11.409863492936063%20C-27.53062921404952%20-11.691807071982142%2C%20-27.290607145767986%20-11.97375065102822%2C%20-27.010222491718686%20-12.30310642001331%20C-26.708469372772733%20-12.614691289716811%2C%20-26.40671625382678%20-12.926276159420311%2C%20-26.194125812778307%20-13.14579324380267%20C-26.001722524604183%20-13.320528819410368%2C%20-25.809319236430056%20-13.495264395018065%2C%20-25.325714761815874%20-13.93446118338944%20C-25.015133569613443%20-14.18214141925825%2C%20-24.704552377411016%20-14.429821655127057%2C%20-24.408557826113366%20-14.66586943304112%20C-24.10414686146682%20-14.87821334424028%2C%20-23.799735896820273%20-15.090557255439439%2C%20-23.446423800249157%20-15.337012479373296%20C-23.06072819248977%20-15.570823423396018%2C%20-22.675032584730385%20-15.804634367418737%2C%20-22.44326629931259%20-15.945132451648877%20C-22.18472456559537%20-16.080013508525266%2C%20-21.926182831878155%20-16.214894565401657%2C%20-21.403207512651655%20-16.487730454460443%20C-21.17274122941482%20-16.58975104151%2C%20-20.94227494617799%20-16.691771628559554%2C%20-20.330521264912637%20-16.962576836227534%20C-19.904543593073967%20-17.119340557158598%2C%20-19.478565921235294%20-17.27610427808966%2C%20-19.229615453977974%20-17.36772035131325%20C-18.874845747272083%20-17.473014138039364%2C%20-18.520076040566195%20-17.578307924765483%2C%20-18.105013937968355%20-17.701496178111086%20C-17.713653995592487%20-17.790821531096082%2C%20-17.322294053216616%20-17.880146884081082%2C%20-16.961337945739317%20-17.962532760154044%20C-16.59731403075409%20-18.021385323681233%2C%20-16.233290115768867%20-18.08023788720842%2C%20-15.803287087260685%20-18.149757442134334%20C-15.499209773327316%20-18.179091414903013%2C%20-15.195132459393944%20-18.20842538767169%2C%20-14.635620041911052%20-18.262400877674132%20C-14.298495005853505%20-18.273211821406424%2C%20-13.96136996979596%20-18.284022765138715%2C%20-13.463135004043584%20-18.300000190734863%20C-13.463135004043583%20-18.300000190734863%2C%20-13.46313500404358%20-18.300000190734863%2C%20-13.463135004043579%20-18.300000190734863%22%20stroke%3D%22none%22%20stroke-width%3D%220%22%20fill%3D%22rgb\(9%2C%2023%2C%2044\)%22%20style%3D%22%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M-13.463135004043579%20-18.300000190734863%20C-2.714279655237613%20-18.300000190734863%2C%208.034575693568353%20-18.300000190734863%2C%2013.463135004043579%20-18.300000190734863%20M-13.463135004043579%20-18.300000190734863%20C-3.4143709658191703%20-18.300000190734863%2C%206.6343930724052385%20-18.300000190734863%2C%2013.463135004043579%20-18.300000190734863%20M13.463135004043579%20-18.300000190734863%20C13.463135004043579%20-18.300000190734863%2C%2013.463135004043577%20-18.300000190734863%2C%2013.463135004043577%20-18.300000190734863%20M13.463135004043579%20-18.300000190734863%20C13.463135004043579%20-18.300000190734863%2C%2013.463135004043577%20-18.300000190734863%2C%2013.463135004043577%20-18.300000190734863%20M13.463135004043577%20-18.300000190734863%20C13.703377515502194%20-18.292296080996067%2C%2013.94362002696081%20-18.284591971257267%2C%2014.635620041911048%20-18.262400877674132%20M13.463135004043577%20-18.300000190734863%20C13.877207676732567%20-18.28672168606529%2C%2014.291280349421559%20-18.27344318139572%2C%2014.635620041911048%20-18.262400877674132%20M14.635620041911048%20-18.262400877674132%20C14.886304688779589%20-18.23821763128312%2C%2015.136989335648131%20-18.214034384892113%2C%2015.80328708726067%20-18.149757442134337%20M14.635620041911048%20-18.262400877674132%20C15.068389090487662%20-18.220652168038878%2C%2015.501158139064277%20-18.17890345840362%2C%2015.80328708726067%20-18.149757442134337%20M15.80328708726067%20-18.149757442134337%20C16.11312900492566%20-18.09966460374622%2C%2016.422970922590647%20-18.049571765358102%2C%2016.961337945739306%20-17.962532760154048%20M15.80328708726067%20-18.149757442134337%20C16.187645013174773%20-18.087617433412778%2C%2016.572002939088875%20-18.025477424691218%2C%2016.961337945739306%20-17.962532760154048%20M16.961337945739306%20-17.962532760154048%20C17.279634228772025%20-17.88988371062919%2C%2017.597930511804744%20-17.81723466110433%2C%2018.105013937968334%20-17.701496178111093%20M16.961337945739306%20-17.962532760154048%20C17.38752132502428%20-17.86525918493871%2C%2017.813704704309256%20-17.76798560972337%2C%2018.105013937968334%20-17.701496178111093%20M18.105013937968334%20-17.701496178111093%20C18.385519742062016%20-17.6182435278611%2C%2018.666025546155698%20-17.534990877611104%2C%2019.22961545397796%20-17.367720351313253%20M18.105013937968334%20-17.701496178111093%20C18.425066754466947%20-17.60650618216582%2C%2018.745119570965564%20-17.511516186220547%2C%2019.22961545397796%20-17.367720351313253%20M19.22961545397796%20-17.367720351313253%20C19.560443416726535%20-17.24597260288161%2C%2019.89127137947511%20-17.124224854449974%2C%2020.330521264912626%20-16.962576836227537%20M19.22961545397796%20-17.367720351313253%20C19.665691853066235%20-17.207240205402723%2C%2020.10176825215451%20-17.046760059492193%2C%2020.330521264912626%20-16.962576836227537%20M20.330521264912626%20-16.962576836227537%20C20.639700736502938%20-16.82571225563767%2C%2020.94888020809325%20-16.6888476750478%2C%2021.403207512651647%20-16.487730454460443%20M20.330521264912626%20-16.962576836227537%20C20.607589230775602%20-16.839927066669187%2C%2020.884657196638578%20-16.717277297110837%2C%2021.403207512651647%20-16.487730454460443%20M21.403207512651647%20-16.487730454460443%20C21.714924371894245%20-16.325107968657758%2C%2022.026641231136843%20-16.16248548285507%2C%2022.443266299312583%20-15.945132451648883%20M21.403207512651647%20-16.487730454460443%20C21.707270812878864%20-16.329100825493743%2C%2022.01133411310608%20-16.170471196527046%2C%2022.443266299312583%20-15.945132451648883%20M22.443266299312583%20-15.945132451648883%20C22.74899623899754%20-15.759797165543308%2C%2023.0547261786825%20-15.574461879437733%2C%2023.446423800249143%20-15.337012479373305%20M22.443266299312583%20-15.945132451648883%20C22.712373598706225%20-15.781998025306425%2C%2022.98148089809987%20-15.61886359896397%2C%2023.446423800249143%20-15.337012479373305%20M23.446423800249143%20-15.337012479373305%20C23.800181666031357%20-15.090246306134825%2C%2024.153939531813574%20-14.843480132896344%2C%2024.408557826113363%20-14.665869433041124%20M23.446423800249143%20-15.337012479373305%20C23.64191922401167%20-15.200643334617064%2C%2023.837414647774196%20-15.064274189860823%2C%2024.408557826113363%20-14.665869433041124%20M24.408557826113363%20-14.665869433041124%20C24.622735869057667%20-14.495068143310128%2C%2024.83691391200197%20-14.324266853579134%2C%2025.32571476181586%20-13.934461183389454%20M24.408557826113363%20-14.665869433041124%20C24.76886977132627%20-14.378530245037377%2C%2025.129181716539176%20-14.09119105703363%2C%2025.32571476181586%20-13.934461183389454%20M25.32571476181586%20-13.934461183389454%20C25.629337055290513%20-13.658719449861442%2C%2025.932959348765163%20-13.382977716333432%2C%2026.194125812778296%20-13.14579324380268%20M25.32571476181586%20-13.934461183389454%20C25.65524306103348%20-13.635192300881029%2C%2025.984771360251106%20-13.335923418372602%2C%2026.194125812778296%20-13.14579324380268%20M26.194125812778296%20-13.14579324380268%20C26.396825679614807%20-12.936488989325415%2C%2026.59952554645132%20-12.727184734848151%2C%2027.01022249171867%20-12.30310642001332%20M26.194125812778296%20-13.14579324380268%20C26.437562812461692%20-12.894424555080201%2C%2026.68099981214509%20-12.643055866357722%2C%2027.01022249171867%20-12.30310642001332%20M27.01022249171867%20-12.30310642001332%20C27.25632537506596%20-12.014019969582828%2C%2027.502428258413246%20-11.724933519152334%2C%2027.770651282331045%20-11.409863492936067%20M27.01022249171867%20-12.30310642001332%20C27.273924863634825%20-11.99334660887057%2C%2027.537627235550975%20-11.683586797727822%2C%2027.770651282331045%20-11.409863492936067%20M27.770651282331045%20-11.409863492936067%20C27.921400650583085%20-11.20787307302831%2C%2028.07215001883512%20-11.005882653120551%2C%2028.47228741960331%20-10.469734989358303%20M27.770651282331045%20-11.409863492936067%20C27.938714275261418%20-11.184674393262995%2C%2028.106777268191795%20-10.959485293589923%2C%2028.47228741960331%20-10.469734989358303%20M28.47228741960331%20-10.469734989358303%20C28.714379777342728%20-10.09781611697012%2C%2028.956472135082144%20-9.72589724458194%2C%2029.11224773014695%20-9.486584098958145%20M28.47228741960331%20-10.469734989358303%20C28.68205209866812%20-10.147480112611527%2C%2028.891816777732927%20-9.82522523586475%2C%2029.11224773014695%20-9.486584098958145%20M29.11224773014695%20-9.486584098958145%20C29.34125730621321%20-9.079954406918317%2C%2029.57026688227947%20-8.67332471487849%2C%2029.687902479774877%20-8.464450799629462%20M29.11224773014695%20-9.486584098958145%20C29.283125003323594%20-9.183174197232812%2C%2029.454002276500237%20-8.879764295507478%2C%2029.687902479774877%20-8.464450799629462%20M29.687902479774877%20-8.464450799629462%20C29.823969070289507%20-8.181905613067183%2C%2029.960035660804138%20-7.899360426504906%2C%2030.19688617964331%20-7.407535256346107%20M29.687902479774877%20-8.464450799629462%20C29.842579225541794%20-8.143261227492284%2C%2029.997255971308707%20-7.822071655355104%2C%2030.19688617964331%20-7.407535256346107%20M30.19688617964331%20-7.407535256346107%20C30.36643775002036%20-6.988739599458193%2C%2030.535989320397405%20-6.56994394257028%2C%2030.63710730655284%20-6.320180561783094%20M30.19688617964331%20-7.407535256346107%20C30.32869138262124%20-7.08197385671038%2C%2030.46049658559917%20-6.756412457074653%2C%2030.63710730655284%20-6.320180561783094%20M30.63710730655284%20-6.320180561783094%20C30.732508645429647%20-6.03284692922528%2C%2030.827909984306455%20-5.745513296667466%2C%2031.00675689746585%20-5.2068548896172295%20M30.63710730655284%20-6.320180561783094%20C30.721404984944893%20-6.066289385477309%2C%2030.805702663336948%20-5.8123982091715245%2C%2031.00675689746585%20-5.2068548896172295%20M31.00675689746585%20-5.2068548896172295%20C31.103389950402093%20-4.838351177741259%2C%2031.200023003338337%20-4.469847465865289%2C%2031.304315982923693%20-4.072133133843056%20M31.00675689746585%20-5.2068548896172295%20C31.09082168661352%20-4.886279414687076%2C%2031.17488647576119%20-4.565703939756923%2C%2031.304315982923693%20-4.072133133843056%20M31.304315982923693%20-4.072133133843056%20C31.37309655729022%20-3.7189594212504726%2C%2031.44187713165675%20-3.3657857086578895%2C%2031.528561828818%20-2.9206781095521106%20M31.304315982923693%20-4.072133133843056%20C31.392422186942536%20-3.619726397459113%2C%2031.48052839096138%20-3.16731966107517%2C%2031.528561828818%20-2.9206781095521106%20M31.528561828818%20-2.9206781095521106%20C31.56210094096236%20-2.6605553788072465%2C%2031.595640053106724%20-2.4004326480623828%2C%2031.678572960867406%20-1.7572213924255182%20M31.528561828818%20-2.9206781095521106%20C31.57579073363033%20-2.5543800502298057%2C%2031.623019638442663%20-2.1880819909075004%2C%2031.678572960867406%20-1.7572213924255182%20M31.678572960867406%20-1.7572213924255182%20C31.697614822861215%20-1.4606290215575937%2C%2031.71665668485502%20-1.164036650689669%2C%2031.753732951153033%20-0.5865438756746428%20M31.678572960867406%20-1.7572213924255182%20C31.702672911794572%20-1.381845203604657%2C%2031.726772862721738%20-1.0064690147837956%2C%2031.753732951153033%20-0.5865438756746428%20M31.753732951153033%20-0.5865438756746428%20C31.753732951153033%20-0.3417923999398628%2C%2031.753732951153033%20-0.09704092420508281%2C%2031.753732951153033%200.5865438756746384%20M31.753732951153033%20-0.5865438756746428%20C31.753732951153033%20-0.18692401073203846%2C%2031.753732951153033%200.21269585421056592%2C%2031.753732951153033%200.5865438756746384%20M31.753732951153033%200.5865438756746384%20C31.731930849272683%200.9261292108010034%2C%2031.710128747392332%201.2657145459273684%2C%2031.678572960867406%201.7572213924255058%20M31.753732951153033%200.5865438756746384%20C31.735997968653944%200.8627805435181479%2C%2031.71826298615486%201.1390172113616575%2C%2031.678572960867406%201.7572213924255058%20M31.678572960867406%201.7572213924255058%20C31.64516444813724%202.0163312199036283%2C%2031.611755935407075%202.275441047381751%2C%2031.528561828818%202.920678109552098%20M31.678572960867406%201.7572213924255058%20C31.61928192340184%202.2170709706688014%2C%2031.55999088593627%202.6769205489120975%2C%2031.528561828818%202.920678109552098%20M31.528561828818%202.920678109552098%20C31.44768283855854%203.335974630753779%2C%2031.36680384829908%203.7512711519554602%2C%2031.304315982923693%204.072133133843051%20M31.528561828818%202.920678109552098%20C31.470747306628322%203.2175434618925056%2C%2031.41293278443864%203.514408814232913%2C%2031.304315982923693%204.072133133843051%20M31.304315982923693%204.072133133843051%20C31.216372219577163%204.407500818551512%2C%2031.128428456230633%204.742868503259972%2C%2031.006756897465852%205.206854889617217%20M31.304315982923693%204.072133133843051%20C31.21357894553687%204.418152783079771%2C%2031.12284190815005%204.76417243231649%2C%2031.006756897465852%205.206854889617217%20M31.006756897465852%205.206854889617217%20C30.89949725139522%205.529903854078159%2C%2030.79223760532459%205.8529528185391015%2C%2030.637107306552842%206.320180561783083%20M31.006756897465852%205.206854889617217%20C30.884586216819784%205.5748135144686515%2C%2030.762415536173712%205.942772139320085%2C%2030.637107306552842%206.320180561783083%20M30.637107306552842%206.320180561783083%20C30.531993873714065%206.579812773124833%2C%2030.42688044087529%206.839444984466584%2C%2030.196886179643315%207.407535256346102%20M30.637107306552842%206.320180561783083%20C30.518631240417683%206.612818735715834%2C%2030.400155174282528%206.905456909648584%2C%2030.196886179643315%207.407535256346102%20M30.196886179643315%207.407535256346102%20C30.024785105580023%207.764906819011612%2C%2029.852684031516727%208.122278381677123%2C%2029.68790247977488%208.464450799629459%20M30.196886179643315%207.407535256346102%20C30.02375088125442%207.767054407952582%2C%2029.850615582865522%208.126573559559063%2C%2029.68790247977488%208.464450799629459%20M29.68790247977488%208.464450799629459%20C29.481425886835876%208.83107089841489%2C%2029.274949293896867%209.197690997200318%2C%2029.112247730146954%209.486584098958142%20M29.68790247977488%208.464450799629459%20C29.517656653817962%208.76673950287521%2C%2029.34741082786104%209.069028206120961%2C%2029.112247730146954%209.486584098958142%20M29.112247730146954%209.486584098958142%20C28.966144139043024%209.71103844920131%2C%2028.820040547939097%209.935492799444477%2C%2028.47228741960332%2010.469734989358292%20M29.112247730146954%209.486584098958142%20C28.872861131186635%209.854346199263663%2C%2028.633474532226316%2010.222108299569186%2C%2028.47228741960332%2010.469734989358292%20M28.47228741960332%2010.469734989358292%20C28.208247706877724%2010.82352414989791%2C%2027.944207994152134%2011.177313310437526%2C%2027.77065128233105%2011.409863492936063%20M28.47228741960332%2010.469734989358292%20C28.29488781820197%2010.70743429379994%2C%2028.117488216800623%2010.945133598241586%2C%2027.77065128233105%2011.409863492936063%20M27.77065128233105%2011.409863492936063%20C27.55699973870644%2011.660830753194752%2C%2027.343348195081838%2011.91179801345344%2C%2027.01022249171868%2012.30310642001331%20M27.77065128233105%2011.409863492936063%20C27.52763617347919%2011.695322867744874%2C%2027.284621064627334%2011.980782242553687%2C%2027.01022249171868%2012.30310642001331%20M27.01022249171868%2012.30310642001331%20C26.736532516732034%2012.585713789551859%2C%2026.46284254174539%2012.868321159090408%2C%2026.1941258127783%2013.145793243802677%20M27.01022249171868%2012.30310642001331%20C26.793501132091517%2012.526889016982889%2C%2026.576779772464356%2012.750671613952466%2C%2026.1941258127783%2013.145793243802677%20M26.1941258127783%2013.145793243802677%20C25.92218141493021%2013.392765950673832%2C%2025.650237017082127%2013.639738657544985%2C%2025.325714761815874%2013.934461183389441%20M26.1941258127783%2013.145793243802677%20C25.97015640204173%2013.34919633672775%2C%2025.746186991305162%2013.552599429652822%2C%2025.325714761815874%2013.934461183389441%20M25.325714761815874%2013.934461183389441%20C25.017863517517977%2014.17996435845135%2C%2024.71001227322008%2014.42546753351326%2C%2024.408557826113366%2014.665869433041122%20M25.325714761815874%2013.934461183389441%20C25.085169071850867%2014.12628996994689%2C%2024.844623381885864%2014.31811875650434%2C%2024.408557826113366%2014.665869433041122%20M24.408557826113366%2014.665869433041122%20C24.20780387885413%2014.805906696150856%2C%2024.00704993159489%2014.94594395926059%2C%2023.446423800249153%2015.3370124793733%20M24.408557826113366%2014.665869433041122%20C24.124461405898693%2014.864042797447063%2C%2023.840364985684015%2015.062216161853003%2C%2023.446423800249153%2015.3370124793733%20M23.446423800249153%2015.3370124793733%20C23.156132924026824%2015.51298851447782%2C%2022.865842047804495%2015.688964549582343%2C%2022.443266299312587%2015.94513245164888%20M23.446423800249153%2015.3370124793733%20C23.1557994319844%2015.513190679313755%2C%2022.865175063719644%2015.68936887925421%2C%2022.443266299312587%2015.94513245164888%20M22.443266299312587%2015.94513245164888%20C22.033533177744793%2016.15888995872421%2C%2021.623800056176997%2016.37264746579954%2C%2021.40320751265165%2016.487730454460443%20M22.443266299312587%2015.94513245164888%20C22.13982739827657%2016.10343633195748%2C%2021.836388497240552%2016.261740212266076%2C%2021.40320751265165%2016.487730454460443%20M21.40320751265165%2016.487730454460443%20C21.15872535731231%2016.595955452323707%2C%2020.914243201972972%2016.704180450186968%2C%2020.330521264912633%2016.962576836227537%20M21.40320751265165%2016.487730454460443%20C20.994573252812945%2016.668620719586407%2C%2020.585938992974235%2016.849510984712367%2C%2020.330521264912633%2016.962576836227537%20M20.330521264912633%2016.962576836227537%20C19.89638621855452%2017.1223425463877%2C%2019.46225117219641%2017.282108256547858%2C%2019.22961545397797%2017.36772035131325%20M20.330521264912633%2016.962576836227537%20C19.99677830964529%2017.08539732885198%2C%2019.663035354377943%2017.20821782147642%2C%2019.22961545397797%2017.36772035131325%20M19.22961545397797%2017.36772035131325%20C18.945633482204773%2017.452004709883745%2C%2018.66165151043158%2017.536289068454245%2C%2018.10501393796835%2017.70149617811109%20M19.22961545397797%2017.36772035131325%20C18.792452060609236%2017.49746815174761%2C%2018.3552886672405%2017.627215952181977%2C%2018.10501393796835%2017.70149617811109%20M18.10501393796835%2017.70149617811109%20C17.724688383378542%2017.78830300409003%2C%2017.344362828788732%2017.87510983006897%2C%2016.961337945739313%2017.962532760154048%20M18.10501393796835%2017.70149617811109%20C17.81088575161222%2017.768629017281086%2C%2017.516757565256086%2017.835761856451082%2C%2016.961337945739313%2017.962532760154048%20M16.961337945739313%2017.962532760154048%20C16.718784894709746%2018.001746856417505%2C%2016.476231843680175%2018.04096095268096%2C%2015.803287087260681%2018.149757442134334%20M16.961337945739313%2017.962532760154048%20C16.68641865302805%2018.006979579368647%2C%2016.411499360316785%2018.051426398583246%2C%2015.803287087260681%2018.149757442134334%20M15.803287087260681%2018.149757442134334%20C15.419019650630698%2018.18682725959682%2C%2015.034752214000713%2018.22389707705931%2C%2014.635620041911048%2018.262400877674132%20M15.803287087260681%2018.149757442134334%20C15.44388355257764%2018.184428668879217%2C%2015.0844800178946%2018.2190998956241%2C%2014.635620041911048%2018.262400877674132%20M14.635620041911048%2018.262400877674132%20C14.370155346368719%2018.27091381376449%2C%2014.104690650826388%2018.27942674985485%2C%2013.463135004043583%2018.300000190734863%20M14.635620041911048%2018.262400877674132%20C14.254690649824047%2018.27461654184428%2C%2013.873761257737044%2018.28683220601443%2C%2013.463135004043583%2018.300000190734863%20M13.463135004043583%2018.300000190734863%20C13.46313500404358%2018.300000190734863%2C%2013.46313500404358%2018.300000190734863%2C%2013.463135004043579%2018.300000190734863%20M13.463135004043583%2018.300000190734863%20C13.46313500404358%2018.300000190734863%2C%2013.46313500404358%2018.300000190734863%2C%2013.463135004043579%2018.300000190734863%20M13.463135004043579%2018.300000190734863%20C3.800901441847339%2018.300000190734863%2C%20-5.8613321203489015%2018.300000190734863%2C%20-13.463135004043576%2018.300000190734863%20M13.463135004043579%2018.300000190734863%20C5.400545945986279%2018.300000190734863%2C%20-2.6620431120710215%2018.300000190734863%2C%20-13.463135004043576%2018.300000190734863%20M-13.463135004043576%2018.300000190734863%20C-13.903522782976879%2018.285877811827284%2C%20-14.343910561910182%2018.2717554329197%2C%20-14.635620041911043%2018.262400877674132%20M-13.463135004043576%2018.300000190734863%20C-13.888668036846939%2018.286354174622662%2C%20-14.3142010696503%2018.272708158510458%2C%20-14.635620041911043%2018.262400877674132%20M-14.635620041911043%2018.262400877674132%20C-14.958794247631767%2018.2312246507221%2C%20-15.28196845335249%2018.20004842377007%2C%20-15.803287087260674%2018.149757442134334%20M-14.635620041911043%2018.262400877674132%20C-14.869252709229107%2018.239862615242348%2C%20-15.102885376547173%2018.217324352810568%2C%20-15.803287087260674%2018.149757442134334%20M-15.803287087260674%2018.149757442134334%20C-16.20210636498943%2018.085279434200842%2C%20-16.60092564271818%2018.020801426267347%2C%20-16.961337945739306%2017.962532760154048%20M-15.803287087260674%2018.149757442134334%20C-16.223151569959374%2018.081877008669302%2C%20-16.643016052658073%2018.01399657520427%2C%20-16.961337945739306%2017.962532760154048%20M-16.961337945739306%2017.962532760154048%20C-17.270759525761136%2017.891909303678574%2C%20-17.580181105782962%2017.821285847203104%2C%20-18.10501393796833%2017.701496178111093%20M-16.961337945739306%2017.962532760154048%20C-17.418796736671737%2017.85812077632131%2C%20-17.876255527604172%2017.753708792488577%2C%20-18.10501393796833%2017.701496178111093%20M-18.10501393796833%2017.701496178111093%20C-18.350139411596995%2017.628744224227972%2C%20-18.59526488522566%2017.555992270344852%2C%20-19.22961545397795%2017.36772035131326%20M-18.10501393796833%2017.701496178111093%20C-18.465349083720735%2017.59455059828956%2C%20-18.825684229473143%2017.48760501846802%2C%20-19.22961545397795%2017.36772035131326%20M-19.22961545397795%2017.36772035131326%20C-19.497066310800424%2017.26929596371397%2C%20-19.764517167622902%2017.170871576114678%2C%20-20.330521264912626%2016.962576836227537%20M-19.22961545397795%2017.36772035131326%20C-19.604752013604553%2017.229666629646324%2C%20-19.979888573231154%2017.091612907979393%2C%20-20.330521264912626%2016.962576836227537%20M-20.330521264912626%2016.962576836227537%20C-20.727236594880882%2016.786962727792734%2C%20-21.123951924849134%2016.61134861935793%2C%20-21.403207512651647%2016.487730454460447%20M-20.330521264912626%2016.962576836227537%20C-20.754372901171656%2016.774950289967734%2C%20-21.17822453743069%2016.587323743707927%2C%20-21.403207512651647%2016.487730454460447%20M-21.403207512651647%2016.487730454460447%20C-21.804561354924633%2016.278344412026033%2C%20-22.205915197197623%2016.068958369591623%2C%20-22.44326629931258%2015.945132451648885%20M-21.403207512651647%2016.487730454460447%20C-21.71125012508242%2016.327024820866022%2C%20-22.019292737513194%2016.166319187271597%2C%20-22.44326629931258%2015.945132451648885%20M-22.44326629931258%2015.945132451648885%20C-22.70012089052317%2015.789425689011901%2C%20-22.956975481733757%2015.633718926374918%2C%20-23.446423800249136%2015.33701247937331%20M-22.44326629931258%2015.945132451648885%20C-22.840266438404573%2015.704468634299538%2C%20-23.237266577496566%2015.463804816950192%2C%20-23.446423800249136%2015.33701247937331%20M-23.446423800249136%2015.33701247937331%20C-23.780208570786893%2015.104178672756007%2C%20-24.113993341324647%2014.871344866138703%2C%20-24.40855782611336%2014.665869433041125%20M-23.446423800249136%2015.33701247937331%20C-23.697452529030766%2015.161905705033773%2C%20-23.948481257812393%2014.986798930694233%2C%20-24.40855782611336%2014.665869433041125%20M-24.40855782611336%2014.665869433041125%20C-24.685468508117413%2014.445040533045615%2C%20-24.96237919012147%2014.224211633050103%2C%20-25.32571476181586%2013.934461183389455%20M-24.40855782611336%2014.665869433041125%20C-24.654121671417823%2014.470038801139182%2C%20-24.899685516722286%2014.27420816923724%2C%20-25.32571476181586%2013.934461183389455%20M-25.32571476181586%2013.934461183389455%20C-25.51461675789614%2013.762905388622277%2C%20-25.703518753976415%2013.591349593855098%2C%20-26.19412581277829%2013.145793243802688%20M-25.32571476181586%2013.934461183389455%20C-25.623884929558386%2013.663670926196017%2C%20-25.922055097300916%2013.39288066900258%2C%20-26.19412581277829%2013.145793243802688%20M-26.19412581277829%2013.145793243802688%20C-26.4132360893547%2012.91954389394928%2C%20-26.632346365931117%2012.693294544095872%2C%20-27.01022249171868%2012.303106420013316%20M-26.19412581277829%2013.145793243802688%20C-26.415372835338204%2012.917337528291204%2C%20-26.636619857898122%2012.688881812779723%2C%20-27.01022249171868%2012.303106420013316%20M-27.01022249171868%2012.303106420013316%20C-27.228353777594645%2012.046876999601622%2C%20-27.44648506347061%2011.790647579189928%2C%20-27.770651282331045%2011.409863492936068%20M-27.01022249171868%2012.303106420013316%20C-27.27326793537353%2011.994118274186569%2C%20-27.53631337902838%2011.685130128359821%2C%20-27.770651282331045%2011.409863492936068%20M-27.770651282331045%2011.409863492936068%20C-27.96125927373351%2011.15446614920201%2C%20-28.151867265135973%2010.89906880546795%2C%20-28.47228741960331%2010.469734989358304%20M-27.770651282331045%2011.409863492936068%20C-27.991157412212953%2011.114405367416007%2C%20-28.211663542094858%2010.818947241895945%2C%20-28.47228741960331%2010.469734989358304%20M-28.47228741960331%2010.469734989358304%20C-28.65138128823035%2010.194598713709729%2C%20-28.83047515685739%209.919462438061155%2C%20-29.112247730146944%209.486584098958154%20M-28.47228741960331%2010.469734989358304%20C-28.69831151961605%2010.12250127576965%2C%20-28.924335619628785%209.775267562180996%2C%20-29.112247730146944%209.486584098958154%20M-29.112247730146944%209.486584098958154%20C-29.316985160860597%209.123052058813116%2C%20-29.521722591574246%208.759520018668077%2C%20-29.687902479774877%208.464450799629464%20M-29.112247730146944%209.486584098958154%20C-29.266517251299298%209.212662942669196%2C%20-29.420786772451656%208.938741786380236%2C%20-29.687902479774877%208.464450799629464%20M-29.687902479774877%208.464450799629464%20C-29.81816442686591%208.19395907933576%2C%20-29.94842637395694%207.923467359042059%2C%20-30.19688617964331%207.407535256346109%20M-29.687902479774877%208.464450799629464%20C-29.847863164999943%208.132289014149242%2C%20-30.00782385022501%207.800127228669019%2C%20-30.19688617964331%207.407535256346109%20M-30.19688617964331%207.407535256346109%20C-30.352298284310564%207.023664353129359%2C%20-30.507710388977817%206.639793449912609%2C%20-30.63710730655284%206.320180561783097%20M-30.19688617964331%207.407535256346109%20C-30.357260243707028%207.011408217487136%2C%20-30.517634307770745%206.615281178628163%2C%20-30.63710730655284%206.320180561783097%20M-30.63710730655284%206.320180561783097%20C-30.77201221856764%205.913868460973276%2C%20-30.90691713058244%205.5075563601634565%2C%20-31.00675689746585%205.206854889617224%20M-30.63710730655284%206.320180561783097%20C-30.730747445131158%206.0381513839151655%2C%20-30.824387583709477%205.756122206047234%2C%20-31.00675689746585%205.206854889617224%20M-31.00675689746585%205.206854889617224%20C-31.067725650715218%204.974354609452568%2C%20-31.128694403964587%204.7418543292879125%2C%20-31.30431598292369%204.0721331338430575%20M-31.00675689746585%205.206854889617224%20C-31.11066683750471%204.810601253396163%2C%20-31.214576777543567%204.414347617175101%2C%20-31.30431598292369%204.0721331338430575%20M-31.30431598292369%204.0721331338430575%20C-31.376502263877605%203.7014718377205917%2C%20-31.44868854483152%203.330810541598126%2C%20-31.528561828818%202.920678109552113%20M-31.30431598292369%204.0721331338430575%20C-31.36148220596174%203.7785966606282035%2C%20-31.418648428999784%203.48506018741335%2C%20-31.528561828818%202.920678109552113%20M-31.528561828818%202.920678109552113%20C-31.5779555853439%202.537589887837686%2C%20-31.6273493418698%202.15450166612326%2C%20-31.678572960867402%201.7572213924255287%20M-31.528561828818%202.920678109552113%20C-31.562961053638748%202.6538845147376535%2C%20-31.597360278459494%202.3870909199231947%2C%20-31.678572960867402%201.7572213924255287%20M-31.678572960867402%201.7572213924255287%20C-31.706264710339973%201.3259000420123974%2C%20-31.733956459812543%200.8945786915992664%2C%20-31.753732951153033%200.586543875674645%20M-31.678572960867402%201.7572213924255287%20C-31.69854874858784%201.4460823745140707%2C%20-31.71852453630828%201.134943356602613%2C%20-31.753732951153033%200.586543875674645%20M-31.753732951153033%200.586543875674645%20C-31.753732951153033%200.24220734480719813%2C%20-31.753732951153033%20-0.10212918606024879%2C%20-31.753732951153033%20-0.5865438756746362%20M-31.753732951153033%200.586543875674645%20C-31.753732951153033%200.1643737432229374%2C%20-31.753732951153033%20-0.25779638922877024%2C%20-31.753732951153033%20-0.5865438756746362%20M-31.753732951153033%20-0.5865438756746362%20C-31.73147706602122%20-0.9331972512297391%2C%20-31.70922118088941%20-1.279850626784842%2C%20-31.678572960867406%20-1.7572213924255036%20M-31.753732951153033%20-0.5865438756746362%20C-31.73175895702695%20-0.9288065712771653%2C%20-31.709784962900873%20-1.2710692668796943%2C%20-31.678572960867406%20-1.7572213924255036%20M-31.678572960867406%20-1.7572213924255036%20C-31.63569303775823%20-2.0897896084617016%2C%20-31.592813114649054%20-2.4223578244979%2C%20-31.528561828818%20-2.9206781095521044%20M-31.678572960867406%20-1.7572213924255036%20C-31.640288912145195%20-2.05414491427445%2C%20-31.602004863422987%20-2.3510684361233958%2C%20-31.528561828818%20-2.9206781095521044%20M-31.528561828818%20-2.9206781095521044%20C-31.48286707260416%20-3.155311025120019%2C%20-31.43717231639032%20-3.3899439406879344%2C%20-31.304315982923693%20-4.0721331338430495%20M-31.528561828818%20-2.9206781095521044%20C-31.464584060458343%20-3.249190428372806%2C%20-31.400606292098686%20-3.5777027471935083%2C%20-31.304315982923693%20-4.0721331338430495%20M-31.304315982923693%20-4.0721331338430495%20C-31.208342746395058%20-4.438120679790565%2C%20-31.112369509866422%20-4.80410822573808%2C%20-31.006756897465852%20-5.206854889617215%20M-31.304315982923693%20-4.0721331338430495%20C-31.220836675218408%20-4.39047591428413%2C%20-31.137357367513122%20-4.708818694725211%2C%20-31.006756897465852%20-5.206854889617215%20M-31.006756897465852%20-5.206854889617215%20C-30.90293640584891%20-5.519545668818497%2C%20-30.799115914231965%20-5.8322364480197795%2C%20-30.637107306552846%20-6.320180561783073%20M-31.006756897465852%20-5.206854889617215%20C-30.922765652447147%20-5.459823137425997%2C%20-30.838774407428442%20-5.7127913852347785%2C%20-30.637107306552846%20-6.320180561783073%20M-30.637107306552846%20-6.320180561783073%20C-30.481336952971958%20-6.704936346742772%2C%20-30.325566599391074%20-7.089692131702471%2C%20-30.196886179643315%20-7.4075352563461%20M-30.637107306552846%20-6.320180561783073%20C-30.52479282850928%20-6.597599494003386%2C%20-30.41247835046572%20-6.8750184262237%2C%20-30.196886179643315%20-7.4075352563461%20M-30.196886179643315%20-7.4075352563461%20C-30.035936231494876%20-7.741751267453542%2C%20-29.874986283346438%20-8.075967278560983%2C%20-29.68790247977488%20-8.464450799629457%20M-30.196886179643315%20-7.4075352563461%20C-30.079050600604297%20-7.652223357498107%2C%20-29.961215021565284%20-7.896911458650115%2C%20-29.68790247977488%20-8.464450799629457%20M-29.68790247977488%20-8.464450799629457%20C-29.561614492267918%20-8.688687909493492%2C%20-29.43532650476096%20-8.912925019357525%2C%20-29.11224773014695%20-9.486584098958149%20M-29.68790247977488%20-8.464450799629457%20C-29.489175131646817%20-8.817311329556933%2C%20-29.29044778351875%20-9.17017185948441%2C%20-29.11224773014695%20-9.486584098958149%20M-29.11224773014695%20-9.486584098958149%20C-28.92219214593695%20-9.778560513374932%2C%20-28.732136561726946%20-10.070536927791716%2C%20-28.47228741960331%20-10.469734989358297%20M-29.11224773014695%20-9.486584098958149%20C-28.945271779162113%20-9.743103998991792%2C%20-28.778295828177278%20-9.999623899025437%2C%20-28.47228741960331%20-10.469734989358297%20M-28.47228741960331%20-10.469734989358297%20C-28.297669878877315%20-10.70370658594592%2C%20-28.123052338151314%20-10.93767818253354%2C%20-27.770651282331052%20-11.409863492936063%20M-28.47228741960331%20-10.469734989358297%20C-28.239390348967696%20-10.781795846650411%2C%20-28.006493278332076%20-11.093856703942523%2C%20-27.770651282331052%20-11.409863492936063%20M-27.770651282331052%20-11.409863492936063%20C-27.617660540965954%20-11.589575123163305%2C%20-27.464669799600856%20-11.769286753390547%2C%20-27.010222491718686%20-12.30310642001331%20M-27.770651282331052%20-11.409863492936063%20C-27.60383846469925%20-11.605811320444593%2C%20-27.43702564706745%20-11.801759147953122%2C%20-27.010222491718686%20-12.30310642001331%20M-27.010222491718686%20-12.30310642001331%20C-26.76871489497392%20-12.552482841794724%2C%20-26.527207298229154%20-12.801859263576139%2C%20-26.194125812778307%20-13.14579324380267%20M-27.010222491718686%20-12.30310642001331%20C-26.811817244249294%20-12.507976127399214%2C%20-26.613411996779902%20-12.712845834785119%2C%20-26.194125812778307%20-13.14579324380267%20M-26.194125812778307%20-13.14579324380267%20C-25.854149161099702%20-13.454551043567903%2C%20-25.514172509421094%20-13.763308843333137%2C%20-25.325714761815874%20-13.93446118338944%20M-26.194125812778307%20-13.14579324380267%20C-25.932471510320195%20-13.383420758301652%2C%20-25.670817207862086%20-13.621048272800634%2C%20-25.325714761815874%20-13.93446118338944%20M-25.325714761815874%20-13.93446118338944%20C-25.092258469985975%20-14.120636363590949%2C%20-24.858802178156076%20-14.30681154379246%2C%20-24.408557826113366%20-14.66586943304112%20M-25.325714761815874%20-13.93446118338944%20C-25.10029518286027%20-14.11422729893961%2C%20-24.874875603904663%20-14.293993414489782%2C%20-24.408557826113366%20-14.66586943304112%20M-24.408557826113366%20-14.66586943304112%20C-24.199499805660686%20-14.811699258133066%2C%20-23.990441785208002%20-14.957529083225012%2C%20-23.446423800249157%20-15.337012479373296%20M-24.408557826113366%20-14.66586943304112%20C-24.028462058885978%20-14.931007786178377%2C%20-23.648366291658593%20-15.196146139315632%2C%20-23.446423800249157%20-15.337012479373296%20M-23.446423800249157%20-15.337012479373296%20C-23.07230605313627%20-15.563804856233046%2C%20-22.698188306023383%20-15.790597233092798%2C%20-22.44326629931259%20-15.945132451648877%20M-23.446423800249157%20-15.337012479373296%20C-23.163914087331694%20-15.508271527555216%2C%20-22.881404374414227%20-15.679530575737138%2C%20-22.44326629931259%20-15.945132451648877%20M-22.44326629931259%20-15.945132451648877%20C-22.16187532852129%20-16.09193394087118%2C%20-21.88048435772999%20-16.238735430093485%2C%20-21.403207512651655%20-16.487730454460443%20M-22.44326629931259%20-15.945132451648877%20C-22.179474737306847%20-16.082752340580715%2C%20-21.915683175301105%20-16.220372229512552%2C%20-21.403207512651655%20-16.487730454460443%20M-21.403207512651655%20-16.487730454460443%20C-21.13784878712679%20-16.605196890663386%2C%20-20.87249006160192%20-16.72266332686633%2C%20-20.330521264912637%20-16.962576836227534%20M-21.403207512651655%20-16.487730454460443%20C-21.073106334894366%20-16.63385645375007%2C%20-20.743005157137073%20-16.779982453039697%2C%20-20.330521264912637%20-16.962576836227534%20M-20.330521264912637%20-16.962576836227534%20C-19.892124080868214%20-17.12391105245503%2C%20-19.453726896823788%20-17.28524526868252%2C%20-19.229615453977974%20-17.36772035131325%20M-20.330521264912637%20-16.962576836227534%20C-19.91922860311851%20-17.11393633771546%2C%20-19.50793594132438%20-17.26529583920339%2C%20-19.229615453977974%20-17.36772035131325%20M-19.229615453977974%20-17.36772035131325%20C-18.849993673372598%20-17.480390103121536%2C%20-18.470371892767222%20-17.59305985492982%2C%20-18.105013937968355%20-17.701496178111086%20M-19.229615453977974%20-17.36772035131325%20C-18.87890399985893%20-17.47180966997379%2C%20-18.528192545739888%20-17.575898988634336%2C%20-18.105013937968355%20-17.701496178111086%20M-18.105013937968355%20-17.701496178111086%20C-17.75183497870727%20-17.782106970854333%2C%20-17.398656019446182%20-17.86271776359758%2C%20-16.961337945739317%20-17.962532760154044%20M-18.105013937968355%20-17.701496178111086%20C-17.770485079068678%20-17.77785020715012%2C%20-17.435956220169%20-17.854204236189155%2C%20-16.961337945739317%20-17.962532760154044%20M-16.961337945739317%20-17.962532760154044%20C-16.58302069713238%20-18.023696159014733%2C%20-16.204703448525446%20-18.084859557875422%2C%20-15.803287087260685%20-18.149757442134334%20M-16.961337945739317%20-17.962532760154044%20C-16.570493717526404%20-18.02572142392925%2C%20-16.179649489313487%20-18.088910087704456%2C%20-15.803287087260685%20-18.149757442134334%20M-15.803287087260685%20-18.149757442134334%20C-15.41265869587175%20-18.18744089325225%2C%20-15.022030304482815%20-18.225124344370165%2C%20-14.635620041911052%20-18.262400877674132%20M-15.803287087260685%20-18.149757442134334%20C-15.342703578675014%20-18.19418937927488%2C%20-14.882120070089345%20-18.23862131641543%2C%20-14.635620041911052%20-18.262400877674132%20M-14.635620041911052%20-18.262400877674132%20C-14.192496746414994%20-18.27661097927352%2C%20-13.749373450918936%20-18.29082108087291%2C%20-13.463135004043584%20-18.300000190734863%20M-14.635620041911052%20-18.262400877674132%20C-14.322859733432402%20-18.27243049201603%2C%20-14.010099424953752%20-18.282460106357934%2C%20-13.463135004043584%20-18.300000190734863%20M-13.463135004043584%20-18.300000190734863%20C-13.463135004043583%20-18.300000190734863%2C%20-13.46313500404358%20-18.300000190734863%2C%20-13.463135004043579%20-18.300000190734863%20M-13.463135004043584%20-18.300000190734863%20C-13.463135004043583%20-18.300000190734863%2C%20-13.463135004043583%20-18.300000190734863%2C%20-13.463135004043579%20-18.300000190734863%22%20stroke%3D%22rgb\(31%2C%2078%2C%20148\)%22%20stroke-width%3D%221.3%22%20fill%3D%22none%22%20stroke-dasharray%3D%220%200%22%20style%3D%22%22%3E%3C%2Fpath%3E%3C%2Fg%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EMulai%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-B-1%22%20transform%3D%22translate\(307.3811162312825%2C%20733.5999984741211\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-115.3375015258789%22%20y%3D%22-35.599998474121094%22%20width%3D%22230.6750030517578%22%20height%3D%2271.19999694824219%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-19.599998474121094\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EPengunjung%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20membuka%3C%2Ftspan%3E%3C%2Ftspan%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%221em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EDaftarIn%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-C-3%22%20transform%3D%22translate\(307.3811162312825%2C%20839.1999969482422\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-121.36502075195312%22%20y%3D%22-30%22%20width%3D%22242.73004150390625%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ELihat%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20daftar%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20event%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20publik%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-D-5%22%20transform%3D%22translate\(123.5062484741211%2C%20939.1999969482422\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-72.56954574584961%22%20y%3D%22-30%22%20width%3D%22145.13909149169922%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EPilih%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20event%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-E-7%22%20transform%3D%22translate\(123.5062484741211%2C%201039.1999969482422\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-111.50625610351562%22%20y%3D%22-30%22%20width%3D%22223.01251220703125%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ELihat%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20detail%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20dan%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20kuota%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%20%20mermaid-decision%22%20id%3D%22flowchart-F-9%22%20transform%3D%22translate\(875.4268175760903%2C%2042\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-90.57564544677734%22%20y%3D%22-30%22%20width%3D%22181.1512908935547%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ECara%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20mendaftar%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-G-11%22%20transform%3D%22translate\(683.89040629069%2C%20328\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-95.33048248291016%22%20y%3D%22-30%22%20width%3D%22190.6609649658203%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EIsi%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20formulir%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20guest%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-H-13%22%20transform%3D%22translate\(920.714640299479%2C%20228\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-101.4942398071289%22%20y%3D%22-30%22%20width%3D%22202.9884796142578%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ELogin%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20atau%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20register%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-I-15%22%20transform%3D%22translate\(920.714640299479%2C%20328\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-101.4937515258789%22%20y%3D%22-30%22%20width%3D%22202.9875030517578%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EIsi%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20formulir%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20peserta%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-J-17%22%20transform%3D%22translate\(882.9795277913411%2C%20428\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-113.20532989501953%22%20y%3D%22-30%22%20width%3D%22226.41065979003906%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EFrontend%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20validasi%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20awal%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-K-21%22%20transform%3D%22translate\(882.9795277913411%2C%20528\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-125.31875610351562%22%20y%3D%22-30%22%20width%3D%22250.63751220703125%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EPOST%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20ke%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20REST%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20API%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20Golang%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-L-23%22%20transform%3D%22translate\(882.9795277913411%2C%20628\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-93.94375228881836%22%20y%3D%22-30%22%20width%3D%22187.88750457763672%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EValidasi%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20backend%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%20%20mermaid-decision%22%20id%3D%22flowchart-M-25%22%20transform%3D%22translate\(882.9795277913411%2C%20733.5999984741211\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-107.67579650878906%22%20y%3D%22-35.599998474121094%22%20width%3D%22215.35159301757812%22%20height%3D%2271.19999694824219%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-19.599998474121094\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EData%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20valid%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20dan%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20event%3C%2Ftspan%3E%3C%2Ftspan%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%221em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3Etersedia%3F%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-N-27%22%20transform%3D%22translate\(630.0089569091797%2C%20939.1999969482422\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-130.4124984741211%22%20y%3D%22-30%22%20width%3D%22260.8249969482422%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ETampilkan%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20pesan%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20kesalahan%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-O-31%22%20transform%3D%22translate\(918.8714599609375%2C%20939.1999969482422\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-118.45000457763672%22%20y%3D%22-30%22%20width%3D%22236.90000915527344%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ETransaksi%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20dan%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20cek%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20kuota%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%20%20mermaid-decision%22%20id%3D%22flowchart-P-33%22%20transform%3D%22translate\(918.8714599609375%2C%201039.1999969482422\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-126.00611877441406%22%20y%3D%22-30%22%20width%3D%22252.01223754882812%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EKuota%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20dan%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20email%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20tersedia%3F%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-Q-35%22%20transform%3D%22translate\(716.5091044108073%2C%201239.1999969482422\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-97.42689514160156%22%20y%3D%22-30%22%20width%3D%22194.85379028320312%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ETampilkan%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20konflik%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-R-37%22%20transform%3D%22translate\(960.8734995524088%2C%201244.7999954223633\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-106.9375%22%20y%3D%22-35.599998474121094%22%20width%3D%22213.875%22%20height%3D%2271.19999694824219%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-19.599998474121094\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ESimpan%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20pendaftaran%3C%2Ftspan%3E%3C%2Ftspan%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%221em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3Epending%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-S-39%22%20transform%3D%22translate\(960.8734995524088%2C%201355.9999923706055\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-97.41407775878906%22%20y%3D%22-35.599998474121094%22%20width%3D%22194.82815551757812%22%20height%3D%2271.19999694824219%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-19.599998474121094\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ETampilkan%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20nomor%3C%2Ftspan%3E%3C%2Ftspan%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%221em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3Ependaftaran%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-T-41%22%20transform%3D%22translate\(960.8734995524088%2C%201449.899990081787\)%22%3E%3Cg%20class%3D%22basic%20label-container%20outer-path%22%3E%3Cpath%20d%3D%22M-17.385326623916626%20-18.300000190734863%20C-10.242492266513764%20-18.300000190734863%2C%20-3.099657909110901%20-18.300000190734863%2C%2017.385326623916626%20-18.300000190734863%20C17.385326623916626%20-18.300000190734863%2C%2017.385326623916626%20-18.300000190734863%2C%2017.385326623916626%20-18.300000190734863%20C17.700836214037597%20-18.289882412281845%2C%2018.016345804158572%20-18.279764633828826%2C%2018.557811661784097%20-18.262400877674132%20C18.89943710038209%20-18.229444682477286%2C%2019.24106253898008%20-18.19648848728044%2C%2019.725478707133718%20-18.149757442134337%20C20.171115447821585%20-18.07771034986446%2C%2020.61675218850945%20-18.005663257594588%2C%2020.883529565612353%20-17.962532760154048%20C21.189111671332352%20-17.892785638633057%2C%2021.494693777052348%20-17.823038517112067%2C%2022.02720555784138%20-17.701496178111093%20C22.45833162569145%20-17.5735402242001%2C%2022.889457693541523%20-17.44558427028911%2C%2023.151807073851007%20-17.367720351313253%20C23.432046175877304%20-17.26458977126571%2C%2023.712285277903604%20-17.161459191218174%2C%2024.252712884785673%20-16.962576836227537%20C24.527826554679066%20-16.84079217552279%2C%2024.80294022457246%20-16.719007514818045%2C%2025.325399132524694%20-16.487730454460443%20C25.721286731535557%20-16.28119614763459%2C%2026.11717433054642%20-16.07466184080873%2C%2026.36545791918563%20-15.945132451648883%20C26.693507235245182%20-15.746267028421814%2C%2027.021556551304737%20-15.547401605194745%2C%2027.36861542012219%20-15.337012479373305%20C27.598329393608477%20-15.176773955626912%2C%2027.828043367094764%20-15.016535431880518%2C%2028.33074944598641%20-14.665869433041124%20C28.535432872930404%20-14.502639846908034%2C%2028.740116299874398%20-14.339410260774944%2C%2029.247906381688907%20-13.934461183389454%20C29.486577228157884%20-13.717706635510881%2C%2029.72524807462686%20-13.500952087632307%2C%2030.116317432651343%20-13.14579324380268%20C30.350717287140576%20-12.903756149456594%2C%2030.585117141629805%20-12.66171905511051%2C%2030.93241411159172%20-12.30310642001332%20C31.100931032591557%20-12.105156855722464%2C%2031.269447953591396%20-11.907207291431607%2C%2031.69284290220409%20-11.409863492936067%20C31.889702290706513%20-11.146089846602058%2C%2032.086561679208934%20-10.88231620026805%2C%2032.39447903947636%20-10.469734989358303%20C32.57906813911291%20-10.186156563202971%2C%2032.76365723874947%20-9.902578137047641%2C%2033.034439350019994%20-9.486584098958145%20C33.16982370390085%20-9.246195469490276%2C%2033.30520805778172%20-9.005806840022405%2C%2033.610094099647924%20-8.464450799629462%20C33.75640289892027%20-8.160637447433627%2C%2033.90271169819262%20-7.856824095237794%2C%2034.11907779951636%20-7.407535256346107%20C34.25022860000986%20-7.083590243498918%2C%2034.38137940050337%20-6.759645230651729%2C%2034.55929892642588%20-6.320180561783094%20C34.66264940484691%20-6.008905387441474%2C%2034.765999883267945%20-5.697630213099853%2C%2034.928948517338895%20-5.2068548896172295%20C35.01904258186264%20-4.863287174573634%2C%2035.10913664638638%20-4.519719459530039%2C%2035.226507602796744%20-4.072133133843056%20C35.27425565719906%20-3.8269569660420273%2C%2035.322003711601376%20-3.581780798240999%2C%2035.450753448691046%20-2.9206781095521106%20C35.50586270487182%20-2.493261601167575%2C%2035.56097196105259%20-2.0658450927830394%2C%2035.60076458074045%20-1.7572213924255182%20C35.62902383994948%20-1.317060619781368%2C%2035.65728309915852%20-0.8768998471372175%2C%2035.67592457102608%20-0.5865438756746428%20C35.67592457102608%20-0.2863042352084128%2C%2035.67592457102608%200.013935405257817224%2C%2035.67592457102608%200.5865438756746384%20C35.65970576037363%200.8391649431748474%2C%2035.643486949721186%201.0917860106750563%2C%2035.60076458074045%201.7572213924255058%20C35.55633880909773%202.1017789044255535%2C%2035.51191303745502%202.4463364164256016%2C%2035.450753448691046%202.920678109552098%20C35.36287065022935%203.371937705616892%2C%2035.27498785176765%203.8231973016816854%2C%2035.226507602796744%204.072133133843051%20C35.11160518729887%204.510305843158333%2C%2034.99670277180099%204.948478552473615%2C%2034.928948517338895%205.206854889617217%20C34.82784563480085%205.5113606632650605%2C%2034.72674275226281%205.815866436912904%2C%2034.55929892642589%206.320180561783083%20C34.43740118920621%206.6212703294481%2C%2034.315503451986544%206.922360097113117%2C%2034.11907779951636%207.407535256346102%20C33.98261995005215%207.690892900488792%2C%2033.84616210058793%207.974250544631481%2C%2033.610094099647924%208.464450799629459%20C33.42916031914689%208.78571704844105%2C%2033.248226538645845%209.10698329725264%2C%2033.03443935002%209.486584098958142%20C32.82654667625269%209.80596307286416%2C%2032.61865400248537%2010.125342046770175%2C%2032.394479039476366%2010.469734989358292%20C32.18799831181318%2010.746400353645692%2C%2031.98151758415%2011.02306571793309%2C%2031.692842902204095%2011.409863492936063%20C31.391346635671624%2011.764018163228663%2C%2031.089850369139157%2012.118172833521264%2C%2030.932414111591726%2012.30310642001331%20C30.69352626252423%2012.54977773723266%2C%2030.45463841345674%2012.79644905445201%2C%2030.116317432651346%2013.145793243802677%20C29.829831867033224%2013.40597185450436%2C%2029.543346301415102%2013.666150465206043%2C%2029.24790638168892%2013.934461183389441%20C28.893026756504085%2014.21746824073091%2C%2028.538147131319253%2014.500475298072377%2C%2028.330749445986413%2014.665869433041122%20C28.033685769079963%2014.873088194371752%2C%2027.73662209217351%2015.080306955702381%2C%2027.3686154201222%2015.3370124793733%20C27.038287610486563%2015.537259138796104%2C%2026.707959800850926%2015.73750579821891%2C%2026.365457919185634%2015.94513245164888%20C25.98311047133783%2016.14460287028585%2C%2025.600763023490025%2016.34407328892282%2C%2025.325399132524698%2016.487730454460443%20C24.9593093855614%2016.649787525774595%2C%2024.593219638598104%2016.811844597088747%2C%2024.25271288478568%2016.962576836227537%20C23.86362700437479%2017.105764036889195%2C%2023.474541123963906%2017.248951237550852%2C%2023.151807073851018%2017.36772035131325%20C22.8663955165613%2017.452429003361%2C%2022.580983959271588%2017.537137655408753%2C%2022.0272055578414%2017.70149617811109%20C21.77461270732786%2017.75914884791841%2C%2021.52201985681432%2017.816801517725732%2C%2020.88352956561236%2017.962532760154048%20C20.52511658615594%2018.02047819113839%2C%2020.166703606699517%2018.078423622122738%2C%2019.72547870713373%2018.149757442134334%20C19.26480557288993%2018.194198025354332%2C%2018.804132438646135%2018.238638608574327%2C%2018.557811661784097%2018.262400877674132%20C18.10103237728123%2018.2770489002612%2C%2017.644253092778357%2018.291696922848264%2C%2017.38532662391663%2018.300000190734863%20C17.38532662391663%2018.300000190734863%2C%2017.385326623916626%2018.300000190734863%2C%2017.385326623916626%2018.300000190734863%20C5.352193738547088%2018.300000190734863%2C%20-6.68093914682245%2018.300000190734863%2C%20-17.385326623916622%2018.300000190734863%20C-17.703738043728627%2018.289789356251724%2C%20-18.02214946354063%2018.27957852176858%2C%20-18.55781166178409%2018.262400877674132%20C-18.798522487833356%2018.23917979378228%2C%20-19.039233313882626%2018.215958709890433%2C%20-19.72547870713372%2018.149757442134334%20C-20.011420225475245%2018.10352863495847%2C%20-20.29736174381677%2018.057299827782607%2C%20-20.883529565612353%2017.962532760154048%20C-21.253699200589903%2017.87804395655304%2C%20-21.623868835567453%2017.793555152952027%2C%20-22.027205557841377%2017.701496178111093%20C-22.397045988510747%2017.59172947962046%2C%20-22.766886419180118%2017.481962781129827%2C%20-23.151807073850996%2017.36772035131326%20C-23.5020239124461%2017.238837317341293%2C%20-23.852240751041204%2017.109954283369326%2C%20-24.252712884785673%2016.962576836227537%20C-24.52179603065873%2016.843461709617454%2C%20-24.79087917653179%2016.724346583007375%2C%20-25.325399132524694%2016.487730454460447%20C-25.59463301843386%2016.34727130863417%2C%20-25.863866904343023%2016.206812162807893%2C%20-26.365457919185626%2015.945132451648885%20C-26.676351212537675%2015.756667110207086%2C%20-26.987244505889723%2015.568201768765286%2C%20-27.368615420122183%2015.33701247937331%20C-27.59406416174895%2015.179749196733207%2C%20-27.819512903375717%2015.022485914093101%2C%20-28.330749445986406%2014.665869433041125%20C-28.629647114051597%2014.427506496760131%2C%20-28.928544782116788%2014.189143560479138%2C%20-29.247906381688907%2013.934461183389455%20C-29.511417297232892%2013.695147542009172%2C%20-29.774928212776878%2013.455833900628889%2C%20-30.116317432651336%2013.145793243802688%20C-30.30663793120176%2012.94927170344585%2C%20-30.49695842975218%2012.752750163089013%2C%20-30.932414111591726%2012.303106420013316%20C-31.193348510688036%2011.996598027246865%2C%20-31.45428290978435%2011.690089634480415%2C%20-31.69284290220409%2011.409863492936068%20C-31.89976783073773%2011.13260293994979%2C%20-32.10669275927137%2010.85534238696351%2C%20-32.39447903947636%2010.469734989358304%20C-32.63303159861814%2010.103254198185109%2C%20-32.87158415775992%209.736773407011913%2C%20-33.034439350019994%209.486584098958154%20C-33.15391453382361%209.274443811940593%2C%20-33.273389717627225%209.062303524923031%2C%20-33.610094099647924%208.464450799629464%20C-33.71945805372847%208.237354208967465%2C%20-33.82882200780901%208.010257618305467%2C%20-34.11907779951636%207.407535256346109%20C-34.25826914958283%207.063729930600255%2C%20-34.39746049964929%206.719924604854401%2C%20-34.55929892642588%206.320180561783097%20C-34.64181991452661%206.071640493557648%2C%20-34.724340902627326%205.823100425332197%2C%20-34.928948517338895%205.206854889617224%20C-35.000141309347065%204.935365918538839%2C%20-35.071334101355234%204.663876947460454%2C%20-35.22650760279674%204.0721331338430575%20C-35.30530317008052%203.667534549289867%2C%20-35.38409873736431%203.262935964736677%2C%20-35.450753448691046%202.920678109552113%20C-35.50111054119215%202.5301184442461984%2C%20-35.55146763369326%202.1395587789402835%2C%20-35.600764580740446%201.7572213924255287%20C-35.61880829442489%201.4761759871668465%2C%20-35.63685200810933%201.1951305819081646%2C%20-35.67592457102608%200.586543875674645%20C-35.67592457102608%200.3108363092357637%2C%20-35.67592457102608%200.035128742796882384%2C%20-35.67592457102608%20-0.5865438756746362%20C-35.657848434711454%20-0.8680942895696054%2C%20-35.63977229839682%20-1.1496447034645747%2C%20-35.60076458074045%20-1.7572213924255036%20C-35.567706575331115%20-2.0136127543388107%2C%20-35.53464856992177%20-2.270004116252118%2C%20-35.450753448691046%20-2.9206781095521044%20C-35.388876743941395%20-3.238401910795377%2C%20-35.327000039191745%20-3.5561257120386496%2C%20-35.226507602796744%20-4.0721331338430495%20C-35.14683508383858%20-4.37595897891865%2C%20-35.06716256488043%20-4.679784823994251%2C%20-34.928948517338895%20-5.206854889617215%20C-34.808189263808785%20-5.570562520875755%2C%20-34.68743001027868%20-5.934270152134294%2C%20-34.559298926425896%20-6.320180561783073%20C-34.46513840889121%20-6.5527588605635225%2C%20-34.37097789135651%20-6.785337159343972%2C%20-34.11907779951636%20-7.4075352563461%20C-33.956701290493214%20-7.744713551633387%2C%20-33.79432478147007%20-8.081891846920673%2C%20-33.610094099647924%20-8.464450799629457%20C-33.390455606412175%20-8.85444118517868%2C%20-33.170817113176426%20-9.244431570727905%2C%20-33.034439350019994%20-9.486584098958149%20C-32.861340408690246%20-9.752510556414698%2C%20-32.688241467360506%20-10.01843701387125%2C%20-32.39447903947636%20-10.469734989358297%20C-32.201162399840335%20-10.728761674962396%2C%20-32.00784576020432%20-10.987788360566492%2C%20-31.6928429022041%20-11.409863492936063%20C-31.51954810849483%20-11.613425418380073%2C%20-31.346253314785564%20-11.816987343824085%2C%20-30.932414111591733%20-12.30310642001331%20C-30.74227990458723%20-12.499435599054165%2C%20-30.552145697582727%20-12.695764778095018%2C%20-30.116317432651353%20-13.14579324380267%20C-29.828884940218927%20-13.406831828382792%2C%20-29.541452447786504%20-13.667870412962916%2C%20-29.24790638168892%20-13.93446118338944%20C-29.034921453659024%20-14.104310995726317%2C%20-28.821936525629127%20-14.274160808063195%2C%20-28.330749445986413%20-14.66586943304112%20C-28.029560549152507%20-14.87596576921525%2C%20-27.7283716523186%20-15.08606210538938%2C%20-27.368615420122204%20-15.337012479373296%20C-27.012832747403376%20-15.55269002638651%2C%20-26.65705007468455%20-15.768367573399726%2C%20-26.365457919185637%20-15.945132451648877%20C-26.078147053785713%20-16.095022346096627%2C%20-25.79083618838579%20-16.244912240544377%2C%20-25.3253991325247%20-16.487730454460443%20C-25.04678357922553%20-16.611065295069245%2C%20-24.76816802592636%20-16.73440013567805%2C%20-24.252712884785684%20-16.962576836227534%20C-23.91249391224839%20-17.087780563070964%2C%20-23.5722749397111%20-17.212984289914395%2C%20-23.15180707385102%20-17.36772035131325%20C-22.85123517184341%20-17.456928514094997%2C%20-22.5506632698358%20-17.54613667687675%2C%20-22.027205557841402%20-17.701496178111086%20C-21.652823035775054%20-17.786946545698456%2C%20-21.278440513708706%20-17.872396913285826%2C%20-20.883529565612363%20-17.962532760154044%20C-20.4776129053522%20-18.028158217854195%2C%20-20.071696245092035%20-18.09378367555434%2C%20-19.725478707133732%20-18.149757442134334%20C-19.484757707240504%20-18.172979507484676%2C%20-19.244036707347274%20-18.196201572835015%2C%20-18.557811661784097%20-18.262400877674132%20C-18.31986198875362%20-18.27003146054728%2C%20-18.081912315723137%20-18.277662043420424%2C%20-17.385326623916633%20-18.300000190734863%20C-17.38532662391663%20-18.300000190734863%2C%20-17.38532662391663%20-18.300000190734863%2C%20-17.385326623916626%20-18.300000190734863%22%20stroke%3D%22none%22%20stroke-width%3D%220%22%20fill%3D%22rgb\(9%2C%2023%2C%2044\)%22%20style%3D%22%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M-17.385326623916626%20-18.300000190734863%20C-6.844036986282989%20-18.300000190734863%2C%203.6972526513506487%20-18.300000190734863%2C%2017.385326623916626%20-18.300000190734863%20M-17.385326623916626%20-18.300000190734863%20C-10.207024019328973%20-18.300000190734863%2C%20-3.0287214147413213%20-18.300000190734863%2C%2017.385326623916626%20-18.300000190734863%20M17.385326623916626%20-18.300000190734863%20C17.385326623916626%20-18.300000190734863%2C%2017.385326623916626%20-18.300000190734863%2C%2017.385326623916626%20-18.300000190734863%20M17.385326623916626%20-18.300000190734863%20C17.385326623916626%20-18.300000190734863%2C%2017.385326623916626%20-18.300000190734863%2C%2017.385326623916626%20-18.300000190734863%20M17.385326623916626%20-18.300000190734863%20C17.710576764091194%20-18.289570051800457%2C%2018.035826904265758%20-18.27913991286605%2C%2018.557811661784097%20-18.262400877674132%20M17.385326623916626%20-18.300000190734863%20C17.76964761406537%20-18.28767576461622%2C%2018.153968604214118%20-18.275351338497575%2C%2018.557811661784097%20-18.262400877674132%20M18.557811661784097%20-18.262400877674132%20C18.986740033450374%20-18.221022673521325%2C%2019.41566840511665%20-18.179644469368522%2C%2019.725478707133718%20-18.149757442134337%20M18.557811661784097%20-18.262400877674132%20C18.897932384081102%20-18.229589840649155%2C%2019.238053106378107%20-18.19677880362418%2C%2019.725478707133718%20-18.149757442134337%20M19.725478707133718%20-18.149757442134337%20C20.03517945761882%20-18.099687426561097%2C%2020.344880208103923%20-18.049617410987857%2C%2020.883529565612353%20-17.962532760154048%20M19.725478707133718%20-18.149757442134337%20C20.15099436538651%20-18.08096337043124%2C%2020.576510023639305%20-18.012169298728143%2C%2020.883529565612353%20-17.962532760154048%20M20.883529565612353%20-17.962532760154048%20C21.221125741881252%20-17.885478635941606%2C%2021.558721918150155%20-17.80842451172916%2C%2022.02720555784138%20-17.701496178111093%20M20.883529565612353%20-17.962532760154048%20C21.140260419983278%20-17.903935617969275%2C%2021.396991274354203%20-17.845338475784505%2C%2022.02720555784138%20-17.701496178111093%20M22.02720555784138%20-17.701496178111093%20C22.295342697617098%20-17.621914482506227%2C%2022.563479837392812%20-17.542332786901362%2C%2023.151807073851007%20-17.367720351313253%20M22.02720555784138%20-17.701496178111093%20C22.37704387475603%20-17.597666001989623%2C%2022.72688219167068%20-17.493835825868153%2C%2023.151807073851007%20-17.367720351313253%20M23.151807073851007%20-17.367720351313253%20C23.499422763095797%20-17.239794564346962%2C%2023.84703845234059%20-17.111868777380675%2C%2024.252712884785673%20-16.962576836227537%20M23.151807073851007%20-17.367720351313253%20C23.439350627609667%20-17.261901665506592%2C%2023.726894181368326%20-17.15608297969993%2C%2024.252712884785673%20-16.962576836227537%20M24.252712884785673%20-16.962576836227537%20C24.53818699706085%20-16.836205915011977%2C%2024.82366110933603%20-16.70983499379642%2C%2025.325399132524694%20-16.487730454460443%20M24.252712884785673%20-16.962576836227537%20C24.558627853863044%20-16.82715735406212%2C%2024.864542822940418%20-16.691737871896702%2C%2025.325399132524694%20-16.487730454460443%20M25.325399132524694%20-16.487730454460443%20C25.62996209371031%20-16.328840152691793%2C%2025.934525054895932%20-16.169949850923146%2C%2026.36545791918563%20-15.945132451648883%20M25.325399132524694%20-16.487730454460443%20C25.663001720852872%20-16.311603400374413%2C%2026.000604309181053%20-16.135476346288378%2C%2026.36545791918563%20-15.945132451648883%20M26.36545791918563%20-15.945132451648883%20C26.60611891418231%20-15.799242342200905%2C%2026.84677990917899%20-15.653352232752928%2C%2027.36861542012219%20-15.337012479373305%20M26.36545791918563%20-15.945132451648883%20C26.64444723379956%20-15.776007489606721%2C%2026.923436548413488%20-15.60688252756456%2C%2027.36861542012219%20-15.337012479373305%20M27.36861542012219%20-15.337012479373305%20C27.701074661448875%20-15.10510330455241%2C%2028.03353390277556%20-14.873194129731514%2C%2028.33074944598641%20-14.665869433041124%20M27.36861542012219%20-15.337012479373305%20C27.633178784078233%20-15.152464529441009%2C%2027.897742148034276%20-14.967916579508712%2C%2028.33074944598641%20-14.665869433041124%20M28.33074944598641%20-14.665869433041124%20C28.679212895135656%20-14.387979105346423%2C%2029.027676344284906%20-14.110088777651722%2C%2029.247906381688907%20-13.934461183389454%20M28.33074944598641%20-14.665869433041124%20C28.561996931220623%20-14.481455717320863%2C%2028.793244416454836%20-14.297042001600602%2C%2029.247906381688907%20-13.934461183389454%20M29.247906381688907%20-13.934461183389454%20C29.593197981729897%20-13.620876488147328%2C%2029.93848958177089%20-13.307291792905202%2C%2030.116317432651343%20-13.14579324380268%20M29.247906381688907%20-13.934461183389454%20C29.547768867376163%20-13.662134007814892%2C%2029.84763135306342%20-13.38980683224033%2C%2030.116317432651343%20-13.14579324380268%20M30.116317432651343%20-13.14579324380268%20C30.42734723181505%20-12.824629440144735%2C%2030.73837703097876%20-12.503465636486789%2C%2030.93241411159172%20-12.30310642001332%20M30.116317432651343%20-13.14579324380268%20C30.320751347275174%20-12.934698442617039%2C%2030.525185261899004%20-12.723603641431398%2C%2030.93241411159172%20-12.30310642001332%20M30.93241411159172%20-12.30310642001332%20C31.095508371503875%20-12.111526621994212%2C%2031.25860263141603%20-11.919946823975106%2C%2031.69284290220409%20-11.409863492936067%20M30.93241411159172%20-12.30310642001332%20C31.09998861433513%20-12.106263873831582%2C%2031.26756311707854%20-11.909421327649843%2C%2031.69284290220409%20-11.409863492936067%20M31.69284290220409%20-11.409863492936067%20C31.850699558992428%20-11.198349953876978%2C%2032.008556215780764%20-10.986836414817889%2C%2032.39447903947636%20-10.469734989358303%20M31.69284290220409%20-11.409863492936067%20C31.83980258222245%20-11.21295091001374%2C%2031.98676226224081%20-11.016038327091414%2C%2032.39447903947636%20-10.469734989358303%20M32.39447903947636%20-10.469734989358303%20C32.60593006926097%20-10.144889425057336%2C%2032.817381099045576%20-9.82004386075637%2C%2033.034439350019994%20-9.486584098958145%20M32.39447903947636%20-10.469734989358303%20C32.62940170747541%20-10.108830685742582%2C%2032.86432437547447%20-9.747926382126863%2C%2033.034439350019994%20-9.486584098958145%20M33.034439350019994%20-9.486584098958145%20C33.19900236019692%20-9.194385810577272%2C%2033.36356537037385%20-8.902187522196398%2C%2033.610094099647924%20-8.464450799629462%20M33.034439350019994%20-9.486584098958145%20C33.17580756704897%20-9.235570514538948%2C%2033.317175784077946%20-8.984556930119751%2C%2033.610094099647924%20-8.464450799629462%20M33.610094099647924%20-8.464450799629462%20C33.7310659319868%20-8.21325020139523%2C%2033.85203776432567%20-7.962049603160999%2C%2034.11907779951636%20-7.407535256346107%20M33.610094099647924%20-8.464450799629462%20C33.78489386354246%20-8.101475349786677%2C%2033.95969362743699%20-7.738499899943892%2C%2034.11907779951636%20-7.407535256346107%20M34.11907779951636%20-7.407535256346107%20C34.23927833200808%20-7.11063761717236%2C%2034.3594788644998%20-6.813739977998612%2C%2034.55929892642588%20-6.320180561783094%20M34.11907779951636%20-7.407535256346107%20C34.23732345001899%20-7.115466213480474%2C%2034.35556910052163%20-6.823397170614841%2C%2034.55929892642588%20-6.320180561783094%20M34.55929892642588%20-6.320180561783094%20C34.6452918657766%20-6.061183529572981%2C%2034.73128480512731%20-5.802186497362868%2C%2034.928948517338895%20-5.2068548896172295%20M34.55929892642588%20-6.320180561783094%20C34.70047860292284%20-5.894969870100977%2C%2034.841658279419796%20-5.469759178418858%2C%2034.928948517338895%20-5.2068548896172295%20M34.928948517338895%20-5.2068548896172295%20C34.99619904560903%20-4.950399478759891%2C%2035.06344957387916%20-4.693944067902553%2C%2035.226507602796744%20-4.072133133843056%20M34.928948517338895%20-5.2068548896172295%20C35.03636217558806%20-4.797240057339203%2C%2035.143775833837225%20-4.387625225061177%2C%2035.226507602796744%20-4.072133133843056%20M35.226507602796744%20-4.072133133843056%20C35.28484918334661%20-3.772561448216895%2C%2035.34319076389648%20-3.472989762590735%2C%2035.450753448691046%20-2.9206781095521106%20M35.226507602796744%20-4.072133133843056%20C35.296106641650546%20-3.714756779090842%2C%2035.36570568050435%20-3.3573804243386283%2C%2035.450753448691046%20-2.9206781095521106%20M35.450753448691046%20-2.9206781095521106%20C35.497252265936055%20-2.5600424652298854%2C%2035.54375108318106%20-2.1994068209076603%2C%2035.60076458074045%20-1.7572213924255182%20M35.450753448691046%20-2.9206781095521106%20C35.49901198331362%20-2.546394444744941%2C%2035.5472705179362%20-2.1721107799377717%2C%2035.60076458074045%20-1.7572213924255182%20M35.60076458074045%20-1.7572213924255182%20C35.628369777017554%20-1.3272481778962901%2C%2035.655974973294654%20-0.8972749633670621%2C%2035.67592457102608%20-0.5865438756746428%20M35.60076458074045%20-1.7572213924255182%20C35.62974728144722%20-1.3057924345026612%2C%2035.658729982153986%20-0.8543634765798042%2C%2035.67592457102608%20-0.5865438756746428%20M35.67592457102608%20-0.5865438756746428%20C35.67592457102608%20-0.17280950432273656%2C%2035.67592457102608%200.2409248670291697%2C%2035.67592457102608%200.5865438756746384%20M35.67592457102608%20-0.5865438756746428%20C35.67592457102608%20-0.28198928100109516%2C%2035.67592457102608%200.022565313672452514%2C%2035.67592457102608%200.5865438756746384%20M35.67592457102608%200.5865438756746384%20C35.65154426367831%200.9662868420460673%2C%2035.627163956330534%201.3460298084174962%2C%2035.60076458074045%201.7572213924255058%20M35.67592457102608%200.5865438756746384%20C35.658428544758905%200.8590586073241242%2C%2035.64093251849173%201.13157333897361%2C%2035.60076458074045%201.7572213924255058%20M35.60076458074045%201.7572213924255058%20C35.56209122051816%202.057164337390848%2C%2035.523417860295865%202.3571072823561905%2C%2035.450753448691046%202.920678109552098%20M35.60076458074045%201.7572213924255058%20C35.55584817303532%202.10558418083854%2C%2035.5109317653302%202.4539469692515743%2C%2035.450753448691046%202.920678109552098%20M35.450753448691046%202.920678109552098%20C35.36846874337998%203.3431926804458056%2C%2035.28618403806892%203.7657072513395127%2C%2035.226507602796744%204.072133133843051%20M35.450753448691046%202.920678109552098%20C35.37802076098612%203.294145088857938%2C%2035.30528807328118%203.6676120681637783%2C%2035.226507602796744%204.072133133843051%20M35.226507602796744%204.072133133843051%20C35.141895616581095%204.394795308350115%2C%2035.05728363036544%204.717457482857177%2C%2034.928948517338895%205.206854889617217%20M35.226507602796744%204.072133133843051%20C35.11233170979732%204.507535297994913%2C%2034.99815581679788%204.942937462146775%2C%2034.928948517338895%205.206854889617217%20M34.928948517338895%205.206854889617217%20C34.805324185308606%205.579191680830033%2C%2034.68169985327832%205.951528472042849%2C%2034.55929892642589%206.320180561783083%20M34.928948517338895%205.206854889617217%20C34.842640156066246%205.466801922400547%2C%2034.756331794793596%205.726748955183877%2C%2034.55929892642589%206.320180561783083%20M34.55929892642589%206.320180561783083%20C34.40669979408848%206.697103368959996%2C%2034.254100661751075%207.07402617613691%2C%2034.11907779951636%207.407535256346102%20M34.55929892642589%206.320180561783083%20C34.39032524022956%206.737548833571994%2C%2034.221351554033234%207.154917105360905%2C%2034.11907779951636%207.407535256346102%20M34.11907779951636%207.407535256346102%20C33.94696860134468%207.764923688896502%2C%2033.774859403173004%208.122312121446901%2C%2033.610094099647924%208.464450799629459%20M34.11907779951636%207.407535256346102%20C33.98358237416898%207.688894406217606%2C%2033.8480869488216%207.97025355608911%2C%2033.610094099647924%208.464450799629459%20M33.610094099647924%208.464450799629459%20C33.416254367150195%208.808632873080528%2C%2033.222414634652466%209.152814946531597%2C%2033.03443935002%209.486584098958142%20M33.610094099647924%208.464450799629459%20C33.42021412300147%208.801601925597826%2C%2033.23033414635502%209.138753051566193%2C%2033.03443935002%209.486584098958142%20M33.03443935002%209.486584098958142%20C32.78045487177467%209.87677246192489%2C%2032.526470393529344%2010.26696082489164%2C%2032.394479039476366%2010.469734989358292%20M33.03443935002%209.486584098958142%20C32.805672807937995%209.838030940014%2C%2032.57690626585599%2010.189477781069861%2C%2032.394479039476366%2010.469734989358292%20M32.394479039476366%2010.469734989358292%20C32.19933613489722%2010.73120870361001%2C%2032.00419323031808%2010.992682417861728%2C%2031.692842902204095%2011.409863492936063%20M32.394479039476366%2010.469734989358292%20C32.19426062575186%2010.738009423476406%2C%2031.99404221202735%2011.006283857594521%2C%2031.692842902204095%2011.409863492936063%20M31.692842902204095%2011.409863492936063%20C31.495025417755393%2011.642231166303244%2C%2031.297207933306694%2011.874598839670425%2C%2030.932414111591726%2012.30310642001331%20M31.692842902204095%2011.409863492936063%20C31.535976301062274%2011.594127928599711%2C%2031.379109699920456%2011.77839236426336%2C%2030.932414111591726%2012.30310642001331%20M30.932414111591726%2012.30310642001331%20C30.73287843813598%2012.509143385039824%2C%2030.53334276468024%2012.715180350066337%2C%2030.116317432651346%2013.145793243802677%20M30.932414111591726%2012.30310642001331%20C30.616039719103078%2012.629788955078526%2C%2030.299665326614434%2012.956471490143743%2C%2030.116317432651346%2013.145793243802677%20M30.116317432651346%2013.145793243802677%20C29.8520989916062%2013.385749441123012%2C%2029.58788055056106%2013.62570563844335%2C%2029.24790638168892%2013.934461183389441%20M30.116317432651346%2013.145793243802677%20C29.79840013317521%2013.434517323556104%2C%2029.480482833699075%2013.72324140330953%2C%2029.24790638168892%2013.934461183389441%20M29.24790638168892%2013.934461183389441%20C28.969997674567647%2014.156085981857371%2C%2028.69208896744637%2014.377710780325303%2C%2028.330749445986413%2014.665869433041122%20M29.24790638168892%2013.934461183389441%20C29.052640965889154%2014.090180156258814%2C%2028.857375550089387%2014.245899129128187%2C%2028.330749445986413%2014.665869433041122%20M28.330749445986413%2014.665869433041122%20C27.970522525730036%2014.917148138639924%2C%2027.61029560547366%2015.168426844238725%2C%2027.3686154201222%2015.3370124793733%20M28.330749445986413%2014.665869433041122%20C28.03026364157819%2014.875475322375475%2C%2027.72977783716997%2015.085081211709827%2C%2027.3686154201222%2015.3370124793733%20M27.3686154201222%2015.3370124793733%20C26.978027818481973%2015.573788978835132%2C%2026.587440216841742%2015.810565478296967%2C%2026.365457919185634%2015.94513245164888%20M27.3686154201222%2015.3370124793733%20C26.978656854625598%2015.57340765342824%2C%2026.588698289128995%2015.80980282748318%2C%2026.365457919185634%2015.94513245164888%20M26.365457919185634%2015.94513245164888%20C26.13380362925656%2016.065986346323225%2C%2025.902149339327483%2016.18684024099757%2C%2025.325399132524698%2016.487730454460443%20M26.365457919185634%2015.94513245164888%20C26.073996142394314%2016.097187873910734%2C%2025.782534365602995%2016.249243296172587%2C%2025.325399132524698%2016.487730454460443%20M25.325399132524698%2016.487730454460443%20C25.02694502294099%2016.61984723544655%2C%2024.728490913357284%2016.751964016432655%2C%2024.25271288478568%2016.962576836227537%20M25.325399132524698%2016.487730454460443%20C25.056276048018738%2016.606863260718576%2C%2024.787152963512774%2016.72599606697671%2C%2024.25271288478568%2016.962576836227537%20M24.25271288478568%2016.962576836227537%20C23.882547076478943%2017.09880127545964%2C%2023.512381268172202%2017.23502571469174%2C%2023.151807073851018%2017.36772035131325%20M24.25271288478568%2016.962576836227537%20C23.937452015933864%2017.078595750204528%2C%2023.622191147082052%2017.194614664181522%2C%2023.151807073851018%2017.36772035131325%20M23.151807073851018%2017.36772035131325%20C22.888837468287235%2017.445768349888954%2C%2022.625867862723453%2017.523816348464656%2C%2022.0272055578414%2017.70149617811109%20M23.151807073851018%2017.36772035131325%20C22.89603050303168%2017.44363349493381%2C%2022.640253932212346%2017.519546638554374%2C%2022.0272055578414%2017.70149617811109%20M22.0272055578414%2017.70149617811109%20C21.63371849030949%2017.791307033532163%2C%2021.240231422777583%2017.881117888953238%2C%2020.88352956561236%2017.962532760154048%20M22.0272055578414%2017.70149617811109%20C21.575227640459264%2017.80465718832201%2C%2021.123249723077127%2017.907818198532937%2C%2020.88352956561236%2017.962532760154048%20M20.88352956561236%2017.962532760154048%20C20.502223185008873%2018.02417941869487%2C%2020.12091680440539%2018.085826077235698%2C%2019.72547870713373%2018.149757442134334%20M20.88352956561236%2017.962532760154048%20C20.464994038301114%2018.030198338418238%2C%2020.046458510989865%2018.09786391668243%2C%2019.72547870713373%2018.149757442134334%20M19.72547870713373%2018.149757442134334%20C19.39508401699154%2018.1816302205346%2C%2019.06468932684935%2018.213502998934867%2C%2018.557811661784097%2018.262400877674132%20M19.72547870713373%2018.149757442134334%20C19.382149017502893%2018.182878044378658%2C%2019.03881932787206%2018.21599864662298%2C%2018.557811661784097%2018.262400877674132%20M18.557811661784097%2018.262400877674132%20C18.201598373418985%2018.273823944504898%2C%2017.84538508505387%2018.285247011335663%2C%2017.38532662391663%2018.300000190734863%20M18.557811661784097%2018.262400877674132%20C18.19807825385195%2018.273936827887916%2C%2017.838344845919803%2018.2854727781017%2C%2017.38532662391663%2018.300000190734863%20M17.38532662391663%2018.300000190734863%20C17.38532662391663%2018.300000190734863%2C%2017.385326623916626%2018.300000190734863%2C%2017.385326623916626%2018.300000190734863%20M17.38532662391663%2018.300000190734863%20C17.38532662391663%2018.300000190734863%2C%2017.38532662391663%2018.300000190734863%2C%2017.385326623916626%2018.300000190734863%20M17.385326623916626%2018.300000190734863%20C6.5156511492729035%2018.300000190734863%2C%20-4.354024325370819%2018.300000190734863%2C%20-17.385326623916622%2018.300000190734863%20M17.385326623916626%2018.300000190734863%20C10.13647486650597%2018.300000190734863%2C%202.8876231090953173%2018.300000190734863%2C%20-17.385326623916622%2018.300000190734863%20M-17.385326623916622%2018.300000190734863%20C-17.754322965156135%2018.28816719627912%2C%20-18.123319306395647%2018.276334201823374%2C%20-18.55781166178409%2018.262400877674132%20M-17.385326623916622%2018.300000190734863%20C-17.74648498113201%2018.288418545171062%2C%20-18.107643338347398%2018.27683689960726%2C%20-18.55781166178409%2018.262400877674132%20M-18.55781166178409%2018.262400877674132%20C-18.99345345775905%2018.22037503755234%2C%20-19.42909525373401%2018.17834919743055%2C%20-19.72547870713372%2018.149757442134334%20M-18.55781166178409%2018.262400877674132%20C-18.897349602762787%2018.229646060862034%2C%20-19.236887543741485%2018.196891244049937%2C%20-19.72547870713372%2018.149757442134334%20M-19.72547870713372%2018.149757442134334%20C-20.064460305645454%2018.094953526128517%2C%20-20.403441904157187%2018.040149610122697%2C%20-20.883529565612353%2017.962532760154048%20M-19.72547870713372%2018.149757442134334%20C-20.104272648306303%2018.088516975316438%2C%20-20.483066589478884%2018.02727650849854%2C%20-20.883529565612353%2017.962532760154048%20M-20.883529565612353%2017.962532760154048%20C-21.156716600152908%2017.900179602232168%2C%20-21.429903634693463%2017.83782644431029%2C%20-22.027205557841377%2017.701496178111093%20M-20.883529565612353%2017.962532760154048%20C-21.243171462996003%2017.88044684395894%2C%20-21.602813360379653%2017.798360927763827%2C%20-22.027205557841377%2017.701496178111093%20M-22.027205557841377%2017.701496178111093%20C-22.308996750832467%2017.617862031183495%2C%20-22.590787943823557%2017.534227884255895%2C%20-23.151807073850996%2017.36772035131326%20M-22.027205557841377%2017.701496178111093%20C-22.341318727978983%2017.608269038027927%2C%20-22.65543189811659%2017.515041897944766%2C%20-23.151807073850996%2017.36772035131326%20M-23.151807073850996%2017.36772035131326%20C-23.546230453913637%2017.22256890144045%2C%20-23.940653833976278%2017.07741745156764%2C%20-24.252712884785673%2016.962576836227537%20M-23.151807073850996%2017.36772035131326%20C-23.41445890742794%2017.27106204863001%2C%20-23.677110741004885%2017.17440374594676%2C%20-24.252712884785673%2016.962576836227537%20M-24.252712884785673%2016.962576836227537%20C-24.639181073149977%2016.79149883341015%2C%20-25.02564926151428%2016.620420830592757%2C%20-25.325399132524694%2016.487730454460447%20M-24.252712884785673%2016.962576836227537%20C-24.668648551585022%2016.778454454828644%2C%20-25.08458421838437%2016.594332073429747%2C%20-25.325399132524694%2016.487730454460447%20M-25.325399132524694%2016.487730454460447%20C-25.53435977644672%2016.378715820372005%2C%20-25.74332042036875%2016.269701186283562%2C%20-26.365457919185626%2015.945132451648885%20M-25.325399132524694%2016.487730454460447%20C-25.670361288555306%2016.307763918618082%2C%20-26.01532344458592%2016.127797382775718%2C%20-26.365457919185626%2015.945132451648885%20M-26.365457919185626%2015.945132451648885%20C-26.611847164524864%2015.795769843180313%2C%20-26.8582364098641%2015.646407234711743%2C%20-27.368615420122183%2015.33701247937331%20M-26.365457919185626%2015.945132451648885%20C-26.605621135324608%2015.799544098669717%2C%20-26.84578435146359%2015.653955745690551%2C%20-27.368615420122183%2015.33701247937331%20M-27.368615420122183%2015.33701247937331%20C-27.633243040600636%2015.152419706872601%2C%20-27.89787066107909%2014.96782693437189%2C%20-28.330749445986406%2014.665869433041125%20M-27.368615420122183%2015.33701247937331%20C-27.675315442731016%2015.123071820431381%2C%20-27.982015465339853%2014.909131161489452%2C%20-28.330749445986406%2014.665869433041125%20M-28.330749445986406%2014.665869433041125%20C-28.640394004899115%2014.418936137296013%2C%20-28.950038563811823%2014.1720028415509%2C%20-29.247906381688907%2013.934461183389455%20M-28.330749445986406%2014.665869433041125%20C-28.631083759177645%2014.42636081050284%2C%20-28.93141807236888%2014.186852187964556%2C%20-29.247906381688907%2013.934461183389455%20M-29.247906381688907%2013.934461183389455%20C-29.539437271615775%2013.669700542642534%2C%20-29.830968161542643%2013.404939901895613%2C%20-30.116317432651336%2013.145793243802688%20M-29.247906381688907%2013.934461183389455%20C-29.476445815199238%2013.726907716697427%2C%20-29.70498524870957%2013.519354250005398%2C%20-30.116317432651336%2013.145793243802688%20M-30.116317432651336%2013.145793243802688%20C-30.304619995344428%2012.951355387894157%2C%20-30.492922558037524%2012.756917531985627%2C%20-30.932414111591726%2012.303106420013316%20M-30.116317432651336%2013.145793243802688%20C-30.39743853184696%2012.855512628411727%2C%20-30.678559631042578%2012.565232013020768%2C%20-30.932414111591726%2012.303106420013316%20M-30.932414111591726%2012.303106420013316%20C-31.20203096746174%2011.986399119474685%2C%20-31.47164782333176%2011.669691818936053%2C%20-31.69284290220409%2011.409863492936068%20M-30.932414111591726%2012.303106420013316%20C-31.170575442357457%2012.023348569132263%2C%20-31.408736773123188%2011.74359071825121%2C%20-31.69284290220409%2011.409863492936068%20M-31.69284290220409%2011.409863492936068%20C-31.836800492341915%2011.216973436957645%2C%20-31.98075808247974%2011.024083380979219%2C%20-32.39447903947636%2010.469734989358304%20M-31.69284290220409%2011.409863492936068%20C-31.87730091656883%2011.162706558158126%2C%20-32.06175893093357%2010.915549623380183%2C%20-32.39447903947636%2010.469734989358304%20M-32.39447903947636%2010.469734989358304%20C-32.62338102601344%2010.118080069247522%2C%20-32.852283012550515%209.76642514913674%2C%20-33.034439350019994%209.486584098958154%20M-32.39447903947636%2010.469734989358304%20C-32.56156952452176%2010.213039134250934%2C%20-32.72866000956716%209.956343279143564%2C%20-33.034439350019994%209.486584098958154%20M-33.034439350019994%209.486584098958154%20C-33.19704801032291%209.197855956677975%2C%20-33.35965667062582%208.909127814397795%2C%20-33.610094099647924%208.464450799629464%20M-33.034439350019994%209.486584098958154%20C-33.169742129878536%209.24634031242718%2C%20-33.30504490973708%209.006096525896204%2C%20-33.610094099647924%208.464450799629464%20M-33.610094099647924%208.464450799629464%20C-33.746059064630494%208.182116640658952%2C%20-33.88202402961306%207.8997824816884386%2C%20-34.11907779951636%207.407535256346109%20M-33.610094099647924%208.464450799629464%20C-33.76357731071293%208.145739627838344%2C%20-33.91706052177795%207.827028456047224%2C%20-34.11907779951636%207.407535256346109%20M-34.11907779951636%207.407535256346109%20C-34.22167902510589%207.154108245480218%2C%20-34.32428025069542%206.900681234614327%2C%20-34.55929892642588%206.320180561783097%20M-34.11907779951636%207.407535256346109%20C-34.24294746997964%207.101574775444645%2C%20-34.366817140442926%206.7956142945431806%2C%20-34.55929892642588%206.320180561783097%20M-34.55929892642588%206.320180561783097%20C-34.6923682177812%205.9193970579332005%2C%20-34.82543750913652%205.518613554083305%2C%20-34.928948517338895%205.206854889617224%20M-34.55929892642588%206.320180561783097%20C-34.68930514279018%205.928622551771428%2C%20-34.81931135915448%205.537064541759759%2C%20-34.928948517338895%205.206854889617224%20M-34.928948517338895%205.206854889617224%20C-35.02308569215186%204.8478690427457565%2C%20-35.117222866964816%204.48888319587429%2C%20-35.22650760279674%204.0721331338430575%20M-34.928948517338895%205.206854889617224%20C-35.00884720153822%204.902166578456435%2C%20-35.08874588573754%204.597478267295646%2C%20-35.22650760279674%204.0721331338430575%20M-35.22650760279674%204.0721331338430575%20C-35.28997769825231%203.746227608088146%2C%20-35.35344779370787%203.420322082333234%2C%20-35.450753448691046%202.920678109552113%20M-35.22650760279674%204.0721331338430575%20C-35.313628000747656%203.6247883032677324%2C%20-35.400748398698575%203.1774434726924072%2C%20-35.450753448691046%202.920678109552113%20M-35.450753448691046%202.920678109552113%20C-35.50032385315856%202.53621984128557%2C%20-35.549894257626086%202.151761573019028%2C%20-35.600764580740446%201.7572213924255287%20M-35.450753448691046%202.920678109552113%20C-35.495237138211564%202.575671397929%2C%20-35.53972082773209%202.2306646863058868%2C%20-35.600764580740446%201.7572213924255287%20M-35.600764580740446%201.7572213924255287%20C-35.61869963899178%201.4778683832425488%2C%20-35.63663469724312%201.1985153740595687%2C%20-35.67592457102608%200.586543875674645%20M-35.600764580740446%201.7572213924255287%20C-35.62480527963064%201.382768101907845%2C%20-35.64884597852084%201.0083148113901617%2C%20-35.67592457102608%200.586543875674645%20M-35.67592457102608%200.586543875674645%20C-35.67592457102608%200.33565322503860456%2C%20-35.67592457102608%200.08476257440256407%2C%20-35.67592457102608%20-0.5865438756746362%20M-35.67592457102608%200.586543875674645%20C-35.67592457102608%200.33596463924455117%2C%20-35.67592457102608%200.08538540281445728%2C%20-35.67592457102608%20-0.5865438756746362%20M-35.67592457102608%20-0.5865438756746362%20C-35.650827500962095%20-0.977450999911537%2C%20-35.62573043089811%20-1.368358124148438%2C%20-35.60076458074045%20-1.7572213924255036%20M-35.67592457102608%20-0.5865438756746362%20C-35.64633287474103%20-1.0474584313016901%2C%20-35.61674117845597%20-1.5083729869287443%2C%20-35.60076458074045%20-1.7572213924255036%20M-35.60076458074045%20-1.7572213924255036%20C-35.566153705822174%20-2.025656503601354%2C%20-35.5315428309039%20-2.294091614777205%2C%20-35.450753448691046%20-2.9206781095521044%20M-35.60076458074045%20-1.7572213924255036%20C-35.56474549900677%20-2.0365782775797467%2C%20-35.52872641727309%20-2.3159351627339904%2C%20-35.450753448691046%20-2.9206781095521044%20M-35.450753448691046%20-2.9206781095521044%20C-35.372283242268125%20-3.323606034849822%2C%20-35.2938130358452%20-3.7265339601475396%2C%20-35.226507602796744%20-4.0721331338430495%20M-35.450753448691046%20-2.9206781095521044%20C-35.3998037701836%20-3.182293940469466%2C%20-35.34885409167616%20-3.443909771386827%2C%20-35.226507602796744%20-4.0721331338430495%20M-35.226507602796744%20-4.0721331338430495%20C-35.12736900418584%20-4.450191577286863%2C%20-35.02823040557493%20-4.8282500207306756%2C%20-34.928948517338895%20-5.206854889617215%20M-35.226507602796744%20-4.0721331338430495%20C-35.15533154183551%20-4.343558302188194%2C%20-35.08415548087427%20-4.614983470533339%2C%20-34.928948517338895%20-5.206854889617215%20M-34.928948517338895%20-5.206854889617215%20C-34.812504471489%20-5.557565802877926%2C%20-34.696060425639104%20-5.908276716138637%2C%20-34.559298926425896%20-6.320180561783073%20M-34.928948517338895%20-5.206854889617215%20C-34.78407262465161%20-5.64319799555256%2C%20-34.63919673196431%20-6.079541101487905%2C%20-34.559298926425896%20-6.320180561783073%20M-34.559298926425896%20-6.320180561783073%20C-34.40253196123111%20-6.7073979966972646%2C%20-34.245764996036336%20-7.094615431611457%2C%20-34.11907779951636%20-7.4075352563461%20M-34.559298926425896%20-6.320180561783073%20C-34.439835198975594%20-6.615258278259361%2C%20-34.32037147152529%20-6.910335994735649%2C%20-34.11907779951636%20-7.4075352563461%20M-34.11907779951636%20-7.4075352563461%20C-33.99662987657992%20-7.661800988289462%2C%20-33.87418195364348%20-7.916066720232823%2C%20-33.610094099647924%20-8.464450799629457%20M-34.11907779951636%20-7.4075352563461%20C-33.92082652617678%20-7.819208267333442%2C%20-33.7225752528372%20-8.230881278320783%2C%20-33.610094099647924%20-8.464450799629457%20M-33.610094099647924%20-8.464450799629457%20C-33.44428026074947%20-8.758870061065547%2C%20-33.278466421851014%20-9.053289322501637%2C%20-33.034439350019994%20-9.486584098958149%20M-33.610094099647924%20-8.464450799629457%20C-33.47254229876155%20-8.70868795073342%2C%20-33.33499049787518%20-8.952925101837385%2C%20-33.034439350019994%20-9.486584098958149%20M-33.034439350019994%20-9.486584098958149%20C-32.89054718770566%20-9.707641100728727%2C%20-32.74665502539132%20-9.928698102499308%2C%20-32.39447903947636%20-10.469734989358297%20M-33.034439350019994%20-9.486584098958149%20C-32.82256129613544%20-9.812085686948658%2C%20-32.61068324225088%20-10.137587274939166%2C%20-32.39447903947636%20-10.469734989358297%20M-32.39447903947636%20-10.469734989358297%20C-32.2338596055537%20-10.684950398083217%2C%20-32.07324017163103%20-10.900165806808134%2C%20-31.6928429022041%20-11.409863492936063%20M-32.39447903947636%20-10.469734989358297%20C-32.21439231131912%20-10.71103479885055%2C%20-32.03430558316189%20-10.952334608342802%2C%20-31.6928429022041%20-11.409863492936063%20M-31.6928429022041%20-11.409863492936063%20C-31.40127660239311%20-11.752353859286497%2C%20-31.109710302582126%20-12.094844225636933%2C%20-30.932414111591733%20-12.30310642001331%20M-31.6928429022041%20-11.409863492936063%20C-31.45198712468296%20-11.692786394294378%2C%20-31.211131347161828%20-11.975709295652694%2C%20-30.932414111591733%20-12.30310642001331%20M-30.932414111591733%20-12.30310642001331%20C-30.702778031723053%20-12.540224525950507%2C%20-30.47314195185437%20-12.777342631887702%2C%20-30.116317432651353%20-13.14579324380267%20M-30.932414111591733%20-12.30310642001331%20C-30.667710437670927%20-12.57643469591234%2C%20-30.40300676375012%20-12.849762971811371%2C%20-30.116317432651353%20-13.14579324380267%20M-30.116317432651353%20-13.14579324380267%20C-29.939248580733953%20-13.30660249012896%2C%20-29.762179728816555%20-13.46741173645525%2C%20-29.24790638168892%20-13.93446118338944%20M-30.116317432651353%20-13.14579324380267%20C-29.802098405124706%20-13.431158650822484%2C%20-29.487879377598063%20-13.716524057842296%2C%20-29.24790638168892%20-13.93446118338944%20M-29.24790638168892%20-13.93446118338944%20C-28.93351501717582%20-14.185179930283063%2C%20-28.619123652662726%20-14.435898677176686%2C%20-28.330749445986413%20-14.66586943304112%20M-29.24790638168892%20-13.93446118338944%20C-28.93061821088513%20-14.187490056212638%2C%20-28.613330040081337%20-14.440518929035838%2C%20-28.330749445986413%20-14.66586943304112%20M-28.330749445986413%20-14.66586943304112%20C-27.970093389757178%20-14.91744748531759%2C%20-27.609437333527946%20-15.16902553759406%2C%20-27.368615420122204%20-15.337012479373296%20M-28.330749445986413%20-14.66586943304112%20C-27.972912596796384%20-14.915480928528547%2C%20-27.615075747606355%20-15.165092424015974%2C%20-27.368615420122204%20-15.337012479373296%20M-27.368615420122204%20-15.337012479373296%20C-27.02328044604129%20-15.546356570074716%2C%20-26.677945471960378%20-15.755700660776135%2C%20-26.365457919185637%20-15.945132451648877%20M-27.368615420122204%20-15.337012479373296%20C-27.143818008592163%20-15.473285991299033%2C%20-26.919020597062122%20-15.609559503224768%2C%20-26.365457919185637%20-15.945132451648877%20M-26.365457919185637%20-15.945132451648877%20C-26.055453667981915%20-16.10686147093466%2C%20-25.745449416778193%20-16.268590490220443%2C%20-25.3253991325247%20-16.487730454460443%20M-26.365457919185637%20-15.945132451648877%20C-26.144930532040785%20-16.060181448267816%2C%20-25.92440314489593%20-16.175230444886754%2C%20-25.3253991325247%20-16.487730454460443%20M-25.3253991325247%20-16.487730454460443%20C-24.994466072302536%20-16.634224703440353%2C%20-24.66353301208037%20-16.780718952420266%2C%20-24.252712884785684%20-16.962576836227534%20M-25.3253991325247%20-16.487730454460443%20C-24.98841271339412%20-16.6369043458626%2C%20-24.651426294263537%20-16.786078237264753%2C%20-24.252712884785684%20-16.962576836227534%20M-24.252712884785684%20-16.962576836227534%20C-23.8985450148722%20-17.092913886247597%2C%20-23.544377144958723%20-17.223250936267657%2C%20-23.15180707385102%20-17.36772035131325%20M-24.252712884785684%20-16.962576836227534%20C-23.95894112811662%20-17.0706875582781%2C%20-23.665169371447558%20-17.178798280328664%2C%20-23.15180707385102%20-17.36772035131325%20M-23.15180707385102%20-17.36772035131325%20C-22.871625182506634%20-17.450876865959504%2C%20-22.591443291162246%20-17.53403338060576%2C%20-22.027205557841402%20-17.701496178111086%20M-23.15180707385102%20-17.36772035131325%20C-22.74591058469935%20-17.488188298699317%2C%20-22.34001409554768%20-17.608656246085385%2C%20-22.027205557841402%20-17.701496178111086%20M-22.027205557841402%20-17.701496178111086%20C-21.67811997174688%20-17.78117268514082%2C%20-21.32903438565236%20-17.860849192170555%2C%20-20.883529565612363%20-17.962532760154044%20M-22.027205557841402%20-17.701496178111086%20C-21.706134041206244%20-17.774778656595608%2C%20-21.385062524571087%20-17.848061135080133%2C%20-20.883529565612363%20-17.962532760154044%20M-20.883529565612363%20-17.962532760154044%20C-20.504268470255532%20-18.023848752837615%2C%20-20.1250073748987%20-18.085164745521187%2C%20-19.725478707133732%20-18.149757442134334%20M-20.883529565612363%20-17.962532760154044%20C-20.62627877720566%20-18.00412307261398%2C%20-20.369027988798955%20-18.045713385073917%2C%20-19.725478707133732%20-18.149757442134334%20M-19.725478707133732%20-18.149757442134334%20C-19.479251406219504%20-18.173510693721873%2C%20-19.233024105305276%20-18.197263945309416%2C%20-18.557811661784097%20-18.262400877674132%20M-19.725478707133732%20-18.149757442134334%20C-19.38016686239715%20-18.183069260497817%2C%20-19.03485501766057%20-18.216381078861303%2C%20-18.557811661784097%20-18.262400877674132%20M-18.557811661784097%20-18.262400877674132%20C-18.10048036822848%20-18.2770666021171%2C%20-17.643149074672866%20-18.291732326560066%2C%20-17.385326623916633%20-18.300000190734863%20M-18.557811661784097%20-18.262400877674132%20C-18.276614555134675%20-18.271418321567413%2C%20-17.995417448485252%20-18.280435765460698%2C%20-17.385326623916633%20-18.300000190734863%20M-17.385326623916633%20-18.300000190734863%20C-17.38532662391663%20-18.300000190734863%2C%20-17.38532662391663%20-18.300000190734863%2C%20-17.385326623916626%20-18.300000190734863%20M-17.385326623916633%20-18.300000190734863%20C-17.38532662391663%20-18.300000190734863%2C%20-17.385326623916626%20-18.300000190734863%2C%20-17.385326623916626%20-18.300000190734863%22%20stroke%3D%22rgb\(31%2C%2078%2C%20148\)%22%20stroke-width%3D%221.3%22%20fill%3D%22none%22%20stroke-dasharray%3D%220%200%22%20style%3D%22%22%3E%3C%2Fpath%3E%3C%2Fg%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ESelesai%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%20%20mermaid-decision%22%20id%3D%22flowchart-U-43%22%20transform%3D%22translate\(347.83612060546875%2C%20939.1999969482422\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-111.76033020019531%22%20y%3D%22-30%22%20width%3D%22223.52066040039062%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ELogin%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20sebagai%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20admin%3F%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-V-45%22%20transform%3D%22translate\(347.8361206054687%2C%201139.1999969482422\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-98.0562515258789%22%20y%3D%22-30%22%20width%3D%22196.1125030517578%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EDashboard%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20admin%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-W-47%22%20transform%3D%22translate\(159.52699279785156%2C%201239.1999969482422\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-78.9820442199707%22%20y%3D%22-30%22%20width%3D%22157.9640884399414%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EKelola%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20event%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-X-49%22%20transform%3D%22translate\(380.52153778076166%2C%201244.7999954223633\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-102.01250457763672%22%20y%3D%22-30%22%20width%3D%22204.02500915527344%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EKelola%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20pendaftaran%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-Y-51%22%20transform%3D%22translate\(380.52153778076166%2C%201355.9999923706055\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-110.24845123291016%22%20y%3D%22-30%22%20width%3D%22220.4969024658203%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EKonfirmasi%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20atau%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20tolak%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-Z-53%22%20transform%3D%22translate\(380.52153778076166%2C%201461.5999908447266\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-120.64376831054688%22%20y%3D%22-30%22%20width%3D%22241.28753662109375%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ESimpan%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20status%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20di%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20MySQL%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edges%20edgePaths%22%3E%3Cpath%20d%3D%22M307.8811162312833%2C658.5000019073486L307.6311162312829%2C658.2500009536743Q307.3811162312825%2C658%20307.3811162312825%2C658.3535540649438L307.3811162312825%2C686%22%20id%3D%22L_A_B_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_A_B_0%22%20data-points%3D%22W3sieCI6MzA3Ljg4MTExNjIzMTI4MzMsInkiOjY1OC41MDAwMDE5MDczNDg2fSx7IngiOjMwNy4zODExMTYyMzEyODI1LCJ5Ijo2NTh9LHsieCI6MzA3LjM4MTExNjIzMTI4MjUsInkiOjY5MH1d%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M307.3811162312825%2C769.1999969482422L307.3811162312825%2C797.1999969482422%22%20id%3D%22L_B_C_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_B_C_0%22%20data-points%3D%22W3sieCI6MzA3LjM4MTExNjIzMTI4MjUsInkiOjc2OS4xOTk5OTY5NDgyNDIyfSx7IngiOjMwNy4zODExMTYyMzEyODI1LCJ5Ijo4MDEuMTk5OTk2OTQ4MjQyMn1d%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M266.92611185709626%2C869.1999969482422L266.9261118570963%2C882.1289291363768Q266.9261118570963%2C889.1999969482422%20259.85504404523084%2C889.1999969482422L130.28920449941575%2C889.1999969482422Q128.5062484741211%2C889.1999969482422%20127.092034911748%2C890.2857833858691L127.092034911748%2C890.2857833858691Q125.67782134937491%2C891.371569823496%20124.59203491174802%2C892.7857833858691L124.592034911748%2C892.7857833858691Q123.5062484741211%2C894.1999969482422%20123.5062484741211%2C895.9829529735368L123.5062484741211%2C899.1999969482422%22%20id%3D%22L_C_D_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_C_D_0%22%20data-points%3D%22W3sieCI6MjY2LjkyNjExMTg1NzA5NjI2LCJ5Ijo4NjkuMTk5OTk2OTQ4MjQyMn0seyJ4IjoyNjYuOTI2MTExODU3MDk2MywieSI6ODg5LjE5OTk5Njk0ODI0MjJ9LHsieCI6MTIzLjUwNjI0ODQ3NDEyMTEsInkiOjg4OS4xOTk5OTY5NDgyNDIyfSx7IngiOjEyMy41MDYyNDg0NzQxMjExLCJ5Ijo5MDMuMTk5OTk2OTQ4MjQyMn1d%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M123.5062484741211%2C969.1999969482422L123.5062484741211%2C997.1999969482422%22%20id%3D%22L_D_E_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_D_E_0%22%20data-points%3D%22W3sieCI6MTIzLjUwNjI0ODQ3NDEyMTEsInkiOjk2OS4xOTk5OTY5NDgyNDIyfSx7IngiOjEyMy41MDYyNDg0NzQxMjExLCJ5IjoxMDAxLjE5OTk5Njk0ODI0MjJ9XQ%3D%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M67.75312423706052%2C1009.1999969482422L67.75312423706053%2C996.2710647601076Q67.75312423706055%2C989.1999969482422%2060.68205642519508%2C989.1999969482422L36.7196625682634%2C989.1999969482422Q34.93670654296875%2C989.1999969482422%2033.52249298059566%2C988.1142105106153L33.52249298059566%2C988.1142105106153Q32.10827941822256%2C987.0284240729884%2031.022492980595665%2C985.6142105106153L31.022492980595654%2C985.6142105106153Q29.93670654296875%2C984.1999969482422%2029.93670654296875%2C982.4170409229475L29.93670654296875%2C939.1999969482422L29.93670654296875%2C839.1999969482422L29.93670654296875%2C733.5999984741211L29.93670654296875%2C628L29.93670654296875%2C528L29.93670654296875%2C428L29.93670654296875%2C328L29.93670654296875%2C228L29.93670654296875%2C145L29.93670654296875%2C98.78295602529465Q29.93670654296875%2C97%2031.022492980595654%2C95.58578643762691L31.022492980595654%2C95.58578643762691Q32.10827941822256%2C94.17157287525382%2033.52249298059565%2C93.08578643762691L33.52249298059566%2C93.08578643762691Q34.93670654296875%2C92%2036.71966256826341%2C92L823.356038827407%2C92Q825.1389948527017%2C92%20826.5532084150748%2C90.91421356237309L826.5532084150748%2C90.91421356237308Q827.9674219774479%2C89.82842712474618%20829.0532084150748%2C88.41421356237309L829.0532084150748%2C88.41421356237309Q830.1389948527017%2C87%20830.1389948527017%2C85.21704397470535L830.1389948527017%2C82%22%20id%3D%22L_E_F_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_E_F_0%22%20data-points%3D%22W3sieCI6NjcuNzUzMTI0MjM3MDYwNTIsInkiOjEwMDkuMTk5OTk2OTQ4MjQyMn0seyJ4Ijo2Ny43NTMxMjQyMzcwNjA1NSwieSI6OTg5LjE5OTk5Njk0ODI0MjJ9LHsieCI6MjkuOTM2NzA2NTQyOTY4NzUsInkiOjk4OS4xOTk5OTY5NDgyNDIyfSx7IngiOjI5LjkzNjcwNjU0Mjk2ODc1LCJ5Ijo5MzkuMTk5OTk2OTQ4MjQyMn0seyJ4IjoyOS45MzY3MDY1NDI5Njg3NSwieSI6ODM5LjE5OTk5Njk0ODI0MjJ9LHsieCI6MjkuOTM2NzA2NTQyOTY4NzUsInkiOjczMy41OTk5OTg0NzQxMjExfSx7IngiOjI5LjkzNjcwNjU0Mjk2ODc1LCJ5Ijo2Mjh9LHsieCI6MjkuOTM2NzA2NTQyOTY4NzUsInkiOjUyOH0seyJ4IjoyOS45MzY3MDY1NDI5Njg3NSwieSI6NDI4fSx7IngiOjI5LjkzNjcwNjU0Mjk2ODc1LCJ5IjozMjh9LHsieCI6MjkuOTM2NzA2NTQyOTY4NzUsInkiOjIyOH0seyJ4IjoyOS45MzY3MDY1NDI5Njg3NSwieSI6MTQ1fSx7IngiOjI5LjkzNjcwNjU0Mjk2ODc1LCJ5Ijo5Mn0seyJ4Ijo4MzAuMTM4OTk0ODUyNzAxNywieSI6OTJ9LHsieCI6ODMwLjEzODk5NDg1MjcwMTcsInkiOjc4fV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M875.4268175760903%2C72L875.4268175760903%2C105.21704397470535Q875.4268175760903%2C107%20874.3410311384634%2C108.41421356237309L874.3410311384634%2C108.41421356237309Q873.2552447008366%2C109.82842712474618%20871.8410311384634%2C110.91421356237308L871.8410311384634%2C110.91421356237309Q870.4268175760903%2C112%20868.6438615507957%2C112L690.6733623159846%2C112Q688.89040629069%2C112%20687.4761927283168%2C113.08578643762691L687.4761927283168%2C113.08578643762692Q686.0619791659437%2C114.17157287525382%20684.9761927283168%2C115.58578643762691L684.9761927283168%2C115.58578643762691Q683.89040629069%2C117%20683.89040629069%2C118.78295602529465L683.89040629069%2C228L683.89040629069%2C286%22%20id%3D%22L_F_G_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_F_G_0%22%20data-points%3D%22W3sieCI6ODc1LjQyNjgxNzU3NjA5MDMsInkiOjcyfSx7IngiOjg3NS40MjY4MTc1NzYwOTAzLCJ5IjoxMTJ9LHsieCI6NjgzLjg5MDQwNjI5MDY5LCJ5IjoxMTJ9LHsieCI6NjgzLjg5MDQwNjI5MDY5LCJ5IjoyMjh9LHsieCI6NjgzLjg5MDQwNjI5MDY5LCJ5IjoyOTB9XQ%3D%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M920.714640299479%2C72L920.714640299479%2C186%22%20id%3D%22L_F_H_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_F_H_0%22%20data-points%3D%22W3sieCI6OTIwLjcxNDY0MDI5OTQ3OSwieSI6NzJ9LHsieCI6OTIwLjcxNDY0MDI5OTQ3OSwieSI6MTkwfV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M920.714640299479%2C258L920.714640299479%2C286%22%20id%3D%22L_H_I_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_H_I_0%22%20data-points%3D%22W3sieCI6OTIwLjcxNDY0MDI5OTQ3OSwieSI6MjU4fSx7IngiOjkyMC43MTQ2NDAyOTk0NzksInkiOjI5MH1d%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M683.89040629069%2C358L683.89040629069%2C371.21704397470535Q683.89040629069%2C373%20684.9761927283168%2C374.4142135623731L684.9761927283168%2C374.4142135623731Q686.0619791659437%2C375.8284271247462%20687.4761927283168%2C376.9142135623731L687.4761927283168%2C376.9142135623731Q688.89040629069%2C378%20690.6733623159846%2C378L838.4614592579084%2C378Q840.244415283203%2C378%20841.6586288455761%2C379.0857864376269L841.6586288455761%2C379.0857864376269Q843.0728424079492%2C380.1715728752538%20844.1586288455761%2C381.5857864376269L844.1586288455761%2C381.5857864376269Q845.244415283203%2C383%20845.244415283203%2C384.78295602529465L845.244415283203%2C388%22%20id%3D%22L_G_J_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_G_J_0%22%20data-points%3D%22W3sieCI6NjgzLjg5MDQwNjI5MDY5LCJ5IjozNTh9LHsieCI6NjgzLjg5MDQwNjI5MDY5LCJ5IjozNzh9LHsieCI6ODQ1LjI0NDQxNTI4MzIwMywieSI6Mzc4fSx7IngiOjg0NS4yNDQ0MTUyODMyMDMsInkiOjM5Mn1d%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M920.714640299479%2C358L920.714640299479%2C386%22%20id%3D%22L_I_J_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_I_J_0%22%20data-points%3D%22W3sieCI6OTIwLjcxNDY0MDI5OTQ3OSwieSI6MzU4fSx7IngiOjkyMC43MTQ2NDAyOTk0NzksInkiOjM5MH1d%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M882.9795277913411%2C458L882.9795277913411%2C486%22%20id%3D%22L_J_K_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_J_K_0%22%20data-points%3D%22W3sieCI6ODgyLjk3OTUyNzc5MTM0MTEsInkiOjQ1OH0seyJ4Ijo4ODIuOTc5NTI3NzkxMzQxMSwieSI6NDkwfV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M882.9795277913411%2C558L882.9795277913411%2C586%22%20id%3D%22L_K_L_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_K_L_0%22%20data-points%3D%22W3sieCI6ODgyLjk3OTUyNzc5MTM0MTEsInkiOjU1OH0seyJ4Ijo4ODIuOTc5NTI3NzkxMzQxMSwieSI6NTkwfV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M882.9795277913411%2C658L882.9795277913411%2C686%22%20id%3D%22L_L_M_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_L_M_0%22%20data-points%3D%22W3sieCI6ODgyLjk3OTUyNzc5MTM0MTEsInkiOjY1OH0seyJ4Ijo4ODIuOTc5NTI3NzkxMzQxMSwieSI6NjkwfV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M847.0875956217448%2C769.1999969482422L847.0875956217448%2C782.4170409229475Q847.0875956217448%2C784.1999969482422%20846.0018091841179%2C785.6142105106153L846.0018091841179%2C785.6142105106153Q844.916022746491%2C787.0284240729884%20843.5018091841179%2C788.1142105106153L843.5018091841179%2C788.1142105106153Q842.0875956217448%2C789.1999969482422%20840.3046395964501%2C789.1999969482422L636.7919129344743%2C789.1999969482422Q635.0089569091797%2C789.1999969482422%20633.5947433468066%2C790.2857833858691L633.5947433468066%2C790.2857833858691Q632.1805297844335%2C791.371569823496%20631.0947433468066%2C792.7857833858691L631.0947433468066%2C792.7857833858691Q630.0089569091797%2C794.1999969482422%20630.0089569091797%2C795.9829529735368L630.0089569091797%2C897.1999969482422%22%20id%3D%22L_M_N_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_M_N_0%22%20data-points%3D%22W3sieCI6ODQ3LjA4NzU5NTYyMTc0NDgsInkiOjc2OS4xOTk5OTY5NDgyNDIyfSx7IngiOjg0Ny4wODc1OTU2MjE3NDQ4LCJ5Ijo3ODkuMTk5OTk2OTQ4MjQyMn0seyJ4Ijo2MzAuMDA4OTU2OTA5MTc5NywieSI6Nzg5LjE5OTk5Njk0ODI0MjJ9LHsieCI6NjMwLjAwODk1NjkwOTE3OTcsInkiOjkwMS4xOTk5OTY5NDgyNDIyfV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M630.0089569091797%2C969.1999969482422L630.0089569091797%2C982.4170409229475Q630.0089569091797%2C984.1999969482422%20628.9231704715528%2C985.6142105106153L628.9231704715528%2C985.6142105106153Q627.8373840339259%2C987.0284240729884%20626.4231704715528%2C988.1142105106153L626.4231704715528%2C988.1142105106153Q625.0089569091797%2C989.1999969482422%20623.226000883885%2C989.1999969482422L186.0423287364763%2C989.1999969482422Q184.25937271118164%2C989.1999969482422%20182.84515914880853%2C990.2857833858691L182.84515914880853%2C990.2857833858691Q181.43094558643546%2C991.371569823496%20180.34515914880856%2C992.7857833858691L180.34515914880853%2C992.7857833858691Q179.25937271118164%2C994.1999969482422%20179.25937271118164%2C995.9829529735368L179.25937271118164%2C999.1999969482422%22%20id%3D%22L_N_E_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_N_E_0%22%20data-points%3D%22W3sieCI6NjMwLjAwODk1NjkwOTE3OTcsInkiOjk2OS4xOTk5OTY5NDgyNDIyfSx7IngiOjYzMC4wMDg5NTY5MDkxNzk3LCJ5Ijo5ODkuMTk5OTk2OTQ4MjQyMn0seyJ4IjoxNzkuMjU5MzcyNzExMTgxNjQsInkiOjk4OS4xOTk5OTY5NDgyNDIyfSx7IngiOjE3OS4yNTkzNzI3MTExODE2NCwieSI6MTAwMy4xOTk5OTY5NDgyNDIyfV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M918.8714599609375%2C769.1999969482422L918.8714599609375%2C897.1999969482422%22%20id%3D%22L_M_O_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_M_O_0%22%20data-points%3D%22W3sieCI6OTE4Ljg3MTQ1OTk2MDkzNzUsInkiOjc2OS4xOTk5OTY5NDgyNDIyfSx7IngiOjkxOC44NzE0NTk5NjA5Mzc1LCJ5Ijo5MDEuMTk5OTk2OTQ4MjQyMn1d%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M918.8714599609375%2C969.1999969482422L918.8714599609375%2C997.1999969482422%22%20id%3D%22L_O_P_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_O_P_0%22%20data-points%3D%22W3sieCI6OTE4Ljg3MTQ1OTk2MDkzNzUsInkiOjk2OS4xOTk5OTY5NDgyNDIyfSx7IngiOjkxOC44NzE0NTk5NjA5Mzc1LCJ5IjoxMDAxLjE5OTk5Njk0ODI0MjJ9XQ%3D%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M876.8694203694662%2C1069.1999969482422L876.8694203694661%2C1082.1289291363767Q876.8694203694661%2C1089.1999969482422%20869.7983525576005%2C1089.1999969482422L723.2920604361019%2C1089.1999969482422Q721.5091044108073%2C1089.1999969482422%20720.0948908484341%2C1090.285783385869L720.0948908484341%2C1090.285783385869Q718.680677286061%2C1091.371569823496%20717.5948908484341%2C1092.785783385869L717.5948908484341%2C1092.785783385869Q716.5091044108073%2C1094.1999969482422%20716.5091044108073%2C1095.9829529735368L716.5091044108073%2C1197.1999969482422%22%20id%3D%22L_P_Q_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_P_Q_0%22%20data-points%3D%22W3sieCI6ODc2Ljg2OTQyMDM2OTQ2NjIsInkiOjEwNjkuMTk5OTk2OTQ4MjQyMn0seyJ4Ijo4NzYuODY5NDIwMzY5NDY2MSwieSI6MTA4OS4xOTk5OTY5NDgyNDIyfSx7IngiOjcxNi41MDkxMDQ0MTA4MDczLCJ5IjoxMDg5LjE5OTk5Njk0ODI0MjJ9LHsieCI6NzE2LjUwOTEwNDQxMDgwNzMsInkiOjEyMDEuMTk5OTk2OTQ4MjQyMn1d%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M960.8734995524088%2C1069.1999969482422L960.8734995524088%2C1197.1999969482422%22%20id%3D%22L_P_R_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_P_R_0%22%20data-points%3D%22W3sieCI6OTYwLjg3MzQ5OTU1MjQwODgsInkiOjEwNjkuMTk5OTk2OTQ4MjQyMn0seyJ4Ijo5NjAuODczNDk5NTUyNDA4OCwieSI6MTIwMS4xOTk5OTY5NDgyNDIyfV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M960.8734995524088%2C1280.3999938964844L960.8734995524088%2C1308.3999938964844%22%20id%3D%22L_R_S_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_R_S_0%22%20data-points%3D%22W3sieCI6OTYwLjg3MzQ5OTU1MjQwODgsInkiOjEyODAuMzk5OTkzODk2NDg0NH0seyJ4Ijo5NjAuODczNDk5NTUyNDA4OCwieSI6MTMxMi4zOTk5OTM4OTY0ODQ0fV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M960.8734995524088%2C1391.5999908447266L960.8734995524088%2C1419.5999908447266%22%20id%3D%22L_S_T_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_S_T_0%22%20data-points%3D%22W3sieCI6OTYwLjg3MzQ5OTU1MjQwODgsInkiOjEzOTEuNTk5OTkwODQ0NzI2Nn0seyJ4Ijo5NjAuODczNDk5NTUyNDA4OCwieSI6MTQyMy41OTk5OTA4NDQ3MjY2fV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M347.83612060546875%2C869.1999969482422L347.83612060546875%2C897.1999969482422%22%20id%3D%22L_C_U_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_C_U_0%22%20data-points%3D%22W3sieCI6MzQ3LjgzNjEyMDYwNTQ2ODc1LCJ5Ijo4NjkuMTk5OTk2OTQ4MjQyMn0seyJ4IjozNDcuODM2MTIwNjA1NDY4NzUsInkiOjkwMS4xOTk5OTY5NDgyNDIyfV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M347.83612060546875%2C969.1999969482422L347.8361206054687%2C1097.1999969482422%22%20id%3D%22L_U_V_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_U_V_0%22%20data-points%3D%22W3sieCI6MzQ3LjgzNjEyMDYwNTQ2ODc1LCJ5Ijo5NjkuMTk5OTk2OTQ4MjQyMn0seyJ4IjozNDcuODM2MTIwNjA1NDY4NywieSI6MTEwMS4xOTk5OTY5NDgyNDIyfV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M315.15070343017584%2C1169.1999969482422L315.1507034301758%2C1182.1289291363767Q315.1507034301757%2C1189.1999969482422%20308.07963561831025%2C1189.1999969482422L166.30994882314621%2C1189.1999969482422Q164.52699279785156%2C1189.1999969482422%20163.11277923547846%2C1190.285783385869L163.11277923547846%2C1190.285783385869Q161.69856567310538%2C1191.371569823496%20160.61277923547848%2C1192.785783385869L160.61277923547846%2C1192.785783385869Q159.52699279785156%2C1194.1999969482422%20159.52699279785156%2C1195.9829529735368L159.52699279785156%2C1199.1999969482422%22%20id%3D%22L_V_W_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_V_W_0%22%20data-points%3D%22W3sieCI6MzE1LjE1MDcwMzQzMDE3NTg0LCJ5IjoxMTY5LjE5OTk5Njk0ODI0MjJ9LHsieCI6MzE1LjE1MDcwMzQzMDE3NTcsInkiOjExODkuMTk5OTk2OTQ4MjQyMn0seyJ4IjoxNTkuNTI2OTkyNzk3ODUxNTYsInkiOjExODkuMTk5OTk2OTQ4MjQyMn0seyJ4IjoxNTkuNTI2OTkyNzk3ODUxNTYsInkiOjEyMDMuMTk5OTk2OTQ4MjQyMn1d%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M380.52153778076155%2C1169.1999969482422L380.52153778076166%2C1202.7999954223633%22%20id%3D%22L_V_X_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_V_X_0%22%20data-points%3D%22W3sieCI6MzgwLjUyMTUzNzc4MDc2MTU1LCJ5IjoxMTY5LjE5OTk5Njk0ODI0MjJ9LHsieCI6MzgwLjUyMTUzNzc4MDc2MTY2LCJ5IjoxMjA2Ljc5OTk5NTQyMjM2MzN9XQ%3D%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M380.52153778076166%2C1274.7999954223633L380.52153778076166%2C1313.9999923706055%22%20id%3D%22L_X_Y_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_X_Y_0%22%20data-points%3D%22W3sieCI6MzgwLjUyMTUzNzc4MDc2MTY2LCJ5IjoxMjc0Ljc5OTk5NTQyMjM2MzN9LHsieCI6MzgwLjUyMTUzNzc4MDc2MTY2LCJ5IjoxMzE3Ljk5OTk5MjM3MDYwNTV9XQ%3D%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M380.52153778076166%2C1385.9999923706055L380.52153778076166%2C1419.5999908447266%22%20id%3D%22L_Y_Z_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_Y_Z_0%22%20data-points%3D%22W3sieCI6MzgwLjUyMTUzNzc4MDc2MTY2LCJ5IjoxMzg1Ljk5OTk5MjM3MDYwNTV9LHsieCI6MzgwLjUyMTUzNzc4MDc2MTY2LCJ5IjoxNDIzLjU5OTk5MDg0NDcyNjZ9XQ%3D%3D%22%20marker-end%3D%22url\(%23mermaid-_r_j9__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabels%22%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_A_B_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_B_C_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_C_D_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_D_E_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_E_F_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%20transform%3D%22translate\(683.552904764811%2C%20145\)%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_F_G_0%22%20transform%3D%22translate\(-33.162498474121094%2C-7.40000057220459\)%22%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22%22%20x%3D%22-12%22%20y%3D%22-5.599999785423279%22%20width%3D%2290.32499694824219%22%20height%3D%2226%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ETanpa%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20akun%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%20transform%3D%22translate\(920.5833918253579%2C%20145\)%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_F_H_0%22%20transform%3D%22translate\(-33.868751525878906%2C-7.40000057220459\)%22%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22%22%20x%3D%22-12%22%20y%3D%22-5.599999785423279%22%20width%3D%2291.73750305175781%22%20height%3D%2226%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EPunya%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20akun%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_H_I_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_G_J_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_I_J_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_J_K_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_K_L_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_L_M_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%20transform%3D%22translate\(629.5427207946777%2C%20839.1999969482422\)%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_M_N_0%22%20transform%3D%22translate\(-16.033763885498047%2C-7.40000057220459\)%22%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22%22%20x%3D%22-12%22%20y%3D%22-5.599999785423279%22%20width%3D%2256.06753158569336%22%20height%3D%2226%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ETidak%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_N_E_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%20transform%3D%22translate\(918.727710723877%2C%20839.1999969482422\)%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_M_O_0%22%20transform%3D%22translate\(-6.05625057220459%2C-7.40000057220459\)%22%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22%22%20x%3D%22-12.800000011920929%22%20y%3D%22-5.599999785423279%22%20width%3D%2237.71250057220459%22%20height%3D%2226%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EYa%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_O_P_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%20transform%3D%22translate\(716.0428682963053%2C%201139.1999969482422\)%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_P_Q_0%22%20transform%3D%22translate\(-16.033763885498047%2C-7.40000057220459\)%22%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22%22%20x%3D%22-12%22%20y%3D%22-5.599999785423279%22%20width%3D%2256.06753158569336%22%20height%3D%2226%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ETidak%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%20transform%3D%22translate\(960.7297503153483%2C%201139.1999969482422\)%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_P_R_0%22%20transform%3D%22translate\(-6.05625057220459%2C-7.40000057220459\)%22%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22%22%20x%3D%22-12.800000011920929%22%20y%3D%22-5.599999785423279%22%20width%3D%2237.71250057220459%22%20height%3D%2226%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EYa%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_R_S_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_S_T_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_C_U_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%20transform%3D%22translate\(347.69237136840815%2C%201039.1999969482422\)%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_U_V_0%22%20transform%3D%22translate\(-6.05625057220459%2C-7.40000057220459\)%22%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22%22%20x%3D%22-12.800000011920929%22%20y%3D%22-5.599999785423279%22%20width%3D%2237.71250057220459%22%20height%3D%2226%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EYa%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_V_W_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_V_X_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_X_Y_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_Y_Z_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E)

## Flow 1 — Pengunjung atau guest

1. Pengunjung membuka halaman utama dan melihat daftar event yang sudah dipublikasikan.

2. Pengunjung memilih event dan membaca tanggal, lokasi, deskripsi, periode pendaftaran, serta ketersediaan kuota.

3. Pengunjung menekan tombol Daftar Sekarang, lalu mengisi nama, email, nomor telepon, dan institusi jika ada.

4. React melakukan validasi awal, lalu mengirim request ke REST API Golang.

5. Backend memvalidasi event, email duplikat, periode pendaftaran, dan kuota melalui transaksi database.

6. Jika berhasil, sistem menyimpan data dengan status `pending` dan menampilkan nomor pendaftaran.

7. Guest dapat menyimpan nomor tersebut untuk referensi. Untuk mengecek status melalui dashboard, guest perlu memiliki akun dan melakukan proses pengaitan pendaftaran yang aman.

## Flow 2 — Peserta yang memiliki akun

1. Peserta melakukan registrasi akun atau login.

2. Server memvalidasi kredensial dan memberikan cookie session yang aman.

3. Peserta membuka dashboard dan melihat daftar pendaftaran yang terhubung ke akunnya.

4. Peserta memilih event, mengisi formulir, lalu mengirim pendaftaran.

5. Backend menyimpan `user_id` dari session terverifikasi, bukan dari nilai `user_id` kiriman browser.

6. Peserta dapat melihat status `pending`, `confirmed`, atau `rejected` beserta alasan penolakan jika ada.

## Flow 3 — Admin

1. Admin login menggunakan akun yang role-nya sudah ditetapkan sebagai `admin` oleh proses administratif yang aman.

2. Admin membuka dashboard berisi total event, total pendaftar, pendaftaran pending, confirmed, dan rejected.

3. Admin membuat event, mengedit detail, menentukan kuota, dan mengatur jadwal pendaftaran.

4. Admin menerbitkan event agar dapat dilihat publik.

5. Admin membuka daftar pendaftaran, mencari nama peserta, memfilter status, dan melihat detail pendaftaran.

6. Admin mengonfirmasi atau menolak pendaftaran. Status terbaru tersimpan di MySQL dan tampil pada dashboard peserta jika pendaftaran terkait akun.

# 6. Flow halaman frontend React

Gue mau struktur UI-nya dibuat jelas supaya AI atau developer yang mengerjakan nggak salah memahami halaman yang harus dibuat.

![Perimeter Institute - Events cards by ImageX on Dribbble](https://images.openai.com/static-rsc-4/fZNMC2kD0gVll-bWnOBPVJ4pR5uruAcKaQnH1o0opv2So6VaTj30kRu7G-NIac6ahXxBlNZyoRGI7xJlRv_dnWL1dvQ6BN0jl3NRi69Q-xgcaCEcrUxvMOymCciqaCBYX4GO_MQVlZOSrYJgUwBWD2a6JoryONvvL46vaSMRryU?purpose=inline)

Tambahkan ke Favorit

A. Halaman publik

Route: `/`, `/events`, `/events/:slug`

* Navbar dengan logo DaftarIn.

* Hero section dengan tombol jelajahi event.

* Daftar event dalam kartu.

* Filter dan pencarian event.

* Detail tanggal, lokasi, dan sisa kuota.

* Tombol daftar yang mengikuti status event.

![Building a Dynamic Registration Form with React, Tailwind CSS, and React Hook Form | by R-Dev | Medium](https://images.openai.com/static-rsc-4/C3yCg3Kz5R11teGBgKrTP6gHWVqE-Qad2d5VLWR1L7Q3sf362CwZoinAQl2YfQBceC-ooIKvCYgBp9OuaaPqVS7uRL6fczMX1tzcIwpLr5k7S-Met9GX-ojBeysihoBFQvq9iep0oc_iJepI0zU0Dva161XEyZTxjDjUEY05s5A?purpose=inline)

Tambahkan ke Favorit

B. Form pendaftaran

Route: `/events/:slug/register`

* Informasi event di bagian atas.

* Form data peserta dengan validasi.

* Persetujuan ketentuan pendaftaran.

* Loading state ketika mengirim.

* Halaman sukses berisi nomor pendaftaran.

* Pesan error jika kuota penuh atau email duplikat.

![Evento - Events Management Dashboard :: Behance](https://images.openai.com/static-rsc-4/EBgxhSSdPqvrbosv9-SPjt66xIsXaIr7FPD988vsXU6nWVX-iacANvsOP5yOGgPMOO6O0xiPyg03JLM8aKtQrC34ZFPaeU-4cy16Zw6v03O77k8LYjv0Wo43vUWgSlsDZsXuX5BEsVQSRySAV3h8c8UIfhh5gyHIAT47FAtAWdQ?purpose=inline)

Tambahkan ke Favorit

C. Dashboard admin

Route: `/admin/dashboard`

* Sidebar navigasi.

* Ringkasan statistik.

* Manajemen event.

* Tabel pendaftaran peserta.

* Filter tanggal dan status.

* Detail peserta dan aksi verifikasi.

![Event List by Dinesh Danny on Dribbble](https://images.openai.com/static-rsc-4/PeGdODcsvsrQSIHJnYGClbeYUhipXTUCGZV36f2nOgHNoHrBYgubMlk4THOX3JS5B8r-vATXIuU6esCauT58Ip_hViGrLnSjEHCi7JvHAXE3-zSBq4lROC3NCkHU3kDy6X_v-65oB85dafa2czZlEoGaBJ5_UQwwS1uWTfE1qlI?purpose=inline)

Tambahkan ke Favorit

D. Dashboard peserta

Route: `/participant/dashboard`, `/participant/registrations`

* Ringkasan pendaftaran milik sendiri.

* Tabel atau kartu event yang diikuti.

* Status pendaftaran.

* Detail dan nomor registrasi.

* Profil akun dan logout.

## Navigasi utama

```
DaftarIn
├── Public
│   ├── Beranda
│   ├── Daftar Event
│   ├── Detail Event
│   ├── Form Pendaftaran
│   ├── Hasil Pendaftaran
│   ├── Login
│   └── Register
│
├── Participant
│   ├── Dashboard
│   ├── Pendaftaran Saya
│   ├── Detail Pendaftaran
│   └── Profil
│
└── Admin
    ├── Dashboard
    ├── Manajemen Event
    │   ├── Daftar Event
    │   ├── Buat Event
    │   └── Edit Event
    ├── Manajemen Pendaftaran
    │   ├── Daftar Peserta
    │   └── Detail Peserta
    └── Pengaturan Akun
```

Semua halaman perlu memiliki loading state, empty state, error state, notifikasi keberhasilan, dan desain responsif untuk HP maupun desktop.

# 7. Arsitektur backend Golang

Jangan membuat semua proses di satu file `main.go`, bre. Kita pisahkan tanggung jawab supaya lebih mudah dirawat.

Opsi diagram

![](data\:image/svg+xml;utf8,%3Csvg%20id%3D%22mermaid-_r_ja_%22%20width%3D%22709.472900390625%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20class%3D%22flowchart%22%20height%3D%22929.5736694335938%22%20viewBox%3D%224%204%20709.472900390625%20929.5736694335938%22%20role%3D%22graphics-document%20document%22%20aria-roledescription%3D%22flowchart-v2%22%3E%3Cstyle%3E%23mermaid-_r_ja_%7Bfont-family%3A%22-apple-system%22%2C%22BlinkMacSystemFont%22%2C%22Segoe%20UI%22%2C%22Roboto%22%2C%22Oxygen%22%2C%22Ubuntu%22%2C%22Cantarell%22%2C%22Helvetica%20Neue%22%2C%22Arial%22%2C%22sans-serif%22%3Bfont-size%3A14px%3Bfill%3Argb\(255%2C%20255%2C%20255\)%3B%7D%40keyframes%20edge-animation-frame%7Bfrom%7Bstroke-dashoffset%3A0%3B%7D%7D%40keyframes%20dash%7Bto%7Bstroke-dashoffset%3A0%3B%7D%7D%23mermaid-_r_ja_%20.edge-animation-slow%7Bstroke-dasharray%3A9%2C5!important%3Bstroke-dashoffset%3A900%3Banimation%3Adash%2050s%20linear%20infinite%3Bstroke-linecap%3Around%3B%7D%23mermaid-_r_ja_%20.edge-animation-fast%7Bstroke-dasharray%3A9%2C5!important%3Bstroke-dashoffset%3A900%3Banimation%3Adash%2020s%20linear%20infinite%3Bstroke-linecap%3Around%3B%7D%23mermaid-_r_ja_%20.error-icon%7Bfill%3Argb\(33%2C%2033%2C%2033\)%3B%7D%23mermaid-_r_ja_%20.error-text%7Bfill%3Argb\(255%2C%20255%2C%20255\)%3Bstroke%3Argb\(255%2C%20255%2C%20255\)%3B%7D%23mermaid-_r_ja_%20.edge-thickness-normal%7Bstroke-width%3A1px%3B%7D%23mermaid-_r_ja_%20.edge-thickness-thick%7Bstroke-width%3A3.5px%3B%7D%23mermaid-_r_ja_%20.edge-pattern-solid%7Bstroke-dasharray%3A0%3B%7D%23mermaid-_r_ja_%20.edge-thickness-invisible%7Bstroke-width%3A0%3Bfill%3Anone%3B%7D%23mermaid-_r_ja_%20.edge-pattern-dashed%7Bstroke-dasharray%3A3%3B%7D%23mermaid-_r_ja_%20.edge-pattern-dotted%7Bstroke-dasharray%3A2%3B%7D%23mermaid-_r_ja_%20.marker%7Bfill%3Argb\(205%2C%20205%2C%20205\)%3Bstroke%3Argb\(205%2C%20205%2C%20205\)%3B%7D%23mermaid-_r_ja_%20.marker.cross%7Bstroke%3Argb\(205%2C%20205%2C%20205\)%3B%7D%23mermaid-_r_ja_%20svg%7Bfont-family%3A%22-apple-system%22%2C%22BlinkMacSystemFont%22%2C%22Segoe%20UI%22%2C%22Roboto%22%2C%22Oxygen%22%2C%22Ubuntu%22%2C%22Cantarell%22%2C%22Helvetica%20Neue%22%2C%22Arial%22%2C%22sans-serif%22%3Bfont-size%3A14px%3B%7D%23mermaid-_r_ja_%20p%7Bmargin%3A0%3B%7D%23mermaid-_r_ja_%20.label%7Bfont-family%3A%22-apple-system%22%2C%22BlinkMacSystemFont%22%2C%22Segoe%20UI%22%2C%22Roboto%22%2C%22Oxygen%22%2C%22Ubuntu%22%2C%22Cantarell%22%2C%22Helvetica%20Neue%22%2C%22Arial%22%2C%22sans-serif%22%3Bcolor%3Argb\(255%2C%20255%2C%20255\)%3B%7D%23mermaid-_r_ja_%20.cluster-label%20text%7Bfill%3Argb\(255%2C%20255%2C%20255\)%3B%7D%23mermaid-_r_ja_%20.cluster-label%20span%7Bcolor%3Argb\(255%2C%20255%2C%20255\)%3B%7D%23mermaid-_r_ja_%20.cluster-label%20span%20p%7Bbackground-color%3Atransparent%3B%7D%23mermaid-_r_ja_%20.label%20text%2C%23mermaid-_r_ja_%20span%7Bfill%3Argb\(255%2C%20255%2C%20255\)%3Bcolor%3Argb\(255%2C%20255%2C%20255\)%3B%7D%23mermaid-_r_ja_%20.node%20rect%2C%23mermaid-_r_ja_%20.node%20circle%2C%23mermaid-_r_ja_%20.node%20ellipse%2C%23mermaid-_r_ja_%20.node%20polygon%2C%23mermaid-_r_ja_%20.node%20path%7Bfill%3Argb\(9%2C%2023%2C%2044\)%3Bstroke%3Argb\(31%2C%2078%2C%20148\)%3Bstroke-width%3A1px%3B%7D%23mermaid-_r_ja_%20.rough-node%20.label%20text%2C%23mermaid-_r_ja_%20.node%20.label%20text%2C%23mermaid-_r_ja_%20.image-shape%20.label%2C%23mermaid-_r_ja_%20.icon-shape%20.label%7Btext-anchor%3Amiddle%3B%7D%23mermaid-_r_ja_%20.node%20.katex%20path%7Bfill%3A%23000%3Bstroke%3A%23000%3Bstroke-width%3A1px%3B%7D%23mermaid-_r_ja_%20.rough-node%20.label%2C%23mermaid-_r_ja_%20.node%20.label%2C%23mermaid-_r_ja_%20.image-shape%20.label%2C%23mermaid-_r_ja_%20.icon-shape%20.label%7Btext-align%3Acenter%3B%7D%23mermaid-_r_ja_%20.node.clickable%7Bcursor%3Apointer%3B%7D%23mermaid-_r_ja_%20.root%20.anchor%20path%7Bfill%3Argb\(205%2C%20205%2C%20205\)!important%3Bstroke-width%3A0%3Bstroke%3Argb\(205%2C%20205%2C%20205\)%3B%7D%23mermaid-_r_ja_%20.arrowheadPath%7Bfill%3Argb\(205%2C%20205%2C%20205\)%3B%7D%23mermaid-_r_ja_%20.edgePath%20.path%7Bstroke%3Argb\(205%2C%20205%2C%20205\)%3Bstroke-width%3A2.0px%3B%7D%23mermaid-_r_ja_%20.flowchart-link%7Bstroke%3Argb\(205%2C%20205%2C%20205\)%3Bfill%3Anone%3B%7D%23mermaid-_r_ja_%20.edgeLabel%7Bbackground-color%3Argb\(0%2C%200%2C%200\)%3Btext-align%3Acenter%3B%7D%23mermaid-_r_ja_%20.edgeLabel%20p%7Bbackground-color%3Argb\(0%2C%200%2C%200\)%3B%7D%23mermaid-_r_ja_%20.edgeLabel%20rect%7Bopacity%3A0.5%3Bbackground-color%3Argb\(0%2C%200%2C%200\)%3Bfill%3Argb\(0%2C%200%2C%200\)%3B%7D%23mermaid-_r_ja_%20.labelBkg%7Bbackground-color%3Argba\(0%2C%200%2C%200%2C%200.5\)%3B%7D%23mermaid-_r_ja_%20.cluster%20rect%7Bfill%3Argb\(33%2C%2033%2C%2033\)%3Bstroke%3Argba\(255%2C%20255%2C%20255%2C%200.05\)%3Bstroke-width%3A1px%3B%7D%23mermaid-_r_ja_%20.cluster%20text%7Bfill%3Argb\(255%2C%20255%2C%20255\)%3B%7D%23mermaid-_r_ja_%20.cluster%20span%7Bcolor%3Argb\(255%2C%20255%2C%20255\)%3B%7D%23mermaid-_r_ja_%20div.mermaidTooltip%7Bposition%3Aabsolute%3Btext-align%3Acenter%3Bmax-width%3A200px%3Bpadding%3A2px%3Bfont-family%3A%22-apple-system%22%2C%22BlinkMacSystemFont%22%2C%22Segoe%20UI%22%2C%22Roboto%22%2C%22Oxygen%22%2C%22Ubuntu%22%2C%22Cantarell%22%2C%22Helvetica%20Neue%22%2C%22Arial%22%2C%22sans-serif%22%3Bfont-size%3A12px%3Bbackground%3Argb\(33%2C%2033%2C%2033\)%3Bborder%3A1px%20solid%20rgba\(255%2C%20255%2C%20255%2C%200.05\)%3Bborder-radius%3A2px%3Bpointer-events%3Anone%3Bz-index%3A100%3B%7D%23mermaid-_r_ja_%20.flowchartTitleText%7Btext-anchor%3Amiddle%3Bfont-size%3A18px%3Bfill%3Argb\(255%2C%20255%2C%20255\)%3B%7D%23mermaid-_r_ja_%20rect.text%7Bfill%3Anone%3Bstroke-width%3A0%3B%7D%23mermaid-_r_ja_%20.icon-shape%2C%23mermaid-_r_ja_%20.image-shape%7Bbackground-color%3Argb\(0%2C%200%2C%200\)%3Btext-align%3Acenter%3B%7D%23mermaid-_r_ja_%20.icon-shape%20p%2C%23mermaid-_r_ja_%20.image-shape%20p%7Bbackground-color%3Argb\(0%2C%200%2C%200\)%3Bpadding%3A2px%3B%7D%23mermaid-_r_ja_%20.icon-shape%20rect%2C%23mermaid-_r_ja_%20.image-shape%20rect%7Bopacity%3A0.5%3Bbackground-color%3Argb\(0%2C%200%2C%200\)%3Bfill%3Argb\(0%2C%200%2C%200\)%3B%7D%23mermaid-_r_ja_%20.label-icon%7Bdisplay%3Ainline-block%3Bheight%3A1em%3Boverflow%3Avisible%3Bvertical-align%3A-0.125em%3B%7D%23mermaid-_r_ja_%20.node%20.label-icon%20path%7Bfill%3AcurrentColor%3Bstroke%3Arevert%3Bstroke-width%3Arevert%3B%7D%23mermaid-_r_ja_%20.node%20text%7Bfont-size%3A16px%3Bfont-weight%3A600%3Bletter-spacing%3A-0.32px%3Bfill%3A%2399ceff%3B%7D%23mermaid-_r_ja_%20.edgeLabels%20text%7Bfont-size%3A13px%3Bfont-weight%3A600%3Bletter-spacing%3A-0.08px%3Bfill%3A%2399ceff%3B%7D%23mermaid-_r_ja_%20.node%20tspan%5Bfont-weight%3D%22normal%22%5D%2C%23mermaid-_r_ja_%20.edgeLabels%20tspan%5Bfont-weight%3D%22normal%22%5D%7Bfont-weight%3A600%3B%7D%23mermaid-_r_ja_%20.edgeLabel%20.label%20rect%7Bopacity%3A1%3Brx%3A13px%3Bry%3A13px%3Bfill%3A%23000e1a%3Bstroke%3Argb\(26%2C%2062%2C%2095\)%3Bstroke-width%3A1px%3B%7D%23mermaid-_r_ja_%20.node%20rect%2C%23mermaid-_r_ja_%20.node%20circle%2C%23mermaid-_r_ja_%20.node%20ellipse%2C%23mermaid-_r_ja_%20.node%20polygon%2C%23mermaid-_r_ja_%20.node%20path%7Bfill%3Argb\(0%2C%2040%2C%2077\)%3Bstroke%3Argba\(255%2C%20255%2C%20255%2C%200.1\)%3Bstroke-width%3A1px%3B%7D%23mermaid-_r_ja_%20.node%20rect%7Brx%3A16px%3Bry%3A16px%3B%7D%23mermaid-_r_ja_%20.node.mermaid-decision%20.label-container%7Bfill%3A%23000e1a%3Bstroke%3Argb\(26%2C%2062%2C%2095\)%3Bstroke-dasharray%3A2%202%3B%7D%23mermaid-_r_ja_%20.edgePaths%20.flowchart-link%7Bstroke%3Argb\(26%2C%2062%2C%2095\)%3Bstroke-width%3A1px%3Bstroke-linecap%3Around%3Bstroke-linejoin%3Around%3B%7D%23mermaid-_r_ja_%20.marker%7Bfill%3Argb\(26%2C%2062%2C%2095\)%3Bstroke%3Argb\(26%2C%2062%2C%2095\)%3B%7D%23mermaid-_r_ja_%20.node%7Bcolor-scheme%3Adark%3B%7D%23mermaid-_r_ja_%20%3Aroot%7B--mermaid-font-family%3A%22-apple-system%22%2C%22BlinkMacSystemFont%22%2C%22Segoe%20UI%22%2C%22Roboto%22%2C%22Oxygen%22%2C%22Ubuntu%22%2C%22Cantarell%22%2C%22Helvetica%20Neue%22%2C%22Arial%22%2C%22sans-serif%22%3B%7D%3C%2Fstyle%3E%3Cg%3E%3Cmarker%20id%3D%22mermaid-_r_ja__flowchart-v2-pointEnd%22%20class%3D%22marker%20flowchart-v2%22%20viewBox%3D%22-5%20-5%2010%2010%22%20refX%3D%220%22%20refY%3D%220%22%20markerUnits%3D%22userSpaceOnUse%22%20markerWidth%3D%2210%22%20markerHeight%3D%2210%22%20orient%3D%22auto%22%3E%3Cpath%20d%3D%22M%200%200%20L%204%200%20M%200.8180194846605362%20-3.181980515339464%20L%204%200%20L%200.8180194846605362%203.181980515339464%22%20class%3D%22arrowMarkerPath%22%20style%3D%22stroke-width%3A%201%3B%20stroke-dasharray%3A%20none%3B%20fill%3A%20none%3B%20stroke-linecap%3A%20round%3B%20stroke-linejoin%3A%20round%3B%22%3E%3C%2Fpath%3E%3C%2Fmarker%3E%3Cmarker%20id%3D%22mermaid-_r_ja__flowchart-v2-pointStart%22%20class%3D%22marker%20flowchart-v2%22%20viewBox%3D%22-5%20-5%2010%2010%22%20refX%3D%220%22%20refY%3D%220%22%20markerUnits%3D%22userSpaceOnUse%22%20markerWidth%3D%2210%22%20markerHeight%3D%2210%22%20orient%3D%22auto%22%3E%3Cpath%20d%3D%22M%200%200%20L%20-4%200%20M%20-0.8180194846605362%20-3.181980515339464%20L%20-4%200%20L%20-0.8180194846605362%203.181980515339464%22%20class%3D%22arrowMarkerPath%22%20style%3D%22stroke-width%3A%201%3B%20stroke-dasharray%3A%20none%3B%20fill%3A%20none%3B%20stroke-linecap%3A%20round%3B%20stroke-linejoin%3A%20round%3B%22%3E%3C%2Fpath%3E%3C%2Fmarker%3E%3Cmarker%20id%3D%22mermaid-_r_ja__flowchart-v2-circleEnd%22%20class%3D%22marker%20flowchart-v2%22%20viewBox%3D%220%200%2010%2010%22%20refX%3D%2211%22%20refY%3D%225%22%20markerUnits%3D%22userSpaceOnUse%22%20markerWidth%3D%2211%22%20markerHeight%3D%2211%22%20orient%3D%22auto%22%3E%3Ccircle%20cx%3D%225%22%20cy%3D%225%22%20r%3D%225%22%20class%3D%22arrowMarkerPath%22%20style%3D%22stroke-width%3A%201%3B%20stroke-dasharray%3A%201%2C%200%3B%22%3E%3C%2Fcircle%3E%3C%2Fmarker%3E%3Cmarker%20id%3D%22mermaid-_r_ja__flowchart-v2-circleStart%22%20class%3D%22marker%20flowchart-v2%22%20viewBox%3D%220%200%2010%2010%22%20refX%3D%22-1%22%20refY%3D%225%22%20markerUnits%3D%22userSpaceOnUse%22%20markerWidth%3D%2211%22%20markerHeight%3D%2211%22%20orient%3D%22auto%22%3E%3Ccircle%20cx%3D%225%22%20cy%3D%225%22%20r%3D%225%22%20class%3D%22arrowMarkerPath%22%20style%3D%22stroke-width%3A%201%3B%20stroke-dasharray%3A%201%2C%200%3B%22%3E%3C%2Fcircle%3E%3C%2Fmarker%3E%3Cmarker%20id%3D%22mermaid-_r_ja__flowchart-v2-crossEnd%22%20class%3D%22marker%20cross%20flowchart-v2%22%20viewBox%3D%220%200%2011%2011%22%20refX%3D%2212%22%20refY%3D%225.2%22%20markerUnits%3D%22userSpaceOnUse%22%20markerWidth%3D%2211%22%20markerHeight%3D%2211%22%20orient%3D%22auto%22%3E%3Cpath%20d%3D%22M%201%2C1%20l%209%2C9%20M%2010%2C1%20l%20-9%2C9%22%20class%3D%22arrowMarkerPath%22%20style%3D%22stroke-width%3A%202%3B%20stroke-dasharray%3A%201%2C%200%3B%22%3E%3C%2Fpath%3E%3C%2Fmarker%3E%3Cmarker%20id%3D%22mermaid-_r_ja__flowchart-v2-crossStart%22%20class%3D%22marker%20cross%20flowchart-v2%22%20viewBox%3D%220%200%2011%2011%22%20refX%3D%22-1%22%20refY%3D%225.2%22%20markerUnits%3D%22userSpaceOnUse%22%20markerWidth%3D%2211%22%20markerHeight%3D%2211%22%20orient%3D%22auto%22%3E%3Cpath%20d%3D%22M%201%2C1%20l%209%2C9%20M%2010%2C1%20l%20-9%2C9%22%20class%3D%22arrowMarkerPath%22%20style%3D%22stroke-width%3A%202%3B%20stroke-dasharray%3A%201%2C%200%3B%22%3E%3C%2Fpath%3E%3C%2Fmarker%3E%3C%2Fg%3E%3Cg%20class%3D%22subgraphs%22%3E%3C%2Fg%3E%3Cg%20class%3D%22nodes%22%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-A-0%22%20transform%3D%22translate\(173.63191986083984%2C%2042\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-121.93126678466797%22%20y%3D%22-30%22%20width%3D%22243.86253356933594%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EHTTP%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20Request%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20dari%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20React%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-B-1%22%20transform%3D%22translate\(173.63191986083984%2C%20142\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-73.60017013549805%22%20y%3D%22-30%22%20width%3D%22147.2003402709961%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EGin%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20Router%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-C-3%22%20transform%3D%22translate\(173.63191986083984%2C%20247.5999984741211\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-101.13330078125%22%20y%3D%22-35.599998474121094%22%20width%3D%22202.2666015625%22%20height%3D%2271.19999694824219%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-19.599998474121094\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ECORS%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20dan%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20Security%3C%2Ftspan%3E%3C%2Ftspan%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%221em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EMiddleware%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%20%20mermaid-decision%22%20id%3D%22flowchart-D-5%22%20transform%3D%22translate\(173.63191986083984%2C%20353.1999969482422\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-94.96673583984375%22%20y%3D%22-30%22%20width%3D%22189.9334716796875%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EEndpoint%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20publik%3F%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-F-7%22%20transform%3D%22translate\(373.2483428955078%2C%20795.573600769043\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-64.12673377990723%22%20y%3D%22-30%22%20width%3D%22128.25346755981445%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EHandler%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-E-9%22%20transform%3D%22translate\(205.2874984741211%2C%20554.3867988586426\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-115.57500457763672%22%20y%3D%22-30%22%20width%3D%22231.15000915527344%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ESession%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20Authentication%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-G-11%22%20transform%3D%22translate\(205.2874984741211%2C%20655.573600769043\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-100.9375%22%20y%3D%22-30%22%20width%3D%22201.875%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ERole%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20Authorization%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-H-15%22%20transform%3D%22translate\(428.09922790527344%2C%20655.573600769043\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-81.87423324584961%22%20y%3D%22-30%22%20width%3D%22163.74846649169922%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EService%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20Layer%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-I-17%22%20transform%3D%22translate\(571.8493026733398%2C%20795.573600769043\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-94.4742317199707%22%20y%3D%22-30%22%20width%3D%22188.9484634399414%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ERepository%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20Layer%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-J-19%22%20transform%3D%22translate\(608.7463396708171%2C%20453.1999969482422\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-59.36250114440918%22%20y%3D%22-30%22%20width%3D%22118.72500228881836%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EGORM%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-K-21%22%20transform%3D%22translate\(628.533839416504%2C%20554.3867988586426\)%22%3E%3Cpath%20d%3D%22M0%2C8.591199410613187%20a32.72329139709473%2C8.591199410613187%200%2C0%2C0%2065.44658279418945%2C0%20a32.72329139709473%2C8.591199410613187%200%2C0%2C0%20-65.44658279418945%2C0%20l0%2C45.19119979208291%20a32.72329139709473%2C8.591199410613187%200%2C0%2C0%2065.44658279418945%2C0%20l0%2C-45.19119979208291%22%20class%3D%22basic%20label-container%22%20style%3D%22%22%20transform%3D%22translate\(-32.72329139709473%2C%20-31.186799306654642\)%22%3E%3C%2Fpath%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(-0.248291015625%2C%200.7999998331069946\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EMySQL%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-L-23%22%20transform%3D%22translate\(628.533839416504%2C%20655.573600769043\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-76.9390754699707%22%20y%3D%22-30%22%20width%3D%22153.8781509399414%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EHasil%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20Query%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22node%20default%22%20id%3D%22flowchart-M-31%22%20transform%3D%22translate\(373.2483428955078%2C%20895.573600769043\)%22%3E%3Crect%20class%3D%22basic%20label-container%22%20style%3D%22%22%20x%3D%22-90.97783660888672%22%20y%3D%22-30%22%20width%3D%22181.95567321777344%22%20height%3D%2260%22%3E%3C%2Frect%3E%3Cg%20class%3D%22label%22%20style%3D%22%22%20transform%3D%22translate\(0%2C%20-10.800000190734863\)%22%3E%3Crect%3E%3C%2Frect%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EJSON%3C%2Ftspan%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3E%20Response%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edges%20edgePaths%22%3E%3Cpath%20d%3D%22M173.63191986083984%2C72L173.63191986083984%2C100%22%20id%3D%22L_A_B_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_A_B_0%22%20data-points%3D%22W3sieCI6MTczLjYzMTkxOTg2MDgzOTg0LCJ5Ijo3Mn0seyJ4IjoxNzMuNjMxOTE5ODYwODM5ODQsInkiOjEwNH1d%22%20marker-end%3D%22url\(%23mermaid-_r_ja__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M173.63191986083984%2C172L173.63191986083984%2C200%22%20id%3D%22L_B_C_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_B_C_0%22%20data-points%3D%22W3sieCI6MTczLjYzMTkxOTg2MDgzOTg0LCJ5IjoxNzJ9LHsieCI6MTczLjYzMTkxOTg2MDgzOTg0LCJ5IjoyMDR9XQ%3D%3D%22%20marker-end%3D%22url\(%23mermaid-_r_ja__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M173.63191986083984%2C283.1999969482422L173.63191986083984%2C311.1999969482422%22%20id%3D%22L_C_D_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_C_D_0%22%20data-points%3D%22W3sieCI6MTczLjYzMTkxOTg2MDgzOTg0LCJ5IjoyODMuMTk5OTk2OTQ4MjQyMn0seyJ4IjoxNzMuNjMxOTE5ODYwODM5ODQsInkiOjMxNS4xOTk5OTY5NDgyNDIyfV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_ja__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M141.97634124755857%2C383.1999969482422L141.9763412475586%2C396.1289291363767Q141.9763412475586%2C403.1999969482422%20134.90527343569312%2C403.1999969482422L37.78295602529465%2C403.1999969482422Q36%2C403.1999969482422%2034.58578643762691%2C404.2857833858691L34.58578643762691%2C404.2857833858691Q33.17157287525381%2C405.371569823496%2032.085786437626915%2C406.7857833858691L32.08578643762691%2C406.7857833858691Q31%2C408.1999969482422%2031%2C409.98295297353684L31%2C453.1999969482422L31%2C655.573600769043L31%2C718.7906447437483Q31%2C720.573600769043%2032.08578643762691%2C721.9878143314161L32.085786437626915%2C721.9878143314161Q33.17157287525381%2C723.4020278937892%2034.58578643762691%2C724.4878143314161L34.58578643762691%2C724.4878143314161Q36%2C725.573600769043%2037.78295602529465%2C725.573600769043L327.989347746678%2C725.573600769043Q329.77230377197264%2C725.573600769043%20331.18651733434575%2C726.6593872066699L331.18651733434575%2C726.6593872066699Q332.60073089671886%2C727.7451736442968%20333.68651733434575%2C729.1593872066699L333.68651733434575%2C729.1593872066699Q334.77230377197264%2C730.573600769043%20334.77230377197264%2C732.3565567943376L334.77230377197264%2C753.573600769043%22%20id%3D%22L_D_F_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_D_F_0%22%20data-points%3D%22W3sieCI6MTQxLjk3NjM0MTI0NzU1ODU3LCJ5IjozODMuMTk5OTk2OTQ4MjQyMn0seyJ4IjoxNDEuOTc2MzQxMjQ3NTU4NiwieSI6NDAzLjE5OTk5Njk0ODI0MjJ9LHsieCI6MzEsInkiOjQwMy4xOTk5OTY5NDgyNDIyfSx7IngiOjMxLCJ5Ijo0NTMuMTk5OTk2OTQ4MjQyMn0seyJ4IjozMSwieSI6NjU1LjU3MzYwMDc2OTA0M30seyJ4IjozMSwieSI6NzI1LjU3MzYwMDc2OTA0M30seyJ4IjozMzQuNzcyMzAzNzcxOTcyNjQsInkiOjcyNS41NzM2MDA3NjkwNDN9LHsieCI6MzM0Ljc3MjMwMzc3MTk3MjY0LCJ5Ijo3NTcuNTczNjAwNzY5MDQzfV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_ja__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M205.28749847412112%2C383.1999969482422L205.2874984741211%2C512.3867988586426%22%20id%3D%22L_D_E_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_D_E_0%22%20data-points%3D%22W3sieCI6MjA1LjI4NzQ5ODQ3NDEyMTEyLCJ5IjozODMuMTk5OTk2OTQ4MjQyMn0seyJ4IjoyMDUuMjg3NDk4NDc0MTIxMSwieSI6NTE2LjM4Njc5ODg1ODY0MjZ9XQ%3D%3D%22%20marker-end%3D%22url\(%23mermaid-_r_ja__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M205.2874984741211%2C584.3867988586426L205.2874984741211%2C613.573600769043%22%20id%3D%22L_E_G_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_E_G_0%22%20data-points%3D%22W3sieCI6MjA1LjI4NzQ5ODQ3NDEyMTEsInkiOjU4NC4zODY3OTg4NTg2NDI2fSx7IngiOjIwNS4yODc0OTg0NzQxMjExLCJ5Ijo2MTcuNTczNjAwNzY5MDQzfV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_ja__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M205.2874984741211%2C685.573600769043L205.2874984741211%2C698.7906447437483Q205.2874984741211%2C700.573600769043%20206.373284911748%2C701.9878143314161L206.37328491174802%2C701.9878143314161Q207.4590713493749%2C703.4020278937892%20208.873284911748%2C704.4878143314161L208.873284911748%2C704.4878143314161Q210.2874984741211%2C705.573600769043%20212.07045449941575%2C705.573600769043L353.64004049570144%2C705.573600769043Q355.4229965209961%2C705.573600769043%20356.8372100833692%2C706.6593872066699L356.8372100833692%2C706.6593872066699Q358.2514236457423%2C707.7451736442968%20359.3372100833692%2C709.1593872066699L359.3372100833692%2C709.1593872066699Q360.4229965209961%2C710.573600769043%20360.4229965209961%2C712.3565567943376L360.4229965209961%2C753.573600769043%22%20id%3D%22L_G_F_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_G_F_0%22%20data-points%3D%22W3sieCI6MjA1LjI4NzQ5ODQ3NDEyMTEsInkiOjY4NS41NzM2MDA3NjkwNDN9LHsieCI6MjA1LjI4NzQ5ODQ3NDEyMTEsInkiOjcwNS41NzM2MDA3NjkwNDN9LHsieCI6MzYwLjQyMjk5NjUyMDk5NjEsInkiOjcwNS41NzM2MDA3NjkwNDN9LHsieCI6MzYwLjQyMjk5NjUyMDk5NjEsInkiOjc1Ny41NzM2MDA3NjkwNDN9XQ%3D%3D%22%20marker-end%3D%22url\(%23mermaid-_r_ja__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M411.7243820190429%2C765.573600769043L411.724382019043%2C697.573600769043%22%20id%3D%22L_F_H_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_F_H_0%22%20data-points%3D%22W3sieCI6NDExLjcyNDM4MjAxOTA0MjksInkiOjc2NS41NzM2MDA3NjkwNDN9LHsieCI6NDExLjcyNDM4MjAxOTA0MywieSI6NjkzLjU3MzYwMDc2OTA0M31d%22%20marker-end%3D%22url\(%23mermaid-_r_ja__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M444.4740737915039%2C685.573600769043L444.4740737915039%2C738.7906447437483Q444.4740737915039%2C740.573600769043%20445.5598602291308%2C741.9878143314161L445.5598602291308%2C741.9878143314161Q446.64564666675767%2C743.4020278937892%20448.0598602291308%2C744.4878143314161L448.0598602291308%2C744.4878143314161Q449.4740737915039%2C745.573600769043%20451.25702981679854%2C745.573600769043L508.38180990488115%2C745.573600769043Q510.1647659301758%2C745.573600769043%20511.5789794925489%2C746.6593872066699L511.5789794925489%2C746.6593872066699Q512.993193054922%2C747.7451736442968%20514.0789794925489%2C749.1593872066699L514.0789794925489%2C749.1593872066699Q515.1647659301758%2C750.573600769043%20515.1647659301758%2C752.3565567943376L515.1647659301758%2C755.573600769043%22%20id%3D%22L_H_I_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_H_I_0%22%20data-points%3D%22W3sieCI6NDQ0LjQ3NDA3Mzc5MTUwMzksInkiOjY4NS41NzM2MDA3NjkwNDN9LHsieCI6NDQ0LjQ3NDA3Mzc5MTUwMzksInkiOjc0NS41NzM2MDA3NjkwNDN9LHsieCI6NTE1LjE2NDc2NTkzMDE3NTgsInkiOjc0NS41NzM2MDA3NjkwNDN9LHsieCI6NTE1LjE2NDc2NTkzMDE3NTgsInkiOjc1OS41NzM2MDA3NjkwNDN9XQ%3D%3D%22%20marker-end%3D%22url\(%23mermaid-_r_ja__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M590.7441482543945%2C765.573600769043L590.7441482543945%2C712.3565567943376Q590.7441482543945%2C710.573600769043%20589.6583618167676%2C709.1593872066699L589.6583618167676%2C709.1593872066699Q588.5725753791407%2C707.7451736442968%20587.1583618167676%2C706.6593872066699L587.1583618167676%2C706.6593872066699Q585.7441482543945%2C705.573600769043%20583.9611922290999%2C705.573600769043L537.3777237865252%2C705.573600769043Q535.5947677612305%2C705.573600769043%20534.1805541988574%2C704.4878143314161L534.1805541988574%2C704.4878143314161Q532.7663406364843%2C703.4020278937892%20531.6805541988574%2C701.9878143314161L531.6805541988574%2C701.9878143314161Q530.5947677612305%2C700.573600769043%20530.5947677612305%2C698.7906447437483L530.5947677612305%2C655.573600769043L530.5947677612305%2C554.3867988586426L530.5947677612305%2C509.98295297353684Q530.5947677612305%2C508.1999969482422%20531.6805541988574%2C506.7857833858691L531.6805541988574%2C506.7857833858691Q532.7663406364843%2C505.371569823496%20534.1805541988574%2C504.2857833858691L534.1805541988574%2C504.2857833858691Q535.5947677612305%2C503.1999969482422%20537.3777237865252%2C503.1999969482422L582.1758838998355%2C503.1999969482422Q583.9588399251302%2C503.1999969482422%20585.3730534875033%2C502.1142105106153L585.3730534875033%2C502.1142105106153Q586.7872670498764%2C501.0284240729884%20587.8730534875033%2C499.6142105106153L587.8730534875033%2C499.6142105106153Q588.9588399251302%2C498.1999969482422%20588.9588399251302%2C496.41704092294754L588.9588399251302%2C493.1999969482422%22%20id%3D%22L_I_J_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_I_J_0%22%20data-points%3D%22W3sieCI6NTkwLjc0NDE0ODI1NDM5NDUsInkiOjc2NS41NzM2MDA3NjkwNDN9LHsieCI6NTkwLjc0NDE0ODI1NDM5NDUsInkiOjcwNS41NzM2MDA3NjkwNDN9LHsieCI6NTMwLjU5NDc2Nzc2MTIzMDUsInkiOjcwNS41NzM2MDA3NjkwNDN9LHsieCI6NTMwLjU5NDc2Nzc2MTIzMDUsInkiOjY1NS41NzM2MDA3NjkwNDN9LHsieCI6NTMwLjU5NDc2Nzc2MTIzMDUsInkiOjU1NC4zODY3OTg4NTg2NDI2fSx7IngiOjUzMC41OTQ3Njc3NjEyMzA1LCJ5Ijo1MDMuMTk5OTk2OTQ4MjQyMn0seyJ4Ijo1ODguOTU4ODM5OTI1MTMwMiwieSI6NTAzLjE5OTk5Njk0ODI0MjJ9LHsieCI6NTg4Ljk1ODgzOTkyNTEzMDIsInkiOjQ4OS4xOTk5OTY5NDgyNDIyfV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_ja__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M628.533839416504%2C483.1999969482422L628.533839416504%2C511.1999969482422%22%20id%3D%22L_J_K_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_J_K_0%22%20data-points%3D%22W3sieCI6NjI4LjUzMzgzOTQxNjUwNCwieSI6NDgzLjE5OTk5Njk0ODI0MjJ9LHsieCI6NjI4LjUzMzgzOTQxNjUwNCwieSI6NTE1LjE5OTk5Njk0ODI0MjJ9XQ%3D%3D%22%20marker-end%3D%22url\(%23mermaid-_r_ja__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M628.533839416504%2C585.573600769043L628.533839416504%2C613.573600769043%22%20id%3D%22L_K_L_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_K_L_0%22%20data-points%3D%22W3sieCI6NjI4LjUzMzgzOTQxNjUwNCwieSI6NTg1LjU3MzYwMDc2OTA0M30seyJ4Ijo2MjguNTMzODM5NDE2NTA0LCJ5Ijo2MTcuNTczNjAwNzY5MDQzfV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_ja__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M628.533839416504%2C685.573600769043L628.533839416504%2C753.573600769043%22%20id%3D%22L_L_I_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_L_I_0%22%20data-points%3D%22W3sieCI6NjI4LjUzMzgzOTQxNjUwNCwieSI6Njg1LjU3MzYwMDc2OTA0M30seyJ4Ijo2MjguNTMzODM5NDE2NTA0LCJ5Ijo3NTcuNTczNjAwNzY5MDQzfV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_ja__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M552.9544570922851%2C765.573600769043L552.9544570922851%2C732.3565567943376Q552.9544570922851%2C730.573600769043%20551.8686706546582%2C729.1593872066699L551.8686706546582%2C729.1593872066699Q550.7828842170313%2C727.7451736442968%20549.3686706546582%2C726.6593872066699L549.3686706546582%2C726.6593872066699Q547.9544570922851%2C725.573600769043%20546.1715010669905%2C725.573600769043L484.0067215892595%2C725.573600769043Q482.22376556396483%2C725.573600769043%20480.8095520015917%2C724.4878143314161L480.8095520015917%2C724.4878143314161Q479.3953384392186%2C723.4020278937892%20478.3095520015917%2C721.9878143314161L478.3095520015917%2C721.9878143314161Q477.22376556396483%2C720.573600769043%20477.22376556396483%2C718.7906447437483L477.22376556396483%2C697.573600769043%22%20id%3D%22L_I_H_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_I_H_0%22%20data-points%3D%22W3sieCI6NTUyLjk1NDQ1NzA5MjI4NTEsInkiOjc2NS41NzM2MDA3NjkwNDN9LHsieCI6NTUyLjk1NDQ1NzA5MjI4NTEsInkiOjcyNS41NzM2MDA3NjkwNDN9LHsieCI6NDc3LjIyMzc2NTU2Mzk2NDgzLCJ5Ijo3MjUuNTczNjAwNzY5MDQzfSx7IngiOjQ3Ny4yMjM3NjU1NjM5NjQ4MywieSI6NjkzLjU3MzYwMDc2OTA0M31d%22%20marker-end%3D%22url\(%23mermaid-_r_ja__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M378.9746902465821%2C685.573600769043L378.97469024658204%2C704.5241012573242Q378.97469024658204%2C705.573600769043%20380.02418975830074%2C705.573600769043L381.0736892700195%2C705.573600769043L383.5736892700195%2C705.573600769043Q386.0736892700195%2C705.573600769043%20386.0736892700195%2C708.073600769043L386.0736892700195%2C710.573600769043L386.0736892700195%2C753.573600769043%22%20id%3D%22L_H_F_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_H_F_0%22%20data-points%3D%22W3sieCI6Mzc4Ljk3NDY5MDI0NjU4MjEsInkiOjY4NS41NzM2MDA3NjkwNDN9LHsieCI6Mzc4Ljk3NDY5MDI0NjU4MjA0LCJ5Ijo3MDUuNTczNjAwNzY5MDQzfSx7IngiOjM4Ni4wNzM2ODkyNzAwMTk1LCJ5Ijo3MDUuNTczNjAwNzY5MDQzfSx7IngiOjM4Ni4wNzM2ODkyNzAwMTk1LCJ5Ijo3NTcuNTczNjAwNzY5MDQzfV0%3D%22%20marker-end%3D%22url\(%23mermaid-_r_ja__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M373.2483428955078%2C825.573600769043L373.2483428955078%2C853.573600769043%22%20id%3D%22L_F_M_0%22%20class%3D%22edge-thickness-normal%20edge-pattern-solid%20edge-thickness-normal%20edge-pattern-solid%20flowchart-link%22%20style%3D%22%3B%22%20data-edge%3D%22true%22%20data-et%3D%22edge%22%20data-id%3D%22L_F_M_0%22%20data-points%3D%22W3sieCI6MzczLjI0ODM0Mjg5NTUwNzgsInkiOjgyNS41NzM2MDA3NjkwNDN9LHsieCI6MzczLjI0ODM0Mjg5NTUwNzgsInkiOjg1Ny41NzM2MDA3NjkwNDN9XQ%3D%3D%22%20marker-end%3D%22url\(%23mermaid-_r_ja__flowchart-v2-pointEnd\)%22%3E%3C%2Fpath%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabels%22%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22stroke%3A%20none%22%3E%3C%2Frect%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_A_B_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_B_C_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_C_D_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%20transform%3D%22translate\(30.856250762939453%2C%20554.3867988586426\)%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_D_F_0%22%20transform%3D%22translate\(-6.05625057220459%2C-7.40000057220459\)%22%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22%22%20x%3D%22-12.800000011920929%22%20y%3D%22-5.599999785423279%22%20width%3D%2237.71250057220459%22%20height%3D%2226%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3EYa%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%20transform%3D%22translate\(204.82126235961914%2C%20453.1999969482422\)%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_D_E_0%22%20transform%3D%22translate\(-16.033763885498047%2C-7.40000057220459\)%22%3E%3Cg%3E%3Crect%20class%3D%22background%22%20style%3D%22%22%20x%3D%22-12%22%20y%3D%22-5.599999785423279%22%20width%3D%2256.06753158569336%22%20height%3D%2226%22%3E%3C%2Frect%3E%3Ctext%20y%3D%22-10.1%22%20style%3D%22%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3Ctspan%20font-style%3D%22normal%22%20class%3D%22text-inner-tspan%22%20font-weight%3D%22normal%22%3ETidak%3C%2Ftspan%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_E_G_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_G_F_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_F_H_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_H_I_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_I_J_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_J_K_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_K_L_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_L_I_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_I_H_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_H_F_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3Cg%20class%3D%22edgeLabel%22%3E%3Cg%20class%3D%22label%22%20data-id%3D%22L_F_M_0%22%20transform%3D%22translate\(0%2C%200\)%22%3E%3Ctext%20y%3D%22-10.1%22%3E%3Ctspan%20class%3D%22text-outer-tspan%22%20x%3D%220%22%20y%3D%22-0.1em%22%20dy%3D%221.1em%22%3E%3C%2Ftspan%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E)

Pembagian tanggung jawab:

* Router: mendefinisikan endpoint dan middleware.

* Handler: menerima request HTTP dan membentuk respons.

* Service: menjalankan aturan bisnis seperti kuota dan verifikasi.

* Repository: menjalankan operasi database.

* Model: mendefinisikan struktur data dan relasi GORM.

* Middleware: autentikasi, otorisasi, CSRF, dan rate limiting.

* Config: membaca konfigurasi dari environment.

## Struktur folder final

```
daftarin/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js
│   │   │   ├── auth.js
│   │   │   ├── events.js
│   │   │   └── registrations.js
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── forms/
│   │   │   └── tables/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   ├── auth/
│   │   │   ├── participant/
│   │   │   └── admin/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
├── backend/
│   ├── cmd/api/main.go
│   ├── internal/
│   │   ├── config/
│   │   ├── database/
│   │   ├── models/
│   │   ├── handlers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── validators/
│   │   └── response/
│   ├── migrations/
│   ├── tests/
│   ├── .env.example
│   └── go.mod
│
├── docs/
│   ├── architecture.md
│   ├── erd.md
│   └── api-contract.md
├── .gitignore
└── README.md
```

# 8. Aturan keamanan dan pencegahan bug

Bagian ini wajib menjadi persyaratan, bukan tambahan belakangan.

| Area        | Aturan implementasi                                                |
| ----------- | ------------------------------------------------------------------ |
| Password    | Hash dengan Argon2id atau bcrypt menggunakan konfigurasi yang aman |
| Session     | Token acak kriptografis; simpan hash token di database             |
| Cookie      | `HttpOnly`, `Secure` di HTTPS, `SameSite` sesuai arsitektur        |
| CSRF        | Perlindungan CSRF untuk request yang menggunakan cookie session    |
| CORS        | Izinkan hanya origin frontend yang ditentukan                      |
| Role        | Backend memeriksa role admin pada setiap endpoint admin            |
| Validasi    | Validasi format, panjang, tipe, dan aturan bisnis di backend       |
| SQL         | Gunakan query parameterized melalui GORM atau `database/sql`       |
| Kuota       | Transaksi database dan locking agar tidak terjadi overselling      |
| Duplikasi   | Unique index untuk email per event                                 |
| Rate limit  | Batasi login dan pendaftaran publik                                |
| Konfigurasi | Secret dan kredensial hanya dari environment                       |
| Error       | Jangan mengirim stack trace atau detail internal ke client         |
| Logging     | Jangan mencatat password, session token, atau data sensitif        |
| Database    | Backup, migrasi berversi, foreign key, dan constraint              |
| Pengujian   | Unit test, integration test, dan end-to-end test                   |

### Aturan bisnis yang harus dipastikan

1. Event `draft` tidak boleh diakses untuk pendaftaran publik.

2. Pendaftaran hanya dibuka selama periode yang ditentukan.

3. Event `cancelled` tidak menerima pendaftaran baru.

4. Peserta tidak boleh mengakses pendaftaran peserta lain dengan mengganti ID di URL.

5. Status pendaftaran hanya bisa diubah sesuai transisi yang diizinkan.

6. Kuota dihitung berdasarkan pendaftaran yang sudah menghabiskan tempat, sesuai kebijakan yang ditetapkan. Untuk MVP, tetapkan `pending` dan `confirmed` sama-sama menempati kuota sampai dibatalkan atau ditolak.

7. Pendaftaran duplikat ditolak oleh database meskipun dua request masuk hampir bersamaan.

8. Penghapusan event yang sudah memiliki data pendaftaran ditolak; gunakan pembatalan.

9. Pembuatan akun admin dilakukan melalui seeder atau perintah administratif, bukan melalui form register publik.

10. Backend menjadi sumber kebenaran untuk harga jika suatu saat fitur berbayar ditambahkan, status, kuota, dan izin.

Catatan penting untuk guest: nomor pendaftaran bukan password atau bukti otorisasi untuk membaca data pribadi. Jika nanti guest ingin mengecek status tanpa akun, gunakan mekanisme lookup yang aman dengan token akses acak berentropi tinggi, bukan hanya nomor pendaftaran yang mudah ditebak.

# 9. Urutan implementasi dari nol sampai selesai

## 01

Setup proyek

Buat repositori, frontend Vite, modul Go, koneksi MySQL, file environment, dan konfigurasi CORS untuk development.

Selesai ketika React dapat diakses dan API Go dapat menjalankan endpoint health check.

## 02

Database dan migrasi

Buat tabel, constraint, indeks, model GORM, konfigurasi transaksi, dan seeder admin awal.

Selesai ketika migrasi dapat dijalankan pada database kosong dan relasi bekerja.

## 03

Autentikasi dan otorisasi

Implementasikan register, login, logout, session, middleware autentikasi, role admin, dan role peserta.

Selesai ketika akses tanpa izin ditolak oleh backend, bukan hanya frontend.

## 04

CRUD event

Implementasikan service dan endpoint event, validasi jadwal, kuota, slug unik, publikasi, dan pembatalan.

Selesai ketika admin dapat membuat, membaca, mengedit, dan mengelola event dengan benar.

## 05

Sistem pendaftaran

Implementasikan form guest, pendaftaran peserta login, nomor registrasi, pengecekan duplikasi, kuota, dan transaksi.

Selesai ketika pendaftaran bersamaan tidak melebihi kuota dan data duplikat ditolak.

## 06

Dashboard dan UI React

Buat halaman publik, form, dashboard admin, dashboard peserta, tabel, filter, pagination, dan state UI.

Selesai ketika seluruh halaman memakai API sungguhan, bukan data dummy.

## 07

Integrasi dan pengujian

Tes alur guest, peserta, admin, session kedaluwarsa, input tidak valid, kuota penuh, dan duplikasi request.

Selesai ketika pengujian otomatis lulus dan tidak ada celah akses lintas pengguna yang diketahui.

## 08

Persiapan deployment

Konfigurasi HTTPS, environment produksi, migrasi, backup, logging, rate limiting, dan build frontend.

Selesai ketika aplikasi dapat dijalankan di lingkungan produksi dengan konfigurasi aman.

# 10. Prompt lengkap untuk AI coding agent

Nah bre, bagian ini bisa lu salin sebagai instruksi utama untuk AI yang akan membantu membangun proyek. Setelah itu, minta AI mengerjakan satu fase dalam satu waktu, bukan menghasilkan seluruh aplikasi sekaligus tanpa pengujian.

PROJECT SPECIFICATION — DAFTARIN

# PROJECT SPECIFICATION — DAFTARIN

## Sistem Pendaftaran Seminar dan Event Online

### 1. Peran AI

Bertindak sebagai Senior Full-Stack Engineer dan Software Architect yang berpengalaman membangun aplikasi web menggunakan React, Golang, Gin, MySQL, dan GORM.

Bangun aplikasi bernama **DaftarIn**, sebuah sistem pendaftaran seminar dan event online dengan arsitektur frontend-backend terpisah, REST API, database relasional, autentikasi aman, dan antarmuka modern.

Jangan hanya membuat mockup atau data dummy. Implementasikan aplikasi secara bertahap, terintegrasi, dapat dijalankan, dan disertai pengujian.

### 2. Stack teknologi

Frontend:

* React dengan Vite.

* JavaScript.

* React Router untuk routing.

* Tailwind CSS untuk styling.

* Fetch API atau Axios untuk komunikasi REST API.

* Komponen UI reusable.

* Tampilan responsif untuk desktop, tablet, dan mobile.

Backend:

* Golang.

* Gin sebagai HTTP framework.

* GORM sebagai ORM.

* MySQL 8.0+.

* REST API dengan prefix `/api/v1`.

* Struktur berlapis: handlers, services, repositories, models, middleware, validators, dan routes.

Autentikasi:

* Session berbasis cookie HttpOnly.

* Session token acak dengan entropi tinggi.

* Simpan hash token session di database.

* Cookie Secure pada HTTPS dan kebijakan SameSite yang tepat.

* Perlindungan CSRF untuk request berbasis cookie.

* Password hashing menggunakan Argon2id atau bcrypt dengan konfigurasi aman.

* Role admin dan participant.

### 3. Tujuan aplikasi

Memungkinkan pengunjung melihat seminar atau event yang tersedia dan mendaftar tanpa harus membuat akun.

Pengguna yang memiliki akun dapat login, mendaftar event, dan memantau status pendaftarannya melalui dashboard.

Admin dapat mengelola event, mengelola pendaftaran, memverifikasi peserta, mengatur kuota, dan melihat statistik.

### 4. Role dan izin

Guest:

* Melihat event yang dipublikasikan.

* Membaca detail event.

* Mengisi form pendaftaran publik.

* Mendapatkan nomor pendaftaran.

* Tidak dapat mengakses dashboard atau data pribadi peserta lain.

Participant:

* Register, login, logout.

* Melihat dashboard dan pendaftaran yang terhubung dengan akun sendiri.

* Mendaftar event.

* Melihat status dan alasan penolakan.

* Tidak dapat mengakses fungsi administratif.

Admin:

* Login menggunakan akun yang dibuat melalui proses administratif aman.

* Melihat statistik dashboard.

* CRUD event.

* Mengelola pendaftaran.

* Mengonfirmasi atau menolak pendaftaran.

* Melakukan pencarian, filter, dan pagination.

* Tidak membuat atau memberikan role admin melalui form registrasi publik.

### 5. Database

Gunakan database `daftarin` dan migrasi SQL berversi.

Tabel users:

* id

* name

* email

* password_hash

* role

* created_at

* updated_at

Tabel sessions:

* id

* user_id

* token_hash

* expires_at

* created_at

Tabel events:

* id

* created_by

* slug

* title

* description

* location

* starts_at

* ends_at

* registration_opens_at

* registration_closes_at

* quota

* status

* created_at

* updated_at

Tabel registrations:

* id

* event_id

* user_id nullable

* registration_number

* name

* email

* phone

* institution nullable

* status

* rejection_reason nullable

* created_at

* updated_at

Gunakan foreign key, unique index, indeks pencarian, dan constraint yang sesuai. Email disimpan dalam format ternormalisasi. Terapkan unique constraint pada kombinasi event_id dan email. Nomor pendaftaran harus unik.

Gunakan migrasi berversi, bukan AutoMigrate sebagai pengganti sistem migrasi produksi. Seeder admin harus aman dan tidak membuat akun admin default dengan password publik.

### 6. Aturan bisnis

* Status event: draft, published, cancelled, completed.

* Status pendaftaran: pending, confirmed, rejected, cancelled.

* Event draft tidak dapat didaftarkan oleh publik.

* Pendaftaran hanya dibuka selama periode yang ditentukan.

* Event yang dibatalkan tidak menerima pendaftaran baru.

* Status awal pendaftaran adalah pending.

* Pending dan confirmed sama-sama menempati kuota.

* Rejected dan cancelled tidak menempati kuota.

* Satu email hanya boleh mendaftar sekali pada event yang sama.

* Semua pengecekan kuota dan pembuatan pendaftaran dilakukan secara aman dalam transaksi.

* Gunakan row locking atau mekanisme transaksi yang sesuai untuk mencegah kuota terlampaui saat request bersamaan.

* Validasi transisi status pendaftaran di backend.

* Tolak penghapusan event yang memiliki pendaftaran; gunakan pembatalan atau pengarsipan.

* Guest tidak otomatis memperoleh akun.

* Jangan mengizinkan pengiriman user_id atau role dari frontend menentukan identitas dan hak akses.

* Semua tanggal disimpan sebagai UTC dan dikirim menggunakan format ISO 8601.

### 7. Endpoint API

Auth:

* POST /api/v1/auth/register

* POST /api/v1/auth/login

* POST /api/v1/auth/logout

* GET /api/v1/auth/me

Event publik:

* GET /api/v1/events

* GET /api/v1/events/

* POST /api/v1/events//registrations

Dashboard peserta:

* GET /api/v1/participant/registrations

* GET /api/v1/participant/registrations/

Admin:

* GET /api/v1/admin/dashboard

* GET /api/v1/admin/events

* POST /api/v1/admin/events

* GET /api/v1/admin/events/

* PUT /api/v1/admin/events/

* DELETE /api/v1/admin/events/

* GET /api/v1/admin/registrations

* GET /api/v1/admin/registrations/

* PATCH /api/v1/admin/registrations//status

Dukung pagination, pencarian, filter status, validasi query, dan format error JSON yang konsisten.

Gunakan HTTP status yang tepat: 200, 201, 204, 400, 401, 403, 404, 409, 422, 429, dan 500 sesuai kondisi.

### 8. Struktur backend

backend/

* cmd/api/main.go

* internal/config/

* internal/database/

* internal/models/

* internal/handlers/

* internal/services/

* internal/repositories/

* internal/middleware/

* internal/routes/

* internal/validators/

* internal/response/

* migrations/

* tests/

* go.mod

* .env.example

Pisahkan HTTP handler, aturan bisnis, dan operasi database. Gunakan dependency injection sederhana. Tangani error secara eksplisit. Gunakan context.Context dan timeout untuk operasi database yang relevan.

### 9. Struktur frontend

frontend/src/

* api/

* components/ui/

* components/forms/

* components/tables/

* layouts/

* pages/public/

* pages/auth/

* pages/participant/

* pages/admin/

* hooks/

* utils/

* App.jsx

* main.jsx

Buat API client terpusat. Gunakan `credentials: "include"` bila menggunakan Fetch API dengan cookie session. Jangan menyimpan session token atau kredensial di localStorage.

Buat route guard untuk pengalaman pengguna, tetapi tetap wajib mengandalkan otorisasi backend sebagai kontrol keamanan utama.

Setiap halaman harus memiliki loading, error, empty, success, dan disabled state yang sesuai.

### 10. Desain UI

Gunakan gaya light modern, profesional, bersih, dan konsisten.

Arah visual:

* Latar putih atau abu-abu sangat muda.

* Warna utama biru.

* Teks slate gelap.

* Kartu dengan border tipis dan radius moderat.

* Tipografi mudah dibaca.

* Spacing konsisten.

* Sidebar dashboard yang rapi.

* Tabel data responsif.

* Form yang jelas dan mudah digunakan.

* Badge status dengan warna yang konsisten.

* Dialog konfirmasi sebelum aksi destruktif.

* Toast untuk hasil aksi.

* Tidak menggunakan animasi berlebihan.

* Prioritaskan aksesibilitas, kontras, dan pengalaman mobile.

Halaman:

1. Beranda publik.

2. Daftar event.

3. Detail event.

4. Form pendaftaran guest.

5. Login dan register.

6. Hasil pendaftaran.

7. Dashboard peserta.

8. Daftar pendaftaran peserta.

9. Dashboard admin.

10. CRUD event.

11. Daftar pendaftar.

12. Detail dan verifikasi pendaftaran.

13. Profil dan logout.

### 11. Keamanan dan kualitas

* Batasi CORS ke origin yang diizinkan.

* Gunakan CSRF protection untuk autentikasi cookie.

* Gunakan rate limiting untuk login dan endpoint pendaftaran publik.

* Validasi seluruh input pada backend.

* Gunakan parameterized queries.

* Jangan mengembalikan stack trace ke client.

* Jangan mencatat password atau session token.

* Jangan memasukkan secret ke source code.

* Sediakan `.env.example` tanpa kredensial sungguhan.

* Gunakan transaksi untuk operasi bisnis yang membutuhkan konsistensi.

* Terapkan timeout request dan graceful shutdown.

* Tambahkan request ID dan logging terstruktur tanpa data sensitif.

* Pastikan endpoint participant hanya dapat mengakses data milik user aktif.

* Pastikan seluruh endpoint admin dilindungi autentikasi dan role middleware.

### 12. Pengujian wajib

Backend:

* Register dan login berhasil.

* Password salah ditolak.

* Session tidak valid atau kedaluwarsa ditolak.

* Guest dapat mendaftar tanpa akun.

* Email duplikat ditolak.

* Kuota penuh ditolak.

* Request bersamaan tidak melebihi kuota.

* Event draft tidak dapat didaftarkan.

* Participant tidak dapat mengakses endpoint admin.

* Participant tidak dapat membaca pendaftaran pengguna lain.

* Admin dapat mengubah status pendaftaran.

* Validasi tanggal dan kuota bekerja.

Frontend:

* Seluruh halaman terhubung ke API sungguhan.

* Form menampilkan error dari backend.

* Loading dan empty state bekerja.

* Refresh halaman tidak merusak status autentikasi.

* Route admin dan participant ditangani dengan benar.

* UI berfungsi pada desktop dan mobile.

### 13. Tahapan pengerjaan

Fase 1: Analisis, ERD, kontrak API, dan struktur folder.

Fase 2: Setup proyek dan konfigurasi development.

Fase 3: Database dan migrasi.

Fase 4: Autentikasi, session, dan otorisasi.

Fase 5: CRUD event.

Fase 6: Pendaftaran publik dan peserta, transaksi kuota, serta nomor registrasi.

Fase 7: Dashboard admin dan peserta.

Fase 8: Integrasi frontend-backend dan perbaikan UI.

Fase 9: Pengujian, audit keamanan, dokumentasi, dan deployment.

### 14. Cara AI harus bekerja

* Kerjakan satu fase pada satu waktu.

* Sebelum menulis kode, jelaskan file yang akan dibuat dan tanggung jawabnya.

* Berikan kode lengkap yang konsisten dengan struktur proyek.

* Jangan mengganti stack teknologi tanpa persetujuan.

* Jangan membuat data dummy sebagai pengganti endpoint produksi.

* Jangan menggunakan fungsi atau package yang belum diverifikasi.

* Pastikan import, nama field, route, dan kontrak JSON konsisten.

* Jalankan atau berikan instruksi pengujian yang dapat direproduksi.

* Perbaiki error sebelum lanjut ke fase berikutnya.

* Perbarui README dan dokumentasi API saat ada perubahan.

* Tandai bagian yang belum diimplementasikan secara jujur.

* Jangan mengklaim pengujian lulus jika belum dijalankan.

Mulai dari **Fase 1: finalisasi ERD, aturan bisnis, kontrak API, dan struktur folder**. Setelah rancangan disetujui, lanjutkan ke Fase 2. Jangan langsung menghasilkan seluruh kode aplikasi dalam satu jawaban.

## 11. Rekomendasi gue sebelum mulai coding

Ada tiga hal yang sebaiknya kita pastikan sejak awal:

* Status pending memakan kuota. Ini mencegah jumlah calon peserta melebihi kapasitas. Jika ditolak atau dibatalkan, tempatnya kembali tersedia.

* Guest bisa mendaftar tanpa akun. Namun, pelacakan status pribadi perlu mekanisme aman jika guest tidak ingin membuat akun.

* Migrasi database dan pengujian berjalan sejak awal. Jangan menunggu aplikasi selesai baru mengecek integritas data.

Dengan rancangan ini, DaftarIn memiliki alur yang jelas dari pengunjung membuka event, mengisi pendaftaran, backend memvalidasi dan menyimpan data, hingga admin memverifikasi peserta. Tahap selanjutnya yang paling tepat adalah mengimplementasikan Fase 1 dan Fase 2, lalu menguji fondasi backend sebelum membangun seluruh UI.
