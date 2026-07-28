from flask import Blueprint, request, jsonify
from classes.ProductionBatchClass import productionBatchObj
from classes.AdminUsersClass import adminUserObj  # Assuming you have this class
from classes.EmployeeClass import employeeObj
import json
from classes.AuditLogClass import auditLogObj
from classes.ProductionStageCategoriesClass import productionStageCategoriesObj

production_batches_blueprint = Blueprint("production_batches", __name__)

@production_batches_blueprint.route("/production-batches/add", methods=["POST"])
def addProductionBatch():
    try:
        # ProductId is optional
        productId = request.form.get("productId") 
        quantity = request.form.get("quantity", 0)
        clientId = request.form.get("clientId")
        floor = request.form.get("floor")
        expectedCompletionDate = request.form.get("expectedCompletionDate")
        productionHeadEmployeeId = request.form.get("productionHeadEmployeeId")
        productionNotes = request.form.get("productionNotes", "")
        stages_json = request.form.get("stages", "[]")  # List of dicts: [{"stageId": X, "weightage": Y, "employeeIds": [ID1, ID2]}]
        orderId = request.form.get("orderId")
        priority = request.form.get("priority", 0)
        
        stageCategoryId = request.form.get("stageCategoryId")   # we  take stages or stagesCategoryId

        # Get manual raw materials list, if product is not selected
        raw_materials_json = request.form.get("rawMaterialsJsonStr", "[]") 
        
        token = request.form["token"]

        # parse manual raw materials
        try:
            raw_materials_list = json.loads(raw_materials_json)
            if not isinstance(raw_materials_list, list):
                raw_materials_list = []
        except Exception:
            raw_materials_list = []

        # parse stages
        stages = []
        if stageCategoryId:
            # if category id is provided then use stages from category
            try:
                stages_from_cat = productionStageCategoriesObj.getStagesListByCategoryId(stageCategoryId)
                
                if isinstance(stages_from_cat, list):
                    stages = stages_from_cat
                else:
                    stages = []
            except Exception as e:
                print("Error fetching stages from category:", e)
                stages = []
        else:
            # if no category id is provided then parse stages
            try:
                stages = json.loads(stages_json)
                if not isinstance(stages, list):
                    stages = []
            except Exception:
                stages = []
            
    except Exception:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not token or not quantity or not expectedCompletionDate or not productionHeadEmployeeId or not floor:
        return jsonify({"errFlag": 1, "message": "All fields (token, quantity, expectedCompletionDate, productionHeadEmployeeId, floor) are required"})

    # Must provide EITHER a product OR a manual list
    if not productId and not raw_materials_list:
        return jsonify({"errFlag": 1, "message": "Either a Product ID or a manual Raw Materials list (rawMaterialsJsonStr) is required."})

    #  At least one of (stageCategoryId / manual stages) is required
    if (not stageCategoryId or stageCategoryId == "") and not stages:
        return jsonify({"errFlag": 1, "message": "Either stageCategoryId or manual stages list is required."})

    try:
        # Assuming adminUserObj.validateToken returns user info or None
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_username = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}
    try:
        out = productionBatchObj.addProductionBatch(
            productId, quantity, clientId, floor, expectedCompletionDate,
            productionHeadEmployeeId, productionNotes, stages, admin_user_id,
            raw_materials_list, orderId, priority
        )
        if isinstance(out, dict):
            # This handles error messages from the class
            return out
        elif out > 0:
            # Audit log for batch creation
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_username,
                    action_type='CREATE',
                    detail=f'Created production batch ID: {out}',
                    object_table='production_batches',
                    object_id=out
                )
            except Exception as e:
                print("Error logging production batch creation action:", e)
            return jsonify({"errFlag": 0, "message": "Production batch created successfully", "batchId": out})
        else:
            return jsonify({"errFlag": 1, "message": "Failed to create production batch"})
    except Exception as e:
        print(f"Error in addProductionBatch route: {e}") 
        return jsonify({"errFlag": 1, "message": "Error creating production batch"})


