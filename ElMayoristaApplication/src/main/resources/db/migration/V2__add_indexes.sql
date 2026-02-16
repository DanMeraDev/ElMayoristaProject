-- =============================================
-- V2: Performance Indexes
-- =============================================

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_seller_id ON sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_order_date ON sales(order_date);
CREATE INDEX IF NOT EXISTS idx_sales_commission_settled ON sales(commission_settled, status);

-- Sale details indexes
CREATE INDEX IF NOT EXISTS idx_sale_details_sale_id ON sale_details(sale_id);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_registered_by ON payments(registered_by);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications(reference_id, type);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_registered_by ON customers(registered_by);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- Customer fiados indexes
CREATE INDEX IF NOT EXISTS idx_customer_fiados_customer_id ON customer_fiados(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_fiados_seller_id ON customer_fiados(seller_id);
CREATE INDEX IF NOT EXISTS idx_customer_fiados_status ON customer_fiados(status);

-- Fiados indexes
CREATE INDEX IF NOT EXISTS idx_fiados_seller_id ON fiados(seller_id);
CREATE INDEX IF NOT EXISTS idx_fiados_status ON fiados(status);

-- Support tickets indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_seller_id ON support_tickets(seller_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_pending_approval ON users(pending_approval);
CREATE INDEX IF NOT EXISTS idx_users_enabled ON users(enabled);
