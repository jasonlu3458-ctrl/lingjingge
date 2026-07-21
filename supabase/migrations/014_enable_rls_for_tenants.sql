ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户数据隔离_profiles" ON public.profiles
USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户数据隔离_chat_messages" ON public.chat_messages
USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户数据隔离_topics" ON public.topics
USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户数据隔离_user_activities" ON public.user_activities
USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));