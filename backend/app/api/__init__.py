from .auth import router as auth_router
from .patients import router as patients_router
from .sessions import router as sessions_router
from .clinical import router as clinical_router

__all__ = ["auth_router", "patients_router", "sessions_router", "clinical_router"]
