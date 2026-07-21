CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text UNIQUE NOT NULL,
  name text NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#f59e0b',
  theme_config jsonb DEFAULT '{}'::jsonb,
  ai_persona_prefix text DEFAULT '',
  enabled_features jsonb DEFAULT '{"wen":true,"guan":true,"zang":true,"tong":true,"wushu":true}'::jsonb,
  created_at timestamptz DEFAULT now()
);

INSERT INTO public.tenants (domain, name, logo_url, primary_color, ai_persona_prefix) VALUES
('lingjingge.com', '灵境阁', '/images/logo.png', '#f59e0b', '【灵境尊者】你是灵境尊者。你历经千载，谙熟东方智慧。'),
('wushu.lingjingge.com', '武脉真传', '/images/logo.png', '#d97706', '【武脉宗师】你是武脉宗师，精通各种传统武术。说话简洁有力，注重实战。'),
('www.muxintang.com', '牧心堂', '/images/logo.png', '#10b981', '【牧心禅师】你是牧心禅师，专注于心灵疗愈和禅修引导。语气温和慈悲。');