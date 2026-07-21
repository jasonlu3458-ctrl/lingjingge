CREATE TABLE IF NOT EXISTS public.muxintang_bazi_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  user_id uuid REFERENCES public.profiles(id),
  name text NOT NULL,
  gender text NOT NULL,
  year text NOT NULL,
  month text NOT NULL,
  day text NOT NULL,
  hour text,
  result jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.muxintang_chooseday_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  user_id uuid REFERENCES public.profiles(id),
  purpose text NOT NULL,
  date text NOT NULL,
  result jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.muxintang_habitat_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  user_id uuid REFERENCES public.profiles(id),
  house_type text,
  direction text,
  layout jsonb,
  result jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.muxintang_match_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  user_id uuid REFERENCES public.profiles(id),
  person1_name text NOT NULL,
  person1_gender text NOT NULL,
  person1_birth_date text NOT NULL,
  person2_name text NOT NULL,
  person2_gender text NOT NULL,
  person2_birth_date text NOT NULL,
  result jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.muxintang_name_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  user_id uuid REFERENCES public.profiles(id),
  type text NOT NULL,
  gender text,
  birth_date text,
  expectations text,
  results jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.muxintang_trend_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  user_id uuid REFERENCES public.profiles(id),
  year text NOT NULL,
  month text,
  result jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.muxintang_pet_naming_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  user_id uuid REFERENCES public.profiles(id),
  pet_type text NOT NULL,
  gender text,
  birth_date text,
  owner_wish text,
  results jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.muxintang_pet_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  name text NOT NULL,
  description text,
  icon text,
  price numeric,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.muxintang_auspicious_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  name text NOT NULL,
  category text,
  description text,
  price numeric,
  image_url text,
  stock integer DEFAULT 0,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.muxintang_acharyas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  user_id uuid REFERENCES public.profiles(id),
  name text NOT NULL,
  title text,
  bio text,
  expertise text[],
  avatar_url text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.muxintang_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  acharya_id uuid REFERENCES public.muxintang_acharyas(id),
  category text NOT NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text,
  summary text,
  cover_image text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.muxintang_study_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  user_id uuid REFERENCES public.profiles(id),
  article_id uuid REFERENCES public.muxintang_articles(id),
  progress integer DEFAULT 0,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_muxintang_bazi_tenant ON public.muxintang_bazi_records(tenant_id);
CREATE INDEX idx_muxintang_chooseday_tenant ON public.muxintang_chooseday_records(tenant_id);
CREATE INDEX idx_muxintang_habitat_tenant ON public.muxintang_habitat_records(tenant_id);
CREATE INDEX idx_muxintang_match_tenant ON public.muxintang_match_records(tenant_id);
CREATE INDEX idx_muxintang_name_tenant ON public.muxintang_name_records(tenant_id);
CREATE INDEX idx_muxintang_trend_tenant ON public.muxintang_trend_records(tenant_id);
CREATE INDEX idx_muxintang_pet_naming_tenant ON public.muxintang_pet_naming_records(tenant_id);
CREATE INDEX idx_muxintang_pet_services_tenant ON public.muxintang_pet_services(tenant_id);
CREATE INDEX idx_muxintang_auspicious_tenant ON public.muxintang_auspicious_items(tenant_id);
CREATE INDEX idx_muxintang_acharyas_tenant ON public.muxintang_acharyas(tenant_id);
CREATE INDEX idx_muxintang_articles_tenant ON public.muxintang_articles(tenant_id);
CREATE INDEX idx_muxintang_study_tenant ON public.muxintang_study_records(tenant_id);
