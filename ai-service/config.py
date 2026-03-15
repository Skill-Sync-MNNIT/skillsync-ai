from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env",   # points to root .env
        extra="ignore",       # silently skip any unrecognised env vars
    )

    gemini_api_key: str
    pinecone_api_key: str
    pinecone_index: str = "mnnit-student-embeddings"
    embedding_model: str = "gemini-embedding-001"
    llm_model: str = "gemini-1.5-flash"
    top_k_results: int = 10

settings = Settings()
