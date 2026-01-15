"""
Apex Learning Platform - Multi-AI Provider Support
===================================================
This module provides a unified interface for multiple free AI APIs:
- Google Gemini (Primary)
- Groq (Free tier with Llama models)
- Cohere (Free tier)

Each provider has its own rate limits and quotas. The system can
automatically failover to backup providers when one is unavailable.
"""

import os
import logging
import time
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from django.conf import settings

logger = logging.getLogger(__name__)


@dataclass
class AIResponse:
    """Standardized response from any AI provider."""
    content: str
    model: str
    provider: str
    tokens_used: int
    response_time_ms: int
    success: bool
    error: Optional[str] = None


class AIProvider(ABC):
    """Abstract base class for AI providers."""
    
    @abstractmethod
    def generate(self, prompt: str, context: str = '', max_tokens: int = 2000) -> AIResponse:
        """Generate a response from the AI."""
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if the provider is available."""
        pass
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name."""
        pass


class GeminiProvider(AIProvider):
    """Google Gemini AI Provider."""
    
    def __init__(self):
        self.api_key = getattr(settings, 'GEMINI_API_KEY', os.getenv('GEMINI_API_KEY', ''))
        self.model_name = 'gemini-2.5-flash'
        self._model = None
    
    @property
    def name(self) -> str:
        return 'gemini'
    
    def _get_model(self):
        if self._model is None and self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._model = genai.GenerativeModel(self.model_name)
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")
        return self._model
    
    def is_available(self) -> bool:
        return bool(self.api_key) and self._get_model() is not None
    
    def generate(self, prompt: str, context: str = '', max_tokens: int = 2000) -> AIResponse:
        start_time = time.time()
        
        try:
            model = self._get_model()
            if not model:
                return AIResponse(
                    content='', model=self.model_name, provider=self.name,
                    tokens_used=0, response_time_ms=0, success=False,
                    error='Gemini not configured'
                )
            
            full_prompt = f"{context}\n\n{prompt}" if context else prompt
            response = model.generate_content(full_prompt)
            
            response_time = int((time.time() - start_time) * 1000)
            
            return AIResponse(
                content=response.text,
                model=self.model_name,
                provider=self.name,
                tokens_used=0,  # Gemini doesn't easily expose token count
                response_time_ms=response_time,
                success=True
            )
            
        except Exception as e:
            logger.error(f"Gemini error: {e}")
            return AIResponse(
                content='', model=self.model_name, provider=self.name,
                tokens_used=0, response_time_ms=int((time.time() - start_time) * 1000),
                success=False, error=str(e)
            )


