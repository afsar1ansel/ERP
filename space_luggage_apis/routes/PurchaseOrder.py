from flask import Blueprint, request
from db import db
from classes.PurchaseOrderClass import purchaseOrderObj
from classes.AdminUsersClass import adminUserObj
import json
from datetime import datetime
from sqlalchemy.sql import text
from classes.AuditLogClass import auditLogObj

purchase_orders_blueprint = Blueprint("purchase_orders", __name__)

@purchase_orders_blueprint.route("/purchase-orders/add", methods=["POST"])
def addPurchaseOrder():
    try:
        vendorId = int(request.form["vendorId"])
        expectedDispatchDate = request.form["expectedDispatchDate"]
        notes = request.form.get("notes", "")
        poItemsJson = request.form.get("poItems", "[]")
        token = request.form["token"]
        
        # Parse PO items JSON
        poItems = json.loads(poItemsJson)
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([vendorId, expectedDispatchDate, token]):
        return {"errFlag": 1, "message": "Vendor, expected dispatch date and token are required"}
    
    if not poItems:
        return {"errFlag": 1, "message": "At least one item is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        response = purchaseOrderObj.addPurchaseOrder(vendorId, expectedDispatchDate, notes, poItems, admin_user_id)
        
        if isinstance(response, dict):
            return response
        elif response > 0:
            #AUDIT LOG IMPLEMENTATION: PURCHASE ORDER CREATION
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='INSERT',
                    detail=f'Created new Purchase Order ID: {response}',
                    object_table='purchase_orders',
                    object_id=response
                )
            except Exception as e:
                print("Error logging purchase order creation action:", e)
            return {"errFlag": 0, "message": "Purchase order added successfully", "poId": response}
        else:
            return {"errFlag": 1, "message": "Failed to add purchase order"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error adding purchase order"}

@purchase_orders_blueprint.route("/purchase-orders/update", methods=["POST"])
def updatePurchaseOrder():
    try:
        poId = int(request.form["poId"])
        vendorId = int(request.form["vendorId"])
        expectedDispatchDate = request.form["expectedDispatchDate"]
        notes = request.form.get("notes", "")
        poItemsJson = request.form.get("poItems", "[]")
        token = request.form["token"]
        
        # Parse PO items JSON
        poItems = json.loads(poItemsJson)
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([poId, vendorId, expectedDispatchDate, token]):
        return {"errFlag": 1, "message": "All required fields are missing"}
    
    if not poItems:
        return {"errFlag": 1, "message": "At least one item is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    #fetch existing PO details for audit log
    try:
        existing_po = purchaseOrderObj.getPurchaseOrderDetails(poId)
    except Exception as e:
        existing_po = None
    try:
        response = purchaseOrderObj.updatePurchaseOrder(poId, vendorId, expectedDispatchDate, notes, poItems, admin_user_id)
        
        if isinstance(response, dict):
            return response
        elif response > 0:
            #AUDIT LOG IMPLEMENTATION: PURCHASE ORDER UPDATE
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='UPDATE',
                    detail=f'Updated Purchase Order ID: {poId}',
                    object_table='purchase_orders',
                    object_id=poId,
                    old_data=existing_po,
                    new_data={
                        "vendor_id": vendorId,
                        "expected_dispatch_date": expectedDispatchDate,
                        "notes": notes,
                        "po_items": poItems
                    }
                )
            except Exception as e:
                print("Error logging purchase order update action:", e)
            return {"errFlag": 0, "message": "Purchase order updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update purchase order"}
    except Exception as e:
        print("Error in updatePurchaseOrder route:_________________", e)
        return {"errFlag": 1, "message": "Error updating purchase order"}

@purchase_orders_blueprint.route("/purchase-orders/get-all/<token>")
def getAllPurchaseOrders(token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        purchase_orders = purchaseOrderObj.getAllPurchaseOrders()
        # AUDIT LOG IMPLEMENTATION: GET ALL PURCHASE ORDERS
        try:    
            auditLogObj.check_and_log_daily_action(
                adminId=admin_user_id,
                adminUsername=admin_user_name,
                action_type='PAGE_VIEW',
                detail='Fetched all purchase orders',
                object_table='purchase_orders'
            )
        except Exception as e:
            print("Error logging fetch all purchase orders action:", e)
        return [dict(row) for row in purchase_orders]
    except Exception as e:
        print(e)
        return {"errFlag": 1, "message": "Error fetching purchase orders"}

@purchase_orders_blueprint.route("/purchase-orders/get-details/<poId>/<token>")
def getPurchaseOrderDetails(poId, token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        po_details = purchaseOrderObj.getPurchaseOrderDetails(int(poId))
        if po_details:
            return po_details
        else:
            return {"errFlag": 1, "message": "Purchase order not found"}
    except Exception as e:
        print(e)
        return {"errFlag": 1, "message": "Error fetching purchase order details"}
     

@purchase_orders_blueprint.route("/purchase-orders/item/update-received-qty", methods=["POST"])
def updateItemReceivedQty():
    try:
        poItemId = int(request.form["poItemId"])
        receivedQty = float(request.form["receivedQty"])
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        response = purchaseOrderObj.updateItemReceivedQty(poItemId, receivedQty, admin_user_id)
        
        if response > 0:
            #AUDIT LOG IMPLEMENTATION: PURCHASE ORDER ITEM RECEIVED QTY UPDATE
            try:    
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='UPDATE',
                    detail=f'Updated received quantity for PO Item ID: {poItemId} to {receivedQty}',
                    object_table='purchase_order_items',
                    object_id=poItemId
                )
            except Exception as e:
                print("Error logging update received quantity action:", e)
            return {"errFlag": 0, "message": "Received quantity updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update received quantity"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating received quantity"}

@purchase_orders_blueprint.route("/purchase-orders/reconcile/all/po-status-complete-percentage/<token>")
def reconcile_all(token):
    res = adminUserObj.validateToken(token)
    if not res:
        return {"errFlag": 1, "message": "Invalid Token"}
    admin_user_id = res[0]['id']
    
    """this is not in used currently, but can be used to reconcile all POs in the system"""
    sql = text('SELECT id FROM purchase_orders')
    with db.engine.connect() as conn:
        rows = conn.execute(sql).mappings().all()

    count = 0
    for r in rows:
        out = purchaseOrderObj.reconcile_po_status(r['id'], admin_user_id)
        if out.get('errFlag') == 0:
            count += 1

    return {"errFlag": 0, "reconciled": count}
    