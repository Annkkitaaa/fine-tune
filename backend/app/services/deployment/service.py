from typing import Dict, Any, Optional
from pathlib import Path
import logging
from fastapi import HTTPException
from app.services.deployment.spheron_service import SpheronService

logger = logging.getLogger(__name__)

class ModelDeploymentService:
    def __init__(
        self,
        model_path: str,
        preprocessor_path: str,
        framework: str,
        config: Optional[Dict[str, Any]] = None
    ):
        self.model_path = Path(model_path)
        self.preprocessor_path = Path(preprocessor_path)
        self.framework = framework.lower()
        self.config = config or {}
        
        # Initialize Spheron service for deployment
        self.spheron_service = SpheronService(config.get("spheron_config", {}))
        
        self.model = None
        self.preprocessor = None
    
    async def deploy_with_spheron(self) -> Dict[str, Any]:
        """
        Deploy model using Spheron Protocol
        """
        try:
            metadata = {
                "name": self.config.get("name", f"model-{self.framework}"),
                "description": self.config.get("description", "ML model deployment"),
                "framework": self.framework,
                "cpu": self.config.get("cpu", 1),
                "memory": self.config.get("memory", 2),
                "instances": self.config.get("instances", 1),
                "env_vars": self.config.get("env_vars", {})
            }
            
            # Deploy using Spheron
            deployment = await self.spheron_service.deploy_model(
                self.model_path, 
                metadata
            )
            
            return deployment
            
        except Exception as e:
            logger.error(f"Error deploying with Spheron: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Spheron deployment error: {str(e)}"
            )
    
    async def check_deployment_status(self, deployment_id: str) -> Dict[str, Any]:
        """
        Check status of Spheron deployment
        """
        try:
            status = await self.spheron_service.check_deployment_status(deployment_id)
            return status
        except Exception as e:
            logger.error(f"Error checking deployment status: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error checking deployment status: {str(e)}"
            )