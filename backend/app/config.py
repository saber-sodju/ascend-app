from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    FIRST_USER_EMAIL: str = "admin@life.local"
    FIRST_USER_PASSWORD: str = "admin123"
    FIRST_USER_USERNAME: str = "admin"
    FIRST_USER_FULLNAME: str = "My Life Manager"

    class Config:
        env_file = ".env"


settings = Settings()
