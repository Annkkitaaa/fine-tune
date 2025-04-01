from typing import Dict, Any, Optional
from pathlib import Path
import os
import logging
import asyncio
import json
import subprocess
import yaml  # Added missing import
from datetime import datetime

logger = logging.getLogger(__name__)

class SpheronService:
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.provider_proxy_url = self.config.get("provider_proxy_url", "http://localhost:3040")
        self.api_key = self.config.get("api_key") or os.environ.get("SPHERON_API_KEY")
        
        if not self.api_key:
            logger.warning("Spheron API key not provided. Some functionality may be limited.")
    
    async def deploy_model(self, model_path: Path, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deploy a model using Spheron Protocol SDK
        """
        try:
            logger.info(f"Deploying model from {model_path} with Spheron")
            
            # Create manifest file
            manifest_path = await self._create_deployment_manifest(model_path, metadata)
            
            # Use the SDK to create deployment
            result = await self._execute_deployment(manifest_path)
            
            return {
                "deployment_id": result.get("id"),
                "status": "pending",
                "provider": "spheron",
                "created_at": datetime.utcnow().isoformat(),
                "metadata": metadata,
                "manifest_path": str(manifest_path),
                "endpoint_url": result.get("url")
            }
            
        except Exception as e:
            logger.error(f"Error deploying model with Spheron: {str(e)}")
            raise
    
    async def _create_deployment_manifest(self, model_path: Path, metadata: Dict[str, Any]) -> Path:
        """
        Create deployment manifest file for Spheron
        """
        manifest = {
            "name": metadata.get("name", "ml-model-deployment"),
            "description": metadata.get("description", "ML model deployed with Spheron"),
            "framework": metadata.get("framework", "tensorflow"),
            "compute": {
                "resources": {
                    "cpu": metadata.get("cpu", 1),
                    "memory": metadata.get("memory", "2Gi"),
                    "gpu": metadata.get("gpu", 0)
                },
                "instances": metadata.get("instances", 1),
                "autoscaling": metadata.get("autoscaling", False)
            },
            "environment": {
                "variables": metadata.get("env_vars", {})
            },
            "storage": {
                "models": [
                    {
                        "path": str(model_path),
                        "mount_path": "/models"
                    }
                ],
                "data": metadata.get("data_mounts", [])
            },
            "ports": [
                {
                    "container_port": 8000,
                    "protocol": "http"
                }
            ]
        }
        
        # Create directory for manifests if it doesn't exist
        manifest_path = Path(f"./spheron-manifests/{metadata.get('name', 'model')}.yaml")
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(manifest_path, "w") as f:
            yaml.dump(manifest, f)
        
        return manifest_path
    
    async def _execute_deployment(self, manifest_path: Path) -> Dict[str, Any]:
        """
        Execute deployment using Spheron SDK through the provider proxy
        """
        # This function would use the SDK to initiate deployment
        cmd = [
            "npx", "spheron", "deploy",
            "--manifest", str(manifest_path),
            "--api-key", self.api_key,
            "--provider-proxy", self.provider_proxy_url
        ]
        
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await proc.communicate()
        
        if proc.returncode != 0:
            logger.error(f"Deployment failed: {stderr.decode()}")
            raise ValueError(f"Deployment failed: {stderr.decode()}")
        
        # Parse the output to get deployment details
        try:
            result = json.loads(stdout.decode())
            return result
        except json.JSONDecodeError:
            # If we can't parse JSON, return some basic info
            return {
                "id": f"spheron-{datetime.utcnow().timestamp()}",
                "status": "pending",
                "url": None,
                "raw_output": stdout.decode()
            }
    
    async def check_deployment_status(self, deployment_id: str) -> Dict[str, Any]:
        """
        Check the status of a deployment
        """
        # This would use the SDK to check deployment status
        cmd = [
            "npx", "spheron", "status",
            "--id", deployment_id,
            "--api-key", self.api_key
        ]
        
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await proc.communicate()
        
        if proc.returncode != 0:
            logger.error(f"Status check failed: {stderr.decode()}")
            raise ValueError(f"Status check failed: {stderr.decode()}")
        
        try:
            # Parse the output to get status details
            status = json.loads(stdout.decode())
            return status
        except json.JSONDecodeError:
            # Return basic status if JSON parsing fails
            return {
                "id": deployment_id,
                "status": "unknown",
                "raw_output": stdout.decode()
            }
    
    async def stop_deployment(self, deployment_id: str) -> Dict[str, Any]:
        """
        Stop a deployment
        """
        # This would use the SDK to stop a deployment
        cmd = [
            "npx", "spheron", "stop",
            "--id", deployment_id,
            "--api-key", self.api_key
        ]
        
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await proc.communicate()
        
        if proc.returncode != 0:
            logger.error(f"Stop deployment failed: {stderr.decode()}")
            raise ValueError(f"Stop deployment failed: {stderr.decode()}")
        
        return {"status": "stopped"}
        
    async def get_deployment_logs(self, deployment_id: str, lines: int = 100) -> Dict[str, Any]:
        """
        Get logs from a deployment
        """
        cmd = [
            "npx", "spheron", "logs",
            "--id", deployment_id,
            "--lines", str(lines),
            "--api-key", self.api_key
        ]
        
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await proc.communicate()
        
        if proc.returncode != 0:
            logger.error(f"Fetching logs failed: {stderr.decode()}")
            raise ValueError(f"Fetching logs failed: {stderr.decode()}")
        
        return {
            "id": deployment_id,
            "logs": stdout.decode()
        }
    
    async def get_deployment_metrics(self, deployment_id: str) -> Dict[str, Any]:
        """
        Get metrics for a deployment
        """
        cmd = [
            "npx", "spheron", "metrics",
            "--id", deployment_id,
            "--api-key", self.api_key
        ]
        
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await proc.communicate()
        
        if proc.returncode != 0:
            logger.error(f"Fetching metrics failed: {stderr.decode()}")
            # Don't raise an exception, just return empty metrics
            return {
                "id": deployment_id,
                "cpu": 0,
                "memory": 0,
                "requests": 0,
                "latency": 0
            }
        
        try:
            metrics = json.loads(stdout.decode())
            return metrics
        except json.JSONDecodeError:
            return {
                "id": deployment_id,
                "cpu": 0,
                "memory": 0,
                "requests": 0,
                "latency": 0
            }
            
    async def update_deployment(self, deployment_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an existing deployment
        """
        try:
            logger.info(f"Updating deployment {deployment_id} with Spheron")
            
            # Create updated manifest file
            model_path = Path(metadata.get("model_path", "./models/default"))
            manifest_path = await self._create_deployment_manifest(model_path, metadata)
            
            # Build update command
            cmd = [
                "npx", "spheron", "update",
                "--id", deployment_id,
                "--manifest", str(manifest_path),
                "--api-key", self.api_key,
                "--provider-proxy", self.provider_proxy_url
            ]
            
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await proc.communicate()
            
            if proc.returncode != 0:
                logger.error(f"Update failed: {stderr.decode()}")
                raise ValueError(f"Update failed: {stderr.decode()}")
            
            try:
                result = json.loads(stdout.decode())
                return {
                    "id": deployment_id,
                    "status": "updating",
                    "updated_at": datetime.utcnow().isoformat(),
                    **result
                }
            except json.JSONDecodeError:
                return {
                    "id": deployment_id,
                    "status": "updating",
                    "updated_at": datetime.utcnow().isoformat(),
                    "raw_output": stdout.decode()
                }
                
        except Exception as e:
            logger.error(f"Error updating deployment with Spheron: {str(e)}")
            raise
            
    async def list_deployments(self) -> Dict[str, Any]:
        """
        List all deployments
        """
        cmd = [
            "npx", "spheron", "list",
            "--api-key", self.api_key
        ]
        
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await proc.communicate()
        
        if proc.returncode != 0:
            logger.error(f"Listing deployments failed: {stderr.decode()}")
            raise ValueError(f"Listing deployments failed: {stderr.decode()}")
        
        try:
            deployments = json.loads(stdout.decode())
            return deployments
        except json.JSONDecodeError:
            return {
                "deployments": [],
                "raw_output": stdout.decode()
            }