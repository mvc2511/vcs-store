from supabase import create_client

from app.core.config import settings

# Cliente con anon key — usado SOLO para lecturas públicas
supabase_anon = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

# Cliente con service_role — rompe RLS, solo para escritura de órdenes
supabase_admin = create_client(
    settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
)
