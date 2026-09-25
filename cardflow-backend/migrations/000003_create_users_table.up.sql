-- Migration Up: Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'cardholder',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert default user usr-001 (Le Huynh Thuan)
-- Password: Password123@ (bcrypt hash: $2a$10$7Z01yV/z31R11ZfTeq4Rk.hIqG7gC8oYVb4M/H28iI65Kz3dI3mvy)
INSERT INTO users (id, email, password_hash, full_name, phone, role)
VALUES (
    'usr-001',
    'thuan@cardflow.io',
    '$2a$10$7Z01yV/z31R11ZfTeq4Rk.hIqG7gC8oYVb4M/H28iI65Kz3dI3mvy',
    'LÊ HUỲNH THUẬN',
    '0901234567',
    'admin'
)
ON CONFLICT (id) DO NOTHING;
