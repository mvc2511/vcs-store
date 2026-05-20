from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    APP_NAME: str = "VCS Store"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""

    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@vyro.boutique"
    EMAIL_FROM_NAME: str = "VYRO Boutique"


settings = Settings()
