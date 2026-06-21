import sys
from pypdf import PdfReader, PdfWriter

def crop_pdf(input_path, output_path):
    reader = PdfReader(input_path)
    writer = PdfWriter()

    for page in reader.pages:
        # Get the original dimensions
        original_width = float(page.mediabox.width)
        original_height = float(page.mediabox.height)
        
        # We need to crop from the right. The user wants the first 5 columns.
        # Based on the screenshot, the total width is around 100% and 5 columns is about 50-60%.
        # Let's say we cut off the right 40% of the page.
        # It's better to crop to exactly the right of the 5th column ("Total electors").
        # From screenshot 2:
        # Col 1: Sl. No.
        # Col 2: Part No.
        # Col 3: Name of the BLO
        # Col 4: Mobile No.
        # Col 5: Total electors
        
        # We can approximate that the first 5 columns take up 65% of the page width.
        new_width = original_width * 0.65
        
        page.cropbox.right = new_width
        writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)

if __name__ == "__main__":
    crop_pdf(sys.argv[1], sys.argv[2])
