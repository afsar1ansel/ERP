# classes/VendorStockReceiptsClass.py
from db import db
from sqlalchemy.sql import text
from datetime import datetime
import cloudinary.uploader
from werkzeug.utils import secure_filename
from collections import defaultdict


class VendorStockReceiptsClass:

    def upload_supporting_doc(self, file):
        """Upload file to Cloudinary (images/docs) with basic validation (2MB)."""
        if not file or getattr(file, "filename", "") == "":
            return {"errFlag": 1, "message": "No file provided"}

        try:
            # size check
            file.seek(0, 2)
            size = file.tell()
            file.seek(0)
            if size > 2 * 1024 * 1024:
                file.seek(0)
                return {"errFlag": 1, "message": "File size must be less than 2MB"}
        except Exception:
            # fallback read
            try:
                if len(file.read()) > 2 * 1024 * 1024:
                    file.seek(0)
                    return {"errFlag": 1, "message": "File size must be less than 2MB"}
                file.seek(0)
            except:
                pass

        # allow common image/docs extensions (pdf, png, jpg, jpeg)
        allowed = {'png','jpg','jpeg','gif','bmp','webp','pdf'}
        filename = secure_filename(file.filename or "")
        if '.' not in filename or filename.rsplit('.',1)[1].lower() not in allowed:
            return {"errFlag": 1, "message": "Invalid file type. Allowed: PNG,JPG,JPEG,GIF,BMP,WEBP,PDF"}

        try:
            res = cloudinary.uploader.upload(
                file,
                folder="vendor_stock_receipts",
                resource_type="auto",
                transformation=[{'quality':'auto'}]
            )
            return {"errFlag": 0, "url": res.get("secure_url"), "public_id": res.get("public_id")}
        except Exception as e:
            print("Cloudinary upload error:", e)
            return {"errFlag": 1, "message": "Upload failed"}

    def delete_supporting_doc(self, public_id):
        try:
            r = cloudinary.uploader.destroy(public_id, resource_type="image")
            return r.get("result") == "ok"
        except Exception:
            return False

    def generate_grn_number(self):
        current_year = datetime.now().year
        sql = text("""
            SELECT grn_number FROM vendor_stock_receipts
            WHERE grn_number LIKE :pattern
            ORDER BY id DESC LIMIT 1
        """)
        with db.engine.connect() as conn:
            res = conn.execute(sql, {"pattern": f"GRN-{current_year}-%"}).mappings().all()
        if res:
            try:
                last = int(res[0]["grn_number"].split("-")[-1])
                new = last + 1
            except Exception:
                new = 1
        else:
            new = 1
        return f"GRN-{current_year}-{new:03d}"

    def _validate_vendor(self, vendorId):
        sql = text("SELECT id FROM vendors WHERE id = :vendorId AND status = 1")
        r = db.engine.connect().execute(sql, {'vendorId': vendorId}).fetchone()
        return r is not None

    def _validate_raw_material(self, rawMaterialId):
        sql = text("SELECT id, stock_qty, unit_price, total_value FROM raw_materials WHERE id = :rmId")
        r = db.engine.connect().execute(sql, {'rmId': rawMaterialId}).fetchone()
        return r

    def addReceipt(self, vendorId, grnNumber, poId, poNumber, invoiceNumber, invoiceDate, receivedDate,
               transportDetails, receivedByEmployeeId, notes,
               items_list, supporting_file, adminUserId):
        """
        items_list: list of dicts:
        [{raw_material_id, received_qty, unit_cost, batch_number, expiry_date, storage_location_id}, ...]
        supporting_file: FileStorage or None
        """

        # Basic validations
        if not vendorId:
            return {"errFlag": 1, "message": "Vendor is required"}
        if not self._validate_vendor(vendorId):
            return {"errFlag": 1, "message": "Vendor does not exist or inactive"}
        if not items_list or len(items_list) == 0:
            return {"errFlag": 1, "message": "At least one item is required"}

        # Handle file upload if provided
        doc_url = None
        doc_public_id = None
        if supporting_file and getattr(supporting_file, "filename", "") != "":
            up = self.upload_supporting_doc(supporting_file)
            if up.get("errFlag") == 1:
                return up
            doc_url = up.get("url")
            doc_public_id = up.get("public_id")

        # Insert header + items + update stock in a transaction
        try:
            with db.engine.connect() as conn:
                trans = conn.begin()

                # Insert into vendor_stock_receipts
                header_sql = text('''
                    INSERT INTO vendor_stock_receipts (
                        grn_number, vendor_id, po_id, po_number, invoice_number, invoice_date,
                        received_date, transport_details, received_by_employee_id,
                        notes, supporting_documents_img, supporing_img_public_id,
                        status, created_at, created_admin_id
                    ) VALUES (
                        :grnNumber, :vendorId, :poId, :poNumber, :invoiceNumber, :invoiceDate,
                        :receivedDate, :transportDetails, :receivedByEmployeeId,
                        :notes, :docUrl, :docPublicId,
                        :status, :createdAt, :createdAdminId
                    )
                ''')
                
                header_params = {
                    'grnNumber': grnNumber, 'vendorId': vendorId, 'poId': poId, 'poNumber': poNumber,
                    'invoiceNumber': invoiceNumber, 'invoiceDate': invoiceDate, 'receivedDate': receivedDate,
                    'transportDetails': transportDetails, 'receivedByEmployeeId': receivedByEmployeeId,
                    'notes': notes, 'docUrl': doc_url, 'docPublicId': doc_public_id, 'status': 1,
                    'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"), 'createdAdminId': adminUserId
                }
                resh = conn.execute(header_sql, header_params)
                receipt_id = resh.lastrowid

                # Items loop: Insert into vendor_stock_receipt_items and update raw_materials stock
                for it in items_list:
                    rm_id = int(it.get('raw_material_id') or 0)
                    rec_qty = float(it.get('received_qty') or 0)
                    unit_cost = float(it.get('unit_cost') or 0.0)
                    batch_no = it.get('batch_number')
                    expiry = it.get('expiry_date')

                    if rec_qty <= 0:
                        trans.rollback()
                        return {"errFlag": 1, "message": "received_qty must be > 0"}

                    rm_row = conn.execute(text('SELECT id FROM raw_materials WHERE id = :rmId'), {'rmId': rm_id}).mappings().first()
                    if not rm_row:
                        trans.rollback()
                        return {"errFlag": 1, "message": f"Raw material {rm_id} not found"}

                    total_cost = round(rec_qty * unit_cost, 2)

                    item_sql = text('''
                        INSERT INTO vendor_stock_receipt_items (
                            receipt_id, raw_material_id, received_qty, unit_cost, total_cost,
                            batch_number, expiry_date,  status, created_at, created_admin_id
                        ) VALUES (
                            :receiptId, :rmId, :recQty, :unitCost, :totalCost,
                            :batchNo, :expiry, :status, :createdAt, :createdAdminId
                        )
                    ''')
                    item_params = {
                        'receiptId': receipt_id, 'rmId': rm_id, 'recQty': rec_qty, 'unitCost': unit_cost,
                        'totalCost': total_cost, 'batchNo': batch_no, 'expiry': expiry, 'status': 1,
                        'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"), 'createdAdminId': adminUserId
                    }
                    conn.execute(item_sql, item_params)

                    update_rm_sql = text('''
                        UPDATE raw_materials
                        SET stock_qty = COALESCE(stock_qty,0) + :recQty,
                            total_value = COALESCE(total_value,0) + :totalCost,
                            last_restocked = :updatedAt, updated_at = :updatedAt,
                            updated_admin_id = :updatedAdminId
                        WHERE id = :rmId
                    ''')
                    conn.execute(update_rm_sql, {
                        'recQty': rec_qty, 'totalCost': total_cost,
                        'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        'updatedAdminId': adminUserId, 'rmId': rm_id
                    })
                
                # --- PURCHASE ORDER UPDATE LOGIC STARTS ---
                if poId and int(poId) > 0:
                    # Step 1: Update received_qty AND item_status for each item
                    for it in items_list:
                        rm_id = int(it.get('raw_material_id') or 0)
                        rec_qty = float(it.get('received_qty') or 0)
                        
                        if rm_id > 0 and rec_qty > 0:
                            update_po_item_sql = text("""
                                UPDATE purchase_order_items
                                SET 
                                    received_qty = COALESCE(received_qty, 0) + :recQty,
                                    item_status = CASE
                                        WHEN (COALESCE(received_qty, 0) + :recQty) >= ordered_qty THEN 'completed'
                                        WHEN (COALESCE(received_qty, 0) + :recQty) > 0 THEN 'partial'
                                        ELSE 'pending'
                                    END
                                WHERE po_id = :poId AND raw_material_id = :rmId
                            """)
                            conn.execute(update_po_item_sql, {'recQty': rec_qty, 'poId': poId, 'rmId': rm_id})

                    # Step 2 & 3: Recalculate completion percentage and determine new PO status
                    po_summary_sql = text("""
                        SELECT SUM(ordered_qty) AS total_ordered, SUM(received_qty) AS total_received
                        FROM purchase_order_items WHERE po_id = :poId
                    """)
                    po_summary = conn.execute(po_summary_sql, {'poId': poId}).mappings().first()
                    total_ordered = float(po_summary['total_ordered'] or 0)
                    total_received = float(po_summary['total_received'] or 0)
                    
                    completion_percent = 0
                    if total_ordered > 0:
                        completion_percent = round((total_received / total_ordered) * 100, 2)
                    
                    po_status = 'pending'
                    if completion_percent >= 100:
                        po_status = 'completed'
                        completion_percent = 100

                        # --- [NEW] VENDOR ON-TIME PERCENTAGE CALCULATION ---
                        vendor_stats_sql = text("""
                            SELECT
                                COUNT(id) AS total_completed_pos,
                                SUM(CASE WHEN actual_dispatch_date <= expected_dispatch_date THEN 1 ELSE 0 END) AS on_time_pos
                            FROM purchase_orders
                            WHERE
                                vendor_id = :vendorId
                                AND po_status = 'completed'
                                AND actual_dispatch_date IS NOT NULL
                        """)
                        vendor_stats = conn.execute(vendor_stats_sql, {'vendorId': vendorId}).mappings().first()

                        total_completed = vendor_stats['total_completed_pos'] or 0
                        on_time_completed = vendor_stats['on_time_pos'] or 0
                        
                        on_time_percentage = 0
                        if total_completed > 0:
                            # We add 1 to each count to include the current PO which is just now being completed
                            on_time_percentage = round(((on_time_completed + 1) / (total_completed + 1)) * 100, 2)
                        else:
                            # If this is the first ever completed order for the vendor
                            on_time_percentage = 100.0

                        update_vendor_sql = text("""
                            UPDATE vendors
                            SET on_time_percentage = :onTimePercentage,
                                updated_at = :updatedAt,
                                updated_admin_id = :updatedAdminId
                            WHERE id = :vendorId
                        """)
                        conn.execute(update_vendor_sql, {
                            'onTimePercentage': on_time_percentage,
                            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                            'updatedAdminId': adminUserId,
                            'vendorId': vendorId
                        })
                        # --- VENDOR ON-TIME LOGIC ENDS ---

                    elif completion_percent > 0:
                        po_status = 'partial'

                    # Step 4: Update the main purchase_orders table
                    update_po_sql = text("""
                        UPDATE purchase_orders
                        SET completion_percent = :completionPercent,
                            po_status = :poStatus,
                            actual_dispatch_date = CASE WHEN :poStatus = 'completed' THEN :dispatchDate ELSE actual_dispatch_date END,
                            updated_at = :updatedAt,
                            updated_admin_id = :updatedAdminId
                        WHERE id = :poId
                    """)
                    conn.execute(update_po_sql, {
                        'completionPercent': completion_percent, 'poStatus': po_status,
                        'dispatchDate': datetime.now().strftime("%Y-%m-%d"),
                        'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        'updatedAdminId': adminUserId, 'poId': poId
                    })
                # --- PURCHASE ORDER UPDATE LOGIC ENDS ---

                trans.commit()
                return receipt_id
        except Exception as e:
            print("Error in addReceipt:", e)
            try:
                trans.rollback()
            except:
                pass
            return {"errFlag": 1, "message": "Error while adding receipt"}


    def getReceiptDetails(self, receiptId):
        # header
        sqlh = text('''
            SELECT r.*, v.vendor_name, v.contact_person, v.phone, v.email
            FROM vendor_stock_receipts r
            LEFT JOIN vendors v ON r.vendor_id = v.id
            WHERE r.id = :receiptId
        ''')
        items_sql = text('''
            SELECT i.*, rm.material_name, rm.material_code
            FROM vendor_stock_receipt_items i
            LEFT JOIN raw_materials rm ON i.raw_material_id = rm.id
            WHERE i.receipt_id = :receiptId
            ORDER BY i.id
        ''')
        with db.engine.connect() as conn:
            header = conn.execute(sqlh, {'receiptId': receiptId}).mappings().all()
            if not header:
                return None
            items = conn.execute(items_sql, {'receiptId': receiptId}).mappings().all()
        return {'header': dict(header[0]), 'items': [dict(x) for x in items]}

    def changeReceiptStatus(self, receiptId, status, adminUserId):
        # status values: 1 active, 0 cancelled
        sql = text('''
            UPDATE vendor_stock_receipts
            SET status = :status, updated_at = :updatedAt, updated_admin_id = :updatedAdminId
            WHERE id = :receiptId
        ''')
        with db.engine.connect() as conn:
            res = conn.execute(sql, {
                'status': status,
                'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'updatedAdminId': adminUserId,
                'receiptId': receiptId
            })
            conn.commit()
        return res.rowcount

    def _get_items_for_receipt(self, conn, receiptId):
        q = text('SELECT * FROM vendor_stock_receipt_items WHERE receipt_id = :receiptId AND status = 1')
        return conn.execute(q, {'receiptId': receiptId}).mappings().all()

    def updateReceipt(self, receiptId, grnNumber, vendorId, invoiceNumber, invoiceDate, receivedDate,
                      transportDetails, receivedByEmployeeId, notes, items_list,
                      supporting_file, adminUserId):
        """
        Update receipt header + replace items.
        Strategy:
         - load existing items and subtract their qty from raw_materials (reverse)
         - delete (or mark status=0) previous items
         - insert new items and apply stock increment
        """
        try:
            with db.engine.connect() as conn:
                trans = conn.begin()

                # validate receipt exists
                hdr = conn.execute(text('SELECT * FROM vendor_stock_receipts WHERE id = :rid'), {'rid': receiptId}).mappings().first()
                if not hdr:
                    trans.rollback()
                    return {"errFlag": 1, "message": "Receipt not found"}

                # reverse existing items' effect on raw_materials
                existing_items = self._get_items_for_receipt(conn, receiptId)
                for ex in existing_items:
                    rm_id = ex['raw_material_id']
                    qty = float(ex['received_qty'] or 0)
                    total_cost = float(ex['total_cost'] or 0)
                    # subtract
                    conn.execute(text('''
                        UPDATE raw_materials
                        SET stock_qty = COALESCE(stock_qty,0) - :qty,
                            total_value = COALESCE(total_value,0) - :total_cost,
                            updated_at = :updatedAt,
                            updated_admin_id = :updatedAdminId
                        WHERE id = :rmId
                    '''), {
                        'qty': qty,
                        'total_cost': total_cost,
                        'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        'updatedAdminId': adminUserId,
                        'rmId': rm_id
                    })
                # mark previous items inactive (status = 0)
                conn.execute(text('UPDATE vendor_stock_receipt_items SET status = 0, updated_at = :updatedAt, updated_admin_id = :updatedAdminId WHERE receipt_id = :receiptId'), {
                    'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    'updatedAdminId': adminUserId,
                    'receiptId': receiptId
                })

                # handle supporting file replacement if present (delete old)
                old_public_id = hdr.get('supporing_img_public_id')
                doc_url = hdr.get('supporting_documents_img')
                new_doc_url = doc_url
                new_pub_id = old_public_id
                if supporting_file and getattr(supporting_file, "filename", "") != "":
                    up = self.upload_supporting_doc(supporting_file)
                    if up.get("errFlag") == 1:
                        trans.rollback()
                        return up
                    new_doc_url = up.get('url')
                    new_pub_id = up.get('public_id')
                    # delete old if exists
                    if old_public_id:
                        try:
                            self.delete_supporting_doc(old_public_id)
                        except:
                            pass

                # update header
                upd_hdr_sql = text('''
                    UPDATE vendor_stock_receipts
                    SET vendor_id = :vendorId,
                        invoice_number = :invoiceNumber,
                        invoice_date = :invoiceDate,
                        received_date = :receivedDate,
                        transport_details = :transportDetails,
                        received_by_employee_id = :receivedByEmployeeId,
                        notes = :notes,
                        supporting_documents_img = :docUrl,
                        supporing_img_public_id = :docPublicId,
                        updated_at = :updatedAt,
                        updated_admin_id = :updatedAdminId
                    WHERE id = :receiptId
                ''')
                conn.execute(upd_hdr_sql, {
                    'vendorId': vendorId,
                    'grnNumber': grnNumber,
                    'invoiceNumber': invoiceNumber,
                    'invoiceDate': invoiceDate,
                    'receivedDate': receivedDate,
                    'transportDetails': transportDetails,
                    'receivedByEmployeeId': receivedByEmployeeId,
                    'notes': notes,
                    'docUrl': new_doc_url,
                    'docPublicId': new_pub_id,
                    'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    'updatedAdminId': adminUserId,
                    'receiptId': receiptId
                })

                # insert new items and apply stock increments
                for it in items_list:
                    rm_id = int(it.get('raw_material_id') or 0)
                    rec_qty = float(it.get('received_qty') or 0)
                    unit_cost = float(it.get('unit_cost') or 0.0)
                    batch_no = it.get('batch_number')
                    expiry = it.get('expiry_date')

                    if rec_qty <= 0:
                        trans.rollback()
                        return {"errFlag": 1, "message": "received_qty must be > 0"}

                    rm_row = conn.execute(text('SELECT id FROM raw_materials WHERE id = :rmId'), {'rmId': rm_id}).mappings().first()
                    if not rm_row:
                        trans.rollback()
                        return {"errFlag": 1, "message": f"Raw material {rm_id} not found"}

                    total_cost = round(rec_qty * unit_cost, 2)

                    conn.execute(text('''
                        INSERT INTO vendor_stock_receipt_items (
                            receipt_id, raw_material_id, received_qty, unit_cost, total_cost,
                            batch_number, expiry_date,  status,
                            created_at, created_admin_id
                        ) VALUES (
                            :receiptId, :rmId, :recQty, :unitCost, :totalCost,
                            :batchNo, :expiry,  :status,
                            :createdAt, :createdAdminId
                        )
                    '''), {
                        'receiptId': receiptId,
                        'rmId': rm_id,
                        'recQty': rec_qty,
                        'unitCost': unit_cost,
                        'totalCost': total_cost,
                        'batchNo': batch_no,
                        'expiry': expiry,
                        'status': 1,
                        'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        'createdAdminId': adminUserId
                    })

                    conn.execute(text('''
                        UPDATE raw_materials
                        SET stock_qty = COALESCE(stock_qty,0) + :recQty,
                            total_value = COALESCE(total_value,0) + :totalCost,
                            updated_at = :updatedAt,
                            updated_admin_id = :updatedAdminId
                        WHERE id = :rmId
                    '''), {
                        'recQty': rec_qty,
                        'totalCost': total_cost,
                        'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        'updatedAdminId': adminUserId,
                        'rmId': rm_id
                    })

                trans.commit()
            return 1
        except Exception as e:
            print("Error in updateReceipt:", e)
            try:
                trans.rollback()
            except:
                pass
            return {"errFlag": 1, "message": "Error while updating receipt"}
    
    def getAllVendorReceipts(self):
        """
        Returns list of vendor_stock_receipts where each header contains an `items` array.
        Efficient: fetch headers, collect ids, fetch all items in one query, then group.
        """
        # 1) get headers
        sql_headers = text('''
            SELECT vsr.*, v.vendor_name
            FROM vendor_stock_receipts vsr
            LEFT JOIN vendors v ON vsr.vendor_id = v.id
            WHERE vsr.status = 1
            ORDER BY vsr.created_at DESC
        ''')
        with db.engine.connect() as conn:
            headers = conn.execute(sql_headers).mappings().all()

        if not headers:
            return []

        # 2) collect receipt ids
        receipt_ids = [h['id'] for h in headers if h.get('id')]

        # 3) fetch items in one query (safe param expansion)
        # build dynamic placeholders like :id0,:id1...
        placeholders = ','.join([f":id{i}" for i in range(len(receipt_ids))])
        params = {f"id{i}": receipt_ids[i] for i in range(len(receipt_ids))}

        items_sql = text(f'''
            SELECT vsi.*, rm.material_name, rm.material_code, rm.unit_of_measure
            FROM vendor_stock_receipt_items vsi
            LEFT JOIN raw_materials rm ON vsi.raw_material_id = rm.id
            WHERE vsi.receipt_id IN ({placeholders})
            ORDER BY vsi.receipt_id, vsi.id
        ''')
        with db.engine.connect() as conn:
            items = conn.execute(items_sql, params).mappings().all()

        # 4) group items by receipt_id
        items_by_receipt = defaultdict(list)
        for it in items:
            items_by_receipt[it['receipt_id']].append(dict(it))

        # 5) attach items to headers and return list
        result = []
        for h in headers:
            hd = dict(h)
            hd['items'] = items_by_receipt.get(hd['id'], [])
            result.append(hd)

        return result
            

# singleton
vendorStockReceiptsObj = VendorStockReceiptsClass()
