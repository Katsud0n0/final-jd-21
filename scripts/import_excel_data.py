
#!/usr/bin/env python3
"""
Excel Data Import Tool

This script imports data from Excel files for local development setup.

Requirements:
- Python 3.6+
- openpyxl

Usage:
python import_excel_data.py <excel_file_path>
"""

import sys
import os
import openpyxl
from datetime import datetime

def import_departments(wb, output_path):
    """Import departments from Excel worksheet."""
    try:
        ws = wb["Departments"]
        output_wb = openpyxl.Workbook()
        output_ws = output_wb.active
        
        # Copy headers
        for col in range(1, ws.max_column + 1):
            output_ws.cell(row=1, column=col, value=ws.cell(row=1, column=col).value)
        
        # Copy data
        for row in range(2, ws.max_row + 1):
            for col in range(1, ws.max_column + 1):
                output_ws.cell(row=row, column=col, value=ws.cell(row=row, column=col).value)
        
        output_wb.save(os.path.join(output_path, 'departments.xlsx'))
        print("Successfully imported departments.")
    except Exception as e:
        print(f"Error importing departments: {e}")

def import_users(wb, output_path):
    """Import users from Excel worksheet."""
    try:
        ws = wb["Users"]
        output_wb = openpyxl.Workbook()
        output_ws = output_wb.active
        
        # Copy headers
        for col in range(1, ws.max_column + 1):
            output_ws.cell(row=1, column=col, value=ws.cell(row=1, column=col).value)
        
        # Copy data
        for row in range(2, ws.max_row + 1):
            for col in range(1, ws.max_column + 1):
                output_ws.cell(row=row, column=col, value=ws.cell(row=row, column=col).value)
        
        output_wb.save(os.path.join(output_path, 'users.xlsx'))
        print("Successfully imported users.")
    except Exception as e:
        print(f"Error importing users: {e}")

def import_requests(wb, output_path):
    """Import requests from Excel worksheet."""
    try:
        ws = wb["Requests"]
        output_wb = openpyxl.Workbook()
        output_ws = output_wb.active
        
        # Copy headers
        for col in range(1, ws.max_column + 1):
            output_ws.cell(row=1, column=col, value=ws.cell(row=1, column=col).value)
        
        # Copy data
        for row in range(2, ws.max_row + 1):
            for col in range(1, ws.max_column + 1):
                output_ws.cell(row=row, column=col, value=ws.cell(row=row, column=col).value)
        
        output_wb.save(os.path.join(output_path, 'requests.xlsx'))
        print("Successfully imported requests.")
    except Exception as e:
        print(f"Error importing requests: {e}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python import_excel_data.py <excel_file_path>")
        sys.exit(1)

    excel_file = sys.argv[1]
    output_path = './data/excel'
    
    if not os.path.exists(excel_file):
        print(f"Error: File {excel_file} does not exist.")
        sys.exit(1)

    if not os.path.exists(output_path):
        os.makedirs(output_path)

    try:
        # Load Excel workbook
        print(f"Loading Excel file: {excel_file}")
        wb = openpyxl.load_workbook(excel_file)
        
        # Import data
        import_departments(wb, output_path)
        import_users(wb, output_path)
        import_requests(wb, output_path)
        
        print("\nImport completed successfully!")
        print(f"Data files have been created in: {output_path}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

