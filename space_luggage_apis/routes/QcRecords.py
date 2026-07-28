from flask import Blueprint, request
from classes.QcRecordsClass import qcRecordObj
from classes.AdminUsersClass import adminUserObj
from classes.AuditLogClass import auditLogObj

qc_records_blueprint = Blueprint("qc_records", __name__)

@qc_records_blueprint.route("/qc-records/add", methods=["POST"])
def addQcRecord():
    try:
        entityType = request.form["entityType"]
        entityId = request.form["entityId"]
        itemName = request.form["itemName"]
        inspectorName = request.form["inspectorName"]
        testTypeId = request.form["testTypeId"]
        testParameters = request.form.get("testParameters", "")
        remarks = request.form.get("remarks", "")
        result = request.form.get("result", "pending")
        defect_count = request.form.get("defect_count", "0") 
        qcImageFile = request.files.get("qcImage")
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([entityType, entityId, itemName, inspectorName, testTypeId, token]):
        return {"errFlag": 1, "message": "All required fields are missing"}
    
    # Validate result value
    if result not in ["pass", "failed", "pending"]:
        return {"errFlag": 1, "message": "Result must be 'pass', 'failed', or 'pending'"}
    
    try:
        testTypeId = int(testTypeId) if testTypeId else None
        defect_count = int(defect_count)
    except ValueError:
        return {"errFlag": 1, "message": "Invalid numeric format for testTypeId or defect_count"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        response = qcRecordObj.addQcRecord(
            entityType, entityId, itemName, inspectorName, testTypeId, testParameters, remarks, result, defect_count, qcImageFile, admin_user_id
        )
        
        if isinstance(response, dict):
            return response
        elif response > 0:
            #AUDIT LOG IMPLEMENTATION: QC RECORD CREATION
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='INSERT',
                    detail=f'Created new QC Record ID: {response} for entity {entityType} ID: {entityId}',
                    object_table='qc_records',
                    object_id=response
                )
            except Exception as e:  
                print("error_______",e)
            return {"errFlag": 0, "message": "QC record added successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to add QC record"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error adding QC record"}

@qc_records_blueprint.route("/qc-records/update", methods=["POST"])
def updateQcRecord():
    try:
        qcId = request.form["qcId"]
        qcCode = request.form["qcCode"]
        entityType = request.form["entityType"]
        entityId = request.form["entityId"]
        itemName = request.form["itemName"]
        inspectorName = request.form["inspectorName"]
        testTypeId = request.form["testTypeId"]
        testParameters = request.form.get("testParameters", "")
        remarks = request.form.get("remarks", "")
        result = request.form.get("result", "pending")
        defect_count = request.form.get("defect_count", "0")
        qcImageFile = request.files.get("qcImage")
        token = request.form["token"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([qcId, qcCode, entityType, entityId, itemName, inspectorName, testTypeId, token]):
        return {"errFlag": 1, "message": "All required fields are missing"}
    
    # Validate result value
    if result not in ["pass", "failed", "pending"]:
        return {"errFlag": 1, "message": "Result must be 'pass', 'failed', or 'pending'"}
    
    try:
        entityId = int(entityId) if entityId else None
        testTypeId = int(testTypeId) if testTypeId else None
        defect_count = int(defect_count)
    except ValueError:
        return {"errFlag": 1, "message": "Invalid numeric format"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    #fetch existing qc record details for audit log
    try:
        existing_qc_record = qcRecordObj.getQcRecordDetails(qcId)
        if existing_qc_record:
            existing_qc_record = dict(existing_qc_record[0])
        else:
            existing_qc_record = None
    except Exception as e:
        existing_qc_record = None
    try:
        response = qcRecordObj.updateQcRecord(qcId, qcCode, entityType, entityId, itemName, inspectorName, testTypeId, testParameters, remarks, result, defect_count, qcImageFile, admin_user_id)
        
        if isinstance(response, dict):
            return response
        elif response > 0:
            #AUDIT LOG IMPLEMENTATION: QC RECORD UPDATE
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='UPDATE',
                    detail=f'Updated QC Record ID: {qcId}',
                    object_table='qc_records',
                    object_id=qcId,
                    old_value=existing_qc_record,
                    new_value={
                        "qcCode": qcCode,
                        "entityType": entityType,
                        "entityId": entityId,
                        "itemName": itemName,
                        "inspectorName": inspectorName,
                        "testTypeId": testTypeId,
                        "testParameters": testParameters,
                        "remarks": remarks,
                        "result": result,
                        "defect_count": defect_count
                    }
                )
            except Exception as e:  
                print("error",e)
            return {"errFlag": 0, "message": "QC record updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update QC record"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating QC record"}

@qc_records_blueprint.route("/qc-records/get-all/<token>")
def getAllQcRecords(token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        qc_records = qcRecordObj.getAllQcRecords()
        # AUDIT LOG IMPLEMENTATION: GET ALL QC RECORDS
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=admin_user_id,
                adminUsername=admin_user_name,
                action_type='PAGE_VIEW',
                detail='Fetched all QC records',
                object_table='qc_records'
            )
        except Exception as e:
            print("error_______",e)
        return [dict(row) for row in qc_records]
    except Exception as e:
        print("error_______",e)
        return {"errFlag": 1, "message": "Error fetching QC records"}

@qc_records_blueprint.route("/qc-records/get-details/<qcId>/<token>")
def getQcRecordDetails(qcId, token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        qc_record = qcRecordObj.getQcRecordDetails(qcId)
        if qc_record:
            return dict(qc_record[0])
        else:
            return {"errFlag": 1, "message": "QC record not found"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching QC record"}

@qc_records_blueprint.route("/qc-records/change-status/<qcId>/<status>/<token>")
def changeQcRecordStatus(qcId, status, token):
    if status not in ["0", "1"]:
        return {"errFlag": 1, "message": "Status must be 0 or 1"}
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    #fetch existing qc record details for audit log
    try:
        existing_qc_record = qcRecordObj.getQcRecordDetails(qcId)
        if existing_qc_record:
            existing_qc_record = dict(existing_qc_record[0])
        else:
            existing_qc_record = None
    except Exception as e:
        existing_qc_record = None
    try:
        status = int(status)
        response = qcRecordObj.changeQcRecordStatus(qcId, status)
        
        if response > 0:
            #AUDIT LOG IMPLEMENTATION: QC RECORD STATUS CHANGE
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='STATUS_CHANGE',
                    detail=f'Changed status for QC Record ID {qcId} to {status}.',
                    object_table='qc_records',
                    object_id=qcId,
                    old_value={"status": existing_qc_record.get("status") if existing_qc_record else "N/A"},
                    new_value={"status": status}
                )
            except Exception as e:  
                print("error",e)
            return {"errFlag": 0, "message": "QC record status updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update QC record status"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating QC record status"}

@qc_records_blueprint.route("/qc-records/get-by-result/<result>/<token>")
def getQcRecordsByResult(result, token):
    if result not in ["pass", "failed", "pending"]:
        return {"errFlag": 1, "message": "Result must be 'pass', 'failed', or 'pending'"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        qc_records = qcRecordObj.getQcRecordsByResult(result)
        return [dict(row) for row in qc_records]
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching QC records by result"}

@qc_records_blueprint.route("/qc-records/get-by-entity/<entityType>/<entityId>/<token>")
def getQcRecordsByEntity(entityType, entityId, token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        entityId = int(entityId)
        qc_records = qcRecordObj.getQcRecordsByEntity(entityType, entityId)
        return [dict(row) for row in qc_records]
    except ValueError:
        return {"errFlag": 1, "message": "Invalid entity ID format"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching QC records by entity"}