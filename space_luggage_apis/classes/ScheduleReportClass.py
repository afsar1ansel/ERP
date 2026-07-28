# In /classes/ScheduleReportClass.py

from db import db
from sqlalchemy.sql import text
from datetime import datetime

class ScheduleReportClass:
    
    def createSchedule(self, report_name, report_type, frequency, execution_time, export_format, recipients):
        """
        Saves a new report schedule and its recipients to the database
        using a transaction.
        """
        
        with db.engine.connect() as conn:
            trans = conn.begin()
            try:
                # --- *** MODIFIED SQL (Removed 'RETURNING id') *** ---
                sql_insert_report = text("""
                    INSERT INTO scheduled_reports 
                    (report_name, report_type, frequency, execution_time, export_format, status)
                    VALUES 
                    (:report_name, :report_type, :frequency, :execution_time, :export_format, 1);
                """)
                
                report_params = {
                    "report_name": report_name,
                    "report_type": report_type,
                    "frequency": frequency,
                    "execution_time": execution_time,
                    "export_format": export_format
                }
                
                # Execute the insert
                result = conn.execute(sql_insert_report, report_params)
                
                # --- *** MODIFIED: Use result.lastrowid for MySQL *** ---
                report_id = result.lastrowid
                
                if not report_id:
                    raise Exception("Failed to create report schedule, no ID returned.")

                sql_insert_recipients = text("""
                    INSERT INTO scheduled_report_recipients (report_id, email)
                    VALUES (:report_id, :email);
                """)
                
                recipient_params = []
                for email in recipients:
                    if email:
                        recipient_params.append({
                            "report_id": report_id,
                            "email": email.strip()
                        })
                
                if not recipient_params:
                     raise Exception("No valid recipient emails were provided.")

                conn.execute(sql_insert_recipients, recipient_params)
                
                trans.commit()
                
                return {
                    "errFlag": 0, 
                    "message": "Report scheduled successfully!",
                    "report_id": report_id
                }

            except Exception as e:
                trans.rollback()
                print(f"Error in createSchedule: {e}")
                
                if 'unique_report_email' in str(e):
                    return {"errFlag": 1, "message": "One or more email addresses are duplicates for this report."}
                    
                return {"errFlag": 1, "message": f"Database error: {str(e)}"}

    # --- *** NEW METHOD 1: GET ALL SCHEDULES *** ---
    def getAllSchedules(self):
        """
        Fetches all scheduled reports and groups their recipients
        into a list (using GROUP_CONCAT for old MySQL/MariaDB).
        """
        try:
            sql = text("""
                SELECT 
                    sr.*, 
                    COALESCE(GROUP_CONCAT(srr.email SEPARATOR ','), '') AS recipients
                FROM 
                    scheduled_reports sr
                LEFT JOIN 
                    scheduled_report_recipients srr ON srr.report_id = sr.id
                GROUP BY 
                    sr.id
                ORDER BY 
                    sr.created_at DESC;
            """)
            
            with db.engine.connect() as conn:
                results = conn.execute(sql).mappings().all()
                
                data = []
                for row in results:
                    row_dict = dict(row)
                    
                    # --- *** THIS IS THE FIX *** ---
                    
                    # 1. Convert timedelta (for execution_time) to a string like "8:30:00"
                    if 'execution_time' in row_dict:
                        row_dict['execution_time'] = str(row_dict['execution_time'])
                    
                    # 2. Convert datetime (for created_at) to a standard string
                    if 'created_at' in row_dict and hasattr(row_dict['created_at'], 'isoformat'):
                        row_dict['created_at'] = row_dict['created_at'].isoformat()
                    
                    # 3. Convert datetime (for updated_at) to a standard string
                    if 'updated_at' in row_dict and hasattr(row_dict['updated_at'], 'isoformat'):
                        row_dict['updated_at'] = row_dict['updated_at'].isoformat()
                    
                    # --- *** END OF FIX *** ---

                    # This part for recipients is still correct
                    recipients_str = row_dict.get('recipients')
                    
                    if recipients_str:
                        row_dict['recipients'] = recipients_str.split(',')
                    else:
                        row_dict['recipients'] = []
                        
                    data.append(row_dict)
                
                return {"errFlag": 0, "message": "Schedules fetched successfully", "data": data}
                
        except Exception as e:
            print(f"Error in getAllSchedules: {e}")
            return {"errFlag": 1, "message": f"Database error: {str(e)}"}

    # --- *** NEW METHOD 2: UPDATE A SCHEDULE *** ---
    def updateSchedule(self, report_id, report_name, report_type, frequency, execution_time, export_format, recipients):
        """
        Updates an existing schedule.
        This uses a "delete-then-insert" strategy for recipients,
        which is the simplest and most robust way to handle changes.
        """
        with db.engine.connect() as conn:
            trans = conn.begin()
            try:
                # Step 1: Update the main report details
                sql_update_report = text("""
                    UPDATE scheduled_reports
                    SET 
                        report_name = :report_name,
                        report_type = :report_type,
                        frequency = :frequency,
                        execution_time = :execution_time,
                        export_format = :export_format,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE 
                        id = :report_id;
                """)
                conn.execute(sql_update_report, {
                    "report_id": report_id,
                    "report_name": report_name,
                    "report_type": report_type,
                    "frequency": frequency,
                    "execution_time": execution_time,
                    "export_format": export_format
                })

                # Step 2: Delete all old recipients for this report
                sql_delete_recipients = text("DELETE FROM scheduled_report_recipients WHERE report_id = :report_id")
                conn.execute(sql_delete_recipients, {"report_id": report_id})

                # Step 3: Insert the new list of recipients
                if not recipients:
                    raise Exception("At least one recipient is required.")

                sql_insert_recipients = text("""
                    INSERT INTO scheduled_report_recipients (report_id, email)
                    VALUES (:report_id, :email);
                """)
                
                recipient_params = []
                for email in recipients:
                    if email:
                        recipient_params.append({
                            "report_id": report_id,
                            "email": email.strip()
                        })

                if not recipient_params:
                     raise Exception("No valid recipient emails were provided.")

                conn.execute(sql_insert_recipients, recipient_params)

                # Step 4: Commit the transaction
                trans.commit()
                return {"errFlag": 0, "message": "Schedule updated successfully!"}

            except Exception as e:
                trans.rollback()
                print(f"Error in updateSchedule: {e}")
                return {"errFlag": 1, "message": f"Database error: {str(e)}"}

    # --- *** NEW METHOD 3: UPDATE STATUS (ACTIVATE/DEACTIVATE) *** ---
    def updateScheduleStatus(self, report_id, status):
        """
        Updates the status of a scheduled report (1 for active, 0 for inactive).
        """
        try:
            if status not in [0, 1]:
                return {"errFlag": 1, "message": "Invalid status. Use 0 or 1."}

            sql = text("UPDATE scheduled_reports SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
            
            with db.engine.connect() as conn:
                # --- *** MODIFIED: Added conn.commit() *** ---
                trans = conn.begin() # Use a transaction for updates
                try:
                    result = conn.execute(sql, {"status": status, "id": report_id})
                    
                    if result.rowcount == 0:
                        trans.rollback()
                        return {"errFlag": 1, "message": "Report ID not found."}
                    
                    trans.commit() # Commit the change
                    
                    action = "activated" if status == 1 else "deactivated"
                    return {"errFlag": 0, "message": f"Schedule {action} successfully."}
                
                except Exception as e:
                    trans.rollback()
                    raise e
                
        except Exception as e:
            print(f"Error in updateScheduleStatus: {e}")
            return {"errFlag": 1, "message": f"Database error: {str(e)}"}

# Create a single instance to be imported by the routes
scheduleReportObj = ScheduleReportClass()