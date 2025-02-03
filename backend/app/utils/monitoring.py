# monitoring.py
from typing import Dict, Any, Optional, List
import psutil
import gputil
import time
from datetime import datetime
import logging
import asyncio
from prometheus_client import Counter, Gauge, Histogram, start_http_server
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
        
        if enable_prometheus:
            # Basic system metrics
            self.cpu_usage = Gauge('cpu_usage_percent', 'CPU Usage Percentage')
            self.memory_usage = Gauge('memory_usage_percent', 'Memory Usage Percentage')
            self.disk_usage = Gauge('disk_usage_percent', 'Disk Usage Percentage')
            self.gpu_usage = Gauge('gpu_usage_percent', 'GPU Usage Percentage', ['gpu_id'])
            
            # Process metrics
            self.process_count = Gauge('process_count', 'Number of Running Processes')
            self.thread_count = Gauge('thread_count', 'Number of Threads')
            self.open_files = Gauge('open_files', 'Number of Open Files')
            
            # Network metrics
            self.network_bytes_sent = Counter('network_bytes_sent', 'Network Bytes Sent')
            self.network_bytes_recv = Counter('network_bytes_recv', 'Network Bytes Received')
            self.network_connections = Gauge('network_connections', 'Number of Network Connections')
            
            # API metrics
            self.request_duration = Histogram(
                'request_duration_seconds',
                'Request Duration in Seconds',
                ['path', 'method']
            )
            self.request_count = Counter(
                'request_count',
                'Total Request Count',
                ['path', 'method', 'status']
            )
            self.error_counter = Counter(
                'error_count',
                'Number of Errors',
                ['type']
            )
            
            # ML metrics
            self.model_prediction_duration = Histogram(
                'model_prediction_duration_seconds',
                'Model Prediction Duration in Seconds',
                ['model_name', 'version']
            )
            self.model_prediction_count = Counter(
                'model_prediction_count',
                'Total Model Predictions',
                ['model_name', 'version']
            )
            self.training_duration = Histogram(
                'training_duration_seconds',
                'Model Training Duration in Seconds',
                ['model_name']
            )
            
            # Start Prometheus server
            start_http_server(prometheus_port)

    async def get_system_metrics(self) -> Dict[str, Any]:
        """
        Get comprehensive system metrics
        """
        try:
            # Basic system metrics
            metrics = {
                'timestamp': datetime.utcnow().isoformat(),
                'cpu': self._get_cpu_metrics(),
                'memory': self._get_memory_metrics(),
                'disk': self._get_disk_metrics(),
                'network': await self._get_network_metrics(),
                'process': self._get_process_metrics(),
            }
            
            # GPU metrics
            gpu_metrics = self._get_gpu_metrics()
            if gpu_metrics:
                metrics['gpu'] = gpu_metrics
            
            # Update Prometheus metrics
            if self.enable_prometheus:
                self._update_prometheus_metrics(metrics)
            
            # Save metrics to file if directory is configured
            if self.metrics_dir:
                await self._save_metrics(metrics)
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error getting system metrics: {str(e)}")
            self.error_counter.labels(type='system_metrics').inc()
            raise

    def _get_cpu_metrics(self) -> Dict[str, Any]:
        """
        Get detailed CPU metrics
        """
        return {
            'percent': psutil.cpu_percent(interval=1),
            'count': {
                'physical': psutil.cpu_count(logical=False),
                'logical': psutil.cpu_count(logical=True)
            },
            'frequency': psutil.cpu_freq()._asdict(),
            'stats': psutil.cpu_stats()._asdict(),
            'times': psutil.cpu_times()._asdict()
        }

    def _get_memory_metrics(self) -> Dict[str, Any]:
        """
        Get detailed memory metrics
        """
        virtual = psutil.virtual_memory()
        swap = psutil.swap_memory()
        
        return {
            'virtual': {
                'total': virtual.total,
                'available': virtual.available,
                'used': virtual.used,
                'free': virtual.free,
                'percent': virtual.percent
            },
            'swap': {
                'total': swap.total,
                'used': swap.used,
                'free': swap.free,
                'percent': swap.percent
            }
        }

    def _get_disk_metrics(self) -> Dict[str, Any]:
        """
        Get detailed disk metrics
        """
        disk_usage = psutil.disk_usage('/')
        disk_io = psutil.disk_io_counters()
        
        return {
            'usage': {
                'total': disk_usage.total,
                'used': disk_usage.used,
                'free': disk_usage.free,
                'percent': disk_usage.percent
            },
            'io': {
                'read_bytes': disk_io.read_bytes,
                'write_bytes': disk_io.write_bytes,
                'read_count': disk_io.read_count,
                'write_count': disk_io.write_count
            }
        }

    async def _get_network_metrics(self) -> Dict[str, Any]:
        """
        Get detailed network metrics
        """
        net_io = psutil.net_io_counters()
        net_connections = psutil.net_connections()
        
        return {
            'io': {
                'bytes_sent': net_io.bytes_sent,
                'bytes_recv': net_io.bytes_recv,
                'packets_sent': net_io.packets_sent,
                'packets_recv': net_io.packets_recv,
                'error_in': net_io.errin,
                'error_out': net_io.errout,
                'drop_in': net_io.dropin,
                'drop_out': net_io.dropout
            },
            'connections': len(net_connections),
            'connection_stats': {
                'ESTABLISHED': len([c for c in net_connections if c.status == 'ESTABLISHED']),
                'LISTEN': len([c for c in net_connections if c.status == 'LISTEN']),
                'TIME_WAIT': len([c for c in net_connections if c.status == 'TIME_WAIT'])
            }
        }

    def _get_process_metrics(self) -> Dict[str, Any]:
        """
        Get detailed process metrics
        """
        current_process = psutil.Process()
        
        return {
            'count': len(psutil.pids()),
            'current_process': {
                'cpu_percent': current_process.cpu_percent(),
                'memory_percent': current_process.memory_percent(),
                'threads': len(current_process.threads()),
                'open_files': len(current_process.open_files()),
                'connections': len(current_process.connections())
            }
        }

    def _get_gpu_metrics(self) -> Optional[List[Dict[str, Any]]]:
        """
        Get GPU metrics if available
        """
        try:
            return [{
                'id': gpu.id,
                'name': gpu.name,
                'load': gpu.load,
                'memory': {
                    'total': gpu.memoryTotal,
                    'used': gpu.memoryUsed,
                    'free': gpu.memoryFree,
                    'utilization': gpu.memoryUtil * 100
                },
                'temperature': gpu.temperature,
                'power_usage': gpu.powerUsage if hasattr(gpu, 'powerUsage') else None
            } for gpu in gputil.getGPUs()]
        except Exception:
            logger.warning("No GPU metrics available")
            return None

    def _update_prometheus_metrics(self, metrics: Dict[str, Any]) -> None:
        """
        Update Prometheus metrics
        """
        # System metrics
        self.cpu_usage.set(metrics['cpu']['percent'])
        self.memory_usage.set(metrics['memory']['virtual']['percent'])
        self.disk_usage.set(metrics['disk']['usage']['percent'])
        
        # Process metrics
        self.process_count.set(metrics['process']['count'])
        self.thread_count.set(metrics['process']['current_process']['threads'])
        self.open_files.set(metrics['process']['current_process']['open_files'])
        
        # Network metrics
        self.network_connections.set(metrics['network']['connections'])
        
        # GPU metrics
        if metrics.get('gpu'):
            for gpu in metrics['gpu']:
                self.gpu_usage.labels(gpu_id=gpu['id']).set(gpu['load'])

    async def _save_metrics(self, metrics: Dict[str, Any]) -> None:
        """
        Save metrics to file
        """
        try:
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            file_path = self.metrics_dir / f'metrics_{timestamp}.json'
            
            async with aiofiles.open(file_path, 'w') as f:
                await f.write(json.dumps(metrics, indent=2))
                
        except Exception as e:
            logger.error(f"Error saving metrics: {str(e)}")

    def record_request(
        self,
        path: str,
        method: str,
        duration: float,
        status_code: int
    ) -> None:
        """
        Record API request metrics
        """
        if self.enable_prometheus:
            self.request_duration.labels(
                path=path,
                method=method
            ).observe(duration)
            
            self.request_count.labels(
                path=path,
                method=method,
                status=status_code
            ).inc()
            
            if status_code >= 400:
                self.error_counter.labels(type='api_error').inc()

    def record_model_prediction(
        self,
        model_name: str,
        version: str,
        duration: float
    ) -> None:
        """
        Record model prediction metrics
        """
        if self.enable_prometheus:
            self.model_prediction_duration.labels(
                model_name=model_name,
                version=version
            ).observe(duration)
            
            self.model_prediction_count.labels(
                model_name=model_name,
                version=version
            ).inc()

    def record_training_duration(
        self,
        model_name: str,
        duration: float
    ) -> None:
        """
        Record model training metrics
        """
        if self.enable_prometheus:
            self.training_duration.labels(
                model_name=model_name
            ).observe(duration)

    async def monitor_resources(
        self,
        interval: int = 60,
        callback: Optional[callable] = None
    ) -> None:
        """
        Continuously monitor system resources
        """
        while True:
            try:
                metrics = await self.get_system_metrics()
                
                if callback:
                    await callback(metrics)
                
                await asyncio.sleep(interval)
                
            except Exception as e:
                logger.error(f"Error monitoring resources: {str(e)}")
                self.error_counter.labels(type='monitoring').inc()
                await asyncio.sleep(interval)

    def get_alert_conditions(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Check for alert conditions
        """
        alerts = []
        
        # CPU usage alert
        if metrics['cpu']['percent'] > 90:
            alerts.append({
                'type': 'high_cpu',
                'level': 'warning',
                'message': f"High CPU usage: {metrics['cpu']['percent']}%"
            })
        
        # Memory usage alert
        if metrics['memory']['virtual']['percent'] > 90:
            alerts.append({
                'type': 'high_memory',
                'level': 'warning',
                'message': f"High memory usage: {metrics['memory']['virtual']['percent']}%"
            })
        
        # Disk usage alert
        if metrics['disk']['usage']['percent'] > 90:
            alerts.append({
                'type': 'high_disk',
                'level': 'warning',
                'message': f"High disk usage: {metrics['disk']['usage']['percent']}%"
            })
        
        # GPU alerts
        if metrics.get('gpu'):
            for gpu in metrics['gpu']:
                if gpu['load'] > 90:
                    alerts.append({
                        'type': 'high_gpu',
                        'level': 'warning',
                        'message': f"High GPU usage on GPU {gpu['id']}: {gpu['load']}%"
                    })
                if gpu['temperature'] > 80:
                    alerts.append({
                        'type': 'high_gpu_temp',
                        'level': 'warning',
                        'message': f"High GPU temperature on GPU {gpu['id']}: {gpu['temperature']}°C"
                    })
        
        return alerts