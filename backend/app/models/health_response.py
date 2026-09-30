from typing import Dict

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """
    Standard health-check response.
    """

    status: str

    service: str

    version: str

    components: Dict[str, str]