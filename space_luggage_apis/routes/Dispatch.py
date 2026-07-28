from flask import Blueprint, request
from db import db
from classes.DispatchClass import dispatchObj
from classes.AdminUsersClass import adminUserObj
from classes.AuditLogClass import auditLogObj
import json

dispatch_blueprint = Blueprint("dispatch", __name__)

@dispatch_blueprint.route("/dispatch-orders/add", methods=["POST"])
def addDispatchOrder():
    try:
        order_reference = request.form["orderReference"]
        priority = request.form["priority"]
        customer_id = request.form["customerId"]
        shipping_address = request.form["shippingAddress"]
        notes = request.form.get("notes", "")
        no_of_boxes_str = request.form.get("noOfBoxes", "0")
        grand_total = request.form["grandTotal"]
        tracking = request.form.get("tracking", "")
        dispatch_status = request.form.get("dispatchStatus", "pending")
        dispatch_date = request.form.get("dispatchDate")
        items_to_dispatch_json = request.form.get("itemsToDispatch", "[]")
        token = request.form["token"]
        
        # Parse items JSON
        items_to_dispatch = json.loads(items_to_dispatch_json)
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([order_reference, priority, customer_id, shipping_address, grand_total, token]):
        return {"errFlag": 1, "message": " All fields are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        response = dispatchObj.addDispatchOrder(
            order_reference, priority, customer_id, shipping_address, 
            notes, no_of_boxes_str, grand_total, tracking, dispatch_status, dispatch_date, 
            items_to_dispatch, admin_user_id
        )
        
        if isinstance(response, dict):
            return response
        elif response > 0:
                #AUDIT LOG IMPLEMENTATION: DISPATCH ORDER CREATION
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=adminUsername,
                    action_type='INSERT',
                    detail=f'Created new Dispatch Order: {order_reference}',
                    object_table='dispatch_orders',
                    object_id=response
                )
            except Exception as e:
                print("Error logging dispatch order creation action:", e)
            return {"errFlag": 0, "message": "Dispatch added successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to add Dispatch"}
    except Exception as e:
        print("erorr",e)
        return {"errFlag": 1, "message": "Error adding Dispatch"}

