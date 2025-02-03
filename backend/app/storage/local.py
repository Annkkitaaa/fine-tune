
from typing import Union, Optional, BinaryIO, List
from pathlib import Path
import shutil
import os
import json
from datetime import datetime
import logging
import aiofiles
import asyncio

logger = logging.getLogger(__name__)

class LocalStorage:
    def __init__(self, base_path: Union[str, Path]):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    async def save_file(
        self,
        file: BinaryIO,
        path: Union[str, Path],
        metadata: Optional[dict] = None
    ) -> str:
        """
        Save file to local storage
        """
        try:
            full_path = self.base_path / path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            
            async with aiofiles.open(full_path, 'wb') as f:
                # Read and write in chunks for large files
                while chunk := file.read(8192):
                    await f.write(chunk)
            
            if metadata:
                meta_path = full_path.with_suffix('.meta.json')
                metadata['timestamp'] = datetime.utcnow().isoformat()
                async with aiofiles.open(meta_path, 'w') as f:
                    await f.write(json.dumps(metadata, indent=4))
            
            return str(full_path)
            
        except Exception as e:
            logger.error(f"Error saving file {path}: {str(e)}")
            raise

    async def read_file(
        self,
        path: Union[str, Path],
        chunk_size: int = 8192
    ) -> BinaryIO:
        """
        Read file from local storage
        """
        try:
            full_path = self.base_path / path
            if not full_path.exists():
                raise FileNotFoundError(f"File not found: {path}")
            
            return open(full_path, 'rb')
            
        except Exception as e:
            logger.error(f"Error reading file {path}: {str(e)}")
            raise

    async def delete_file(self, path: Union[str, Path]) -> bool:
        """
        Delete file from local storage
        """
        try:
            full_path = self.base_path / path
            if full_path.exists():
                full_path.unlink()
                
                # Delete metadata if exists
                meta_path = full_path.with_suffix('.meta.json')
                if meta_path.exists():
                    meta_path.unlink()
                
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error deleting file {path}: {str(e)}")
            raise

    async def list_files(
        self,
        directory: Union[str, Path] = "",
        pattern: Optional[str] = None
    ) -> List[str]:
        """
        List files in directory
        """
        try:
            full_path = self.base_path / directory
            if pattern:
                return [str(p.relative_to(self.base_path))
                       for p in full_path.glob(pattern)]
            else:
                return [str(p.relative_to(self.base_path))
                       for p in full_path.rglob('*')
                       if p.is_file() and not p.name.endswith('.meta.json')]
            
        except Exception as e:
            logger.error(f"Error listing files in {directory}: {str(e)}")
            raise
