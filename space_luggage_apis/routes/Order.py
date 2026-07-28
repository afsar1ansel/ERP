from flask import Blueprint, request
from sqlalchemy import text
from classes.OrderClass import orderObj
from classes.AdminUsersClass import adminUserObj
from classes.AuditLogClass import auditLogObj


orders_blueprint = Blueprint("orders", __name__)

@orders_blueprint.route("/orders/create", methods=["POST"])
def createOrder():
    """Create a new order"""
    try:
        # Required fields
        clientId = request.form["clientId"]
        quantity = request.form["quantity"]
        expectedDeliveryDate = request.form["expectedDeliveryDate"]
        token = request.form["token"]
        
        # Optional fields
        productSkuId = request.form.get("productSkuId")  # Either this OR rawMaterialsJson
        rawMaterialsJson = request.form.get("rawMaterialsJson")  # JSON string of raw materials
        notes = request.form.get("notes", "")
        
    except Exception as e:
        return {"errFlag": 1, "message": "Missing required fields: clientId, quantity, expectedDeliveryDate, token"}

    # Validate token and get admin user
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_username = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        # Create order
        out = orderObj.createOrder(
            clientId=clientId,
            quantity=quantity,
            expectedDeliveryDate=expectedDeliveryDate,
            adminUserId=admin_user_id,
            productSkuId=productSkuId,
            rawMaterialsJson=rawMaterialsJson,
            notes=notes
        )
        
        if isinstance(out, dict):
            # Error response
            return out
        elif out > 0:
            # Success - log audit
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_username,
                    action_type='CREATE',
                    detail=f'Created order ID: {out}',
                    object_table='orders',
                    object_id=out
                )
            except Exception as e:
                print("Error logging order creation action:", e)
            
            return {"errFlag": 0, "message": "Order created successfully", "orderId": out}
        else:
            return {"errFlag": 1, "message": "Failed to create order"}
            
    except Exception as e:
        print(f"Error in createOrder route: {e}")
        return {"errFlag": 1, "message": "Error creating order"}

@orders_blueprint.route("/orders/update", methods=["POST"])
def updateOrder():
    """Update an existing order"""
    try:
        orderId = request.form["orderId"]
        token = request.form["token"]
        
        # Optional fields that can be updated
        clientId = request.form.get("clientId")
        quantity = request.form.get("quantity")
        expectedDeliveryDate = request.form.get("expectedDeliveryDate")
        productSkuId = request.form.get("productSkuId")
        rawMaterialsJson = request.form.get("rawMaterialsJson")
        notes = request.form.get("notes")
        
    except Exception as e:
        return {"errFlag": 1, "message": "Missing required fields: orderId, token"}

    # Validate token and get admin user
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_username = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    # Get existing order details for audit log
    try:
        existing_order = orderObj.getOrderDetailsForAudit(orderId)
    except Exception as e:
        existing_order = None

    try:
        # Update order
        out = orderObj.editOrder(
            orderId=orderId,
            clientId=clientId,
            quantity=quantity,
            expectedDeliveryDate=expectedDeliveryDate,
            adminUserId=admin_user_id,
            productSkuId=productSkuId,
            rawMaterialsJson=rawMaterialsJson,
            notes=notes
        )
        
        if isinstance(out, dict):
            # Error response
            return out
        elif out > 0:
            # Success - log audit
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_username,
                    action_type='UPDATE',
                    detail=f'Updated order ID: {orderId}',
                    object_table='orders',
                    object_id=orderId,
                    old_value=existing_order,
                    new_value=orderObj.getOrderDetailsForAudit(orderId)
                )
            except Exception as e:
                print(f"Error logging order update action: {e}")
            
            return {"errFlag": 0, "message": "Order updated successfully"}
        else:
            return {"errFlag": 1, "message": "No changes detected or failed to update order"}
            
    except Exception as e:
        print(f"Error in updateOrder route: {e}")
        return {"errFlag": 1, "message": "Error updating order"}

@orders_blueprint.route("/orders/cancel", methods=["POST"])
def cancelOrder():
    """Cancel an order"""
    try:
        orderId = request.form["orderId"]
        cancelReason = request.form.get("cancelReason", "No reason provided")
        token = request.form["token"]
        
    except Exception as e:
        return {"errFlag": 1, "message": "Missing required fields: orderId, token"}

    # Validate token and get admin user
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_username = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    # Get existing order details for audit log
    try:
        existing_order = orderObj.getOrderDetailsForAudit(orderId)
    except Exception as e:
        existing_order = None

    try:
        # Cancel order
        out = orderObj.cancelOrder(
            orderId=orderId,
            cancelReason=cancelReason,
            adminUserId=admin_user_id
        )
        
        if isinstance(out, dict):
            # Error response
            return out
        elif out > 0:
            # Success - log audit
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_username,
                    action_type='STATUS_CHANGE',
                    detail=f'Cancelled order ID: {orderId}. Reason: {cancelReason}',
                    object_table='orders',
                    object_id=orderId,
                    old_value=existing_order,
                    new_value=orderObj.getOrderDetailsForAudit(orderId)
                )
            except Exception as e:
                print(f"Error logging order cancellation action: {e}")
            
            return {"errFlag": 0, "message": "Order cancelled successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to cancel order"}
            
    except Exception as e:
        print(f"Error in cancelOrder route: {e}")
        return {"errFlag": 1, "message": "Error cancelling order"}

@orders_blueprint.route("/orders/get-all/<token>")
def getAllOrders(token):
    """Get all orders"""
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_username = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        orders = orderObj.getAllOrders()
        
        # Log page view audit
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=admin_user_id,
                adminUsername=admin_username,
                action_type='PAGE_VIEW',
                detail='Fetched all orders',
                object_table='orders'
            )
        except Exception as e:
            print("Error logging orders page view action:", e)
        
        return {"errFlag": 0, "data": orders}
        
    except Exception as e:
        print(f"Error in getAllOrders route: {e}")
        return {"errFlag": 1, "message": "Error fetching orders"}

@orders_blueprint.route("/orders/get-details/<orderId>/<token>")
def getOrderDetails(orderId, token):
    """Get detailed order information"""
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_username = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        order_details = orderObj.getOrderDetails(orderId)
        if order_details:
            # Log view audit for specific order
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_username,
                    action_type='VIEW',
                    detail=f'Viewed order details ID: {orderId}',
                    object_table='orders',
                    object_id=orderId
                )
            except Exception as e:
                print(f"Error logging order view action: {e}")
            
            return {"errFlag": 0, "data": order_details}
        else:
            return {"errFlag": 1, "message": "Order not found"}
            
    except Exception as e:
        print(f"Error in getOrderDetails route: {e}")
        return {"errFlag": 1, "message": "Error fetching order details"}
