import os
import shutil
from fastapi import UploadFile
from config import UPLOAD_DIR
from utils.logger import logger


async def save_uploaded_file(file: UploadFile) -> str:
    """
    Save the uploaded file to local disk, then mirror to S3 if configured.
    Returns the local file path (used for text extraction regardless of S3 status).
    """
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    logger.info(f"Saving file: {file.filename}")

    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Mirror to S3 (silently no-ops when USE_S3_STORAGE is False)
    try:
        from services.storage_client import upload_pdf_upload
        upload_pdf_upload(file_location, file.filename)
    except Exception as exc:
        logger.warning(f"S3 upload skipped for {file.filename}: {exc}")

    return file_location