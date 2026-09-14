import datetime
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import User, AuditLog
from ..core import security
from ..schemas.auth import (
    LoginRequest, TokenResponse, UserRead, UserCreate, UserUpdate, ChangePassword,
)
from ..core.security import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_admin, require_write_access,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    if security.PUBLIC_DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff sign-in is disabled in the public demo",
        )
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
    if user.role == "guest":
        raise HTTPException(status_code=400, detail="Use the guest access endpoint")

    token = create_access_token({"sub": str(user.user_id), "role": user.role})

    # Audit login
    db.add(AuditLog(
        user_id=user.user_id,
        action="LOGIN",
        entity="users",
        entity_id=str(user.user_id),
        at=datetime.datetime.now(datetime.UTC).replace(tzinfo=None),
    ))
    db.commit()

    return TokenResponse(access_token=token)


@router.post("/guest", response_model=TokenResponse)
def guest_login(db: Session = Depends(get_db)):
    """Issue a read-only visitor session without asking for credentials."""
    if not security.DEMO_GUEST_ENABLED:
        raise HTTPException(status_code=404, detail="Guest access is not enabled")

    email = "guest@demo.dialycore.local"
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        if security.PUBLIC_DEMO_MODE:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Demo data is unavailable",
            )
        user = User(
            email=email,
            full_name="Guest Visitor",
            password_hash=hash_password("guest-password-login-disabled"),
            role="guest",
            is_active=True,
        )
        db.add(user)
        db.flush()
    if not user.is_active or user.role != "guest":
        raise HTTPException(status_code=403, detail="Guest access is unavailable")

    token = create_access_token({"sub": str(user.user_id), "role": "guest"})
    if security.PUBLIC_DEMO_MODE:
        return TokenResponse(access_token=token)

    db.add(AuditLog(
        user_id=user.user_id,
        action="GUEST_LOGIN",
        entity="users",
        entity_id=str(user.user_id),
        at=datetime.datetime.now(datetime.UTC).replace(tzinfo=None),
        meta_json=json.dumps({"synthetic": True, "read_only": True}),
    ))
    db.commit()
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(body: UserCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if body.role not in ("admin", "doctor", "nurse"):
        raise HTTPException(status_code=400, detail="Role must be admin, doctor, or nurse")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    user = User(
        email=body.email,
        full_name=body.full_name,
        password_hash=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/users", response_model=list[UserRead])
def list_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(User).order_by(User.user_id).all()


@router.patch("/users/{user_id}", response_model=UserRead)
def update_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.role is not None:
        if body.role not in ("admin", "doctor", "nurse"):
            raise HTTPException(status_code=400, detail="Invalid role")
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active
    db.commit()
    db.refresh(user)
    return user


@router.post("/change-password")
def change_password(body: ChangePassword, db: Session = Depends(get_db), current_user: User = Depends(require_write_access)):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"detail": "Password changed successfully"}
