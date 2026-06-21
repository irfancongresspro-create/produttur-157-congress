import pdfplumber
import json
import sys

def extract_data(pdf_path, json_path):
    all_data = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            table = page.extract_table()
            if not table:
                continue
                
            for row in table:
                # Filter out empty rows or header rows
                if not row or not any(row):
                    continue
                
                # Check if it's a data row (Sl. No. should be a number or numeric string)
                sl_no_raw = str(row[0]).strip() if row[0] else ""
                
                if sl_no_raw.isdigit():
                    # We have a valid row!
                    # The columns should be: 0: Sl.No, 1: Part No, 2: Name, 3: Mobile, 4: Total electors
                    try:
                        sl_no = int(sl_no_raw)
                        part_no = int(str(row[1]).strip().replace('\n', ''))
                        name = str(row[2]).strip().replace('\n', ' ')
                        mobile = str(row[3]).strip().replace('\n', '')
                        total_electors = int(str(row[4]).strip().replace('\n', ''))
                        
                        all_data.append({
                            "sl_no": sl_no,
                            "part_no": part_no,
                            "name": name,
                            "mobile": mobile,
                            "total_electors": total_electors
                        })
                    except Exception as e:
                        print(f"Skipping row due to error: {row} - {e}")

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=2, ensure_ascii=False)
        
    print(f"Extracted {len(all_data)} records to {json_path}")

if __name__ == "__main__":
    extract_data(sys.argv[1], sys.argv[2])