@dispatch_blueprint.route("/dispatch-orders/update", methods=["POST"])
def updateDispatchOrder():
    try:
        dispatch_order_id = request.form["dispatchOrderId"]
        order_reference = request.form["orderReference"]
        priority = request.form["priority"]
        customer_id = request.form["customerName"]
        shipping_address = request.form["shippingAddress"]
        notes = request.form.get("notes", "")
        grand_total = request.form["grandTotal"]
        tracking = request.form.get("tracking", "")
        dispatch_status = request.form.get("dispatchStatus", "")
        dispatch_date = request.form.get("dispatchDate")
        items_to_dispatch_json = request.form.get("itemsToDispatch", "[]")
        token = request.form["token"]
        
        # Parse items JSON
        items_to_dispatch = json.loads(items_to_dispatch_json)
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([dispatch_order_id, order_reference, priority, customer_id, shipping_address, grand_total, token]):
        return {"errFlag": 1, "message": "All required fields are missing"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    #fetch existing dispatch order details for audit log
    try:
        existing_dispatch_order = dispatchObj.getDispatchOrderDetails(dispatch_order_id)
        if existing_dispatch_order:
            existing_dispatch_data = dict(existing_dispatch_order[0])
        else:
            existing_dispatch_data = None
    except Exception as e:
        existing_dispatch_data = None
    
    try:
        response = dispatchObj.updateDispatchOrder(
            dispatch_order_id, order_reference, priority, customer_id, 
            shipping_address, notes, grand_total, tracking, dispatch_status, 
            dispatch_date, items_to_dispatch, admin_user_id
        )
        
        if isinstance(response, dict):
            return response
        elif response > 0:
            #AUDIT LOG IMPLEMENTATION: DISPATCH ORDER UPDATE
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=adminUsername,
                    action_type='UPDATE',
                    detail=f'Updated Dispatch Order: {order_reference} (ID: {dispatch_order_id})',
                    object_table='dispatch_orders',
                    object_id=dispatch_order_id,
                    old_value=existing_dispatch_data,
                    new_value={
                        'order_reference': order_reference,
                        'priority': priority,
                        'customer_id': customer_id,
                        'shipping_address': shipping_address})
            except Exception as e:
                print("Error logging dispatch order update action:", e)
            return {"errFlag": 0, "message": "Dispatch order updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update dispatch order"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating dispatch order"}

@dispatch_blueprint.route("/dispatch-orders/get-all/<token>")
def getAllDispatchOrders(token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        dispatch_orders = dispatchObj.getAllDispatchOrders()
        # AUDIT LOG IMPLEMENTATION: GET ALL DISPATCH ORDERS
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=adminUserId,
                adminUsername=adminUsername,
                action_type='PAGE_VIEW',
                detail='Fetched all dispatch orders',
                object_table='dispatch_orders'
            )
        except Exception as e:
            print("Error logging fetch all dispatch orders action:", e)
        return [dict(row) for row in dispatch_orders]
    except Exception as e:
        print("error",e)
        return {"errFlag": 1, "message": "Error fetching dispatch orders"}

@dispatch_blueprint.route("/dispatch-orders/get-details/<dispatch_order_id>/<token>")
def getDispatchOrderDetails(dispatch_order_id, token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        dispatch_order = dispatchObj.getDispatchOrderDetails(dispatch_order_id)
        if dispatch_order:
            order_data = dict(dispatch_order[0])
            # Get items for this dispatch order
            order_items = dispatchObj.getDispatchOrderItems(dispatch_order_id)
            order_data['items'] = [dict(row) for row in order_items]
            return order_data
        else:
            return {"errFlag": 1, "message": "Dispatch order not found"}
    except Exception as e:
        print("error",e)
        return {"errFlag": 1, "message": "Error fetching dispatch order"}

@dispatch_blueprint.route("/dispatch-orders/change-status/<dispatch_order_id>/<status>/<token>")
def changeDispatchOrderStatus(dispatch_order_id, status, token):
    if status not in ["0","1"]:
        return {"errFlag": 1, "message": "Status must be 0 or 1"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    # AUDIT LOG IMPLEMENTATION: PRE-STATUS CHANGE (Get old status)
    try:
        existing_dispatch_order = dispatchObj.getDispatchOrderDetails(dispatch_order_id)
        if existing_dispatch_order:
            existing_dispatch_data = dict(existing_dispatch_order[0])
        else:
            existing_dispatch_data = None
    except Exception as e:
        existing_dispatch_data = None   
    
    try:
        response = dispatchObj.changeDispatchOrderStatus(dispatch_order_id, status)
        
        if response > 0:
            # AUDIT LOG IMPLEMENTATION: STATUS CHANGE (Post-action)
            try:
                old_status = existing_dispatch_data['dispatch_status'] if existing_dispatch_data else 'N/A'
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=adminUsername,
                    action_type='STATUS_CHANGE',
                    detail=f'Changed status for Dispatch Order ID {dispatch_order_id} from {old_status} to {status}.',
                    object_table='dispatch_orders',
                    object_id=dispatch_order_id
                )
            except Exception as e:
                print("Error logging dispatch order status change action:", e)
            return {"errFlag": 0, "message": "Dispatch order status updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update dispatch order status"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating dispatch order status",}
    


@dispatch_blueprint.route("/dispatch-orders/get-by-customer/<customer_id>/<token>")
def getDispatchOrdersByCustomer(customer_id, token):
    try:
        # Token validation
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        # Get dispatch orders for the specific customer
        dispatch_orders = dispatchObj.getDispatchOrdersByCustomer(customer_id)
        return [dict(row) for row in dispatch_orders]
    except Exception as e:
        print("error", e)
        return {"errFlag": 1, "message": "Error fetching dispatch orders for customer"}    