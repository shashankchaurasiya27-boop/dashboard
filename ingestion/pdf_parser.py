import fitz  # PyMuPDF
from utils.logger import logger
from ingestion.ocr_extractor import is_scanned_pdf, extract_text_with_ocr


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from a PDF.

    - For digital PDFs, uses PyMuPDF directly (fast).
    - For scanned / image-based PDFs, falls back to Tesseract OCR.
    """
    logger.info(f"Extracting text from: {file_path}")
    text = ""

    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
        doc.close()

    except Exception as e:
        logger.error(f"Error reading PDF with PyMuPDF: {e}")
        return ""

    if is_scanned_pdf(text):
        logger.info("Detected scanned PDF — switching to OCR extraction.")
        text = extract_text_with_ocr(file_path)

    return text