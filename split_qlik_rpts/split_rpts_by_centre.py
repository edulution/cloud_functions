import pdfplumber
from pypdf import PdfReader, PdfWriter
from datetime import datetime
import re
import os

# Mapping of report types to their split keywords {report name: split keyword}
SPLIT_KEYWORDS = {
    "MLROR": "Centre: ",
    "Payslip": "Payslip",
    "Attended Once": "Learners Attended only Once",
    "Zero Exercises by Learner": "Zero Exercises by Learner",
    "Inactive Learner Report": "Inactive Learner Report",
    "Graduates": "Graduates",
    "Untested Learners": "Untested Learners",
}


def sanitize_filename(name):
    """Sanitize the filename by removing invalid characters."""
    return re.sub(r'[\\/*?:"<>|]', "_", name)


def split_report_by_keyword(input_pdf_path, output_dir, report_type):
    if report_type not in SPLIT_KEYWORDS:
        raise ValueError(
            f"Unknown report type '{report_type}'. Available types: {list(SPLIT_KEYWORDS.keys())}"
        )

    keyword = SPLIT_KEYWORDS[report_type]
    os.makedirs(output_dir, exist_ok=True)

    reader = PdfReader(input_pdf_path)
    plumber_pdf = pdfplumber.open(input_pdf_path)

    centre_writer = None
    centre_name = None
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    print(f"Splitting '{input_pdf_path}' based on keyword '{keyword}'...")

    for i, page in enumerate(plumber_pdf.pages):
        text = page.extract_text() or ""

        centre_match = re.search(re.escape(keyword) + r"\s*(.+)", text)

        if centre_match:
            # Save the current PDF if it exists
            if centre_writer and centre_name:
                output_path = os.path.join(output_dir, f"{centre_name}_{timestamp}.pdf")
                with open(output_path, "wb") as f:
                    centre_writer.write(f)
                print(f"Saved file: {output_path}")

            # Start a new writer
            centre_writer = PdfWriter()
            centre_name_raw = centre_match.group(1).strip()
            centre_name = sanitize_filename(centre_name_raw.replace(" ", "_"))
            print(f"Starting new report for: {centre_name_raw}")

        # Add current page to the active writer
        if centre_writer:
            centre_writer.add_page(reader.pages[i])

    # Save the last report
    if centre_writer and centre_name:
        output_path = os.path.join(output_dir, f"{centre_name}_{timestamp}.pdf")
        with open(output_path, "wb") as f:
            centre_writer.write(f)
        print(f"Saved file: {output_path}")

    print("Splitting completed!")


if __name__ == "__main__":
    input_pdf = "path/to/your/input.pdf"
    output_folder = "path/to/output/folder"
    report_type = "MLROR"  # Choose from 'MLROR', 'Payslip', 'Attended Once', 'Zero Exercises by Learner', 'Inactive Learner Report', 'Graduates', 'Untested Learners'

    split_report_by_keyword(input_pdf, output_folder, report_type)
