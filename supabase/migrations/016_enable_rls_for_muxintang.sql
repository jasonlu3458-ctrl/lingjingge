ALTER TABLE public.muxintang_bazi_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户数据隔离_muxintang_bazi_records" ON public.muxintang_bazi_records
USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

ALTER TABLE public.muxintang_chooseday_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户数据隔离_muxintang_chooseday_records" ON public.muxintang_chooseday_records
USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

ALTER TABLE public.muxintang_habitat_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户数据隔离_muxintang_habitat_records" ON public.muxintang_habitat_records
USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

ALTER TABLE public.muxintang_match_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户数据隔离_muxintang_match_records" ON public.muxintang_match_records
USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

ALTER TABLE public.muxintang_name_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户数据隔离_muxintang_name_records" ON public.muxintang_name_records
USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

ALTER TABLE public.muxintang_trend_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户数据隔离_muxintang_trend_records" ON public.muxintang_trend_records
USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

ALTER TABLE public.muxintang_pet_naming_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户数据隔离_muxintang_pet_naming_records" ON public.muxintang_pet_naming_records
USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

ALTER TABLE public.muxintang_pet_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户数据隔离_muxintang_pet_services" ON public.muxintang_pet_services
USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

ALTER TABLE public.muxintang_auspicious_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户数据隔离_muxintang_auspicious_items" ON public.muxintang_auspicious_items
USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

ALTER TABLE public.muxintang_acharyas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户数据隔离_muxintang_acharyas" ON public.muxintang_acharyas
USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

ALTER TABLE public.muxintang_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户数据隔离_muxintang_articles" ON public.muxintang_articles
USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

ALTER TABLE public.muxintang_study_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户数据隔离_muxintang_study_records" ON public.muxintang_study_records
USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));
