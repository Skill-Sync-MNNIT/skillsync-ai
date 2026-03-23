import fitz                     
import numpy as np
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from config import settings
from services.pinecone_repo import PineconeRepository


class EmbeddingService:
    def __init__(self):
        self.embedder =  GoogleGenerativeAIEmbeddings(
            model=settings.embedding_model,
            google_api_key=settings.gemini_api_key
        )

        self.splitter=RecursiveCharacterTextSplitter(
            chunk_size=512,
            chunk_overlap=50,
            length_function=len
        )

        self.repo=PineconeRepository()
    
    def extract_text(self, pdf_bytes:bytes) -> str:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = "".join(page.get_text() for page in doc)
        doc.close()
        return text.strip()

    def chunk_text(self, text:str) -> list[str]:
        return self.splitter.split_text(text)

    def embed_chunks(self, chunks:list[str]) -> list[list[float]]:
        return self.embedder.embed_documents(chunks)

    def mean_pool(self,vectors: list[list[float]]) -> list[float]:
        if not vectors:
            return []
        return np.array(vectors).mean(axis=0).tolist()

    async def process_resume(
        self, 
        user_id: str, 
        pdf_bytes:bytes,
        metadata:dict | None = None 
    ) ->dict:
        text = self.extract_text(pdf_bytes)
        if not text:
            raise ValueError("No text found in PDF")
        
        chunks = self.chunk_text(text)
        
        if not chunks:
            raise ValueError("No chunks found in PDF")
        
        vectors = self.embed_chunks(chunks)
        final_vector = self.mean_pool(vectors)
        
        self.repo.upsert(
            user_id=user_id,
            vector=final_vector,
            metadata=metadata or {},
        )

        return {
            "user_id": user_id,
            "chunks" : len(chunks),
            "vector_dims" : len(final_vector),
        }
    
    async def delete_from_vector_db(self, user_id:str) -> None:
        self.repo.delete(user_id)
        
        

    