@production_batches_blueprint.route("/production-batches/update", methods=["POST"])
def updateProductionBatch():
    try:
        batchId = request.form["batchId"]
        productId = request.form.get("productId") 
        quantity = request.form.get("quantity")
        clientId = request.form.get("clientId")
        floor = request.form.get("floor")
        expectedCompletionDate = request.form.get("expectedCompletionDate")
        productionHeadEmployeeId = request.form.get("productionHeadEmployeeId")
        productionNotes = request.form.get("productionNotes")
        batchStatus = request.form.get("batchStatus")
        stages_json = request.form.get("stages", "[]")   # List of dicts: [{"stageId": X, "weightage": Y, "employeeIds": [ID1, ID2]}]
        orderId = request.form.get("orderId")
        priority = request.form.get("priority")
        
        stageCategoryId = request.form.get("stageCategoryId")  #use either stageCategoryId or manual stages
        
        # Accept manual raw materials on update
        raw_materials_json = request.form.get("rawMaterialsJsonStr")
        
        token = request.form["token"]

        # parse stages
        stages = None # Default
        if stageCategoryId:
            # if category id is provided then use stages from category
            try:
                stages_from_cat = productionStageCategoriesObj.getStagesListByCategoryId(stageCategoryId)
                
                if isinstance(stages_from_cat, list):
                    stages = stages_from_cat
                else:
                    stages = []
            except Exception as e:
                print("Error fetching stages from category:", e)
                stages = []
        elif "stages" in request.form:
            try:
                stages = json.loads(stages_json)
                if not isinstance(stages, list):
                    stages = [] 
            except Exception:
                stages = [] 

        # Parse manual raw materials list
        raw_materials_list = None # Default
        if "rawMaterialsJsonStr" in request.form:
            try:
                raw_materials_list = json.loads(raw_materials_json)
                if not isinstance(raw_materials_list, list):
                    raw_materials_list = []
            except Exception:
                raw_materials_list = []
            
    except Exception:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not batchId or not token:
        return jsonify({"errFlag": 1, "message": "batchId and token are required"})

    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    #fetch existing batch details for audit log
    try:
        existing_batch = productionBatchObj.getBatchDetailsForAudit(batchId)
    except Exception as e:
        existing_batch = None
    
    try:
        out = productionBatchObj.updateProductionBatch(
            batchId, productId, quantity, clientId, floor,
            expectedCompletionDate, productionHeadEmployeeId,
            productionNotes, batchStatus, stages, admin_user_id,
            rawMaterialsList=raw_materials_list, orderId=orderId, priority=priority # Pass the new list and orderId
        )
        if isinstance(out, dict):
            # This handles error messages from the class
            return out
        elif out > 0:
            # Audit log for batch update
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='UPDATE',
                    detail=f'Updated production batch ID: {batchId}',
                    object_table='production_batches',
                    object_id=batchId,
                    old_value=existing_batch,
                    new_value=productionBatchObj.getBatchDetailsForAudit(batchId)
                )
            except Exception as e:
                print(f"Error logging audit action: {e}")
            return jsonify({"errFlag": 0, "message": "Production batch updated successfully"})
        else:
            return jsonify({"errFlag": 1, "message": "Failed to update production batch or no changes detected"})
    except Exception as e:
        print(f"Error in updateProductionBatch route: {e}")
        # Pass the specific error message (e.g., "Insufficient...")
        return jsonify({"errFlag": 1, "message": str(e) or "Error updating production batch"})


@production_batches_blueprint.route("/production-batches/get-all/<token>")
def getAllProductionBatches(token):
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        rows = productionBatchObj.getAllProductionBatches()
        # AUDIT LOG IMPLEMENTATION: GET ALL PRODUCTION BATCHES
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=adminUserId,
                adminUsername=adminUsername,
                action_type='PAGE_VIEW',
                detail='Fetched all production batches',
                object_table='production_batches'
            )
        except Exception as e:
            print("Error logging fetch all production batches action:", e)
        return jsonify(rows) 
    except Exception as e:
        print(f"Error in getAllProductionBatches route: {e}")
        return jsonify({"errFlag": 1, "message": "Error fetching production batches"})


@production_batches_blueprint.route("/production-batches/get-details/<batchId>/<token>")
def getProductionBatchDetails(batchId, token):
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        out = productionBatchObj.getProductionBatchDetails(int(batchId))
        if out:
            return jsonify(out)
        else:
            return jsonify({"errFlag": 1, "message": "Production batch not found"})
    except Exception as e:
        print(f"Error in getProductionBatchDetails route: {e}")
        return jsonify({"errFlag": 1, "message": "Error fetching production batch details"})


@production_batches_blueprint.route("/production-batches/change-status/<batchId>/<status>/<token>")
def changeProductionBatchStatus(batchId, status, token):
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_username = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}
    #fetch existing batch details for audit log
    try:
        existing_batch = productionBatchObj.getBatchDetailsForAudit(batchId)
    except Exception as e:
        existing_batch = None
    try:
        out = productionBatchObj.changeBatchStatus(batchId, status, admin_user_id)
        if out > 0:
            # Audit log for batch status change
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_username,
                    action_type='STATUS_CHANGE',
                    detail=f'Changed status of production batch ID: {batchId} from {existing_batch["status"]} to {status}',
                    object_table='production_batches',
                    object_id=batchId,
                    old_value=existing_batch,
                    new_value=productionBatchObj.getBatchDetailsForAudit(batchId)
                )
            except Exception as e:
                print(f"Error logging audit action: {e}")
            return jsonify({"errFlag": 0, "message": "Batch status changed successfully"})
        else:
            return jsonify({"errFlag": 1, "message": "Failed to change batch status"})
    except Exception as e:
        print(f"Error in changeProductionBatchStatus route: {e}")
        return jsonify({"errFlag": 1, "message": "Error changing batch status"})


