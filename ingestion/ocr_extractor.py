"""
ingestion/ocr_extractor.py

Provides OCR-based text extraction for scanned / image-based PDFs.
Called automatically by pdf_parser.py when PyMuPDF returns near-empty text.

Requires:
  - tesseract binary on PATH  (brew install tesseract)
  - pytesseract Python package (already installed)
  - Pillow                    (already installed)
"""

import io
from utils.logger import logger

try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.warning("pytesseract / Pillow not available — OCR disabled.")

try:
    import fitz  # PyMuPDF
    FITZ_AVAILABLE = True
except ImportError:
    FITZ_AVAILABLE = False


# A PDF is classified as scanned if its extracted text is shorter than this
# OR contains no digits (no numeric financial data at all).
# 20 chars is intentionally low — even a 3-line financial statement has more.
SCAN_THRESHOLD = 20


def is_scanned_pdf(text: str) -> bool:
    """
    Return True if the PDF appears to be a scanned image rather than
    a digital document.

    Criteria:
      - Extracted text is fewer than SCAN_THRESHOLD characters after stripping, OR
      - The text contains no digits (i.e. no financial numbers were extracted at all).
    """
    stripped = text.strip()
    if len(stripped) < SCAN_THRESHOLD:
        return True
    # If there are absolutely no digits, it's either a pure-image scan or totally blank
    if not any(ch.isdigit() for ch in stripped):
        return True
    return False


def extract_text_with_ocr(file_path: str) -> str:
    """
    Render each PDF page to a PIL image and run Tesseract OCR.

    Returns the combined text from all pages, or an empty string if OCR fails.
    """
    if not TESSERACT_AVAILABLE:
        logger.error("OCR requested but pytesseract/Pillow are not installed.")
        return ""

    if not FITZ_AVAILABLE:
        logger.error("OCR requested but PyMuPDF (fitz) is not installed.")
        return ""

    logger.info(f"Running OCR on scanned PDF: {file_path}")
    pages_text: list[str] = []

    try:
        doc = fitz.open(file_path)
        for page_num, page in enumerate(doc):
            # Render page at 300 DPI for good OCR accuracy
            matrix = fitz.Matrix(300 / 72, 300 / 72)
            pix = page.get_pixmap(matrix=matrix, colorspace=fitz.csRGB)
            img_bytes = pix.tobytes("png")

            image = Image.open(io.BytesIO(img_bytes))
            page_text = pytesseract.image_to_string(image, lang="eng")
            pages_text.append(page_text)
            logger.info(f"  OCR page {page_num + 1}: {len(page_text)} chars extracted")

        doc.close()

    except Exception as e:
        logger.error(f"OCR extraction failed: {e}")
        return ""

    combined = "\n".join(pages_text)
    logger.info(f"OCR complete — total chars: {len(combined)}")
    return combined
