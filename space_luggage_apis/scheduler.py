import os
import sys
from datetime import datetime, timedelta
from flask import Flask, Response
from flask_mail import Mail, Message
from db import db
from sqlalchemy.sql import text
from dotenv import load_dotenv
import pytz
from classes.ReportsClass import reportsObj
import io


# Set Python path for imports (crucial for cron jobs)
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
load_dotenv() 

# --- FLASK APP & DATABASE SETUP ---
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DB_URI')
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

mail = Mail(app)
db.init_app(app)

# --- SQL QUERY FOR ACTIVE SCHEDULES (Updated to include report_type and export_format) ---
fetch_sql = text("""
    SELECT 
        sr.id, sr.report_name, sr.frequency, sr.execution_time, sr.report_type, sr.export_format,
        GROUP_CONCAT(srr.email SEPARATOR ',') AS recipients
    FROM 
        scheduled_reports sr
    LEFT JOIN 
        scheduled_report_recipients srr ON srr.report_id = sr.id
    WHERE 
        sr.status = 1 
    GROUP BY 
        sr.id;
""")

# --- REPORT MAPPING (Links report_type in DB to the actual function) ---
REPORT_FUNCTION_MAP = {
    "raw-materials-stock-report": reportsObj.generateRawMaterialsStockReport,
    "finished-goods-stock-report": reportsObj.generateFinishedGoodsStockReport,
    "material-inward-report": reportsObj.generateMaterialInwardReport,
    "qc-records-report": reportsObj.generateQcRecordsReport,
    "raw-material-consumption-report": reportsObj.generateRawMaterialConsumptionReport,
    "vendor-performance-report": reportsObj.generateVendorPerformanceReport,
}

# --- DATE RANGE CALCULATION LOGIC (REVISED FOR 3 MONTH LOOKBACK) ---
def calculate_date_range(frequency, now_target_tz):
    """
    Calculates a fixed 90-day (approx. 3 month) lookback period for all reports.
    Ignores the 'frequency' parameter for range calculation.
    """
    
    # End date is always today (target timezone's date)
    end_date = now_target_tz.date().strftime('%Y-%m-%d')
    
    # Start date is always 90 days ago
    start_date = (now_target_tz.date() - timedelta(days=90)).strftime('%Y-%m-%d')

    print(f"DEBUG: Calculated Fixed Report Range (90 Days): {start_date} to {end_date}")
    return start_date, end_date

