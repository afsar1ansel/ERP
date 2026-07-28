from flask import Blueprint, request, jsonify, send_file
from classes.AdminUsersClass import adminUserObj 
from classes.AuditLogClass import auditLogObj 
from classes.AuditLogClass import auditLogObj 
from datetime import datetime
from io import BytesIO

auditlogs_blueprint = Blueprint("auditlogs", __name__)

@auditlogs_blueprint.route("/auditlogs/get-all-logs/<token>", methods=["GET"])
def getAllAuditLogs(token):
    """
    API to fetch paginated audit logs.
    Query parameters: page (int), per_page (int)
    """
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"] 
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token" , "error": str(e)}
        
    # Get pagination parameters from query string
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        if page < 1: page = 1
        if per_page < 1: per_page = 20
    except ValueError:
        return {"errFlag": 1, "message": "Invalid pagination parameters"}

    # AUDIT LOG IMPLEMENTATION: PAGE VIEW (Once per day per page)
    try:
        auditLogObj.check_and_log_daily_action(
            adminId=adminUserId,
            adminUsername=res[0].get("username", ""), 
            action_type='PAGE_VIEW',
            detail='Accessed Audit Logs page',
            object_table='audit_logs',
            object_id=0
        )
    except Exception as e:
        print("Error logging page view:", "err" + str(e))

    try:
        responseData, total_count = auditLogObj.getAllAuditLogs(page, per_page)
        
        # Prepare pagination metadata
        total_pages = (total_count + per_page - 1) // per_page
        
        return jsonify({
            "errFlag": 0,
            "message": "Audit logs fetched successfully",
            "data": [dict(row) for row in responseData], # Ensure all is mapped correctly
            "pagination": {
                "total_records": total_count,
                "current_page": page,
                "per_page": per_page,
                "total_pages": total_pages
            }
        })
    except Exception as e:
        print(f"Error while fetching audit logs: ", str(e))
        return {"errFlag": 1, "message": "Error while fetching audit logs"}


# ---
@auditlogs_blueprint.route("/auditlogs/download-logs/<token>", methods=["GET"])
def downloadAuditLogs(token):
    """
    API to download audit logs as a CSV file for a given date range.
    Query parameters: start_date (YYYY-MM-DD), end_date (YYYY-MM-DD)
    """
    if not token:
        return {"errFlag": 1, "message": "Token is required"}

    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    # Get date range parameters
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    if not start_date_str or not end_date_str:
        return {"errFlag": 1, "message": "start_date and end_date are required in YYYY-MM-DD format"}

    try:
        # Validate date format
        datetime.strptime(start_date_str, '%Y-%m-%d')
        datetime.strptime(end_date_str, '%Y-%m-%d')
    except ValueError:
        return {"errFlag": 1, "message": "Invalid date format. Use YYYY-MM-DD"}

    try:
        csv_data, error_message = auditLogObj.getAuditLogsForDownload(start_date_str, end_date_str)
        
        if error_message:
            return {"errFlag": 1, "message": error_message}

        # AUDIT LOG IMPLEMENTATION: DOWNLOAD
        try:
            auditLogObj.log_action(
                adminId=adminUserId,
                adminUsername=adminUsername,
                action_type='DOWNLOAD',
                detail=f'Downloaded audit logs from {start_date_str} to {end_date_str}.',
                object_table='audit_logs',
                object_id=0 
            )
        except Exception as e:
            print("Error logging download action:", e)
            
        # Return CSV file
        filename = f"audit_logs_{start_date_str}_to_{end_date_str}.csv"
        
        return send_file(
            BytesIO(csv_data.encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        print(f"Error while downloading audit logs: {e}")
        return {"errFlag": 1, "message": "Error while processing audit log download"}