from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.shared import Pt
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def export_docx(content: str, output_path: Path) -> Path:
    doc = Document()
    doc.add_paragraph(content).runs[0].font.size = Pt(11)
    doc.save(output_path)
    return output_path


def export_pdf(content: str, output_path: Path) -> Path:
    c = canvas.Canvas(str(output_path), pagesize=letter)
    width, height = letter
    text_obj = c.beginText(72, height - 72)
    text_obj.setFont("Helvetica", 11)
    for line in content.splitlines():
        text_obj.textLine(line)
    c.drawText(text_obj)
    c.save()
    return output_path