# --- CORE EMAIL SENDING LOGIC (Modified) ---
def send_email_report_with_attachment(report_data, now_target_tz):
    """Generates the report file and attaches it to the email."""
    
    # Normalize report_type key (handle spaces/hyphens for lookup)
    raw_report_key = report_data.get('report_type')
    if not raw_report_key:
         print(f"ERROR: Report ID {report_data['id']} is missing 'report_type' column value.")
         return False
         
    report_type = raw_report_key.strip().lower().replace(' ', '-').replace('_', '-')

    doc_type = report_data['export_format']
    recipients_list = [email.strip() for email in report_data['recipients'].split(',') if email.strip()]

    if not recipients_list:
        print(f"SKIPPED: Report ID {report_data['id']} has no recipients.")
        return False

    # 1. Determine Date Range
    # Vendor performance report is handled separately as it doesn't need a date range filter in the API call.
    if report_type == "vendor-performance-report":
        # For documentation purposes, set the start/end date to today
        start_date = now_target_tz.date().strftime('%Y-%m-%d')
        end_date = start_date
    else:
        # Use the new 90-day fixed calculation for all other reports
        start_date, end_date = calculate_date_range(report_data['frequency'], now_target_tz)

    # 2. Generate Report Content
    response = None
    try:
        report_func = REPORT_FUNCTION_MAP.get(report_type)
        if not report_func:
            print(f"ERROR: Unknown report type: {report_type}. Check DB or REPORT_FUNCTION_MAP.")
            return False

        # Prepare arguments based on the report type
        if report_type == "vendor-performance-report":
            response = report_func(doc_type=doc_type)
        else:
            # All other reports require start_date and end_date
            response = report_func(start_date=start_date, end_date=end_date, doc_type=doc_type)

        if isinstance(response, dict) and response.get('errFlag') == 1:
            print(f"REPORT GENERATION FAILED: {response.get('message')}")
            return False
            
        if not isinstance(response, Response):
            print(f"REPORT GENERATION FAILED: Function did not return a proper Flask Response object.")
            return False
        
        # Get data and filename from the Flask Response object
        file_data = response.data
        
        # Extract filename from Content-Disposition header
        content_disposition = response.headers.get('Content-Disposition')
        filename = f"report_{report_data['id']}.{doc_type}" # Default fallback
        if content_disposition:
            # Simple extraction from "attachment;filename=NAME.EXT"
            parts = content_disposition.split(';')
            for part in parts:
                if 'filename=' in part:
                    # Clean up the filename
                    filename = part.split('filename=')[1].strip('\"')
                    break

    except Exception as e:
        print(f"CRITICAL ERROR during report generation for ID {report_data['id']}: {e}")
        return False

    # 3. Send Email with Attachment
    msg = Message(
        f"Scheduled Report: {report_data['report_name']} ({start_date} to {end_date})",
        recipients=recipients_list,
        body=f"Please find the requested scheduled report: '{report_data['report_name']}' for the period {start_date} to {end_date}, attached below.",
    )

    # Attach the file
    msg.attach(
        filename,
        response.mimetype, # Use the mimetype returned by the generator
        file_data
    )
    
    # We must be within the application context to send mail
    try:
        mail.send(msg)
        print(f"SUCCESS: Email sent with attachment for Report ID {report_data['id']} (File: {filename})")
        return True
    except Exception as e:
        print(f"EMAIL SENDING FAILED (SMTP Error) for ID {report_data['id']}: {e}")
        return False


# --- MAIN SCHEDULER FUNCTION ---

def run_scheduler():
    """Main scheduler loop that pulls due reports from the database and executes email sends."""

    # 1. Define Timezones (UNCHANGED)
    server_tz = pytz.utc 
    target_tz = pytz.timezone('Asia/Kolkata') 
    now_utc = datetime.now(server_tz) 
    
    print(f"\n--- Scheduler running at {now_utc.isoformat()} ---")
    
    with app.app_context():
        
        try:
            # Note: fetch_sql now correctly includes report_type and export_format from the global definition.
            results = db.session.execute(fetch_sql).mappings().all()
        except Exception as e:
            print(f"FATAL DB ERROR: {e}")
            return 

        reports_to_run = []
        time_tolerance = timedelta(minutes=5)
        
        for row in results:
            
            try:
                report_time_obj = datetime.strptime(str(row['execution_time']), '%H:%M:%S').time()
                scheduled_datetime_target_tz = target_tz.localize(
                    datetime.combine(now_utc.date(), report_time_obj)
                )
                scheduled_datetime_utc = scheduled_datetime_target_tz.astimezone(server_tz)
                
            except ValueError:
                print(f"Skipping report ID {row['id']}: Invalid time format in DB.")
                continue

            # Check 1: Time Window (Compare UTC times)
            if scheduled_datetime_utc > now_utc - time_tolerance and scheduled_datetime_utc <= now_utc:
                
                # Check 2: Frequency Match (Use the current date relative to the TARGET timezone)
                now_target_tz = now_utc.astimezone(target_tz)
                
                is_due_today = False
                
                if row['frequency'] == 'daily':
                    is_due_today = True
                elif row['frequency'] == 'weekly' and now_target_tz.weekday() == 0: 
                    is_due_today = True 
                elif row['frequency'] == 'monthly' and now_target_tz.day == 1: 
                    is_due_today = True

                if is_due_today:
                    reports_to_run.append(row)

        
        # 3. Execute Send Logic
        for report in reports_to_run:
            # Pass the target timezone object needed for date range calculation
            send_email_report_with_attachment(report, now_target_tz) 

        print(f"--- Scheduler finished. {len(reports_to_run)} reports processed. ---")


if __name__ == '__main__':
    run_scheduler()