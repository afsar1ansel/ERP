from db import db
from sqlalchemy.sql import text
from datetime import datetime
import random
import string

class DispatchClass:
    def generate_dispatch_id(self):
        """Generate unique dispatch_id like DSP-YYYY-XXX"""
        current_year = datetime.now().year

        sql = text("""
            SELECT dispatch_id
            FROM dispatch_orders
            WHERE dispatch_id LIKE :pattern
            ORDER BY id DESC
            LIMIT 1
        """)

        with db.engine.connect() as conn:
            result = conn.execute(sql, {"pattern": f"DSP-{current_year}-%"}).mappings().all()
        if result:
            last_number = int(result[0]["dispatch_id"].split("-")[-1])
            new_number = last_number + 1
        else:
            new_number = 1
        return f"DSP-{current_year}-{new_number:03d}"

    def generate_tracking(self):
        """Generate a unique tracking code."""
        now = datetime.now()
        unique_part = now.strftime("%Y%m%d%H%M%S")
        rand_part = ''.join(random.choices(string.digits, k=4))
        return f"TRK{unique_part}{rand_part}"

    def checkDuplicateOrderReference(self, order_reference, dispatch_order_id=None):
        data = {'order_reference': order_reference}
        if dispatch_order_id:
            sql = text('SELECT * FROM dispatch_orders WHERE order_reference = :order_reference AND id != :dispatch_order_id')
            data['dispatch_order_id'] = dispatch_order_id
        else:
            sql = text('SELECT * FROM dispatch_orders WHERE order_reference = :order_reference')
        
        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
        return res.mappings().all()

    def parse_date_string(self, date_str):
        if not date_str:
            return None
        date_str = str(date_str).strip()
        if not date_str:
            return None
        try:
            clean_str = date_str.replace("T", " ").replace("Z", "")
            if "." in clean_str:
                clean_str = clean_str.split(".")[0]
            return clean_str
        except Exception:
            return date_str

    def addDispatchOrder(self, order_reference, priority, customer_id, shipping_address, 
                         notes, no_of_boxes, grand_total, tracking, dispatch_status, dispatch_date, 
                         items_to_dispatch, admin_user_id):
        # Check duplicate order reference
        if self.checkDuplicateOrderReference(order_reference):
            return {"errFlag": 1, "message": "Order reference already exists"}
        
        # Validate items
        if not items_to_dispatch or len(items_to_dispatch) == 0:
            return {"errFlag": 1, "message": "At least one item is required"}
        
        # Generate dispatch_id and tracking if not provided
        dispatch_id = self.generate_dispatch_id()
        if not tracking:
            tracking = self.generate_tracking()
        
        clean_dispatch_date = self.parse_date_string(dispatch_date)
        
        data = {
            'order_reference': order_reference, 'priority': priority, 'customer_id': customer_id,
            'shipping_address': shipping_address, 'notes': notes, 'no_of_boxes': no_of_boxes, 'grand_total': grand_total,
            'tracking': tracking, 'dispatch_id' : dispatch_id, 'dispatch_status': dispatch_status,
            'dispatch_date': clean_dispatch_date, 'status': 1,
            'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'created_admin_id': admin_user_id
        }

        sql = text('''
            INSERT INTO dispatch_orders (order_reference, priority, customer_id, shipping_address, notes, no_of_boxes, 
                                         grand_total, tracking, dispatch_id, dispatch_status, dispatch_date, status,
                                         created_at, created_admin_id)
            VALUES (:order_reference, :priority, :customer_id, :shipping_address, :notes,
                    :no_of_boxes,
                    :grand_total, :tracking, :dispatch_id, :dispatch_status, :dispatch_date, :status,
                    :created_at, :created_admin_id)
        ''')

        
        update_client_sql = text('UPDATE clients SET total_orders = total_orders + 1 WHERE id = :customer_id')

        try:
            with db.engine.connect() as conn:
                trans = conn.begin()
                try:
                    result = conn.execute(sql, data)
                    dispatch_order_id = result.lastrowid
                    
                    if customer_id:
                        conn.execute(update_client_sql, {'customer_id': customer_id})

                    for item in items_to_dispatch:
                        item_data = {
                            'dispatch_order_id': dispatch_order_id, 'product_id': item['productId'],
                            'ordered_quantity': item['orderedQuantity'], 'available_unit': item.get('availableUnit', 'pcs'),
                            'unit_price': item['unitPrice'], 'total': item['total'],
                            'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        }
                        item_sql = text('''
                            INSERT INTO dispatch_orders_items (dispatch_order_id, product_id, ordered_quantity, available_unit,
                                                               unit_price, total, created_at)
                            VALUES (:dispatch_order_id, :product_id, :ordered_quantity, :available_unit,
                                    :unit_price, :total, :created_at)
                        ''')
                        conn.execute(item_sql, item_data)
                    
                    trans.commit()
                    return dispatch_order_id
                
                except Exception as e:
                    trans.rollback()
                    return {"errFlag": 1, "message": "Error processing dispatch order", "error": str(e)}
        except Exception as e:
            return {"errFlag": 1, "message": "Database connection error", "error": str(e)}

    def updateDispatchOrder(self, dispatch_order_id, order_reference, priority, customer_id, 
                            shipping_address, notes, grand_total, tracking, dispatch_status, 
                            dispatch_date, items_to_dispatch, admin_user_id):
        # if self.checkDuplicateOrderReference(order_reference, dispatch_order_id):
        #     return {"errFlag": 1, "message": "Order reference already exists"}

        if not items_to_dispatch or len(items_to_dispatch) == 0:
            return {"errFlag": 1, "message": "At least one item is required"}

        clean_dispatch_date = self.parse_date_string(dispatch_date)

        data = {
            'dispatch_order_id': dispatch_order_id, 'order_reference': order_reference,
            'priority': priority, 'customer_id': customer_id, 'shipping_address': shipping_address,
            'notes': notes, 'grand_total': grand_total, 'tracking': tracking,
            'dispatch_status': dispatch_status, 'dispatch_date': clean_dispatch_date,
            'updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updated_admin_id': admin_user_id
        }

        try:
            with db.engine.connect() as conn:
                trans = conn.begin()
                try:
                    # 1. Get the old customer_id before the update
                    old_customer_sql = text('SELECT customer_id FROM dispatch_orders WHERE id = :dispatch_order_id')
                    result = conn.execute(old_customer_sql, {'dispatch_order_id': dispatch_order_id}).mappings().first()
                    old_customer_id = result['customer_id'] if result else None

                    # 2. Update the main dispatch order
                    sql = text('''
                        UPDATE dispatch_orders SET order_reference = :order_reference, priority = :priority,
                               customer_id = :customer_id, shipping_address = :shipping_address, notes = :notes,
                               grand_total = :grand_total, tracking = :tracking, dispatch_status = :dispatch_status,
                               dispatch_date = :dispatch_date, updated_at = :updated_at,
                               updated_admin_id = :updated_admin_id
                        WHERE id = :dispatch_order_id
                    ''')
                    conn.execute(sql, data)

                    # 3. Adjust client total_orders if customer has changed
                    new_customer_id = customer_id
                    if old_customer_id != new_customer_id:
                        if old_customer_id:
                            decrement_sql = text('UPDATE clients SET total_orders = total_orders - 1 WHERE id = :customer_id')
                            conn.execute(decrement_sql, {'customer_id': old_customer_id})
                        if new_customer_id:
                            increment_sql = text('UPDATE clients SET total_orders = total_orders + 1 WHERE id = :customer_id')
                            conn.execute(increment_sql, {'customer_id': new_customer_id})
                    
                    # 4. Delete old items and insert new ones
                    delete_sql = text('DELETE FROM dispatch_orders_items WHERE dispatch_order_id = :dispatch_order_id')
                    conn.execute(delete_sql, {'dispatch_order_id': dispatch_order_id})
                    
                    for item in items_to_dispatch:
                        item_data = {
                            'dispatch_order_id': dispatch_order_id, 'product_id': item['productId'],
                            'ordered_quantity': item['orderedQuantity'], 'available_unit': item.get('availableUnit') or 'pcs',
                            'unit_price': item['unitPrice'], 'total': item['total'],
                            'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        }
                        item_sql = text('''
                            INSERT INTO dispatch_orders_items (dispatch_order_id, product_id, ordered_quantity, available_unit,
                                                               unit_price, total, created_at)
                            VALUES (:dispatch_order_id, :product_id, :ordered_quantity, :available_unit,
                                    :unit_price, :total, :created_at)
                        ''')
                        conn.execute(item_sql, item_data)
                    
                    trans.commit()
                    return 1 # Return success indicator (e.g., row count)
                
                except Exception as e:
                    trans.rollback()
                    return {"errFlag": 1, "message": "Error processing order update", "error": str(e)}
        except Exception as e:
            return {"errFlag": 1, "message": "Database connection error", "error": str(e)}


    def getAllDispatchOrders(self):
        sql = text('''
            SELECT do.*, c.client_name AS customer_name, c.id AS customer_id
            FROM dispatch_orders do
            LEFT JOIN clients c ON do.customer_id = c.id
            ORDER BY do.created_at DESC
        ''')
        with db.engine.connect() as conn:
            res = conn.execute(sql)
            result = res.mappings().all()  # List of RowMapping

        orders = []
        for row in result:
            dispatch_order_id = row['id']
            dispatch_items = self.getDispatchOrderItems(dispatch_order_id)
            # Convert items to list of dicts
            items = [dict(item) for item in dispatch_items]
            # Combine order and items
            order_dict = dict(row)
            order_dict['items'] = items
            orders.append(order_dict)

        return orders

    
    def getDispatchOrderDetails(self, dispatch_order_id):
        data = {'dispatch_order_id': dispatch_order_id}
        sql = text('''
            SELECT * FROM dispatch_orders
            WHERE id = :dispatch_order_id
        ''')
        with db.engine.connect() as conn:
            res = conn.execute(sql,data)
        return res.mappings().all()

    def getDispatchOrderItems(self, dispatch_order_id):
        sql = text('''
            SELECT doi.*, ps.product_name, ps.product_image
            FROM dispatch_orders_items doi 
            LEFT JOIN products_sku ps ON doi.product_id = ps.id 
            WHERE doi.dispatch_order_id = :dispatch_order_id
        ''')
        with db.engine.connect() as conn:
            res = conn.execute(sql, {'dispatch_order_id': dispatch_order_id})
        return res.mappings().all()
    


    def changeDispatchOrderStatus(self, dispatch_order_id, status):
        data = {
            'dispatch_order_id': dispatch_order_id,
            'status': status,
            'updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        sql = text('UPDATE dispatch_orders SET status = :status, updated_at = :updated_at WHERE id = :dispatch_order_id')
        try:
            with db.engine.connect() as conn:
                result = conn.execute(sql, data)
                conn.commit()
            return result.rowcount
        except Exception as e:
            return {"errFlag": 1, "message": "Error updating dispatch order status", "error": str(e)}


    def getDispatchOrdersByCustomer(self, customer_id):
        sql = text('''
            SELECT do.*, c.client_name AS customer_name, c.id AS customer_id
            FROM dispatch_orders do
            LEFT JOIN clients c ON do.customer_id = c.id
            WHERE do.customer_id = :customer_id
            ORDER BY do.created_at DESC
        ''')
        
        with db.engine.connect() as conn:
            res = conn.execute(sql, {'customer_id': customer_id})
            result = res.mappings().all()

        orders = []
        for row in result:
            dispatch_order_id = row['id']
            dispatch_items = self.getDispatchOrderItems(dispatch_order_id)
            # Convert items to list of dicts
            items = [dict(item) for item in dispatch_items]
            # Combine order and items
            order_dict = dict(row)
            order_dict['items'] = items
            orders.append(order_dict)

        return orders       

# Singleton instance
dispatchObj = DispatchClass()