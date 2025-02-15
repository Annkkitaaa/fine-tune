# app/utils/monitoring.py
import psutil
import time
from datetime import datetime
import logging
from typing import Dict, Any, Optional
import json
from pathlib import Path
import aiofiles

logger = logging.getLogger(__name__)

class SystemMonitor:
    def __init__(
        self,
        enable_prometheus: bool = True,
        prometheus_port: int = 9090,
        metrics_dir: Optional[str] = None
    ):
        self.enable_prometheus = enable_prometheus
        self.metrics_dir = Path(metrics_dir) if metrics_dir else None
        
        if self.metrics_dir:
            self.metrics_dir.mkdir(parents=True, exist_ok=True)

        # Try to import gputil for GPU monitoring
        try:
            import gputil
            self.gputil = gputil
            self.gpu_enabled = True
        except ImportError:
            self.gputil = None
            self.gpu_enabled = False
            logger.info("GPU monitoring disabled: gputil not installed")

    async def get_system_metrics(self) -> Dict[str, Any]:
        """Get comprehensive system metrics"""
        try:
            metrics = {
                'timestamp': datetime.utcnow().isoformat(),
                'cpu': self._get_cpu_metrics(),
                'memory': self._get_memory_metrics(),
                'disk': self._get_disk_metrics(),
                'process': self._get_process_metrics()
            }

            # Add GPU metrics if available
            if self.gpu_enabled:
                gpu_metrics = self._get_gpu_metrics()
                if gpu_metrics:
                    metrics['gpu'] = gpu_metrics

            # Save metrics to file if directory is configured
            if self.metrics_dir:
                await self._save_metrics(metrics)

            return metrics

        except Exception as e:
            logger.error(f"Error getting system metrics: {str(e)}")
            raise

    def _get_cpu_metrics(self) -> Dict[str, Any]:
        """Get CPU metrics"""
        return {
            'percent': psutil.cpu_percent(interval=1),
            'count': {
                'physical': psutil.cpu_count(logical=False),
                'logical': psutil.cpu_count(logical=True)
            },
            'frequency': {
                'current': psutil.cpu_freq().current if psutil.cpu_freq() else None,
                'min': psutil.cpu_freq().min if psutil.cpu_freq() else None,
                'max': psutil.cpu_freq().max if psutil.cpu_freq() else None
            }
        }

    def _get_memory_metrics(self) -> Dict[str, Any]:
        """Get memory metrics"""
        memory = psutil.virtual_memory()
        swap = psutil.swap_memory()
        
        return {
            'virtual': {
                'total': memory.total,
                'available': memory.available,
                'percent': memory.percent,
                'used': memory.used,
                'free': memory.free
            },
            'swap': {
                'total': swap.total,
                'used': swap.used,
                'free': swap.free,
                'percent': swap.percent
            }
        }

    def _get_disk_metrics(self) -> Dict[str, Any]:
        """Get disk metrics"""
        disk = psutil.disk_usage('/')
        return {
            'total': disk.total,
            'used': disk.used,
            'free': disk.free,
            'percent': disk.percent
        }

    def _get_process_metrics(self) -> Dict[str, Any]:
        """Get process metrics"""
        current_process = psutil.Process()
        return {
            'cpu_percent': current_process.cpu_percent(),
            'memory_percent': current_process.memory_percent(),
            'threads': len(current_process.threads()),
            'open_files': len(current_process.open_files())
        }

    def _get_gpu_metrics(self) -> Optional[Dict[str, Any]]:
        """Get GPU metrics if available"""
        if not self.gpu_enabled:
            return None

        try:
            gpus = self.gputil.getGPUs()
            return [{
                'id': gpu.id,
                'name': gpu.name,
                'load': gpu.load * 100,
                'memory': {
                    'total': gpu.memoryTotal,
                    'used': gpu.memoryUsed,
                    'free': gpu.memoryFree,
                    'utilization': gpu.memoryUtil * 100
                },
                'temperature': gpu.temperature
            } for gpu in gpus]
        except Exception as e:
            logger.warning(f"Error getting GPU metrics: {str(e)}")
            return None

    async def _save_metrics(self, metrics: Dict[str, Any]) -> None:
        """Save metrics to file"""
        try:
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            file_path = self.metrics_dir / f'metrics_{timestamp}.json'
            
            async with aiofiles.open(file_path, 'w') as f:
                await f.write(json.dumps(metrics, indent=2))
        except Exception as e:
            logger.error(f"Error saving metrics: {str(e)}")

# Create a singleton instance
system_monitor = SystemMonitor()