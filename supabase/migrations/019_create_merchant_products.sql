CREATE TABLE IF NOT EXISTS merchant_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'default',
  status TEXT DEFAULT 'active',
  product_type TEXT DEFAULT 'physical',
  stock_quantity INTEGER DEFAULT -1,
  digital_file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_products_tenant ON merchant_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_products_category ON merchant_products(category);
CREATE INDEX IF NOT EXISTS idx_merchant_products_status ON merchant_products(status);
