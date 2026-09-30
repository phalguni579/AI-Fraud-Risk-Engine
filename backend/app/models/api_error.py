from typing import Any, Dict, Optional

from pydantic import BaseModel


class APIErrorResponse(BaseModel):
    """
    Standard API error response.
    """

    success: bool = False

    error: str

    message: str

    details: Optional[Dict[str, Any]] = None