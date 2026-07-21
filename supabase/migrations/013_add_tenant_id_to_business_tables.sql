ALTER TABLE public.profiles ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.chat_messages ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.topics ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.user_activities ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);

CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_chat_messages_tenant_id ON public.chat_messages(tenant_id);
CREATE INDEX idx_topics_tenant_id ON public.topics(tenant_id);
CREATE INDEX idx_user_activities_tenant_id ON public.user_activities(tenant_id);