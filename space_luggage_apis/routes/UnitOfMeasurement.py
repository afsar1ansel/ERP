
from flask import Blueprint, request
from classes.UnitOfMeasurementClass import unitObj
from classes.AdminUsersClass import adminUserObj
from classes.AuditLogClass import auditLogObj

units_blueprint = Blueprint("units", __name__)

@units_blueprint.route("/units/get-units/<token>")
def getUnits(token):
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
        responseData = unitObj.getUnits()
        resJsonData = [dict(row) for row in responseData]

        # Audit log for fetching units
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=adminUserId,
                adminUsername=adminUserName,
                action_type='PAGE_VIEW',
                detail='Fetched all units',
                object_table='units',
                object_id=0
            )
        except Exception as e:
            print("Error logging fetch units action:", e)

        return resJsonData
    except Exception as e:
        return {"errFlag": 1, "message": "Error while fetching units"}

@units_blueprint.route("/units/add-unit", methods=["POST"])
def addUnit():
    try:
        unitName = request.form["unitName"]
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid form inputs"}
    
    if not unitName or not token:
        return {"errFlag": 1, "message": "unitName and token are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUserName = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token:"}
    
    try:
        responseData = unitObj.addUnit(unitName, adminUserId)
        
        if isinstance(responseData, dict) and responseData.get("errFlag") == 1:
            return responseData
        elif isinstance(responseData, int) and responseData > 0:

            # Audit log for adding unit
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUserName,
                    action_type='CREATE',
                    detail=f'Added new unit: {unitName}',
                    object_table='units',
                    object_id=responseData
                )
            except Exception as e:
                print("Error logging add unit action:", e)
            return {"errFlag": 0, "message": "Unit Added Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Add Unit"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while adding unit"}


@units_blueprint.route("/units/update-unit", methods=["POST"])
def updateUnit():
    try:
        unitId = request.form["unitId"]
        unitName = request.form["unitName"]
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid form inputs"}
    
    if not unitId or not unitName or not token:
        return {"errFlag": 1, "message": "unitId, unitName and token are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUserName = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = unitObj.updateUnit(unitId, unitName, adminUserId)
        
        if isinstance(responseData, dict) and responseData.get("errFlag") == 1:
            return responseData
        elif responseData > 0:
            # Audit log for updating unit
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUserName,
                    action_type='UPDATE',
                    detail=f'Updated unit ID {unitId} to {unitName}',
                    object_table='units',
                    object_id=unitId
                )
            except Exception as e:
                print("Error logging update unit action:", e)
            return {"errFlag": 0, "message": "Unit Updated Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Update Unit"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while updating unit"}

@units_blueprint.route("/units/get-unit-details/<unitId>/<token>")
def getUnitDetails(unitId, token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = unitObj.getUnitDetails(unitId)
        
        if responseData:
            return dict(responseData[0])
        else:
            return {"errFlag": 1, "message": "Unit not found"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while fetching unit details"}

@units_blueprint.route("/units/change-unit-status/<unitId>/<status>/<token>")
def changeUnitStatus(unitId, status, token):
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
        responseData = unitObj.changeUnitStatus(unitId, status, adminUserId)

        if responseData > 0:
            # Audit log for changing unit status
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUserName,
                    action_type='STATUS_CHANGE',
                    detail=f'Changed status for Unit ID {unitId} to {status}',
                    object_table='units',
                    object_id=unitId
                )
            except Exception as e:
                print("Error logging change unit status action:", e)
            return {"errFlag": 0, "message": "Unit Status Changed Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Change Unit Status"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while changing unit status"}
