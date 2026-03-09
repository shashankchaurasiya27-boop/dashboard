"""
services/storage_client.py

Transparent cloud / local storage layer.

When AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME)
are present in the environment, files are stored in S3.
Otherwise, they are kept on local disk (safe offline / dev default).
"""

import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from config import (
    AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
    AWS_REGION, S3_BUCKET_NAME, USE_S3_STORAGE,
    OUTPUT_DIR, UPLOAD_DIR,
)
from utils.logger import logger


# Build the boto3 client once at import time (no-op when USE_S3_STORAGE is False)
_s3 = None
if USE_S3_STORAGE:
    try:
        _s3 = boto3.client(
            "s3",
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )
        logger.info(f"S3 client initialised — bucket: {S3_BUCKET_NAME} / region: {AWS_REGION}")
    except Exception as exc:
        logger.warning(f"Failed to init S3 client: {exc}. Falling back to local storage.")
        _s3 = None


# ─────────────────────────────────────────────────────────────────────────────
# Public helpers
# ─────────────────────────────────────────────────────────────────────────────

def upload_file(local_path: str, s3_key: str) -> str:
    """
    Upload *local_path* to S3 under *s3_key*.

    Returns:
        The S3 object key when S3 is enabled,  
        or the original *local_path* when running locally.
    """
    if _s3 is None:
        logger.info(f"[local] Skipping S3 upload — keeping file at {local_path}")
        return local_path

    try:
        _s3.upload_file(local_path, S3_BUCKET_NAME, s3_key)
        logger.info(f"[S3] Uploaded {local_path} → s3://{S3_BUCKET_NAME}/{s3_key}")
        return s3_key
    except (ClientError, NoCredentialsError) as exc:
        logger.error(f"[S3] Upload failed for {local_path}: {exc}. Keeping local copy.")
        return local_path


def get_presigned_url(s3_key: str, expiry_seconds: int = 3600) -> str | None:
    """
    Generate a time-limited pre-signed download URL for *s3_key*.

    Returns None when S3 is not configured (callers should serve local file instead).
    """
    if _s3 is None:
        return None
    try:
        url = _s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET_NAME, "Key": s3_key},
            ExpiresIn=expiry_seconds,
        )
        logger.info(f"[S3] Pre-signed URL generated for {s3_key} (expires {expiry_seconds}s)")
        return url
    except (ClientError, NoCredentialsError) as exc:
        logger.error(f"[S3] Failed to generate pre-signed URL for {s3_key}: {exc}")
        return None


def upload_pdf_upload(local_path: str, filename: str) -> str:
    """Convenience wrapper: upload a received PDF to the uploads/ S3 prefix."""
    return upload_file(local_path, f"uploads/{filename}")


def upload_cam_pdf(local_path: str, company_name: str) -> str:
    """Convenience wrapper: upload a generated CAM PDF to the outputs/ S3 prefix."""
    return upload_file(local_path, f"outputs/{company_name}_CAM.pdf")


def is_s3_enabled() -> bool:
    return _s3 is not None
