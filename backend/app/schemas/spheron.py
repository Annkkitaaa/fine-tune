from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class SpheronConfig(BaseModel):
    api_key: Optional[str] = None
    provider_proxy_url: str = "http://localhost:3040"
    organization_id: Optional[str] = None

class SpheronDeploymentConfig(BaseModel):
    instances: int = 1
    cpu: int = 1
    memory: int = 2
    gpu: int = 0
    autoscaling: bool = False
    env_vars: Dict[str, str] = {}
    
class SpheronDeploymentCreate(BaseModel):
    model_config = {"protected_namespaces": ()}

    name: str
    description: Optional[str] = None
    model_id: int
    config: SpheronDeploymentConfig