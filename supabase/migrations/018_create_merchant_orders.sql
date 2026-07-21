CREATE TABLE IF NOT EXISTS merchant_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB,
  items JSONB NOT NULL,
  polar_checkout_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_orders_user ON merchant_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_orders_status ON merchant_orders(status);
CREATE INDEX IF NOT EXISTS idx_merchant_orders_tenant ON merchant_orders(tenant_id);
