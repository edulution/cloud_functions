import pdfplumber
from pypdf import PdfReader, PdfWriter
from datetime import datetime
import re
import os


def split_report_by_centre(input_pdf_path, output_dir):
    # Make sure the output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Open the PDF files
    reader = PdfReader(input_pdf_path)
    plumber_pdf = pdfplumber.open(input_pdf_path)

    centre_writer = None
    centre_name = None
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    for i, page in enumerate(plumber_pdf.pages):
        text = page.extract_text() or ""

        # Check if this page starts a new centre report
        centre_match = re.search(r"Centre:\s*(.+)", text)

        if centre_match:
            # Save previous centre report if it exists
            if centre_writer and centre_name:
                output_path = os.path.join(output_dir, f"{centre_name}_{timestamp}.pdf")
                with open(output_path, "wb") as f:
                    centre_writer.write(f)

            # Start a new centre writer
            centre_writer = PdfWriter()
            centre_name = centre_match.group(1).strip().replace(" ", "_")

        # Add current page to the current centre's writer
        if centre_writer:
            centre_writer.add_page(reader.pages[i])

    # Save the last centre report
    if centre_writer and centre_name:
        output_path = os.path.join(output_dir, f"{centre_name}_{timestamp}.pdf")
        with open(output_path, "wb") as f:
            centre_writer.write(f)

    print("Splitting completed!")


# Example usage
input_pdf = ""
output_folder = ""
split_report_by_centre(input_pdf, output_folder)
