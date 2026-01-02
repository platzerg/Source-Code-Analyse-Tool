"""
Authentication endpoints for user signup, signin, and management.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.db.supabase_client import get_supabase
from app.core.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["authentication"])


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: dict


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignUpRequest):
    """
    Register a new user.
    
    Creates a new user account with email and password.
    User will receive a confirmation email if email confirmation is enabled.
    """
    supabase = get_supabase()
    
    try:
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "full_name": request.full_name
                }
            }
        })
        
        if not response.session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User created but email confirmation required"
            )
        
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "user_metadata": response.user.user_metadata
            }
        }
        
    except Exception as e:
        error_message = str(e)
        if "already registered" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )


@router.post("/signin", response_model=AuthResponse)
async def signin(request: SignInRequest):
    """
    Sign in an existing user.
    
    Returns access token and refresh token for authenticated requests.
    """
    supabase = get_supabase()
    
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "user_metadata": response.user.user_metadata
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )


@router.post("/signout")
async def signout(user: dict = Depends(get_current_user)):
    """
    Sign out the current user.
    
    Invalidates the current session.
    """
    supabase = get_supabase()
    try:
        supabase.auth.sign_out()
        return {"message": "Signed out successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sign out failed: {str(e)}"
        )


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """
    Get current authenticated user information.
    
    Returns user profile data.
    """
    return user


@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """
    Refresh access token using refresh token.
    
    Returns new access token and refresh token.
    """
    supabase = get_supabase()
    
    try:
        response = supabase.auth.refresh_session(refresh_token)
        
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
