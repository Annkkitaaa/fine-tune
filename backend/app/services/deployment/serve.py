# serve.py
from typing import Dict, Any, Optional, Union, List
import torch
import tensorflow as tf
import onnxruntime as ort
import joblib
import numpy as np
from pathlib import Path
from fastapi import FastAPI, HTTPException
import uvicorn
import logging
import json
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class PredictionRequest(BaseModel):
    instances: List[List[float]]
    parameters: Optional[Dict[str, Any]] = None

class PredictionResponse(BaseModel):
    predictions: List[Any]
    metadata: Optional[Dict[str, Any]] = None

class ModelServer:
    def __init__(
        self,
        model_path: Union[str, Path],
        framework: str,
        config: Dict[str, Any]
    ):
        self.model_path = Path(model_path)
        self.framework = framework
        self.config = config
        self.model = None
        self.app = FastAPI()
        self.setup_routes()

    def setup_routes(self):
        """
        Setup FastAPI routes
        """
        @self.app.post("/predict", response_model=PredictionResponse)
        async def predict(request: PredictionRequest):
            try:
                predictions = await self._predict(request.instances, request.parameters)
                return PredictionResponse(
                    predictions=predictions,
                    metadata={'model_version': self.config.get('version')}
                )
            except Exception as e:
                logger.error(f"Prediction error: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/health")
        async def health():
            return {"status": "healthy"}

    async def load_model(self):
        """
        Load model based on framework
        """
        try:
            if self.framework == "pytorch":
                await self._load_pytorch_model()
            elif self.framework == "tensorflow":
                await self._load_tensorflow_model()
            elif self.framework == "sklearn":
                await self._load_sklearn_model()
            else:
                raise ValueError(f"Unsupported framework: {self.framework}")
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise

    async def _load_pytorch_model(self):
        """
        Load PyTorch model
        """
        if self.config.get('use_onnx', False):
            self.model = ort.InferenceSession(str(self.model_path / 'model.onnx'))
        else:
            model_class = self.config['model_class']
            state_dict = torch.load(self.model_path / 'model.pt')
            self.model = model_class()
            self.model.load_state_dict(state_dict)
            self.model.eval()

    async def _load_tensorflow_model(self):
        """
        Load TensorFlow model
        """
        if self.config.get('use_saved_model', True):
            self.model = tf.saved_model.load(str(self.model_path / 'saved_model'))
        else:
            self.model = tf.keras.models.load_model(self.model_path / 'model.h5')

    async def _load_sklearn_model(self):
        """
        Load scikit-learn model
        """
        self.model = joblib.load(self.model_path / 'model.joblib')

    async def _predict(
        self,
        instances: List[List[float]],
        parameters: Optional[Dict[str, Any]] = None
    ) -> List[Any]:
        """
        Make predictions using loaded model
        """
        try:
            # Convert instances to appropriate format
            input_data = np.array(instances)
            
            if self.framework == "pytorch":
                if self.config.get('use_onnx', False):
                    ort_inputs = {
                        'input': input_data.astype(np.float32)
                    }
                    predictions = self.model.run(None, ort_inputs)[0]
                else:
                    with torch.no_grad():
                        tensor_input = torch.FloatTensor(input_data)
                        predictions = self.model(tensor_input).numpy()
                        
            elif self.framework == "tensorflow":
                predictions = self.model(input_data).numpy()
                
            elif self.framework == "sklearn":
                predictions = self.model.predict(input_data)
            
            # Post-process predictions if needed
            if parameters and parameters.get('post_process'):
                predictions = self._post_process_predictions(predictions, parameters)
            
            return predictions.tolist()
            
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            raise

    def _post_process_predictions(
        self,
        predictions: np.ndarray,
        parameters: Dict[str, Any]
    ) -> np.ndarray:
        """
        Post-process predictions based on parameters
        """
        if parameters.get('threshold'):
            predictions = (predictions > parameters['threshold']).astype(np.float32)
            
        if parameters.get('probabilities') and hasattr(self.model, 'predict_proba'):
            predictions = self.model.predict_proba(predictions)
            
        return predictions

    def start(self, host: str = "0.0.0.0", port: int = 8000):
        """
        Start the model server
        """
        uvicorn.run(self.app, host=host, port=port)

    def stop(self):
        """
        Stop the model server
        """
        # Cleanup resources
        self.model = None