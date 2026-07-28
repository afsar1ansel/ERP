from flask import Blueprint, request
from classes.AdminUsersClass import adminUserObj
from classes.ClientTypesClass import clientTypeObj
from classes.AuditLogClass import auditLogObj

client_types_blueprint = Blueprint("client_types", __name__)

@client_types_blueprint.route("/client-types/get-client-types/<token>")
def getClientTypes(token):
    if token == "":
        return {"errFlag": 1, "message": "token is required"}
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        rows = clientTypeObj.getClientTypes()
        #AUDIT LOG IMPLEMENTATION: GET ALL CLIENT TYPES
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=res[0]["id"],
                adminUsername=res[0].get("username", "N/A"),
                action_type='PAGE_VIEW',
                detail='Fetched all client types',
                object_table='client_types'
            )
        except Exception as e:
            print("Error logging fetch all client types action:", e)
        return [dict(r) for r in rows]
    except Exception as e:
        return {"errFlag": 1, "message": "error while fetching client types", "error": str(e)}

@client_types_blueprint.route("/client-types/add-client-type", methods=["POST"])
def addClientType():
    try:
        typeName = request.form["typeName"]
        token = request.form["token"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if typeName == "" or token == "":
        return {"errFlag": 1, "message": "typeName and token are required"}

    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        out = clientTypeObj.addClientType(typeName, adminUserId)
        if isinstance(out, dict) and out.get("errFlag") == 1:
            return out
        elif out > 0:
            #AUDIT LOG IMPLEMENTATION: ADD CLIENT TYPE
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=res[0].get("username", "N/A"),
                    action_type='CREATE',
                    detail='Added client type: ' + typeName,
                    object_table='client_types'
                )
            except Exception as e:
                print("Error logging add client type action:", e)
            return {"errFlag": 0, "message": "Client Type Added Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Add Client Type"}
    except Exception:
        return {"errFlag": 1, "message": "error while adding client type"}

@client_types_blueprint.route("/client-types/update-client-type", methods=["POST"])
def updateClientType():
    try:
        clientTypeId = request.form["clientTypeId"]
        typeName = request.form["typeName"]
        token = request.form["token"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if clientTypeId == "" or typeName == "" or token == "":
        return {"errFlag": 1, "message": "fields are missing"}

    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        out = clientTypeObj.updateClientType(clientTypeId, typeName, adminUserId)
        if isinstance(out, dict) and out.get("errFlag") == 1:
            return out
        elif out > 0:
            #AUDIT LOG IMPLEMENTATION: UPDATE CLIENT TYPE
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=res[0].get("username", "N/A"),
                    action_type='UPDATE',
                    detail='Updated client type: ' + typeName,
                    object_table='client_types'
                )
            except Exception as e:
                print("Error logging update client type action:", e)
            return {"errFlag": 0, "message": "Client Type Updated Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Update Client Type"}
    except Exception:
        return {"errFlag": 1, "message": "error while updating client type"}

@client_types_blueprint.route("/client-types/change-client-type-status/<clientTypeId>/<status>/<token>")
def changeClientTypeStatus(clientTypeId, status, token):
    if token == "":
        return {"errFlag": 1, "message": "token is required"}
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        out = clientTypeObj.changeClientTypeStatus(clientTypeId, status)
        if out > 0:
            #AUDIT LOG IMPLEMENTATION: CHANGE CLIENT TYPE STATUS
            try:
                auditLogObj.log_action(
                    adminId=res[0]["id"],
                    adminUsername=res[0].get("username", "N/A"),
                    action_type='UPDATE',
                    detail='Changed client type status: ' + status,
                    object_table='client_types'
                )
            except Exception as e:
                print("Error logging change client type status action:", e)
            return {"errFlag": 0, "message": "Client Type Status Changed Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Change Client Type Status"}
    except Exception:
        return {"errFlag": 1, "message": "error while changing client type status"}
