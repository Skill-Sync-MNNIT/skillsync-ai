import os
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_PATH,   # points to root .env robustly
        extra="ignore",       # silently skip any unrecognised env vars
    )

    gemini_api_key: str
    gemini_api_key_2: str = ""
    pinecone_api_key: str
    pinecone_index: str = "mnnit-student-embeddings"
    embedding_model: str = "gemini-embedding-001"
    llm_model: str = "gemini-2.0-flash-lite"
    top_k_results: int = 10
    mongo_uri: str

    groq_api_key: str = ""
    groq_api_key_2: str = ""
    backend_url: str = "https://skillsync-ai-txfw.onrender.com"
    internal_secret: str = ""
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""    

settings = Settings()
