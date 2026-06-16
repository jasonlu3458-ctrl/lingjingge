-- 008_add_consent_to_profiles.sql
-- 在 profiles 表中记录用户同意免责声明的时间戳（用于法律证据）
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS consent_given_at timestamptz;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS consent_version text DEFAULT 'v1.0';

-- 注释
COMMENT ON COLUMN profiles.consent_given_at IS '用户同意免责声明的时间';
COMMENT ON COLUMN profiles.consent_version  IS '免责声明版本号';