@production_batches_blueprint.route("/production-batches/update-stage-progress", methods=["POST"])
def updateBatchStageProgress():
    try:
        batchStageId = request.form["batchStageId"]
        status = request.form.get("status")
        notes = request.form.get("notes")
        token = request.form["token"]
    except Exception:
        return jsonify({"errFlag": 1, "message": "batchStageId and token are required"})

    if not status:
        return jsonify({"errFlag": 1, "message": "status is required"})

    # Dual-Auth: Try admin token first, then employee token
    is_admin = False
    is_employee = False
    actor_id = 0
    actor_name = "N/A"

    # 1. Try Admin Token
    try:
        admin_res = adminUserObj.validateToken(token)
        if admin_res:
            is_admin = True
            actor_id = admin_res[0]["id"]
            actor_name = admin_res[0].get("username", "N/A")
    except:
        pass

    # 2. Try Employee Token if not admin
    if not is_admin:
        try:
            emp_id = employeeObj.validateEmployeeToken(token)
            if emp_id != 0:
                # Check if employee is assigned to this stage
                if productionBatchObj.isEmployeeAssignedToStage(int(batchStageId), emp_id):
                    is_employee = True
                    actor_id = emp_id
                    # Fetch employee name for audit log
                    emp_details = employeeObj.getEmployeeDetails(emp_id)
                    if emp_details:
                        actor_name = emp_details[0].get("name", f"Emp-{emp_id}")
                    else:
                        actor_name = f"Emp-{emp_id}"
                else:
                    return jsonify({"errFlag": 1, "message": "You are not assigned to this production stage"})
        except Exception as e:
            print(f"Error validating employee token for stage update: {e}")

    if not is_admin and not is_employee:
        return jsonify({"errFlag": 1, "message": "Invalid or Unauthorized Token"})

    try:
        # Pass actor_id for audit tracking in DB
        out = productionBatchObj.updateBatchStageProgress(
            int(batchStageId), status, actor_id, notes
        )
        if out == 1:
            # Audit log for stage progress update
            try:
                auditLogObj.log_action(
                    adminId=actor_id if is_admin else 0, # Use 0 if employee updated
                    adminUsername=actor_name,
                    action_type='UPDATE',
                    detail=f'Updated production batch stage ID: {batchStageId} to status: {status} by {"Admin" if is_admin else "Employee"}: {actor_name}',
                    object_table='production_batch_stages',
                    object_id=batchStageId
                )
            except Exception as e:
                print(f"Error logging audit action: {e}")
            return jsonify({"errFlag": 0, "message": "Stage progress updated successfully"})
        elif out == -1:
            return jsonify({"errFlag": 1, "message": f"Batch stage ID {batchStageId} not found"})
        else:
            return jsonify({"errFlag": 1, "message": "No changes detected. Stage is already at this progress/status."})
    except Exception as e:
        print(f"Error in updateBatchStageProgress route: {e}")
        return jsonify({"errFlag": 1, "message": str(e) or "Error updating stage progress"})


@production_batches_blueprint.route("/production-batches/delete", methods=["POST"])
def deleteProductionBatch():
    try:
        batchId = request.form["batchId"]
        token = request.form["token"]
    except Exception:
        return jsonify({"errFlag": 1, "message": "batchId and token are required"})

    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_username = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        # Fetch status for audit log before deletion
        batch_details = productionBatchObj.getBatchDetailsForAudit(batchId)
        
        out = productionBatchObj.deleteProductionBatch(batchId, admin_user_id)
        if out == 1:
            # Audit log for batch deletion
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_username,
                    action_type='DELETE',
                    detail=f'Deleted production batch ID: {batchId}',
                    object_table='production_batches',
                    object_id=batchId,
                    old_value=batch_details
                )
            except Exception as e:
                print(f"Error logging audit action: {e}")
            return jsonify({"errFlag": 0, "message": "Production batch deleted successfully"})
        else:
            return jsonify(out) # Return the error dict from the class
    except Exception as e:
        print(f"Error in deleteProductionBatch route: {e}")
        return jsonify({"errFlag": 1, "message": str(e) or "Error deleting production batch"})


@production_batches_blueprint.route("/production-batches/update-priorities", methods=["POST"])
def updateBatchPriorities():
    try:
        # Expecting JSON body for large/complex lists
        data = request.get_json()
        if not data:
            return jsonify({"errFlag": 1, "message": "No JSON payload provided"})
            
        priorityList = data.get("priorityList") # Expecting [{"batchId": X, "newPosition": Y}, ...]
        token = data.get("token")
        
        if not priorityList or not token:
            return jsonify({"errFlag": 1, "message": "priorityList and token are required"})
            
    except Exception as e:
        print(f"Error parsing priority update request: {e}")
        return jsonify({"errFlag": 1, "message": "Invalid request payload"})

    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_username = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        out = productionBatchObj.updateBatchPriorities(priorityList, admin_user_id)
        if out == 1:
            # Audit log
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_username,
                    action_type='UPDATE',
                    detail=f'Bulk updated production batch priorities for {len(priorityList)} items',
                    object_table='production_batches'
                )
            except Exception as e:
                print(f"Error logging audit action: {e}")
            return jsonify({"errFlag": 0, "message": "Batch priorities updated successfully"})
        else:
            return jsonify(out)
    except Exception as e:
        print(f"Error in updateBatchPriorities route: {e}")
        return jsonify({"errFlag": 1, "message": str(e) or "Error updating batch priorities"})