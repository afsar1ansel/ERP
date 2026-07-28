# /ScheduleReports.py

from flask import Blueprint, request
from classes.ScheduleReportClass import scheduleReportObj
from classes.AdminUsersClass import adminUserObj
from datetime import datetime
from classes.AuditLogClass import auditLogObj

schedule_reports_blueprint = Blueprint("schedule_reports", __name__)

@schedule_reports_blueprint.route("/schedule/create", methods=["POST"])
def create_report_schedule():
    # print("Reached /schedule/create endpoint")
    # --- This is your existing create route ---
    token = request.form.get('token')
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUserName = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        report_name = request.form.get('report_name')
        report_type = request.form.get('report_type')
        frequency = request.form.get('frequency')
        execution_time = request.form.get('time')
        export_format = request.form.get('export_format', 'pdf').lower()
        recipients = request.form.getlist('recipients')

        if not all([report_name, report_type, frequency, execution_time, recipients]):
            return {"errFlag": 1, "message": "Missing required fields. Name, type, frequency, time, and at least one recipient are required."}

        if frequency not in ['daily', 'weekly', 'monthly']:
            return {"errFlag": 1, "message": "Invalid frequency. Use 'daily', 'weekly', or 'monthly'"}

        if export_format not in ['pdf', 'csv']:
            return {"errFlag": 1, "message": "Invalid export format. Use 'pdf' or 'csv'"}
        
        try:
            datetime.strptime(execution_time, '%H:%M') 
        except ValueError:
            return {"errFlag": 1, "message": "Invalid time format. Please use HH:MM"}

        response = scheduleReportObj.createSchedule(
            report_name, 
            report_type, 
            frequency, 
            execution_time, 
            export_format, 
            recipients
        )
        #Audit log for schedule creation
        try:
            auditLogObj.log_action(
                adminId=adminUserId,
                adminUsername=adminUserName,
                action_type='INSERT',
                detail=f'Created new Report Schedule: {report_name}',
                object_table='report_schedules',
                object_id=response if isinstance(response, int) else 0
            )
        except Exception as e:
            print("Error logging schedule creation action:", e)
        return response
        
    except Exception as e:
        print(f"Error in /schedule/create endpoint: {e}")
        return {"errFlag": 1, "message": "An error occurred while scheduling the report"}


# --- *** NEW ROUTE 1: GET ALL SCHEDULES *** ---
@schedule_reports_blueprint.route("/schedule/get-all/<token>", methods=["GET"])
def get_all_schedules(token): # Token now comes from the URL as an argument
    """
    API endpoint to fetch all scheduled reports.
    """
    
    # --- MODIFIED: We get the token from the function argument ---
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUserName = res[0].get("username", "N/A")
    except Exception as e:
        print(f"Token validation error: {e}")
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        # This part stays the same, it just calls the class method
        response = scheduleReportObj.getAllSchedules()

        #Audit log for fetching all schedules
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=adminUserId,
                adminUsername=adminUserName,
                action_type='PAGE_VIEW',
                detail='Fetched all Report Schedules',
                object_table='report_schedules',
                object_id=0
            )
        except Exception as e:
            print("Error logging schedule fetching action:", e)
        return response
    except Exception as e:
        print(f"Error in /schedule/get-all: {e}")
        return {"errFlag": 1, "message": "An error occurred while fetching schedules"}


# --- *** NEW ROUTE 2: UPDATE A SCHEDULE *** ---
@schedule_reports_blueprint.route("/schedule/update", methods=["POST"])
def update_report_schedule():
    """
    API endpoint to update an existing report schedule.
    """
    token = request.form.get('token')
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUserName = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        # Get all the form data, including the report ID
        report_id = request.form.get('id')
        report_name = request.form.get('report_name')
        report_type = request.form.get('report_type')
        frequency = request.form.get('frequency')
        execution_time = request.form.get('time')
        export_format = request.form.get('export_format', 'pdf').lower()
        recipients = request.form.getlist('recipients')

        # Validation
        if not report_id:
            return {"errFlag": 1, "message": "Report ID is required for an update."}
        
        if not all([report_name, report_type, frequency, execution_time, recipients]):
            return {"errFlag": 1, "message": "Missing required fields."}

        # (You can add the other validations for frequency, format, and time here too)
           
        response = scheduleReportObj.updateSchedule(
            report_id,
            report_name, 
            report_type, 
            frequency, 
            execution_time, 
            export_format, 
            recipients
        )
        
        #Audit log for schedule update
        try:
            auditLogObj.log_action(
                adminId=adminUserId,
                adminUsername=adminUserName,
                action_type='UPDATE',
                detail=f'Updated Report Schedule to {report_name}',
                object_table='report_schedules',
                object_id=response if isinstance(response, int) else 0
               
            )
        except Exception as e:
            print("Error logging schedule update action:", e)
        return response
        
    except Exception as e:
        print(f"Error in /schedule/update: {e}")
        return {"errFlag": 1, "message": "An error occurred while updating the schedule"}


# --- *** NEW ROUTE 3: UPDATE STATUS (ACTIVATE/DEACTIVATE) *** ---
@schedule_reports_blueprint.route("/schedule/update-status", methods=["POST"])
def update_schedule_status():
    """
    API endpoint to activate (1) or deactivate (0) a schedule.
    """
    token = request.form.get('token')
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUserName = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        report_id = request.form.get('id')
        status = request.form.get('status')

        if not report_id or status is None:
            return {"errFlag": 1, "message": "Both 'id' and 'status' are required."}
        
        try:
            # Ensure status is an integer (0 or 1)
            status_int = int(status)
        except ValueError:
            return {"errFlag": 1, "message": "Status must be 0 or 1."}

        response = scheduleReportObj.updateScheduleStatus(report_id, status_int)
        #Audit log for schedule status update
        try:
            auditLogObj.log_action(
                adminId=adminUserId,
                adminUsername=adminUserName,
                action_type='STATUS_CHANGE',
                detail=f'Updated Report Schedule ID {report_id} status to {status_int}',
                object_table='report_schedules',
                object_id=report_id
            )
        except Exception as e:
            print("Error logging schedule status update action:", e)
        return response
        
    except Exception as e:
        print(f"Error in /schedule/update-status: {e}")
        return {"errFlag": 1, "message": "An error occurred while updating status"}