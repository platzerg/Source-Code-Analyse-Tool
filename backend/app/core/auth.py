"""
Supabase authentication middleware and utilities.
"""
from fastapi import Depends, HTTPException, status, Header
from typing import Optional
from app.db.supabase_client import get_supabase


async def get_current_user(
    authorization: Optional[str] = Header(None)
) -> dict:
    """
    Extract and verify JWT token from Authorization header.
    
    Args:
        authorization: Authorization header with Bearer token
        
    Returns:
        User info dict with id, email, etc.
        
    Raises:
        HTTPException: 401 if token is missing or invalid
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Extract token from "Bearer <token>"
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme"
            )
        
        # Verify token with Supabase
        supabase = get_supabase()
        response = supabase.auth.get_user(token)
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Return user as dict
        return {
            "id": response.user.id,
            "email": response.user.email,
            "user_metadata": response.user.user_metadata
        }
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


async def get_optional_user(
    authorization: Optional[str] = Header(None)
) -> Optional[dict]:
    """
    Optional authentication - returns user if token present, None otherwise.
    
    Useful for endpoints that work with or without authentication.
    """
    if not authorization:
        return None
    
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None
