# export.py
from typing import Dict, Any, Optional, Union
import torch
import tensorflow as tf
import onnx
import json
import joblib
from pathlib import Path
import logging
import shutil
from datetime import datetime

logger = logging.getLogger(__name__)

class ModelExporter:
    def __init__(self, export_dir: Union[str, Path]):
        self.export_dir = Path(export_dir)
        self.export_dir.mkdir(parents=True, exist_ok=True)

    async def export_model(
        self,
        model: Any,
        framework: str,
        model_name: str,
        model_version: str,
        config: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Export model to various formats based on framework
        """
        try:
            export_path = self.export_dir / model_name / model_version
            export_path.mkdir(parents=True, exist_ok=True)
            
            # Export based on framework
            if framework == "pytorch":
                paths = await self._export_pytorch_model(model, export_path, config)
            elif framework == "tensorflow":
                paths = await self._export_tensorflow_model(model, export_path, config)
            elif framework == "sklearn":
                paths = await self._export_sklearn_model(model, export_path, config)
            else:
                raise ValueError(f"Unsupported framework: {framework}")
            
            # Save model metadata
            metadata = {
                'name': model_name,
                'version': model_version,
                'framework': framework,
                'config': config,
                'export_time': datetime.utcnow().isoformat(),
                'export_paths': paths
            }
            
            metadata_path = export_path / 'metadata.json'
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=4)
            
            paths['metadata'] = str(metadata_path)
            return paths
            
        except Exception as e:
            logger.error(f"Error exporting model: {str(e)}")
            raise

    async def _export_pytorch_model(
        self,
        model: torch.nn.Module,
        export_path: Path,
        config: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Export PyTorch model to various formats
        """
        paths = {}
        
        # Save PyTorch model
        torch_path = export_path / 'model.pt'
        torch.save(model.state_dict(), torch_path)
        paths['pytorch'] = str(torch_path)
        
        # Export to ONNX if configured
        if config.get('export_onnx', True):
            onnx_path = export_path / 'model.onnx'
            dummy_input = torch.randn(1, *config['input_shape'])
            torch.onnx.export(
                model,
                dummy_input,
                onnx_path,
                export_params=True,
                opset_version=11,
                input_names=['input'],
                output_names=['output'],
                dynamic_axes={
                    'input': {0: 'batch_size'},
                    'output': {0: 'batch_size'}
                }
            )
            paths['onnx'] = str(onnx_path)
        
        # Export to TorchScript if configured
        if config.get('export_torchscript', True):
            script_path = export_path / 'model.pt.script'
            scripted_model = torch.jit.script(model)
            scripted_model.save(script_path)
            paths['torchscript'] = str(script_path)
        
        return paths

    async def _export_tensorflow_model(
        self,
        model: tf.keras.Model,
        export_path: Path,
        config: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Export TensorFlow model to various formats
        """
        paths = {}
        
        # Save Keras model
        keras_path = export_path / 'model.h5'
        model.save(keras_path)
        paths['keras'] = str(keras_path)
        
        # Export SavedModel format
        saved_model_path = export_path / 'saved_model'
        tf.saved_model.save(model, str(saved_model_path))
        paths['saved_model'] = str(saved_model_path)
        
        # Export to TFLite if configured
        if config.get('export_tflite', True):
            converter = tf.lite.TFLiteConverter.from_keras_model(model)
            tflite_model = converter.convert()
            
            tflite_path = export_path / 'model.tflite'
            with open(tflite_path, 'wb') as f:
                f.write(tflite_model)
            paths['tflite'] = str(tflite_path)
        
        return paths

    async def _export_sklearn_model(
        self,
        model: Any,
        export_path: Path,
        config: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Export scikit-learn model
        """
        paths = {}
        
        # Save using joblib
        joblib_path = export_path / 'model.joblib'
        joblib.dump(model, joblib_path)
        paths['joblib'] = str(joblib_path)
        
        # Export to ONNX if configured and supported
        if config.get('export_onnx', True):
            try:
                from skl2onnx import convert_sklearn
                from skl2onnx.common.data_types import FloatTensorType
                
                initial_type = [('float_input', FloatTensorType([None, config['input_dim']]))]
                onx = convert_sklearn(model, initial_types=initial_type)
                
                onnx_path = export_path / 'model.onnx'
                with open(onnx_path, "wb") as f:
                    f.write(onx.SerializeToString())
                paths['onnx'] = str(onnx_path)
                
            except Exception as e:
                logger.warning(f"Could not export to ONNX: {str(e)}")
        
        return paths