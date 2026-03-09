from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
import os

from config import OUTPUT_DIR
from utils.logger import logger


def generate_cam_pdf(company_name: str, cam_data: dict) -> str:
    """
    Render a CAM PDF locally, then upload to S3 if configured.
    Returns the local path OR the S3 object key (whichever is authoritative).
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    file_path = os.path.join(OUTPUT_DIR, f"{company_name}_CAM.pdf")


    doc = SimpleDocTemplate(file_path)
    elements = []
    styles = getSampleStyleSheet()

    heading_style = styles["Heading2"]
    normal_style = styles["Normal"]

    elements.append(Paragraph("CREDIT APPRAISAL MEMO", styles["Heading1"]))
    elements.append(Spacer(1, 0.3 * inch))

    for section, content in cam_data.items():

        elements.append(Paragraph(f"<b>{section}</b>", styles["Heading2"]))
        elements.append(Spacer(1, 0.2 * inch))

        if isinstance(content, dict):
            table_data = []
            for key, value in content.items():

                if isinstance(value, float):
                    if "Margin" in key:
                        formatted_value = f"{value * 100:.2f}%"
                    else:
                        formatted_value = f"{value:,.2f}"
                else:
                    formatted_value = str(value)

                table_data.append([key, formatted_value])
            
            table = Table(table_data)
            elements.append(table)

        else:
            elements.append(Paragraph(str(content), styles["Normal"]))

        elements.append(Spacer(1, 0.4 * inch))

    doc.build(elements)
    logger.info(f"CAM PDF built at {file_path}")

    # Upload to S3 (silently skipped if USE_S3_STORAGE is False)
    try:
        from services.storage_client import upload_cam_pdf
        s3_key = upload_cam_pdf(file_path, company_name)
        if s3_key != file_path:
            logger.info(f"CAM PDF uploaded to S3: {s3_key}")
    except Exception as exc:
        logger.warning(f"S3 upload skipped for CAM PDF: {exc}")

    return file_path

    return file_path