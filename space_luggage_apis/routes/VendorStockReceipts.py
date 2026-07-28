from flask import Blueprint, request
from classes.VendorStockReceiptsClass import vendorStockReceiptsObj
from classes.AdminUsersClass import adminUserObj
import json
from classes.AuditLogClass import auditLogObj

vendor_stock_receipts_blueprint = Blueprint("vendor_stock_receipts", __name__)

@vendor_stock_receipts_blueprint.route("/vendor-stock-receipts/add", methods=["POST"])
def addReceipt():
    try:
        vendorId = int(request.form["vendorId"])
        grnNumber = request.form.get("grnNumber")
        poId = request.form.get("poId","0") 
        poNumber = request.form.get("poNumber","")
        invoiceNumber = request.form.get("invoiceNumber")
        invoiceDate = request.form.get("invoiceDate")  # YYYY-MM-DD
        receivedDate = request.form.get("receivedDate")  # YYYY-MM-DD
        transportDetails = request.form.get("transportDetails")
        receivedByEmployeeId = request.form.get("receivedByEmployeeId")
        notes = request.form.get("notes", "")
        itemsJson = request.form.get("items", "[]")
        token = request.form["token"]

        # supporting file (optional)
        supporting_file = request.files.get("supportingFile")
        items = json.loads(itemsJson)
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not vendorId or not receivedDate or not token:
        return {"errFlag": 1, "message": "vendorId, receivedDate and token are required"}

    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        # CHANGED: Pass poId and poNumber to the addReceipt method
        out = vendorStockReceiptsObj.addReceipt(
            vendorId, grnNumber, poId, poNumber, invoiceNumber, invoiceDate, receivedDate,
            transportDetails, receivedByEmployeeId, notes,
            items, supporting_file, admin_user_id
        )
        if isinstance(out, dict):
            return out
        elif isinstance(out, int) and out > 0:
            # Audit log for adding receipt
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='INSERT',
                    detail=f'Added Vendor Stock Receipt ID: {out}',
                    object_table='vendor_stock_receipts',
                    object_id=out
                )
            except Exception as e:
                print("Error logging add receipt action:", e)
            return {"errFlag": 0, "message": "Receipt added successfully", "receiptId": out}
        else:
            return {"errFlag": 1, "message": "Failed to add receipt"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error adding receipt"}


@vendor_stock_receipts_blueprint.route("/vendor-stock-receipts/update", methods=["POST"])
def updateReceipt():
    try:
        receiptId = int(request.form["receiptId"])
        vendorId = int(request.form["vendorId"])
        grnNumber = request.form.get("grnNumber")
        invoiceNumber = request.form.get("invoiceNumber")
        invoiceDate = request.form.get("invoiceDate")
        receivedDate = request.form.get("receivedDate")
        transportDetails = request.form.get("transportDetails")
        receivedByEmployeeId = request.form.get("receivedByEmployeeId")
        notes = request.form.get("notes", "")
        itemsJson = request.form.get("items", "[]")
        token = request.form["token"]
        supporting_file = request.files.get("supportingFile")
        items = json.loads(itemsJson)
    except Exception:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not receiptId or not vendorId or not token:
        return {"errFlag": 1, "message": "receiptId, vendorId and token are required"}

    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        out = vendorStockReceiptsObj.updateReceipt(
            receiptId, vendorId, grnNumber, invoiceNumber, invoiceDate, receivedDate,
            transportDetails, receivedByEmployeeId, notes,
            items, supporting_file, admin_user_id
        )
        if isinstance(out, dict):
            return out
        elif out > 0:
            # Audit log for updating receipt
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='UPDATE',
                    detail=f'Updated Vendor Stock Receipt ID: {receiptId}',
                    object_table='vendor_stock_receipts',
                    object_id=receiptId
                )
            except Exception as e:
                print("Error logging update receipt action:", e)
            return {"errFlag": 0, "message": "Receipt updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update receipt"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating receipt"}


@vendor_stock_receipts_blueprint.route("/vendor-stock-receipts/get-all/<token>")
def getAllVendorStockReceipts(token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}

    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        rows = vendorStockReceiptsObj.getAllVendorReceipts()
        # AUDIT LOG IMPLEMENTATION: GET ALL VENDOR STOCK RECEIPTS
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=admin_user_id,
                adminUsername=admin_user_name,
                action_type='PAGE_VIEW',
                detail='Fetched all vendor stock receipts',
                object_table='vendor_stock_receipts'
            )
        except Exception as e:
            print("Error logging fetch all vendor stock receipts action:", e)
        return [dict(r) for r in rows]
    except Exception as e:
        print("Error in getAllVendorStockReceipts route:", e)
        return {"errFlag": 1, "message": "Error fetching vendor stock receipts"}


@vendor_stock_receipts_blueprint.route("/vendor-stock-receipts/get-details/<receiptId>/<token>")
def getReceiptDetails(receiptId, token):
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        out = vendorStockReceiptsObj.getReceiptDetails(int(receiptId))
        if out:
            return out
        else:
            return {"errFlag": 1, "message": "Receipt not found"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching receipt details"}


@vendor_stock_receipts_blueprint.route("/vendor-stock-receipts/change-status/<receiptId>/<status>/<token>")
def changeReceiptStatus(receiptId, status, token):
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        out = vendorStockReceiptsObj.changeReceiptStatus(receiptId, int(status), admin_user_id)
        if out > 0:
            # Audit log for changing receipt status
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='UPDATE',
                    detail=f'Changed status of Vendor Stock Receipt ID: {receiptId} to {status}',
                    object_table='vendor_stock_receipts',
                    object_id=receiptId
                )
            except Exception as e:
                print("Error logging change receipt status action:", e)
            return {"errFlag": 0, "message": "Receipt status changed successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to change receipt status"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error changing receipt status"}
