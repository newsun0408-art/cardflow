-- Migration Up: Create cards & transactions tables
CREATE TABLE IF NOT EXISTS cards (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    card_number VARCHAR(19) NOT NULL,
    card_holder VARCHAR(255) NOT NULL,
    expiry VARCHAR(5) NOT NULL,
    cvv VARCHAR(4) NOT NULL,
    balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    card_type VARCHAR(20) NOT NULL DEFAULT 'CREDIT',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    spending_limit NUMERIC(18, 2) NOT NULL DEFAULT 50000000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY,
    card_id VARCHAR(36) REFERENCES cards(id) ON DELETE SET NULL,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    type VARCHAR(10) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card_id ON transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- Seed Initial Data for user 'usr-001'
INSERT INTO cards (id, user_id, card_number, card_holder, expiry, cvv, balance, currency, card_type, status, spending_limit)
VALUES 
    ('card-001', 'usr-001', '4123 4567 8901 2345', 'LE HUYNH THUAN', '12/28', '888', 125450000, 'VND', 'BLACK_TITANIUM', 'ACTIVE', 200000000),
    ('card-002', 'usr-001', '5234 5678 9012 3456', 'LE HUYNH THUAN', '08/27', '321', 48200000, 'VND', 'NEON_CYBER', 'ACTIVE', 100000000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transactions (id, card_id, user_id, title, amount, type, category, status, created_at)
VALUES
    ('tx-001', 'card-001', 'usr-001', 'MacBook Pro M3 Max', 17100000, 'EXPENSE', 'TECHNOLOGY', 'SUCCESS', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('tx-002', 'card-001', 'usr-001', 'Tiền thuê căn hộ Vinhomes', 2400000, 'EXPENSE', 'HOUSING', 'SUCCESS', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('tx-003', 'card-001', 'usr-001', 'Đăng ký GrabCar Tháng', 145000, 'EXPENSE', 'TRANSPORT', 'SUCCESS', CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('tx-004', 'card-001', 'usr-001', 'Lương tháng 09/2026', 45000000, 'INCOME', 'OTHER', 'SUCCESS', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('tx-005', 'card-001', 'usr-001', 'Tiệc tối gia đình Haidilao', 505000, 'EXPENSE', 'FOOD', 'SUCCESS', CURRENT_TIMESTAMP - INTERVAL '6 days')
ON CONFLICT (id) DO NOTHING;
