from flask import Blueprint, request
from classes.ReportsClass import reportsObj
from classes.AdminUsersClass import adminUserObj
from classes.AuditLogClass import auditLogObj

reports_blueprint = Blueprint("reports", __name__)

@reports_blueprint.route("/reports/raw-materials-stock-report", methods=["POST"])
def generateRawMaterialsStockReport():
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
        # Get date range and document type from form data
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        doc_type = request.form.get('doc_type', 'csv').lower()  # Default to CSV
        
        if not start_date or not end_date:
            return {"errFlag": 1, "message": "Start date and end date are required"}
        
        # Validate document type
        if doc_type not in ['csv', 'pdf', 'excel']:
            return {"errFlag": 1, "message": "Invalid document type. Use 'csv', 'pdf', or 'excel'"}
        
        response = reportsObj.generateRawMaterialsStockReport(start_date, end_date, doc_type)
        # Add audit log entry
        try:
            auditLogObj.log_action(
                adminId=adminUserId,
                adminUsername=adminUserName,
                action_type='REPORT_GENERATION',
                detail=f'Generated raw materials stock report from {start_date} to {end_date} in {doc_type} format.',
                object_table='reports',
                object_id=0 
            )
        except Exception as e:
            print("Error logging report generation action:", e)
        
        return response
        
    except Exception as e:
        print("error ::::::", e)
        return {"errFlag": 1, "message": "Error while generating stock report"}


@reports_blueprint.route("/reports/finished-goods-stock-report", methods=["POST"])
def generateFinishedGoodsStockReport():

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
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        doc_type = request.form.get('doc_type', 'csv').lower()

        if not start_date or not end_date:
            return {"errFlag": 1, "message": "Start date and end date are required"}

        if doc_type not in ['csv', 'pdf', 'excel']:
            return {"errFlag": 1, "message": "Invalid document type. Use 'csv', 'pdf', or 'excel'"}

        response = reportsObj.generateFinishedGoodsStockReport(start_date, end_date, doc_type)
        # Add audit log entry
        try:
            auditLogObj.log_action(
                adminId=adminUserId,
                adminUsername=adminUserName,
                action_type='REPORT_GENERATION',
                detail=f'Generated finished goods stock report from {start_date} to {end_date} in {doc_type} format.',
                object_table='reports',
                object_id=0 
            )
        except Exception as e:
            print("Error logging report generation action:", e)
        return response
    except Exception as e:
        print("error generating finished goods report ::::::", e)
        return {"errFlag": 1, "message": "Error while generating finished goods stock report"}
    

@reports_blueprint.route("/reports/material-inward-report", methods=["POST"])
def generateMaterialInwardReport():
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
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        doc_type = request.form.get('doc_type', 'csv').lower()

        if not start_date or not end_date:
            return {"errFlag": 1, "message": "Start date and end date are required"}

        if doc_type not in ['csv', 'pdf', 'excel']:
            return {"errFlag": 1, "message": "Invalid document type. Use 'csv', 'pdf', or 'excel'"}

        response = reportsObj.generateMaterialInwardReport(start_date, end_date, doc_type)
        # Add audit log entry
        try:
            auditLogObj.log_action(
                adminId=adminUserId,
                adminUsername=adminUserName,
                action_type='REPORT_GENERATION',
                detail=f'Generated material inward report from {start_date} to {end_date} in {doc_type} format.',
                object_table='reports',
                object_id=0 
            )
        except Exception as e:
            print("Error logging report generation action:", e)
        return response
    except Exception as e:
        print("error generating material inward report ::::::", e)
        return {"errFlag": 1, "message": "Error while generating material inward report"}
    

@reports_blueprint.route("/reports/qc-records-report", methods=["POST"])
def generateQcRecordsReport():
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
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        doc_type = request.form.get('doc_type', 'csv').lower()

        if not start_date or not end_date:
            return {"errFlag": 1, "message": "Start date and end date are required"}

        if doc_type not in ['csv', 'pdf', 'excel']:
            return {"errFlag": 1, "message": "Invalid document type. Use 'csv', 'pdf', or 'excel'"}

        response = reportsObj.generateQcRecordsReport(start_date, end_date, doc_type)
        # Add audit log entry
        try:
            auditLogObj.log_action(
                adminId=adminUserId,
                adminUsername=adminUserName,
                action_type='REPORT_GENERATION',
                detail=f'Generated QC records report from {start_date} to {end_date} in {doc_type} format.',
                object_table='reports',
                object_id=0 
            )
        except Exception as e:
            print("Error logging report generation action:", e)
        return response
    except Exception as e:
        print("error generating qc records report ::::::", e)
        return {"errFlag": 1, "message": "Error while generating QC records report"}    


@reports_blueprint.route("/reports/raw-material-consumption-report", methods=["POST"])
def generateRawMaterialConsumptionReport():
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
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        doc_type = request.form.get('doc_type', 'csv').lower()

        if not start_date or not end_date:
            return {"errFlag": 1, "message": "Start date and end date are required"}

        if doc_type not in ['csv', 'pdf', 'excel']:
            return {"errFlag": 1, "message": "Invalid document type. Use 'csv', 'pdf', or 'excel'"}

        response = reportsObj.generateRawMaterialConsumptionReport(start_date, end_date, doc_type)
        # Add audit log entry
        try:
            auditLogObj.log_action(
                adminId=adminUserId,
                adminUsername=adminUserName,
                action_type='REPORT_GENERATION',
                detail=f'Generated raw material consumption report from {start_date} to {end_date} in {doc_type} format.',
                object_table='reports',
                object_id=0 
            )
        except Exception as e:
            print("Error logging report generation action:", e)
        return response

    except Exception as e:
        print("error ::::::", e)
        return {"errFlag": 1, "message": "Error while generating consumption report"}
    

@reports_blueprint.route("/reports/vendor-performance-report", methods=["POST"])
def generate_vendor_performance_report():
    token = request.form.get('token')
    if not token:
        return {"errFlag": 1, "message": "Token is required"}

    try:
        # Validate the token
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid or expired token"}
        adminUserId = res[0]["id"]
        adminUserName = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": f"Token validation error: {e}"}

    try:
        # Get the desired document type from the form, default to 'csv'
        doc_type = request.form.get('doc_type', 'csv').lower()

        if doc_type not in ['csv', 'pdf', 'excel']:
            return {"errFlag": 1, "message": "Invalid document type. Use 'csv', 'pdf', or 'excel'"}

        # Call the class method to generate the report file
        response = reportsObj.generateVendorPerformanceReport(doc_type)

        # The class method returns a Flask Response object on success
        # or a dictionary on error.
        if isinstance(response, dict) and response.get("errFlag") == 1:
             return (response)
        # Log the report generation action
        try:
            auditLogObj.log_action(
                adminId=adminUserId,
                adminUsername=adminUserName,
                action_type='REPORT_GENERATION',
                detail=f'Generated vendor performance report in {doc_type} format.',
                object_table='reports',
                object_id=0 
            )
        except Exception as e:
            print("Error logging report generation action:", e)
        return response

    except Exception as e:
        print(f"Error in /reports/vendor-performance-report endpoint: {e}")
        return {"errFlag": 1, "message": "An error occurred while generating the report"}


