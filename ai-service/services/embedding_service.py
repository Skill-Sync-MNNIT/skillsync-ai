import fitz                     
import numpy as np
import json
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

from config import settings
from services.pinecone_repo import PineconeRepository

SKILL_EXTRACTION_PROMPT = PromptTemplate.from_template(
    "Extract all technical and professional skills from the following resume text.\n"
    "Return ONLY a valid JSON array of skill strings, nothing else.\n"
    "Example format: [\"Python\", \"FastAPI\", \"Machine Learning\"]\n\n"
    "Resume text:\n{text}"
)


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

        # LLM chain for skill extraction (Groq – free tier)
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=settings.groq_api_key,
            temperature=0.1,
        )
        self.skill_chain = SKILL_EXTRACTION_PROMPT | llm | StrOutputParser()

    async def extract_skills(self, text: str) -> list[str]:
        """Use Gemini to extract skills from resume text."""
        try:
            snippet = text
            raw = await self.skill_chain.ainvoke({"text": snippet})
            raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            skills = json.loads(raw)
            if isinstance(skills, list):
                return [s.strip() for s in skills if isinstance(s, str) and s.strip()]
        except Exception as e:
            print(f"[EmbeddingService] Skill extraction failed: {e}")
        return []
    
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
        
        # Auto-extract skills from resume text
        extracted_skills = await self.extract_skills(text)

        meta = metadata or {}
        provided_skills = meta.get("skills", [])
        merged_skills = list(dict.fromkeys(extracted_skills + provided_skills))
        meta["skills"] = merged_skills
        vectors = self.embed_chunks(chunks)
        final_vector = self.mean_pool(vectors)
        
        self.repo.upsert(
            user_id=user_id,
            vector=final_vector,
            metadata=meta,
        )

        return {
            "user_id": user_id,
            "chunks" : len(chunks),
            "vector_dims" : len(final_vector),
            "skills_extracted": merged_skills,
        }
    
    async def delete_from_vector_db(self, user_id:str) -> None:
        self.repo.delete(user_id)
        
        

    