from flask import Blueprint, request
from classes.DefectTypeClass import defectTypeObj
from classes.AdminUsersClass import adminUserObj
from classes.AuditLogClass import auditLogObj

defect_types_blueprint = Blueprint("defect_types", __name__)

@defect_types_blueprint.route("/defect-types/get-defect-types/<token>")
def getDefectTypes(token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = defectTypeObj.getDefectTypes()
        resJsonData = [dict(row) for row in responseData]

        # AUDIT LOG IMPLEMENTATION: GET DEFECT TYPES
        try:
            auditLogObj.log_action(
                adminId=adminUserId,
                adminUsername=adminUsername,
                action_type='PAGE_VIEW',
                detail='Fetched defect types',
                object_table='defect_types'
            )
        except Exception as e:
            print("Error logging fetch defect types action:", e)

        return resJsonData
    except Exception as e:
        print("error ::::::", e)
        return {"errFlag": 1, "message": "Error while fetching defect types"}

@defect_types_blueprint.route("/defect-types/add-defect-type", methods=["POST"])
def addDefectType():
    try:
        defect_code = request.form["defect_code"]
        defect_name = request.form["defect_name"]
        category = request.form["category"]
        severity = request.form["severity"]
        description = request.form.get("description", "")
        corrective_action = request.form.get("corrective_action", "")
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid form inputs"}
    
    if not defect_code or not defect_name or not category or not severity or not token:
        return {"errFlag": 1, "message": "defect_code, defect_name, category, severity and token are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = defectTypeObj.addDefectType(
            defect_code, defect_name, category, severity, description, corrective_action, adminUserId
        )
        
        if isinstance(responseData, dict) and responseData.get("errFlag") == 1:
            return responseData
        elif isinstance(responseData, int) and responseData > 0:
            # AUDIT LOG IMPLEMENTATION: ADD DEFECT TYPE
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUsername,
                    action_type='INSERT',
                    detail=f'Added Defect Type: {defect_name} (Code: {defect_code})',
                    object_table='defect_types',
                    object_id=responseData
                )
            except Exception as e:
                print("Error logging add defect type action:", e)
            return {"errFlag": 0, "message": "Defect Type Added Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Add Defect Type"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while adding defect type"}

@defect_types_blueprint.route("/defect-types/update-defect-type", methods=["POST"])
def updateDefectType():
    try:
        defect_type_id = request.form["defect_type_id"]
        defect_code = request.form["defect_code"]
        defect_name = request.form["defect_name"]
        category = request.form["category"]
        severity = request.form["severity"]
        description = request.form.get("description", "")
        corrective_action = request.form.get("corrective_action", "")
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid form inputs"}
    
    if not defect_type_id or not defect_code or not defect_name or not category or not severity or not token:
        return {"errFlag": 1, "message": "defect_type_id, defect_code, defect_name, category, severity and token are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = defectTypeObj.updateDefectType(
            defect_type_id, defect_code, defect_name, category, severity, description, corrective_action, adminUserId
        )
        
        if isinstance(responseData, dict) and responseData.get("errFlag") == 1:
            return responseData
        elif responseData > 0:
            # AUDIT LOG IMPLEMENTATION: UPDATE DEFECT TYPE
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUsername,
                    action_type='UPDATE',
                    detail=f'Updated Defect Type ID: {defect_type_id}',
                    object_table='defect_types',
                    object_id=defect_type_id
                )
            except Exception as e:
                print("Error logging update defect type action:", e)
            return {"errFlag": 0, "message": "Defect Type Updated Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Update Defect Type"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while updating defect type"}

@defect_types_blueprint.route("/defect-types/get-defect-type-details/<defect_type_id>/<token>")
def getDefectTypeDetails(defect_type_id, token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = defectTypeObj.getDefectTypeDetails(defect_type_id)
        
        if responseData:
            return dict(responseData[0])
        else:
            return {"errFlag": 1, "message": "Defect type not found"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while fetching defect type details"}

@defect_types_blueprint.route("/defect-types/change-defect-type-status/<defect_type_id>/<status>/<token>")
def changeDefectTypeStatus(defect_type_id, status, token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
       
    try:
        responseData = defectTypeObj.changeDefectTypeStatus(defect_type_id, status, adminUserId)

        if responseData > 0:
            # AUDIT LOG IMPLEMENTATION: CHANGE DEFECT TYPE STATUS
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUsername,
                    action_type='STATUS_CHANGE',
                    detail=f'Changed status for Defect Type ID {defect_type_id} to {status}.',
                    object_table='defect_types',
                    object_id=defect_type_id
                )
            except Exception as e:
                print("Error logging change defect type status action:", e)
            return {"errFlag": 0, "message": "Defect Type Status Changed Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Change Defect Type Status"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while changing defect type status"}