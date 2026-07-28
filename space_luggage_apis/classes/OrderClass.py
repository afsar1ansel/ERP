from db import db
from sqlalchemy.sql import text
from datetime import datetime
import json

class OrderClass:
    
    def generate_order_code(self):
        """Generate unique order code like ORD-YYYY-XXX (resets each year)."""
        current_year = datetime.now().year
        sql = text("""
            SELECT order_code
            FROM orders
            WHERE order_code LIKE :pattern
            ORDER BY id DESC
            LIMIT 1
        """)
        try:
            with db.engine.connect() as conn:
                res = conn.execute(sql, {"pattern": f"ORD-{current_year}-%"}).mappings().all()
            if res:
                last_code = res[0]["order_code"]  # ORD-2024-012
                try:
                    last_seq = int(last_code.split("-")[-1])
                    new_seq = last_seq + 1
                except Exception:
                    new_seq = 1
            else:
                new_seq = 1
            return f"ORD-{current_year}-{new_seq:03d}"
        except Exception as e:
            print("Error generating order code:", e)
            return f"ORD-{current_year}-{datetime.now().strftime('%H%M%S')}"

    def createOrder(self, clientId, quantity, expectedDeliveryDate, adminUserId, 
                   productSkuId=None, rawMaterialsJson=None, notes=None):
        """
        Create a new order.
        Either productSkuId OR rawMaterialsJson must be provided.
        Returns new order id or error dict.
        """
        
        # Validate inputs
        if not clientId or not quantity or not expectedDeliveryDate:
            return {"errFlag": 1, "message": "clientId, quantity, and expectedDeliveryDate are required"}
        
        if not productSkuId and not rawMaterialsJson:
            return {"errFlag": 1, "message": "Either productSkuId or rawMaterialsJson must be provided"}
        
        if productSkuId and rawMaterialsJson:
            return {"errFlag": 1, "message": "Cannot provide both productSkuId and rawMaterialsJson"}
        
        # Validate client exists
        sql_chk_client = text('SELECT id FROM clients WHERE id = :clientId AND status = 1')
        with db.engine.connect() as conn:
            client_exists = conn.execute(sql_chk_client, {'clientId': clientId}).mappings().first()
        if not client_exists:
            return {"errFlag": 1, "message": "Client not found"}
        
        # Validate product exists if provided
        if productSkuId:
            sql_chk_product = text('SELECT id FROM products_sku WHERE id = :productId AND status = 1')
            with db.engine.connect() as conn:
                product_exists = conn.execute(sql_chk_product, {'productId': productSkuId}).mappings().first()
            if not product_exists:
                return {"errFlag": 1, "message": "Product not found"}
        
        # Validate rawMaterialsJson if provided
        if rawMaterialsJson:
            try:
                materials_list = json.loads(rawMaterialsJson)
                if not isinstance(materials_list, list) or len(materials_list) == 0:
                    return {"errFlag": 1, "message": "rawMaterialsJson must be a non-empty JSON array"}
                
                # Validate each material exists
                rm_ids = [item.get('raw_material_id') for item in materials_list if item.get('raw_material_id')]
                if rm_ids:
                    rm_ids_tuple = tuple(set(rm_ids))
                    sql_chk_rm = text('SELECT id FROM raw_materials WHERE id IN :rm_ids AND status = 1')
                    with db.engine.connect() as conn:
                        rm_exists = conn.execute(sql_chk_rm, {'rm_ids': rm_ids_tuple}).mappings().all()
                    if len(rm_exists) != len(rm_ids_tuple):
                        return {"errFlag": 1, "message": "One or more raw materials not found"}
            except json.JSONDecodeError:
                return {"errFlag": 1, "message": "Invalid rawMaterialsJson format"}
        
        order_code = self.generate_order_code()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        try:
            with db.engine.connect() as conn:
                trans = conn.begin()
                
                insert_sql = text('''
                    INSERT INTO orders 
                    (order_code, client_id, product_sku_id, quantity, raw_materials_json, 
                     order_status, notes, expected_delivery_date, created_at, created_admin_id)
                    VALUES 
                    (:orderCode, :clientId, :productSkuId, :quantity, :rawMaterialsJson,
                     :orderStatus, :notes, :expectedDeliveryDate, :createdAt, :createdAdminId)
                ''')
                
                params = {
                    'orderCode': order_code,
                    'clientId': int(clientId),
                    'productSkuId': int(productSkuId) if productSkuId not in (None, "", "null") else None,
                    'quantity': float(quantity),
                    'rawMaterialsJson': rawMaterialsJson,
                    'orderStatus': 'pending',  # Default status
                    'notes': notes,
                    'expectedDeliveryDate': expectedDeliveryDate,
                    'createdAt': now,
                    'createdAdminId': adminUserId
                }
                
                result = conn.execute(insert_sql, params)
                order_id = result.lastrowid
                
                # Log status change
                status_sql = text('''
                    INSERT INTO order_status_history 
                    (order_id, old_status, new_status, changed_by_admin_id)
                    VALUES 
                    (:orderId, :oldStatus, :newStatus, :changedByAdminId)
                ''')
                conn.execute(status_sql, {
                    'orderId': order_id,
                    'oldStatus': None,
                    'newStatus': 'pending',
                    'changedByAdminId': adminUserId
                })
                
                trans.commit()
                return order_id
                
        except Exception as e:
            if 'trans' in locals():
                trans.rollback()
            print("Error in createOrder:", e)
            return {"errFlag": 1, "message": "Error while creating order"}

    def editOrder(self, orderId, clientId=None, quantity=None, expectedDeliveryDate=None, 
                 adminUserId=None, productSkuId=None, rawMaterialsJson=None, notes=None):
        """
        Edit an existing order.
        Returns number of affected rows or error dict.
        """
        
        # Check if order exists
        sql_chk = text('SELECT id, order_status FROM orders WHERE id = :orderId AND status = 1')
        with db.engine.connect() as conn:
            order_exists = conn.execute(sql_chk, {'orderId': orderId}).mappings().first()
        if not order_exists:
            return {"errFlag": 1, "message": "Order not found"}
        
        # Cannot edit if order is in production or completed
        current_status = order_exists['order_status']
        if current_status in ['in_production', 'completed']:
            return {"errFlag": 1, "message": f"Cannot edit order with status: {current_status}"}
        
        data = {
            'orderId': int(orderId),
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }
        set_parts = []
        
        if clientId is not None:
            # Validate client exists
            sql_chk_client = text('SELECT id FROM clients WHERE id = :clientId AND status = 1')
            with db.engine.connect() as conn:
                client_exists = conn.execute(sql_chk_client, {'clientId': clientId}).mappings().first()
            if not client_exists:
                return {"errFlag": 1, "message": "Client not found"}
            data['clientId'] = int(clientId)
            set_parts.append("client_id = :clientId")
        
        if quantity is not None:
            try:
                data['quantity'] = float(quantity)
                set_parts.append("quantity = :quantity")
            except ValueError:
                return {"errFlag": 1, "message": "Invalid quantity format"}
        
        if expectedDeliveryDate is not None:
            data['expectedDeliveryDate'] = expectedDeliveryDate
            set_parts.append("expected_delivery_date = :expectedDeliveryDate")
        
        if productSkuId is not None:
            if productSkuId in ["", "null"]:
                data['productSkuId'] = None
                set_parts.append("product_sku_id = NULL")
            else:
                # Validate product exists
                sql_chk_product = text('SELECT id FROM products_sku WHERE id = :productId AND status = 1')
                with db.engine.connect() as conn:
                    product_exists = conn.execute(sql_chk_product, {'productId': productSkuId}).mappings().first()
                if not product_exists:
                    return {"errFlag": 1, "message": "Product not found"}
                data['productSkuId'] = int(productSkuId)
                set_parts.append("product_sku_id = :productSkuId")
        
        if rawMaterialsJson is not None:
            if rawMaterialsJson in ["", "null"]:
                data['rawMaterialsJson'] = None
                set_parts.append("raw_materials_json = NULL")
            else:
                try:
                    materials_list = json.loads(rawMaterialsJson)
                    if not isinstance(materials_list, list):
                        return {"errFlag": 1, "message": "rawMaterialsJson must be a JSON array"}
                    data['rawMaterialsJson'] = rawMaterialsJson
                    set_parts.append("raw_materials_json = :rawMaterialsJson")
                except json.JSONDecodeError:
                    return {"errFlag": 1, "message": "Invalid rawMaterialsJson format"}
        
        if notes is not None:
            data['notes'] = notes
            set_parts.append("notes = :notes")
        
        # Validate that we have either product or raw materials (not both, not none)
        if 'productSkuId' in data or 'rawMaterialsJson' in data:
            # Check current state after update
            final_product_id = data.get('productSkuId') if 'productSkuId' in data else (order_exists.get('product_sku_id') if hasattr(order_exists, 'product_sku_id') else None)
            final_raw_materials = data.get('rawMaterialsJson') if 'rawMaterialsJson' in data else None
            
            if final_product_id and final_raw_materials:
                return {"errFlag": 1, "message": "Cannot have both productSkuId and rawMaterialsJson"}
            if not final_product_id and not final_raw_materials:
                return {"errFlag": 1, "message": "Either productSkuId or rawMaterialsJson must be provided"}
        
        if not set_parts:
            return 0  # No changes
        
        set_parts.append("updated_at = :updatedAt")
        set_parts.append("updated_admin_id = :updatedAdminId")
        
        update_sql = 'UPDATE orders SET \n'
        update_sql += ",\n".join(set_parts)
        update_sql += "\n WHERE id = :orderId"
        
        try:
            with db.engine.connect() as conn:
                trans = conn.begin()
                result = conn.execute(text(update_sql), data)
                trans.commit()
            return result.rowcount
            
        except Exception as e:
            if 'trans' in locals():
                trans.rollback()
            print("Error in editOrder:", e)
            return {"errFlag": 1, "message": "Error while updating order"}

    def cancelOrder(self, orderId, cancelReason, adminUserId):
        """
        Cancel an order.
        Returns number of affected rows or error dict.
        """
        
        # Check if order exists
        sql_chk = text('SELECT id, order_status FROM orders WHERE id = :orderId AND status = 1')
        with db.engine.connect() as conn:
            order_exists = conn.execute(sql_chk, {'orderId': orderId}).mappings().first()
        if not order_exists:
            return {"errFlag": 1, "message": "Order not found"}
        
        current_status = order_exists['order_status']
        if current_status == 'cancelled':
            return {"errFlag": 1, "message": "Order is already cancelled"}
        
        # Cannot cancel completed orders
        if current_status == 'completed':
            return {"errFlag": 1, "message": "Cannot cancel completed order"}
        
        try:
            with db.engine.connect() as conn:
                trans = conn.begin()
                
                # Update order status
                update_sql = text('''
                    UPDATE orders 
                    SET order_status = 'cancelled', 
                        updated_at = :updatedAt, 
                        updated_admin_id = :updatedAdminId
                    WHERE id = :orderId
                ''')
                result = conn.execute(update_sql, {
                    'orderId': int(orderId),
                    'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    'updatedAdminId': adminUserId
                })
                
                # Log status change with reason
                status_sql = text('''
                    INSERT INTO order_status_history 
                    (order_id, old_status, new_status, change_reason, changed_by_admin_id)
                    VALUES 
                    (:orderId, :oldStatus, :newStatus, :changeReason, :changedByAdminId)
                ''')
                conn.execute(status_sql, {
                    'orderId': int(orderId),
                    'oldStatus': current_status,
                    'newStatus': 'cancelled',
                    'changeReason': cancelReason,
                    'changedByAdminId': adminUserId
                })
                
                trans.commit()
                return result.rowcount
                
        except Exception as e:
            if 'trans' in locals():
                trans.rollback()
            print("Error in cancelOrder:", e)
            return {"errFlag": 1, "message": "Error while cancelling order"}

    def getAllOrders(self, include_full_history=False):
        """
        Get all orders with client, product details, and status history.
        
        Args:
            include_full_history: If True, includes all history. If False, includes only latest 5 entries.
        
        Returns list of orders with embedded history.
        """
        # Main orders query
        sql = text('''
            SELECT o.*, 
                c.client_name,
                p.product_name,
                creator.username as created_by,
                updater.username as updated_by
            FROM orders o
            LEFT JOIN clients c ON o.client_id = c.id
            LEFT JOIN products_sku p ON o.product_sku_id = p.id
            LEFT JOIN admin_users creator ON o.created_admin_id = creator.id
            LEFT JOIN admin_users updater ON o.updated_admin_id = updater.id
            WHERE o.status = 1
            ORDER BY o.created_at DESC
        ''')
        
        try:
            with db.engine.connect() as conn:
                orders = conn.execute(sql).mappings().all()
                
            if not orders:
                return []
                
            # Get order IDs for batch history query
            order_ids = [order['id'] for order in orders]
            
            if include_full_history:
                # Fetch all status history
                history_sql = text('''
                    SELECT osh.*, a.username as changed_by_name
                    FROM order_status_history osh
                    LEFT JOIN admin_users a ON osh.changed_by_admin_id = a.id
                    WHERE osh.order_id IN :order_ids
                    ORDER BY osh.order_id, osh.changed_at DESC
                ''')
            else:
                # Fetch limited history (latest 5 per order) for better performance
                history_sql = text('''
                    SELECT osh.*, a.username as changed_by_name
                    FROM order_status_history osh
                    LEFT JOIN admin_users a ON osh.changed_by_admin_id = a.id
                    WHERE osh.order_id IN :order_ids
                    AND osh.id IN (
                        SELECT id FROM (
                            SELECT id, 
                                ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY changed_at DESC) as rn
                            FROM order_status_history 
                            WHERE order_id IN :order_ids
                        ) as ranked
                        WHERE rn <= 5
                    )
                    ORDER BY osh.order_id, osh.changed_at DESC
                ''')
            
            with db.engine.connect() as conn:
                all_history = conn.execute(history_sql, {'order_ids': tuple(order_ids)}).mappings().all()
            
            # Group history by order_id
            history_by_order = {}
            for history in all_history:
                order_id = history['order_id']
                if order_id not in history_by_order:
                    history_by_order[order_id] = []
                history_by_order[order_id].append(dict(history))
            
            # Combine orders with their history
            result = []
            for order in orders:
                order_dict = dict(order)
                order_dict['status_history'] = history_by_order.get(order_dict['id'], [])
                result.append(order_dict)
                
            return result
            
        except Exception as e:
            print("Error in getAllOrders:", e)
            return []

    def getOrderDetails(self, orderId):
        """
        Get detailed order information including status history.
        Returns order details or None.
        """
        # Get order basic info
        sql = text('''
            SELECT o.*, 
                   c.client_name,
                   c.email as client_email,
                   c.phone as client_phone,
                   p.product_name,
                   creator.username as created_by,
                   updater.username as updated_by
            FROM orders o
            LEFT JOIN clients c ON o.client_id = c.id
            LEFT JOIN products_sku p ON o.product_sku_id = p.id
            LEFT JOIN admin_users creator ON o.created_admin_id = creator.id
            LEFT JOIN admin_users updater ON o.updated_admin_id = updater.id
            WHERE o.id = :orderId AND o.status = 1
        ''')
        
        # Get status history
        history_sql = text('''
            SELECT osh.*, a.username as changed_by_name
            FROM order_status_history osh
            LEFT JOIN admin_users a ON osh.changed_by_admin_id = a.id
            WHERE osh.order_id = :orderId
            ORDER BY osh.changed_at DESC
        ''')
        
        try:
            with db.engine.connect() as conn:
                order = conn.execute(sql, {'orderId': orderId}).mappings().first()
                if not order:
                    return None
                
                history = conn.execute(history_sql, {'orderId': orderId}).mappings().all()
                
                result = dict(order)
                result['status_history'] = [dict(h) for h in history]
                return result
                
        except Exception as e:
            print("Error in getOrderDetails:", e)
            return None

    def getOrderDetailsForAudit(self, orderId):
        """Get order details for audit logging."""
        return self.getOrderDetails(orderId)

# Singleton instance
orderObj = OrderClass()