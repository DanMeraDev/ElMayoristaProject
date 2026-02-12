-- Agregar columnas de permisos de crédito a la tabla users
-- Ejecutar este script en la base de datos para agregar las nuevas columnas

ALTER TABLE users ADD COLUMN can_credit_self BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN can_credit_customers BOOLEAN DEFAULT FALSE;

-- Opcional: Actualizar vendedores existentes si se desea darles permisos por defecto
-- UPDATE users SET can_credit_self = TRUE WHERE role = 'SELLER';
-- UPDATE users SET can_credit_customers = TRUE WHERE role = 'SELLER';
