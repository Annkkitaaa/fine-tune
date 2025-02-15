# app/core/lifecycle.py
import logging
from typing import Callable
from fastapi import FastAPI
import asyncio
from app.core.config import settings
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

class AppLifecycle:
    def __init__(self):
        self._startup_handlers = []
        self._shutdown_handlers = []

    def on_startup(self, handler: Callable):
        self._startup_handlers.append(handler)

    def on_shutdown(self, handler: Callable):
        self._shutdown_handlers.append(handler)

    async def startup(self):
        for handler in self._startup_handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler()
                else:
                    handler()
            except Exception as e:
                logger.error(f"Error in startup handler: {e}")
                raise

    async def shutdown(self):
        for handler in reversed(self._shutdown_handlers):
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler()
                else:
                    handler()
            except Exception as e:
                logger.error(f"Error in shutdown handler: {e}")

lifecycle = AppLifecycle()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await lifecycle.startup()
        yield
    finally:
        # Shutdown
        await lifecycle.shutdown()

def setup_lifecycle_handlers(app: FastAPI):
    @lifecycle.on_startup
    async def setup_databases():
        # Initialize databases and connections
        logger.info("Setting up databases...")

    @lifecycle.on_startup
    async def setup_monitoring():
        if settings.ENABLE_METRICS:
            logger.info("Setting up monitoring...")

    @lifecycle.on_shutdown
    async def cleanup_tasks():
        # Cancel any running tasks
        tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
        [task.cancel() for task in tasks]
        
        logger.info(f"Cancelling {len(tasks)} running tasks...")
        await asyncio.gather(*tasks, return_exceptions=True)

    @lifecycle.on_shutdown
    async def cleanup_resources():
        # Clean up any resources
        logger.info("Cleaning up resources...")