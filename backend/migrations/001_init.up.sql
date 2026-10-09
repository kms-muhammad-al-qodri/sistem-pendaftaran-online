CREATE DATABASE IF NOT EXISTS daftarin
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE daftarin;

CREATE TABLE IF NOT EXISTS users (
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

CREATE TABLE IF NOT EXISTS sessions (
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

CREATE TABLE IF NOT EXISTS events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    created_by BIGINT UNSIGNED NOT NULL,
    slug VARCHAR(180) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    image_url VARCHAR(500) NULL,
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

CREATE TABLE IF NOT EXISTS registrations (
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
