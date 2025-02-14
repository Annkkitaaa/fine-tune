from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from typing import Dict, Any, List, Optional
import logging
import json
from pathlib import Path
import asyncio
import torch
import tensorflow as tf
from datetime import datetime

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
        
        self.model = None
        self.preprocessor = None
        self.app = FastAPI()
        self.setup_middleware()
        self.setup_routes()
        
        # Initialize metrics tracking
        self.metrics = {
            'total_requests': 0,
            'successful_predictions': 0,
            'failed_predictions': 0,
            'average_latency': 0,
            'last_error': None
        }
    
    def setup_middleware(self):
        """Setup middleware for the FastAPI application"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    def setup_routes(self):
        """Setup API routes"""
        @self.app.post("/predict")
        async def predict(request: Dict[str, Any]):
            return await self._handle_prediction(request)
        
        @self.app.get("/health")
        async def health():
            return {
                "status": "healthy",
                "model_framework": self.framework,
                "metrics": self.metrics
            }
        
        @self.app.get("/metadata")
        async def metadata():
            return await self._get_metadata()
    
    async def _handle_prediction(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle prediction request with metrics tracking"""
        start_time = datetime.now()
        self.metrics['total_requests'] += 1
        
        try:
            # Validate input
            if 'data' not in request:
                raise HTTPException(status_code=400, detail="No data provided")
            
            # Preprocess data
            processed_data = await self._preprocess_data(request['data'])
            
            # Make prediction
            prediction = await self._predict(processed_data)
            
            # Update metrics
            self.metrics['successful_predictions'] += 1
            latency = (datetime.now() - start_time).total_seconds()
            self.metrics['average_latency'] = (
                (self.metrics['average_latency'] * (self.metrics['successful_predictions'] - 1) + latency)
                / self.metrics['successful_predictions']
            )
            
            return {
                "prediction": prediction.tolist(),
                "metadata": {
                    "latency": latency,
                    "model_version": self.config.get('model_version', 'unknown')
                }
            }
            
        except Exception as e:
            self.metrics['failed_predictions'] += 1
            self.metrics['last_error'] = str(e)
            logger.error(f"Prediction error: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def _preprocess_data(self, data: List[Any]) -> np.ndarray:
        """Preprocess input data"""
        try:
            # Convert input to numpy array
            if isinstance(data, list):
                data = np.array(data)
            
            # Apply preprocessing
            if self.preprocessor:
                data, _ = await self.preprocessor.process_pipeline(data)
            
            return data
            
        except Exception as e:
            logger.error(f"Preprocessing error: {str(e)}")
            raise
    
    async def _predict(self, data: np.ndarray) -> np.ndarray:
        """Make prediction using loaded model"""
        try:
            if self.framework == "pytorch":
                with torch.no_grad():
                    tensor_input = torch.FloatTensor(data)
                    prediction = self.model(tensor_input).numpy()
                    
            elif self.framework == "tensorflow":
                prediction = self.model.predict(data)
                
            elif self.framework == "sklearn":
                prediction = self.model.predict(data)
                
            else:
                raise ValueError(f"Unsupported framework: {self.framework}")
            
            return prediction
            
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            raise
    
    async def _get_metadata(self) -> Dict[str, Any]:
        """Get model and service metadata"""
        return {
            "framework": self.framework,
            "model_config": self.config,
            "metrics": self.metrics,
            "preprocessor_config": self.preprocessor.config if self.preprocessor else None
        }
    
    async def load_model(self):
        """Load model and preprocessor"""
        try:
            # Load preprocessor
            from app.services.ml.preprocessing import EnhancedPreprocessor
            with open(self.preprocessor_path, 'rb') as f:
                self.preprocessor = EnhancedPreprocessor(json.load(f))
            
            # Load model based on framework
            if self.framework == "pytorch":
                self.model = torch.load(self.model_path)
                self.model.eval()
                
            elif self.framework == "tensorflow":
                self.model = tf.keras.models.load_model(self.model_path)
                
            elif self.framework == "sklearn":
                import joblib
                self.model = joblib.load(self.model_path)
                
            else:
                raise ValueError(f"Unsupported framework: {self.framework}")
                
            logger.info(f"Successfully loaded {self.framework} model from {self.model_path}")
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
    
    def start(self, host: str = "0.0.0.0", port: int = 8000):
        """Start the model deployment service"""
        import uvicorn