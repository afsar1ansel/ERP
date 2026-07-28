#!/usr/bin/env python3
"""
ERP Domain Transition Script: Luggage/Bags -> Coffee Business
--------------------------------------------------------------
This script cleanly purges all domain-specific luggage/bags mock data from the
MySQL database while keeping the table schemas intact, preserving system page
permission metadata, and initializing a single primary Super Admin account (afsar@gmail.com).

Usage:
    python scripts/reset_for_coffee_domain.py
"""

import sys
import os
import pymysql
from urllib.parse import urlparse
from dotenv import load_dotenv

# Ensure space_luggage_apis root directory is in sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
sys.path.insert(0, PROJECT_ROOT)

load_dotenv(os.path.join(PROJECT_ROOT, ".env"))


def get_db_connection():
    """Extracts MySQL connection parameters from DB_URI env var or defaults to localhost."""
    db_uri = os.getenv("DB_URI", "mysql+pymysql://root:admin123@localhost:3306/space_luggage_db")
    
    # Parse URI e.g. mysql+pymysql://root:admin123@localhost:3306/space_luggage_db
    clean_uri = db_uri.replace("mysql+pymysql://", "mysql://").replace("mysql+mysqldb://", "mysql://")
    parsed = urlparse(clean_uri)
    
    host = parsed.hostname or "localhost"
    port = parsed.port or 3306
    user = parsed.username or "root"
    password = parsed.password or "admin123"
    database = parsed.path.lstrip("/") or "space_luggage_db"
    
    conn = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        autocommit=False
    )
    return conn, database


# Domain tables to purge (clearing all mock data, retaining schemas)
DOMAIN_TABLES_TO_PURGE = [
    "audit_logs",
    "brands",
    "client_types",
    "clients",
    "company_info_settings",
    "defect_types",
    "departments",
    "dispatch_orders",
    "dispatch_orders_items",
    "employee_jobs",
    "employees",
    "fg_stock_adjustments",
    "finished_goods",
    "jobs",
    "order_status_history",
    "orders",
    "payment_terms",
    "product_categories",
    "product_raw_material_consumption",
    "production_batch",
    "production_batch_stage_employees",
    "production_batch_stages",
    "production_receipts",
    "production_stage",
    "production_stage_categories",
    "production_stage_employees",
    "products_sku",
    "purchase_order_items",
    "purchase_orders",
    "qc_records",
    "qc_test_type",
    "raw_material_categories",
    "raw_material_consumption_receipt",
    "raw_material_vendors",
    "raw_materials",
    "scheduled_report_recipients",
    "scheduled_reports",
    "stock_transactions",
    "storage_locations",
    "units_of_measurement",
    "vendor_raw_materials",
    "vendor_stock_receipt_items",
    "vendor_stock_receipts",
    "vendors",
]


def reset_database_for_coffee_domain():
    print("\n" + "=" * 70)
    print(" ☕ ERP DATABASE RESET SCRIPT: TRANSITION TO COFFEE DOMAIN")
    print("=" * 70)

    try:
        conn, db_name = get_db_connection()
        print(f"[*] Connected to database: '{db_name}'")
    except Exception as err:
        print(f"[!] Database Connection Error: {err}")
        sys.exit(1)

    cursor = conn.cursor()

    try:
        print("\n[*] Disabling foreign key checks for safe purging...")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")

        # 1. Truncate/Purge Domain-Specific Data Tables
        print("\n" + "-" * 70)
        print(" PHASE 1: PURGING DOMAIN-SPECIFIC LUGGAGE MOCK DATA")
        print("-" * 70)
        
        cleared_count = 0
        for table in DOMAIN_TABLES_TO_PURGE:
            # Check if table exists
            cursor.execute(f"SHOW TABLES LIKE '{table}'")
            if cursor.fetchone():
                cursor.execute(f"SELECT COUNT(*) FROM `{table}`")
                before_cnt = cursor.fetchone()[0]
                
                cursor.execute(f"TRUNCATE TABLE `{table}`")
                print(f"  [✓] Cleared table `{table}` ({before_cnt} records removed)")
                cleared_count += 1
            else:
                print(f"  [-] Table `{table}` not found in database (skipped)")

        # 2. Reset and Re-initialize Admin Account
        print("\n" + "-" * 70)
        print(" PHASE 2: INITIALIZING DEFAULT ADMINISTRATOR ACCOUNT")
        print("-" * 70)

        # Check existing afsar@gmail.com record to preserve exact password hash
        cursor.execute("SELECT password, token FROM admin_users WHERE email = 'afsar@gmail.com'")
        existing_afsar = cursor.fetchone()
        
        if existing_afsar:
            afsar_password_hash = existing_afsar[0]
            afsar_token = existing_afsar[1]
            print("  [*] Existing admin account 'afsar@gmail.com' found. Preserving password hash.")
        else:
            # Fallback hash for 'afsar@gmail.com' if not present
            afsar_password_hash = "1a40730115688e72b31523b18f5df7f04a6cac86cdfc5c3f2edda09db00d4026"
            afsar_token = ""
            print("  [*] Creating new primary admin credentials for 'afsar@gmail.com'.")

        # Ensure Super Admin Role exists in admin_roles
        cursor.execute("SELECT id FROM admin_roles WHERE id = 1")
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO admin_roles (id, role_name, page_access, status)
                VALUES (1, 'Super Admin', '[10, 9, 6, 8, 11, 13, 12, 1, 3, 2, 7, 5, 14, 4, 15, 16]', 1)
            """)
            print("  [✓] Re-created 'Super Admin' role (ID = 1).")

        # Truncate admin_users table to clear all mock users
        cursor.execute("TRUNCATE TABLE `admin_users`")
        print("  [✓] Purged mock users from `admin_users` table.")

        # Re-insert single primary administrator account
        insert_admin_sql = """
            INSERT INTO admin_users (id, username, email, password, token, role_id, created_date, status)
            VALUES (1, 'Super Admin', 'afsar@gmail.com', %s, %s, 1, CURDATE(), 1)
        """
        cursor.execute(insert_admin_sql, (afsar_password_hash, afsar_token))
        print("  [✓] Primary Admin Account initialized successfully.")

        # 3. Re-enable Foreign Key Checks & Commit
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        conn.commit()

        print("\n" + "=" * 70)
        print(" 🎉 TRANSITION COMPLETE: DATABASE IS FRESH & READY FOR COFFEE ERP!")
        print("=" * 70)
        print("  Summary of Operations:")
        print(f"  • Total Domain Tables Cleared: {cleared_count}")
        print("  • Preserved System Metadata:  admin_role_pages, admin_roles")
        print("  • Primary Admin Account Details:")
        print("    - Email:    afsar@gmail.com")
        print("    - Role:     Super Admin / Administrator (Full Permissions)")
        print("    - Status:   Active (1)")
        print("=" * 70 + "\n")

    except Exception as e:
        conn.rollback()
        print(f"\n[!] Error during database reset: {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    reset_database_for_coffee_domain()
