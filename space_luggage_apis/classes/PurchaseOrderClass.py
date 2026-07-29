from db import db
from sqlalchemy.sql import text
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from collections import defaultdict

class PurchaseOrderClass:

    def generate_po_number(self):
        """Generate unique PO number like PO-YYYY-XXX"""

        current_year = datetime.now().year

        # Get the last PO number for this year
        sql = text("""
            SELECT po_number 
            FROM purchase_orders 
            WHERE po_number LIKE :pattern 
            ORDER BY id DESC 
            LIMIT 1
        """)

        with db.engine.connect() as conn:
            result = conn.execute(sql, {"pattern": f"PO-{current_year}-%"}).mappings().all()
        if result:
            # Extract last number
            last_number = int(result[0]["po_number"].split("-")[-1])
            new_number = last_number + 1
        else:
            # First PO for this year
            new_number = 1
        # Format with leading zeros (e.g. 001, 002, 010, 123)
        return f"PO-{current_year}-{new_number:03d}"

    def validateVendorExists(self, vendorId):
        """Check if vendor exists"""
        sql = text('SELECT id FROM vendors WHERE id = :vendorId AND status = 1')
        with db.engine.connect() as conn:
            result = conn.execute(sql, {'vendorId': vendorId}).fetchone()
        return result is not None

    def addPurchaseOrder(self, vendorId, expectedDispatchDate, notes, poItems, adminUserId):
        # Validate vendor exists
        if not self.validateVendorExists(vendorId):
            return {"errFlag": 1, "message": "Vendor does not exist"}
        # Generate PO number
        po_number = self.generate_po_number()

        # Calculate grand total
        grand_total = sum(float(item.get('totalPrice', item.get('total', 0))) for item in poItems)
        data = {
            'poNumber': po_number,
            'vendorId': vendorId,
            'expectedDispatchDate': expectedDispatchDate,
            'notes': notes,
            'grandTotal': grand_total,
            'poStatus': 'pending',
            'completionPercent': 0,
            'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'createdAdminId': adminUserId
        }

        sql = text('''
            INSERT INTO purchase_orders (
                po_number,
                vendor_id,
                expected_dispatch_date,
                notes,
                grand_total,
                po_status,
                completion_percent,
                created_at,
                created_admin_id)
            VALUES (
                :poNumber,
                :vendorId,
                :expectedDispatchDate,
                :notes,
                :grandTotal,
                :poStatus,
                :completionPercent,
                :createdAt,
                :createdAdminId)
        ''')
        try:
            with db.engine.connect() as conn:
                with conn.begin() as transaction:
                    # Insert main purchase order
                    result = conn.execute(sql, data)
                    po_id = result.lastrowid
                    
                    if not po_id:
                        raise Exception("Failed to create purchase order.")

                    # Insert PO items
                    for item in poItems:
                        item_data = {
                            'poId': po_id,
                            'alias': item.get('alias', ''),
                            'rawMaterialId': item.get('rawMaterialId'),
                            'orderedQty': item.get('quantity', item.get('orderedQty', 0)),
                            'receivedQty': 0,
                            'unitPrice': item.get('unitPrice', 0),
                            'totalPrice': item.get('totalPrice', item.get('total', 0)),
                            'itemStatus': 'pending',
                            'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        }
                        
                        item_sql = text('''
                            INSERT INTO purchase_order_items (
                                po_id,
                                alias,
                                raw_material_id,
                                ordered_qty,
                                received_qty,
                                unit_price,
                                total_price,
                                item_status,
                                created_at)
                            VALUES (
                                :poId,
                                :alias,
                                :rawMaterialId,
                                :orderedQty,
                                :receivedQty,
                                :unitPrice,
                                :totalPrice,
                                :itemStatus,
                                :createdAt)
                        ''')
                        conn.execute(item_sql, item_data)
                    
                    transaction.commit()
                # Reconcile status after successful commit
                self.reconcile_po_status(po_id, adminUserId)
                return po_id    
            
        except Exception as e:
            print("Error in addPurchaseOrder:", e)
            return {"errFlag": 1, "message": f"Error adding purchase order: {str(e)}"}


    def updatePurchaseOrder(self, poId, vendorId, expectedDispatchDate, notes, poItems, adminUserId):
        # Validate PO exists
        if not self.validatePOExists(poId):
            return {"errFlag": 1, "message": "Purchase order does not exist"}

        # Validate vendor exists
        if not self.validateVendorExists(vendorId):
            return {"errFlag": 1, "message": "Vendor does not exist"}

        # Calculate new grand total
        grand_total = sum(float(item['totalPrice']) for item in poItems)

        data = {
            'poId': poId,
            'vendorId': vendorId,
            'expectedDispatchDate': expectedDispatchDate,
            'notes': notes,
            'grandTotal': grand_total,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }

        sql = text('''
            UPDATE purchase_orders 
            SET vendor_id = :vendorId,
                expected_dispatch_date = :expectedDispatchDate,
                notes = :notes,
                grand_total = :grandTotal,
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :poId
        ''')
        
        try:
            with db.engine.connect() as conn:
                with conn.begin() as transaction:
                    # Update main purchase order
                    conn.execute(sql, data)
                    
                    # Delete existing items
                    delete_sql = text('DELETE FROM purchase_order_items WHERE po_id = :poId')
                    conn.execute(delete_sql, {'poId': poId})
                    
                    # Insert new items
                    for item in poItems:
                        item_data = {
                            'poId': poId,
                            'alias': item['alias'],
                            'rawMaterialId': item['rawMaterialId'],
                            'orderedQty': item['quantity'],
                            'receivedQty': 0,
                            'unitPrice': item['unitPrice'],
                            'totalPrice': item['totalPrice'],
                            'itemStatus': 'pending',
                            'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        }
                        
                        item_sql = text('''
                            INSERT INTO purchase_order_items (
                                po_id,
                                alias,
                                raw_material_id,
                                ordered_qty,
                                received_qty,
                                unit_price,
                                total_price,
                                item_status,
                                created_at)
                            VALUES (
                                :poId,
                                :alias,
                                :rawMaterialId,
                                :orderedQty,
                                :receivedQty,
                                :unitPrice,
                                :totalPrice,
                                :itemStatus,
                                :createdAt)
                        ''')
                        conn.execute(item_sql, item_data)
                    
                    transaction.commit()
                self.reconcile_po_status(poId, adminUserId)
                return poId
            
        except Exception as e:

            return {"errFlag": 1, "message": "Error updating purchase order", "error": str(e)}

    def validatePOExists(self, poId):
        """Check if purchase order exists"""
        sql = text('SELECT id FROM purchase_orders WHERE id = :poId')
        with db.engine.connect() as conn:
            result = conn.execute(sql, {'poId': poId}).fetchone()
        return result is not None

    def getAllPurchaseOrders(self):
        """
        Retrieves all purchase orders along with their associated items.
        """
        # 1. Get all purchase order headers
        sql_headers = text('''
            SELECT po.*, v.vendor_name 
            FROM purchase_orders po 
            LEFT JOIN vendors v ON po.vendor_id = v.id 
            ORDER BY po.created_at DESC
        ''')
        with db.engine.connect() as conn:
            po_headers = conn.execute(sql_headers).mappings().all()

        if not po_headers:
            return []

        # 2. Get all relevant PO IDs
        po_ids = [po['id'] for po in po_headers]

        # 3. Get all items for those POs in a single query
        sql_items = text('''
            SELECT
                poi.id            AS po_item_id,
                poi.po_id         AS po_id,
                poi.alias,                     -- <-- ADD THIS LINE
                poi.raw_material_id,
                poi.ordered_qty,
                poi.received_qty,
                poi.unit_price,
                poi.total_price,
                poi.item_status,
                rm.id             AS raw_material_id,
                rm.material_name  AS raw_material_name,
                rm.material_code  AS raw_material_code,
                rm.material_description AS raw_material_description,
                rm.raw_material_image,
                rm.raw_material_image_public_id,
                rm.unit_of_measure
            FROM purchase_order_items poi
            LEFT JOIN raw_materials rm ON poi.raw_material_id = rm.id
            WHERE poi.po_id IN :po_ids
        ''')
        
        with db.engine.connect() as conn:
            # Use tuple(po_ids) for broader database compatibility with IN clauses
            all_items = conn.execute(sql_items, {'po_ids': tuple(po_ids)}).mappings().all()

        # 4. Group items by their po_id for efficient lookup
        items_by_po_id = defaultdict(list)
        for item in all_items:
            items_by_po_id[item['po_id']].append(dict(item))

        # 5. Combine headers with their respective items
        result_list = []
        for header in po_headers:
            po_id = header['id']
            # Convert RowMapping to a mutable dict and add items
            header_dict = dict(header)
            header_dict['items'] = items_by_po_id.get(po_id, [])
            result_list.append(header_dict)

        return result_list

    def getPurchaseOrderDetails(self, poId):
        # Get PO header
        sql = text('''
            SELECT po.*, v.vendor_name, v.contact_person, v.email, v.phone 
            FROM purchase_orders po 
            LEFT JOIN vendors v ON po.vendor_id = v.id 
            WHERE po.id = :poId
        ''')
        with db.engine.connect() as conn:
            po_header = conn.execute(sql, {'poId': poId}).mappings().first()
        
        if not po_header:
            return None
        
        # Get PO items
        items_sql = text('''
            SELECT poi.*, rm.id AS raw_material_id, rm.material_name
            FROM purchase_order_items poi
            LEFT JOIN raw_materials rm ON rm.id = poi.raw_material_id
            WHERE poi.po_id = :poId 
        ''')
        with db.engine.connect() as conn:
            po_items = conn.execute(items_sql, {'poId': poId}).mappings().all()
        
        # Combine into a final dictionary
        po_details = dict(po_header)
        po_details['items'] = [dict(item) for item in po_items]
        
        return po_details

    def updateItemReceivedQty(self, poItemId, receivedQty, adminUserId):
        # Get current item details
        sql = text('SELECT * FROM purchase_order_items WHERE id = :poItemId')
        with db.engine.connect() as conn:
            item = conn.execute(sql, {'poItemId': poItemId}).mappings().first()
            
        if not item:
            return {"errFlag": 1, "message": "PO item not found"}

        po_id=item["po_id"]
        
        ordered_qty = item['ordered_qty']
        received_qty = float(receivedQty)
        
        # Determine item status
        if received_qty <= 0 or received_qty is None:
            item_status = 'pending'
        elif received_qty >= ordered_qty:
            item_status = 'completed'
        else:
            item_status = 'partial'
        
        data = {
            'poItemId': poItemId,
            'receivedQty': received_qty,
            'itemStatus': item_status,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        sql = text('''
            UPDATE purchase_order_items 
            SET received_qty = :receivedQty, item_status = :itemStatus, updated_at = :updatedAt 
            WHERE id = :poItemId
        ''')
        
        with db.engine.connect() as conn:
            with conn.begin() as transaction:
                result = conn.execute(sql, data)
                transaction.commit()
        
        # Update PO completion percentage
        self.reconcile_po_status(po_id, adminUserId)
        return result.rowcount

    def reconcile_po_status(self, poId, adminUserId):
        """
        Calculate completion_percent for the given PO and update po_status according to rules.
        """
        sql = text('''
                SELECT
                    COALESCE(SUM(i.ordered_qty), 0) AS total_ordered,
                    COALESCE(SUM(i.received_qty), 0) AS total_received,
                    p.expected_dispatch_date
                FROM purchase_orders p
                LEFT JOIN purchase_order_items i ON i.po_id = p.id
                WHERE p.id = :poId
                GROUP BY p.id, p.expected_dispatch_date
            ''')

        with db.engine.connect() as conn:
            row = conn.execute(sql, {'poId': poId}).mappings().first()

        if not row:
            print(f"Warning: PO with ID {poId} not found during reconciliation.")
            return

        try:
            total_ordered = Decimal(row.get('total_ordered') or 0)
            total_received = Decimal(row.get('total_received') or 0)
        except (InvalidOperation, TypeError):
            total_ordered = Decimal(0)
            total_received = Decimal(0)

        expected_dispatch_date = row.get('expected_dispatch_date')

        if total_ordered > 0:
            completion_percent = float(round((total_received / total_ordered) * 100, 2))
            completion_percent = min(completion_percent, 100.0) # Clamp to 100 max
        else:
            completion_percent = 100.0 if total_received > 0 else 0.0

        if completion_percent >= 100:
            po_status = 'completed'
        elif completion_percent > 0:
            po_status = 'partial'
        else:
            po_status = 'pending'
        
        today = date.today()
        exp_date = None
        if isinstance(expected_dispatch_date, datetime):
            exp_date = expected_dispatch_date.date()
        elif isinstance(expected_dispatch_date, date):
            exp_date = expected_dispatch_date

        if exp_date and exp_date < today and po_status != 'completed':
            po_status = 'overdue'

        update_sql = text('''
            UPDATE purchase_orders
            SET
                completion_percent = :completionPercent,
                po_status = :poStatus,
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :poId
        ''')

        with db.engine.begin() as conn:
            conn.execute(update_sql, {
                'completionPercent': int(round(completion_percent)),
                'poStatus': po_status,
                'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'updatedAdminId': adminUserId,
                'poId': poId
            })

# Singleton instance
purchaseOrderObj = PurchaseOrderClass()