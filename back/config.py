import pydantic as pyd
from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    model_config: SettingsConfigDict = SettingsConfigDict(env_file=".env")

    postgresql_dns: pyd.PostgresDsn


config = Config()