class GroqProvider(AIProvider):
    """
    Groq AI Provider - Uses Llama models.
    
    Free tier: 14,400 requests/day, 30 requests/minute
    Sign up at: https://console.groq.com/
    """
    
    def __init__(self):
        self.api_key = getattr(settings, 'GROQ_API_KEY', os.getenv('GROQ_API_KEY', ''))
        self.model_name = 'llama-3.3-70b-versatile'  # Free and powerful
        self.api_url = 'https://api.groq.com/openai/v1/chat/completions'
    
    @property
    def name(self) -> str:
        return 'groq'
    
    def is_available(self) -> bool:
        return bool(self.api_key)
    
    def generate(self, prompt: str, context: str = '', max_tokens: int = 2000) -> AIResponse:
        start_time = time.time()
        
        if not self.api_key:
            return AIResponse(
                content='', model=self.model_name, provider=self.name,
                tokens_used=0, response_time_ms=0, success=False,
                error='Groq API key not configured'
            )
        
        try:
            import requests
            
            system_prompt = """You are an AI learning advisor for Apex e-learning platform.

RULES:
- Be CONCISE and direct - aim for 2-4 short paragraphs max
- Use bullet points for lists (max 3-5 items)
- No lengthy explanations - get straight to the point
- Each paragraph should be 1-2 sentences
- Give actionable advice, not general fluff
- Add blank lines between paragraphs for readability

Keep responses brief but helpful."""
            
            if context:
                system_prompt += f"\n\nAdditional context: {context}"
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'model': self.model_name,
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': prompt}
                ],
                'max_tokens': max_tokens,
                'temperature': 0.7
            }
            
            response = requests.post(self.api_url, json=data, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            content = result['choices'][0]['message']['content']
            tokens = result.get('usage', {}).get('total_tokens', 0)
            
            response_time = int((time.time() - start_time) * 1000)
            
            return AIResponse(
                content=content,
                model=self.model_name,
                provider=self.name,
                tokens_used=tokens,
                response_time_ms=response_time,
                success=True
            )
            
        except Exception as e:
            logger.error(f"Groq error: {e}")
            return AIResponse(
                content='', model=self.model_name, provider=self.name,
                tokens_used=0, response_time_ms=int((time.time() - start_time) * 1000),
                success=False, error=str(e)
            )


class CohereProvider(AIProvider):
    """
    Cohere AI Provider.
    
    Free tier: 1000 API calls/month for trial
    Sign up at: https://dashboard.cohere.com/
    """
    
    def __init__(self):
        self.api_key = getattr(settings, 'COHERE_API_KEY', os.getenv('COHERE_API_KEY', ''))
        self.model_name = 'command-r'
        self.api_url = 'https://api.cohere.ai/v1/chat'
    
    @property
    def name(self) -> str:
        return 'cohere'
    
    def is_available(self) -> bool:
        return bool(self.api_key)
    
    def generate(self, prompt: str, context: str = '', max_tokens: int = 2000) -> AIResponse:
        start_time = time.time()
        
        if not self.api_key:
            return AIResponse(
                content='', model=self.model_name, provider=self.name,
                tokens_used=0, response_time_ms=0, success=False,
                error='Cohere API key not configured'
            )
        
        try:
            import requests
            
            preamble = """You are an expert AI learning advisor for Apex, an advanced e-learning platform.
Your role is to provide helpful, encouraging, and practical study advice.
Keep responses concise but informative. Be friendly and professional."""
            
            if context:
                preamble += f"\n\nAdditional context: {context}"
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'model': self.model_name,
                'message': prompt,
                'preamble': preamble,
                'max_tokens': max_tokens,
                'temperature': 0.7
            }
            
            response = requests.post(self.api_url, json=data, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            content = result.get('text', '')
            tokens = result.get('meta', {}).get('tokens', {}).get('output_tokens', 0)
            
            response_time = int((time.time() - start_time) * 1000)
            
            return AIResponse(
                content=content,
                model=self.model_name,
                provider=self.name,
                tokens_used=tokens,
                response_time_ms=response_time,
                success=True
            )
            
        except Exception as e:
            logger.error(f"Cohere error: {e}")
            return AIResponse(
                content='', model=self.model_name, provider=self.name,
                tokens_used=0, response_time_ms=int((time.time() - start_time) * 1000),
                success=False, error=str(e)
            )


class AIProviderManager:
    """
    Manages multiple AI providers with automatic failover.
    
    Tries providers in order of preference, falling back to
    the next one if the current one fails.
    """
    
    def __init__(self):
        self.providers: Dict[str, AIProvider] = {
            'gemini': GeminiProvider(),
            'groq': GroqProvider(),
            'cohere': CohereProvider(),
        }
        self.default_order = ['gemini', 'groq', 'cohere']
    
    def get_provider(self, name: str) -> Optional[AIProvider]:
        """Get a specific provider by name."""
        return self.providers.get(name)
    
    def get_available_providers(self) -> List[str]:
        """Get list of available providers."""
        return [name for name, provider in self.providers.items() if provider.is_available()]
    
    def generate(
        self, 
        prompt: str, 
        context: str = '',
        preferred_provider: str = 'auto',
        max_tokens: int = 2000
    ) -> AIResponse:
        """
        Generate response using best available provider.
        
        Args:
            prompt: The user's message
            context: Additional context
            preferred_provider: Specific provider or 'auto' for failover
            max_tokens: Maximum tokens for response
        
        Returns:
            AIResponse with the result
        """
        
        # Determine provider order
        if preferred_provider == 'auto':
            provider_order = self.default_order
        else:
            # Put preferred provider first, then others as fallback
            provider_order = [preferred_provider] + [p for p in self.default_order if p != preferred_provider]
        
        last_error = None
        
        for provider_name in provider_order:
            provider = self.providers.get(provider_name)
            
            if not provider or not provider.is_available():
                continue
            
            logger.info(f"Trying AI provider: {provider_name}")
            response = provider.generate(prompt, context, max_tokens)
            
            if response.success:
                logger.info(f"Success with {provider_name} in {response.response_time_ms}ms")
                return response
            
            last_error = response.error
            logger.warning(f"Provider {provider_name} failed: {response.error}")
        
        # All providers failed - return mock response
        return self._get_mock_response(prompt, last_error)
    
    def _get_mock_response(self, question: str, error: Optional[str] = None) -> AIResponse:
        """Provide fallback mock response when all providers fail."""
        
        responses = {
            'learn': "Great question! The key to effective learning is consistency. Try setting aside dedicated study time each day, even if it's just 30 minutes. Break complex topics into smaller chunks and practice active recall by testing yourself regularly.",
            'career': "Career development in tech requires both technical skills and soft skills. Focus on building a strong foundation in your chosen area, contribute to open-source projects, and don't underestimate the power of networking.",
            'focus': "Maintaining focus while studying can be challenging. Try the Pomodoro Technique (25 minutes of focused work, 5-minute break), eliminate distractions, and use our Focus Mode feature to track your attention!",
            'default': "That's a great question! I'd recommend breaking down your learning goals into smaller, achievable milestones. Consistent practice is key, and our platform offers many courses that can help you on your learning journey. Would you like me to recommend some courses based on your interests?"
        }
        
        question_lower = question.lower()
        
        if any(word in question_lower for word in ['learn', 'study', 'understand']):
            answer = responses['learn']
        elif any(word in question_lower for word in ['career', 'job', 'work']):
            answer = responses['career']
        elif any(word in question_lower for word in ['focus', 'concentrate', 'distract']):
            answer = responses['focus']
        else:
            answer = responses['default']
        
        if error:
            answer += f"\n\n(Note: AI providers are currently unavailable. This is a fallback response.)"
        
        return AIResponse(
            content=answer,
            model='mock',
            provider='fallback',
            tokens_used=0,
            response_time_ms=0,
            success=True,
            error=error
        )


# Singleton instance
_ai_manager: Optional[AIProviderManager] = None

def get_ai_manager() -> AIProviderManager:
    """Get the singleton AI manager instance."""
    global _ai_manager
    if _ai_manager is None:
        _ai_manager = AIProviderManager()
    return _ai_manager
