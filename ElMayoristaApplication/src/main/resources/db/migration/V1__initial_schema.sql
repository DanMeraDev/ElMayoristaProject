-- =============================================
-- V1: Initial Schema - El Mayorista
-- =============================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255),
    phone_number    VARCHAR(20) UNIQUE,
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    pending_approval BOOLEAN DEFAULT TRUE,
    commission_percentage DECIMAL(5, 2) DEFAULT 5.00,
    can_credit_self     BOOLEAN DEFAULT FALSE,
    can_credit_customers BOOLEAN DEFAULT FALSE,
    reset_password_token VARCHAR(255),
    reset_password_token_expiry TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP
);

-- 2. USER_ROLES TABLE (ElementCollection)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role    VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role)
);

-- 3. SALES TABLE
CREATE TABLE IF NOT EXISTS sales (
    id                  BIGSERIAL PRIMARY KEY,
    seller_id           UUID NOT NULL REFERENCES users(id),
    order_number        VARCHAR(255) UNIQUE,
    customer_name       VARCHAR(255) NOT NULL,
    customer_id_number  VARCHAR(255),
    customer_address    TEXT,
    customer_city       VARCHAR(255),
    customer_phone      VARCHAR(255),
    customer_email      VARCHAR(255),
    subtotal            DECIMAL(12, 2) NOT NULL,
    shipping            DECIMAL(12, 2) DEFAULT 0,
    total               DECIMAL(12, 2) NOT NULL,
    commission_amount   DECIMAL(12, 2) DEFAULT 0,
    commission_percentage DECIMAL(5, 2) DEFAULT 0,
    sale_type           VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    tv_serial_number    VARCHAR(255),
    tv_model            VARCHAR(255),
    status              VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    payment_status      VARCHAR(50) NOT NULL DEFAULT 'UNPAID',
    order_date          TIMESTAMP NOT NULL,
    report_pdf_url      TEXT,
    rejection_reason    VARCHAR(255),
    commission_settled  BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP
);

-- 4. SALE_DETAILS TABLE
CREATE TABLE IF NOT EXISTS sale_details (
    id          BIGSERIAL PRIMARY KEY,
    sale_id     BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    sku         VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity    DECIMAL NOT NULL,
    unit_price  DECIMAL NOT NULL,
    subtotal    DECIMAL NOT NULL
);

-- 5. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id              BIGSERIAL PRIMARY KEY,
    sale_id         BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    amount          DECIMAL NOT NULL,
    payment_method  VARCHAR(50) NOT NULL,
    payment_date    TIMESTAMP DEFAULT NOW(),
    registered_by   UUID NOT NULL REFERENCES users(id),
    receipt_url     VARCHAR(255),
    notes           VARCHAR(255)
);

-- 6. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id              BIGSERIAL PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    id_number       VARCHAR(20),
    phone_number    VARCHAR(20),
    status          VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    rejection_reason VARCHAR(255),
    registered_by   UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP
);

-- 7. CUSTOMER_FIADOS TABLE
CREATE TABLE IF NOT EXISTS customer_fiados (
    id              BIGSERIAL PRIMARY KEY,
    customer_id     BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    seller_id       UUID NOT NULL REFERENCES users(id),
    item_name       VARCHAR(200) NOT NULL,
    price           DECIMAL(12, 2) NOT NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    settled_in_cycle BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP
);

-- 8. FIADOS TABLE
CREATE TABLE IF NOT EXISTS fiados (
    id              BIGSERIAL PRIMARY KEY,
    seller_id       UUID NOT NULL REFERENCES users(id),
    item_name       VARCHAR(200) NOT NULL,
    price           DECIMAL(12, 2) NOT NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    settled_in_cycle BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    message         VARCHAR(255) NOT NULL,
    reference_id    BIGINT,
    reference_date  TIMESTAMP,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    last_email_sent_at TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- 10. SUPPORT_TICKETS TABLE
CREATE TABLE IF NOT EXISTS support_tickets (
    id              BIGSERIAL PRIMARY KEY,
    seller_id       UUID NOT NULL REFERENCES users(id),
    type            VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    status          VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    subject         VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    admin_notes     TEXT,
    resolved_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP
);

-- 11. CYCLES TABLE
CREATE TABLE IF NOT EXISTS cycles (
    id              BIGSERIAL PRIMARY KEY,
    start_date      TIMESTAMP NOT NULL,
    end_date        TIMESTAMP NOT NULL,
    total_sales     DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_commissions DECIMAL(12, 2) NOT NULL DEFAULT 0,
    sales_count     INTEGER NOT NULL DEFAULT 0,
    excel_report_url TEXT,
    status          VARCHAR(50) NOT NULL DEFAULT 'CLOSED',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP
);
