import os
from typing import Any, Dict, Optional

from dotenv import load_dotenv

from backend.app.services.agent_prompt_service import (
    build_agent_prompt,
)


load_dotenv()


class LLMService:
    """
    Abstraction layer for the Large Language Model.

    The rest of the application does not need to know
    which LLM provider is being used.

    Later this can be connected to an actual LLM API
    without changing the Risk Agent architecture.
    """

    def __init__(self):
        self.provider = os.getenv(
            "LLM_PROVIDER",
            "openai",
        )

        self.model = os.getenv(
            "LLM_MODEL",
            "gpt-5.6",
        )

        self.api_key = os.getenv(
            "LLM_API_KEY"
        )

    def is_configured(self) -> bool:
        """
        Checks whether an LLM API key is available.
        """

        return bool(self.api_key)

    def generate(
        self,
        investigation: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Generates an AI assessment.

        The actual provider call will be connected
        after the core application is stable.
        """

        prompt = build_agent_prompt(
            investigation
        )

        if not self.is_configured():

            return {
                "status": "not_configured",
                "provider": self.provider,
                "model": self.model,
                "message": (
                    "LLM provider is not configured. "
                    "Deterministic risk analysis remains available."
                ),
                "prompt_preview": prompt,
            }

        return {
            "status": "ready",
            "provider": self.provider,
            "model": self.model,
            "message": (
                "LLM configuration detected. "
                "Provider integration is ready."
            ),
        }


llm_service = LLMService()


def generate_ai_assessment(
    investigation: Dict[str, Any],
) -> Dict[str, Any]:

    return llm_service.generate(
        investigation
    )