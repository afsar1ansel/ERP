# Recieves from production

from flask import Blueprint, request
from classes.ProductionReceiptsClass import productionReceiptsObj
from classes.AdminUsersClass import adminUserObj
from classes.AuditLogClass import auditLogObj

production_receipts_blueprint = Blueprint("production_receipts", __name__)

@production_receipts_blueprint.route("/production-receipts/receive", methods=["POST"])
def receiveFromProduction():
    
    try:
        productionBatchId = request.form["productionBatchId"]
        storageLocationId = request.form.get("storageLocationId")
        quantity = request.form["quantity"]
        notes = request.form.get("notes", "")
        token = request.form["token"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not productionBatchId or not quantity or not token:
        return {"errFlag": 1, "message": "productionBatchId, quantity and token are required"}

    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_username = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        out = productionReceiptsObj.receiveFromProduction(
            productionBatchId, storageLocationId, quantity, notes, admin_user_id
        )
        if isinstance(out, dict) and out.get("errFlag") == 1:
            return out
        else:
            # Log the receive action
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_username,
                    action_type='RECEIVE Stock',
                    detail=f'Received {quantity} units from production batch ID {productionBatchId}',
                    object_table='production_receipts'
                )
            except Exception as e:
                print("Error logging receive from production action:", e)
            return out
    except Exception as e:
        print("Error in receiveFromProduction route:", e)
        return {"errFlag": 1, "message": "Error receiving from production"}


@production_receipts_blueprint.route("/production-receipts/get-all/<token>")
def getAllProductionReceipts(token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}

    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_username = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        rows = productionReceiptsObj.getAllProductionReceipts()

        # AUDIT LOG IMPLEMENTATION: GET ALL PRODUCTION RECEIPTS
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=admin_user_id,
                adminUsername=admin_username,
                action_type='PAGE_VIEW',
                detail='Fetched all production receipts',
                object_table='production_receipts'
            )
        except Exception as e:
            print("Error logging fetch all production receipts action:", e)
        return rows
    except Exception as e:
        print("Error in getAllProductionReceipts route:", e)
        return {"errFlag": 1, "message": "Error fetching production receipts"}


 
# Download template for bulk upload
@production_receipts_blueprint.route("/production-receipts/download-template/<token>", methods=["GET"])
def downloadProductionReceiptsTemplate(token):
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}
    try:
        return productionReceiptsObj.generateBulkUploadTemplate()
    except Exception as e:
        print("Error generating template:", e)
        return {"errFlag": 1, "message": "Error generating template"}


# Bulk upload endpoint
@production_receipts_blueprint.route("/production-receipts/bulk-upload", methods=["POST"])
def bulkUploadProductionReceipts():
    try:
        token = request.form["token"]
        excel_file = request.files["excelFile"]
    except Exception:
        return {"errFlag": 1, "message": "Token or excelFile missing"}

    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_username = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        out = productionReceiptsObj.bulkUploadProductionReceipts(excel_file, admin_user_id)
        # AUDIT LOG IMPLEMENTATION: BULK UPLOAD PRODUCTION RECEIPTS
        try:
            auditLogObj.log_action(
                adminId=admin_user_id,
                adminUsername=admin_username,
                action_type='BULK_UPLOAD',
                detail='Bulk uploaded production receipts via Excel',
                object_table='production_receipts'
            )
        except Exception as e:
            print("Error logging bulk upload production receipts action:", e)
        return out
    except Exception as e:
        print("Error in bulkUploadProductionReceipts route:", e)
        return {"errFlag": 1, "message": "Error processing bulk upload"}       