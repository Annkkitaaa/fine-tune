
# cloud.py
from typing import Union, Optional, BinaryIO, List, Dict
from pathlib import Path
import boto3
import json
from datetime import datetime
import logging
from botocore.exceptions import ClientError
import asyncio
from io import BytesIO

logger = logging.getLogger(__name__)

class CloudStorage:
    def __init__(
        self,
        bucket_name: str,
        aws_access_key_id: Optional[str] = None,
        aws_secret_access_key: Optional[str] = None,
        region_name: Optional[str] = None
    ):
        self.bucket_name = bucket_name
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=region_name
        )

    async def save_file(
        self,
        file: BinaryIO,
        path: str,
        metadata: Optional[dict] = None,
        content_type: Optional[str] = None
    ) -> str:
        """
        Save file to S3
        """
        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            if metadata:
                extra_args['Metadata'] = {
                    k: str(v) for k, v in metadata.items()
                }
            
            # Upload file
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.s3_client.upload_fileobj(
                    file,
                    self.bucket_name,
                    path,
                    ExtraArgs=extra_args
                )
            )
            
            return f"s3://{self.bucket_name}/{path}"
            
        except Exception as e:
            logger.error(f"Error saving file to S3 {path}: {str(e)}")
            raise

    async def read_file(self, path: str) -> BinaryIO:
        """
        Read file from S3
        """
        try:
            file_obj = BytesIO()
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.s3_client.download_fileobj(
                    self.bucket_name,
                    path,
                    file_obj
                )
            )
            file_obj.seek(0)
            return file_obj
            
        except Exception as e:
            logger.error(f"Error reading file from S3 {path}: {str(e)}")
            raise

    async def delete_file(self, path: str) -> bool:
        """
        Delete file from S3
        """
        try:
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.s3_client.delete_object(
                    Bucket=self.bucket_name,
                    Key=path
                )
            )
            return True
            
        except Exception as e:
            logger.error(f"Error deleting file from S3 {path}: {str(e)}")
            raise

    async def list_files(
        self,
        prefix: str = "",
        max_keys: int = 1000
    ) -> List[Dict[str, any]]:
        """
        List files in S3 bucket
        """
        try:
            paginator = self.s3_client.get_paginator('list_objects_v2')
            files = []
            
            async for page in paginator.paginate(
                Bucket=self.bucket_name,
                Prefix=prefix,
                MaxKeys=max_keys
            ):
                if 'Contents' in page:
                    files.extend([{
                        'key': obj['Key'],
                        'size': obj['Size'],
                        'last_modified': obj['LastModified'].isoformat(),
                        'etag': obj['ETag']
                    } for obj in page['Contents']])
            
            return files
            
        except Exception as e:
            logger.error(f"Error listing files in S3 {prefix}: {str(e)}")
            raise

    async def get_presigned_url(
        self,
        path: str,
        expires_in: int = 3600,
        operation: str = 'get_object'
    ) -> str:
        """
        Generate presigned URL for S3 object
        """
        try:
            url = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.s3_client.generate_presigned_url(
                    ClientMethod=operation,
                    Params={
                        'Bucket': self.bucket_name,
                        'Key': path
                    },
                    ExpiresIn=expires_in
                )
            )
            return url
            
        except Exception as e:
            logger.error(f"Error generating presigned URL for {path}: {str(e)}")
            raise