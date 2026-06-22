from langchain_openai import ChatOpenAI
from app.config import settings

def get_llm(temperature: float = 0.0, json_mode: bool = False):
    # Initialize using Gemini API key and its OpenAI-compatible endpoint
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "mock-gemini-key" and settings.GEMINI_API_KEY.strip() != "":
        model_kwargs = {"response_format": {"type": "json_object"}} if json_mode else {}
        return ChatOpenAI(
            model="gemini-3.5-flash",
            temperature=temperature,
            openai_api_key=settings.GEMINI_API_KEY,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            model_kwargs=model_kwargs
        )
    return None
