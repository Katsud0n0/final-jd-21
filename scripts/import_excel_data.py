
#!/usr/bin/env python3
"""
Excel to SQLite Import Tool for JD Frameworks

This script imports data from Excel files into a SQLite database for local development setup.

Requirements:
- Python 3.6+
- openpyxl
- sqlite3 (included in standard Python)

Usage:
python import_excel_data.py <excel_file_path>
"""

import sys
import os
import sqlite3
import openpyxl
from datetime import datetime

def create_database():
    """Create SQLite database and tables for JD Frameworks."""
    conn = sqlite3.connect('jd_frameworks.db')
    cursor = conn.cursor()

    # Create departments table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        description TEXT NOT NULL
    )
    ''')

    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        department TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        role TEXT,
        password_hash TEXT,
        created_at TEXT,
        FOREIGN KEY (department) REFERENCES departments(name)
    )
    ''')

    # Create requests table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        department TEXT NOT NULL,
        creator TEXT NOT NULL,
        status TEXT NOT NULL,
        date_created TEXT NOT NULL,
        date_updated TEXT,
        FOREIGN KEY (department) REFERENCES departments(name),
        FOREIGN KEY (creator) REFERENCES users(username)
    )
    ''')

    conn.commit()
    return conn

def import_departments(conn, wb):
    """Import departments from Excel worksheet."""
    try:
        ws = wb["Departments"]
        cursor = conn.cursor()
        
        print("Importing departments...")
        for row in ws.iter_rows(min_row=2, values_only=True):
            if not row[0]:  # Skip empty rows
                continue
                
            cursor.execute('''
            INSERT OR REPLACE INTO departments (id, name, icon, color, description)
            VALUES (?, ?, ?, ?, ?)
            ''', (row[0], row[1], row[2], row[3], row[4]))
            
        conn.commit()
        print(f"Successfully imported departments.")
    except Exception as e:
        print(f"Error importing departments: {e}")

def import_users(conn, wb):
    """Import users from Excel worksheet."""
    try:
        ws = wb["Users"]
        cursor = conn.cursor()
        
        print("Importing users...")
        for row in ws.iter_rows(min_row=2, values_only=True):
            if not row[0]:  # Skip empty rows
                continue
                
            cursor.execute('''
            INSERT OR REPLACE INTO users (id, username, full_name, department, email, phone, role, password_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], datetime.now().isoformat()))
            
        conn.commit()
        print(f"Successfully imported users.")
    except Exception as e:
        print(f"Error importing users: {e}")

def import_requests(conn, wb):
    """Import requests from Excel worksheet."""
    try:
        ws = wb["Requests"]
        cursor = conn.cursor()
        
        print("Importing requests...")
        for row in ws.iter_rows(min_row=2, values_only=True):
            if not row[0]:  # Skip empty rows
                continue
                
            cursor.execute('''
            INSERT OR REPLACE INTO requests (id, title, description, department, creator, status, date_created, date_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (row[0], row[1], row[2], row[3], row[4], row[5], row[6], datetime.now().isoformat()))
            
        conn.commit()
        print(f"Successfully imported requests.")
    except Exception as e:
        print(f"Error importing requests: {e}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python import_excel_data.py <excel_file_path>")
        sys.exit(1)

    excel_file = sys.argv[1]
    
    if not os.path.exists(excel_file):
        print(f"Error: File {excel_file} does not exist.")
        sys.exit(1)

    try:
        # Load Excel workbook
        print(f"Loading Excel file: {excel_file}")
        wb = openpyxl.load_workbook(excel_file)
        
        # Create database and tables
        conn = create_database()
        
        # Import data
        import_departments(conn, wb)
        import_users(conn, wb)
        import_requests(conn, wb)
        
        print("\nImport completed successfully!")
        print("Database file: jd_frameworks.db")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()
