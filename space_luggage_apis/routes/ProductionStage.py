from flask import Blueprint, request
from classes.ProductionStageClass import productionStageObj
from classes.AdminUsersClass import adminUserObj
import json
from classes.AuditLogClass import auditLogObj

production_stage_blueprint = Blueprint("production_stage", __name__)

@production_stage_blueprint.route("/production-stages/add", methods=["POST"])
def addProductionStage():
    try:
        stage_name = request.form["stageName"]
        stage_head_employee_id = request.form["stageHeadEmployeeId"]
        stage_employees_json = request.form.get("stageEmployees", "[]") # Expects a JSON string of objects like [{"stage_employee_id": 1}, {"stage_employee_id": 2}]
        token = request.form["token"]
        
        stage_employees = json.loads(stage_employees_json)
    except Exception as e:
        return {"errFlag": 1, "message": f"Invalid or missing inputs"}

    if not all([stage_name, stage_head_employee_id, token]):
        return {"errFlag": 1, "message": "Required fields are missing."}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_username = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": f"Token validation error"}
    
    try:
        response = productionStageObj.addProductionStage(
            stage_name, stage_head_employee_id, stage_employees, admin_user_id
        )
        
        if isinstance(response, dict): # An error dictionary was returned
            return response
        elif response > 0:
            #AUDIT LOG IMPLEMENTATION: PRODUCTION STAGE CREATION
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_username,
                    action_type='INSERT',
                    detail=f'Created new Production Stage: {stage_name}',
                    object_table='production_stages',
                    object_id=response
                )
            except Exception as e:
                print("Error logging production stage creation action:", e)
            return {"errFlag": 0, "message": "Production Stage added successfully."}
        else:
            return {"errFlag": 1, "message": "Failed to add Production Stage."}
    except Exception as e:
        print(e)
        return {"errFlag": 1, "message": f"An unexpected error occurred"}

@production_stage_blueprint.route("/production-stages/update", methods=["POST"])
def updateProductionStage():
    try:
        stage_id = int(request.form["stageId"])
        stage_name = request.form["stageName"]
        stage_head_employee_id = request.form["stageHeadEmployeeId"]
        stage_employees_json = request.form.get("stageEmployees", "[]")
        token = request.form["token"]
        
        stage_employees = json.loads(stage_employees_json)
    except Exception as e:
        return {"errFlag": 1, "message": f"Invalid or missing inputs"}

    if not all([stage_id, stage_name, stage_head_employee_id, token]):
        return {"errFlag": 1, "message": "Required fields are missing."}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": f"Token validation error"}
    
    #fetch existing stage details for audit log
    try:
        existing_stage = productionStageObj.getProductionStageDetails(stage_id)
    except Exception as e:
        existing_stage = None       
    try:
        response = productionStageObj.updateProductionStage(
            stage_id, stage_name, stage_head_employee_id, stage_employees, admin_user_id
        )
        
        if isinstance(response, dict): # An error dictionary was returned
            return response
        elif response > 0:
            #AUDIT LOG IMPLEMENTATION: PRODUCTION STAGE UPDATE
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='UPDATE',
                    detail=f'Updated Production Stage: {stage_name} (ID: {stage_id})',
                    object_table='production_stages',
                    object_id=stage_id,
                    old_value=existing_stage[0] if existing_stage else None,
                    new_value={
                        'stage_name': stage_name,
                        'stage_head_employee_id': stage_head_employee_id,
                        'stage_employees': stage_employees
                    }
                )
            except Exception as e:
                print("Error logging production stage update action:", e)
            return {"errFlag": 0, "message": "Production Stage updated successfully."}
        else:
            return {"errFlag": 1, "message": "Failed to update Production Stage or no changes were made."}
    except Exception as e:
        return {"errFlag": 1, "message": f"An unexpected error occurred"}

@production_stage_blueprint.route("/production-stages/get-all/<token>")
def getAllProductionStages(token):
    if not token:
        return {"errFlag": 1, "message": "Token is required."}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Token validation error"}
    
    try:
        stages = productionStageObj.getAllProductionStages()
        # AUDIT LOG IMPLEMENTATION: GET ALL PRODUCTION STAGES
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=admin_user_id,
                adminUsername=admin_user_name,
                action_type='PAGE_VIEW',
                detail='Fetched all Production Stages',
                object_table='production_stages',
                object_id=None
            )
        except Exception as e:
            print("Error logging production stages fetch action:", e)
        return [dict(row) for row in stages]
    except Exception as e:
        return {"errFlag": 1, "message": f"Error fetching production stages: {e}"}

@production_stage_blueprint.route("/production-stages/get-details/<stage_id>/<token>")
def getProductionStageDetails(stage_id, token):
    if not token:
        return {"errFlag": 1, "message": "Token is required."}
        
    try:
        if not adminUserObj.validateToken(token):
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": f"Token validation error"}
        
    try:
        stage_details = productionStageObj.getProductionStageDetails(stage_id)
        if stage_details:
            return stage_details
        else:
            return {"errFlag": 1, "message": "Production Stage not found or is inactive."}
    except Exception as e:
        return {"errFlag": 1, "message": f"Error fetching production stage details"}

@production_stage_blueprint.route("/production-stages/change-status/<stage_id>/<status>/<token>")
def changeProductionStageStatus(stage_id, status, token):
    if status not in ["0", "1"]:
        return {"errFlag": 1, "message": "Status must be 0 (Inactive) or 1 (Active)."}
        
    if not token:
        return {"errFlag": 1, "message": "Token is required."}

    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": f"Token validation error: {e}"}
    
    #fetch existing stage details for audit log
    try:
        existing_stage = productionStageObj.getProductionStageDetails(stage_id)
    except Exception as e:
        existing_stage = None    
    try:
        response = productionStageObj.changeProductionStageStatus(stage_id, status, admin_user_id)
        if response > 0:
            #AUDIT LOG IMPLEMENTATION: PRODUCTION STAGE STATUS CHANGE
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='UPDATE',
                    detail=f'Changed status of Production Stage: {existing_stage[0]["stage_name"]} (ID: {stage_id}) to {status}',
                    object_table='production_stages',
                    object_id=stage_id,
                    old_value=existing_stage[0] if existing_stage else None,
                    new_value={"status": status}
                )
            except Exception as e:
                print("Error logging production stage status change action:", e)
            return {"errFlag": 0, "message": "Status changed successfully."}
        else:
            return {"errFlag": 1, "message": "Failed to change status or stage not found."}
    except Exception as e:
        return {"errFlag": 1, "message": f"Error changing status"}