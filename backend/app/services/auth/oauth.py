# oauth.py
from typing import Optional, Dict, Any
import aiohttp
from fastapi import HTTPException, status
from pydantic import BaseModel

from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate

class OAuthProvider(BaseModel):
    name: str
    client_id: str
    client_secret: str
    authorize_url: str
    token_url: str
    userinfo_url: str
    scope: str

class OAuthHandler:
    providers: Dict[str, OAuthProvider] = {
        "google": OAuthProvider(
            name="google",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            authorize_url="https://accounts.google.com/o/oauth2/v2/auth",
            token_url="https://oauth2.googleapis.com/token",
            userinfo_url="https://www.googleapis.com/oauth2/v3/userinfo",
            scope="openid email profile"
        ),
        "github": OAuthProvider(
            name="github",
            client_id=settings.GITHUB_CLIENT_ID,
            client_secret=settings.GITHUB_CLIENT_SECRET,
            authorize_url="https://github.com/login/oauth/authorize",
            token_url="https://github.com/login/oauth/access_token",
            userinfo_url="https://api.github.com/user",
            scope="read:user user:email"
        )
    }

    @classmethod
    def get_provider(cls, provider: str) -> OAuthProvider:
        """
        Get OAuth provider configuration
        """
        if provider not in cls.providers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported OAuth provider: {provider}"
            )
        return cls.providers[provider]

    @classmethod
    async def get_oauth_token(
        cls,
        provider: str,
        code: str,
        redirect_uri: str
    ) -> Dict[str, Any]:
        """
        Exchange authorization code for access token
        """
        provider_config = cls.get_provider(provider)
        
        async with aiohttp.ClientSession() as session:
            params = {
                "client_id": provider_config.client_id,
                "client_secret": provider_config.client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code"
            }
            
            async with session.post(
                provider_config.token_url,
                params=params,
                headers={"Accept": "application/json"}
            ) as response:
                if response.status != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to get OAuth token"
                    )
                return await response.json()

    @classmethod
    async def get_user_info(
        cls,
        provider: str,
        access_token: str
    ) -> Dict[str, Any]:
        """
        Get user information from OAuth provider
        """
        provider_config = cls.get_provider(provider)
        
        async with aiohttp.ClientSession() as session:
            headers = {"Authorization": f"Bearer {access_token}"}
            if provider == "github":
                headers["Accept"] = "application/vnd.github.v3+json"
            
            async with session.get(
                provider_config.userinfo_url,
                headers=headers
            ) as response:
                if response.status != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to get user info"
                    )
                return await response.json()

    @classmethod
    async def authenticate_oauth(
        cls,
        provider: str,
        code: str,
        redirect_uri: str,
        db: Any
    ) -> Optional[User]:
        """
        Authenticate user using OAuth
        """
        # Get OAuth token
        token_data = await cls.get_oauth_token(provider, code, redirect_uri)
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OAuth token response"
            )
        
        # Get user info
        user_info = await cls.get_user_info(provider, access_token)
        
        # Get or create user
        email = user_info.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by OAuth provider"
            )
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Create new user
            user_data = UserCreate(
                email=email,
                full_name=user_info.get("name", ""),
                password=None  # OAuth users don't need password
            )
            user = User(**user_data.dict(exclude={"password"}))
            db.add(user)
            db.commit()
            db.refresh(user)
        
        return user

# Additional utility functions for OAuth flow
def get_oauth_redirect_url(provider: str) -> str:
    """
    Get OAuth authorization URL
    """
    provider_config = OAuthHandler.get_provider(provider)
    
    params = {
        "client_id": provider_config.client_id,
        "redirect_uri": settings.OAUTH_REDIRECT_URI,
        "scope": provider_config.scope,
        "response_type": "code"
    }
    
    # Convert params to URL query string
    query_string = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{provider_config.authorize_url}?{query_string}"