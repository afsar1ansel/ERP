from db import db
from sqlalchemy.sql import text
from datetime import datetime
from collections import OrderedDict

class ProductionBatchClass:

    def generate_production_code(self):
        """Generate unique production code like PRD-YYYY-XXX (resets each year)."""
        current_year = datetime.now().year
        sql = text("""
            SELECT production_code
            FROM production_batch
            WHERE production_code LIKE :pattern
            ORDER BY id DESC
            LIMIT 1
        """)
        try:
            with db.engine.connect() as conn:
                res = conn.execute(sql, {"pattern": f"PRD-{current_year}-%"}).mappings().all()
            if res:
                last_code = res[0]["production_code"]  # PRD-2024-012
                try:
                    last_seq = int(last_code.split("-")[-1])
                    new_seq = last_seq + 1
                except Exception:
                    new_seq = 1
            else:
                new_seq = 1
            return f"PRD-{current_year}-{new_seq:03d}"
        except Exception as e:
            print("Error generating production code:", e)
            return f"PRD-{current_year}-{datetime.now().strftime('%H%M%S')}"

    
    def addProductionBatch(self, productId, quantity, clientId, floor, expectedCompletionDate,
                           productionHeadEmployeeId, productionNotes, stages, adminUserId,
                           rawMaterialsList=None,orderId=None, priority=0):
        """
        Insert a new production_batch row. Returns new id or error dict.
        - If productId is provided: Deduct raw materials based on BOM.
        - If productId is NULL and rawMaterialsList is provided: Deduct raw materials based on the manual list.
        """
        
        if productId:
            sql_chk = text('SELECT id FROM products_sku WHERE id = :productId AND status = 1')
            with db.engine.connect() as conn:
                exists = conn.execute(sql_chk, {'productId': productId}).mappings().first()
            if not exists:
                return {"errFlag": 1, "message": "Product not found"}
        elif not rawMaterialsList:
             return {"errFlag": 1, "message": "Product ID is required if no manual raw materials are specified."}

        production_code = self.generate_production_code()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        try:
            with db.engine.connect() as conn:
                trans = conn.begin()

                insert_sql = text('''
                    INSERT INTO production_batch
                    (production_code,order_id, product_id, planned_qty, completed_qty, floor, client_id, expected_completion_date,
                     production_head_employee_id, production_notes, batch_status, priority,
                     created_at, updated_at, created_admin_id)
                    VALUES
                    (:productionCode, :orderId, :productId, :plannedQuantity, :completedQuantity, :floor, :clientId, :expectedCompletionDate,
                     :productionHeadEmployeeId, :productionNotes, :batchStatus, :priority,
                     :createdAt, :updatedAt, :createdAdminId)
                ''')

                params = {
                    'productionCode': production_code,
                    'orderId': int(orderId) if orderId not in (None, "", "null") else None,
                    'productId': int(productId) if productId not in (None, "", "null") else None,
                    'plannedQuantity': float(quantity),
                    'completedQuantity': 0.0,
                    'floor': floor,
                    'clientId': int(clientId) if clientId not in (None, "", "null") else None,
                    'expectedCompletionDate': expectedCompletionDate,
                    'productionHeadEmployeeId': int(productionHeadEmployeeId) if productionHeadEmployeeId not in (None, "", "null") else None,
                    'productionNotes': productionNotes,
                    'batchStatus': 'scheduled',
                    'priority': int(priority) if priority not in (None, "", "null") else 0,
                    'createdAt': now,
                    'updatedAt': now,
                    'createdAdminId': adminUserId
                }
                res = conn.execute(insert_sql, params)
                batch_id = res.lastrowid

                # Insert stages and handle assigned employees
                if stages and isinstance(stages, (list, tuple)) and len(stages) > 0:
                    all_manual_emp_ids = set()
                    for s in stages:
                        try:
                            if isinstance(s, dict):
                                stage_id = int(s.get("stageId"))
                                weightage = float(s.get("weightage", 0))
                                manual_emp_ids = s.get("employeeIds", [])
                            else:
                                stage_id = int(s)
                                weightage = 0.0
                                manual_emp_ids = []
                        except Exception:
                            continue

                        pbs_sql = text('''
                            INSERT INTO production_batch_stages
                            (batch_id, stage_id, stage_status, weightage, end_at, notes, created_at, updated_at, created_admin_id)
                            VALUES (:batchId, :stageId, 'pending', :weightage, NULL, NULL, :createdAt, :updatedAt, :createdAdminId)
                        ''')
                        pbs_res = conn.execute(pbs_sql, {
                            'batchId': batch_id,
                            'stageId': stage_id,
                            'weightage': weightage,
                            'createdAt': now,
                            'updatedAt': now,
                            'createdAdminId': adminUserId
                        })
                        batch_stage_id = pbs_res.lastrowid

                        # Handle individual employee assignments if provided
                        if manual_emp_ids and isinstance(manual_emp_ids, list):
                            for emp_id in manual_emp_ids:
                                try:
                                    emp_id = int(emp_id)
                                    all_manual_emp_ids.add(emp_id)
                                    pbse_sql = text('''
                                        INSERT INTO production_batch_stage_employees
                                        (batch_stage_id, employee_id, created_at, created_admin_id)
                                        VALUES (:batchStageId, :employeeId, :createdAt, :createdAdminId)
                                    ''')
                                    conn.execute(pbse_sql, {
                                        'batchStageId': batch_stage_id,
                                        'employeeId': emp_id,
                                        'createdAt': now,
                                        'createdAdminId': adminUserId
                                    })
                                except Exception as e:
                                    print(f"Warning: failed to add batch stage employee {emp_id}: {e}")
                        else:
                            # Fallback: Auto-assign all employees from global mapping if no manual IDs provided
                            fetch_sql = text('''
                                SELECT stage_employee_id
                                FROM production_stage_employees
                                WHERE production_stage_id = :stage_id
                            ''')
                            fetched = conn.execute(fetch_sql, {'stage_id': stage_id}).mappings().all()
                            for row in fetched:
                                try:
                                    emp_id = int(row['stage_employee_id'])
                                    all_manual_emp_ids.add(emp_id)
                                    pbse_sql = text('''
                                        INSERT INTO production_batch_stage_employees
                                        (batch_stage_id, employee_id, created_at, created_admin_id)
                                        VALUES (:batchStageId, :employeeId, :createdAt, :createdAdminId)
                                    ''')
                                    conn.execute(pbse_sql, {
                                        'batchStageId': batch_stage_id,
                                        'employeeId': emp_id,
                                        'createdAt': now,
                                        'createdAdminId': adminUserId
                                    })
                                except Exception:
                                    continue

                    # Assign all involved employees to employee_jobs for this batch
                    for emp_id in all_manual_emp_ids:
                        try:
                            ej_ins = text('''
                                INSERT INTO employee_jobs
                                (employee_id, job_code,  status, created_at, updated_at, created_admin_id)
                                VALUES (:employeeId, :jobCode, 1, :createdAt, :updatedAt, :createdAdminId)
                            ''')
                            conn.execute(ej_ins, {
                                'employeeId': emp_id,
                                'jobCode': production_code,
                                'createdAt': now,
                                'updatedAt': now,
                                'createdAdminId': adminUserId
                            })
                        except Exception as e:
                            if 'Duplicate entry' not in str(e):
                                print("Warning: failed to add employee job for emp", emp_id, ":", e)

                # Assign production head job separately
                try:
                    if productionHeadEmployeeId not in (None, "", "null"):
                        ej_sql = text('''
                            INSERT IGNORE INTO employee_jobs
                            (employee_id, job_code, status, created_at, updated_at, created_admin_id)
                            VALUES (:employeeId, :jobCode, 1, :createdAt, :updatedAt, :createdAdminId)
                        ''')
                        conn.execute(ej_sql, {
                            'employeeId': int(productionHeadEmployeeId),
                            'jobCode': production_code,
                            'createdAt': now,
                            'updatedAt': now,
                            'createdAdminId': adminUserId
                        })
                except Exception as e:
                    print("Warning: failed to add production head job:", e)

                # --- RAW MATERIAL DEDUCTION & LOGGING ---
                
                # CASE 1: Product ID was provided, use BOM
                if productId:
                    try:
                        self._deduct_materials_for_product(conn, batch_id, productId, quantity, production_code, adminUserId, now)
                    except Exception as e:
                        trans.rollback()
                        return {"errFlag": 1, "message": str(e)}
                
                # CASE 2: NO Product ID, but manual list was provided
                elif rawMaterialsList and isinstance(rawMaterialsList, list) and len(rawMaterialsList) > 0:
                    try:
                        self._deduct_manual_materials(conn, batch_id, rawMaterialsList, production_code, adminUserId, now)
                    except Exception as e:
                        trans.rollback()
                        return {"errFlag": 1, "message": str(e)}

                trans.commit()
            return batch_id
        except Exception as e:
            if 'trans' in locals():
                trans.rollback()
            print(f"DEBUG: Error in addProductionBatch: {e}")
            return {"errFlag": 1, "message": f"Error while creating production batch: {e}"}

    # --- HELPER METHODS FOR MATERIAL HANDLING ---

    def _return_all_materials(self, conn, batchId, production_code, adminUserId, timestamp):
        """
        Finds all positive consumptions for a batch and returns them to stock.
        Logs a negative consumption receipt for each.
        This runs inside a transaction.
        """
        return_sql = text('''
            SELECT id, raw_material_id, consumed_qty, unit, unit_cost
            FROM raw_material_consumption_receipt
            WHERE production_batch_id = :batchId AND consumed_qty > 0 
        ''')
        old_consumptions = conn.execute(return_sql, {'batchId': batchId}).mappings().all()
        
        for item in old_consumptions:
            try:
                return_qty = float(item['consumed_qty'])
                rm_id = int(item['raw_material_id'])
                
                ret_upd_sql = text('''
                    UPDATE raw_materials
                    SET stock_qty = stock_qty + :qty,
                        total_value = CASE WHEN unit_cost IS NOT NULL THEN (stock_qty + :qty) * unit_cost ELSE total_value END,
                        stock_status = CASE
                            WHEN (stock_qty + :qty) > min_stock_level THEN 'in-stock'
                            WHEN (stock_qty + :qty) > 0 THEN 'low-stock'
                            ELSE stock_status
                        END,
                        updated_at = :updatedAt,
                        updated_admin_id = :updatedAdminId
                    WHERE id = :rmId
                ''')
                conn.execute(ret_upd_sql, {
                    'qty': return_qty,
                    'updatedAt': timestamp,
                    'updatedAdminId': adminUserId,
                    'rmId': rm_id
                })
                
                total_cost_return = None
                if item.get('unit_cost') is not None:
                    total_cost_return = float(item['unit_cost']) * return_qty

                ret_log_sql = text('''
                    INSERT INTO raw_material_consumption_receipt
                    (production_batch_id, raw_material_id, consumed_qty, unit, unit_cost, total_cost, notes, created_at, created_admin_id, status)
                    VALUES (:batchId, :rmId, :consumedQty, :unit, :unitCost, :totalCost, :notes, :createdAt, :createdAdminId, 1)
                ''')
                conn.execute(ret_log_sql, {
                    'batchId': batchId,
                    'rmId': rm_id,
                    'consumedQty': -return_qty, # Negative value
                    'unit': item.get('unit'),
                    'unitCost': item.get('unit_cost'),
                    'totalCost': total_cost_return, 
                    'notes': f'Returned to stock due to batch update on {production_code}',
                    'createdAt': timestamp,
                    'createdAdminId': adminUserId
                })
            except Exception as e:
                print(f"Error returning material {item.get('raw_material_id')} for batch {batchId}: {e}")
                raise Exception("Error returning old raw materials")

    def _deduct_materials_for_product(self, conn, batchId, productId, quantity, production_code, adminUserId, timestamp):
        """
        Deducts materials based on a product's BOM and quantity.
        Raises an Exception on failure (e.g., insufficient stock).
        """
        try:
            bom_sql = text('''
                SELECT prmc.id, prmc.raw_material_id, prmc.quantity, prmc.unit,
                    rm.unit_of_measure AS rm_unit, rm.stock_qty AS rm_stock_qty, rm.unit_cost AS rm_unit_cost, rm.material_code AS rm_material_code, rm.material_name AS rm_material_name
                FROM product_raw_material_consumption prmc
                LEFT JOIN raw_materials rm ON prmc.raw_material_id = rm.id
                WHERE prmc.product_sku_id = :productId AND prmc.status = 1
            ''')
            bom_rows = conn.execute(bom_sql, {'productId': productId}).mappings().all()
        except Exception as e:
            bom_rows = []
            print("Warning: failed to fetch BOM for product", productId, ":", e)

        if not bom_rows:
            return # No BOM for this product, nothing to deduct

        insufficient = []
        required_changes = [] 
        for b in bom_rows:
            try:
                rm_id = int(b['raw_material_id'])
                per_unit_qty = float(b['quantity'])
            except Exception:
                continue
            required_qty = per_unit_qty * float(quantity)
            rm_stock_qty = float(b['rm_stock_qty']) if b.get('rm_stock_qty') not in (None, '') else 0.0
            rm_unit_cost = float(b['rm_unit_cost']) if b.get('rm_unit_cost') not in (None, '') else None
            required_changes.append({
                'raw_material_id': rm_id,
                'required_qty': required_qty,
                'unit': b.get('unit') or b.get('rm_unit') or None,
                'unit_cost': rm_unit_cost,
                'current_stock': rm_stock_qty
            })
            if required_qty > rm_stock_qty:
                insufficient.append({
                    'raw_material_code': b.get('rm_material_code') or str(rm_id),
                    'raw_material_name': b.get('rm_material_name') or "",
                    'required_qty': required_qty,
                    'available_qty': rm_stock_qty
                })

        if len(insufficient) > 0:
            msg_parts = []
            for it in insufficient:
                name_str = f" ({it['raw_material_name']})" if it.get('raw_material_name') else ""
                msg_parts.append(f"Raw material {it['raw_material_code']}{name_str} needs {it['required_qty']}, available {it['available_qty']}")
            msg = "Insufficient raw materials for product: " + "; ".join(msg_parts)
            raise Exception(msg)

        for ch in required_changes:
            try:
                upd_sql = text('''
                    UPDATE raw_materials
                    SET stock_qty = stock_qty - :qty,
                        total_value = CASE WHEN unit_cost IS NOT NULL THEN (stock_qty - :qty) * unit_cost ELSE total_value END,
                        stock_status = CASE
                            WHEN (stock_qty - :qty) <= 0 THEN 'out-of-stock'
                            WHEN (stock_qty - :qty) < min_stock_level THEN 'low-stock'
                            ELSE 'in-stock'
                        END,
                        updated_at = :updatedAt,
                        updated_admin_id = :updatedAdminId
                    WHERE id = :rmId
                ''')
                conn.execute(upd_sql, {
                    'qty': ch['required_qty'],
                    'updatedAt': timestamp,
                    'updatedAdminId': adminUserId,
                    'rmId': ch['raw_material_id']
                })

                total_cost = None
                if ch.get('unit_cost') not in (None, ''):
                    total_cost = float(ch['unit_cost']) * float(ch['required_qty'])

                ins_log_sql = text('''
                    INSERT INTO raw_material_consumption_receipt
                    (production_batch_id, raw_material_id, consumed_qty, unit, unit_cost, total_cost, notes, created_at, created_admin_id, status)
                    VALUES (:batchId, :rmId, :consumedQty, :unit, :unitCost, :totalCost, :notes, :createdAt, :createdAdminId, 1)
                ''')
                conn.execute(ins_log_sql, {
                    'batchId': batchId,
                    'rmId': ch['raw_material_id'],
                    'consumedQty': ch['required_qty'],
                    'unit': ch.get('unit'),
                    'unitCost': ch.get('unit_cost'),
                    'totalCost': total_cost,
                    'notes': f'Consumed for production {production_code}',
                    'createdAt': timestamp,
                    'createdAdminId': adminUserId
                })
            except Exception as e:
                print("Error while deducting/logging raw material", ch.get('raw_material_id'), ":", e)
                raise Exception("Error while deducting raw materials")

    def _deduct_manual_materials(self, conn, batchId, rawMaterialsList, production_code, adminUserId, timestamp):
        """
        Deducts materials based on a manual list.
        Raises an Exception on failure (e.g., insufficient stock).
        """
        if not rawMaterialsList:
            return # Nothing to deduct

        insufficient = []
        required_changes = []

        rm_ids = [item.get('raw_material_id') for item in rawMaterialsList if item.get('raw_material_id')]
        if not rm_ids:
            raise Exception("Manual raw materials list is invalid or empty.")

        rm_ids_tuple = tuple(set(rm_ids))
        stock_sql = text('''
            SELECT id, stock_qty, unit_cost, unit_of_measure, material_code, material_name
            FROM raw_materials
            WHERE id IN :rm_ids
        ''')
        stock_rows = conn.execute(stock_sql, {'rm_ids': rm_ids_tuple}).mappings().all()
        stock_map = {r['id']: r for r in stock_rows}

        for item in rawMaterialsList:
            try:
                rm_id = int(item['raw_material_id'])
                required_qty = float(item['quantity'])
                unit = item.get('unit')
            except Exception:
                print(f"Skipping invalid manual raw material item: {item}")
                continue 

            if rm_id not in stock_map:
                insufficient.append({'raw_material_id': rm_id, 'message': 'does not exist'})
                continue
            
            stock_data = stock_map[rm_id]
            rm_stock_qty = float(stock_data.get('stock_qty') or 0.0)
            rm_unit_cost = float(stock_data.get('unit_cost')) if stock_data.get('unit_cost') not in (None, '') else None

            required_changes.append({
                'raw_material_id': rm_id,
                'required_qty': required_qty,
                'unit': unit or stock_data.get('unit_of_measure') or None,
                'unit_cost': rm_unit_cost,
                'current_stock': rm_stock_qty
            })

            if required_qty > rm_stock_qty:
                insufficient.append({
                    'raw_material_id': rm_id,
                    'raw_material_code': stock_data.get('material_code') or str(rm_id),
                    'raw_material_name': stock_data.get('material_name') or "",
                    'required_qty': required_qty,
                    'available_qty': rm_stock_qty
                })
        
        if len(insufficient) > 0:
            msg_parts = []
            for it in insufficient:
                name_str = f" ({it['raw_material_name']})" if it.get('raw_material_name') else ""
                code_str = it.get('raw_material_code', it.get('raw_material_id'))
                if 'message' in it:
                    msg_parts.append(f"Raw material {code_str}{name_str} {it['message']}")
                else:
                    msg_parts.append(f"Raw material {code_str}{name_str} needs {it['required_qty']}, available {it['available_qty']}")
            msg = "Insufficient manual raw materials: " + "; ".join(msg_parts)
            raise Exception(msg)

        for ch in required_changes:
            try:
                upd_sql = text('''
                    UPDATE raw_materials
                    SET stock_qty = stock_qty - :qty,
                        total_value = CASE WHEN unit_cost IS NOT NULL THEN (stock_qty - :qty) * unit_cost ELSE total_value END,
                        stock_status = CASE
                            WHEN (stock_qty - :qty) <= 0 THEN 'out-of-stock'
                            WHEN (stock_qty - :qty) < min_stock_level THEN 'low-stock'
                            ELSE 'in-stock'
                        END,
                        updated_at = :updatedAt,
                        updated_admin_id = :updatedAdminId
                    WHERE id = :rmId
                ''')
                conn.execute(upd_sql, {
                    'qty': ch['required_qty'],
                    'updatedAt': timestamp,
                    'updatedAdminId': adminUserId,
                    'rmId': ch['raw_material_id']
                })

                total_cost = None
                if ch.get('unit_cost') not in (None, ''):
                    total_cost = float(ch['unit_cost']) * float(ch['required_qty'])

                ins_log_sql = text('''
                    INSERT INTO raw_material_consumption_receipt
                    (production_batch_id, raw_material_id, consumed_qty, unit, unit_cost, total_cost, notes, created_at, created_admin_id, status)
                    VALUES (:batchId, :rmId, :consumedQty, :unit, :unitCost, :totalCost, :notes, :createdAt, :createdAdminId, 1)
                ''')
                conn.execute(ins_log_sql, {
                    'batchId': batchId,
                    'rmId': ch['raw_material_id'],
                    'consumedQty': ch['required_qty'],
                    'unit': ch.get('unit'),
                    'unitCost': ch.get('unit_cost'),
                    'totalCost': total_cost,
                    'notes': f'Manually consumed for production {production_code}',
                    'createdAt': timestamp,
                    'createdAdminId': adminUserId
                })
            except Exception as e:
                print("Error while deducting/logging manual raw material", ch.get('raw_material_id'), ":", e)
                raise Exception("Error while deducting manual raw materials")

    # --- END HELPER METHODS ---

    def updateProductionBatch(self, batchId, productId=None, quantity=None, clientId=None,floor=None,
                              expectedCompletionDate=None, productionHeadEmployeeId=None,
                              productionNotes=None, batchStatus=None, stages=None, adminUserId=None,
                              rawMaterialsList=None, orderId=None, priority=None):
        
        sql_chk = text('SELECT id, production_code, planned_qty, product_id FROM production_batch WHERE id = :batchId')
        with db.engine.connect() as conn:
            exists = conn.execute(sql_chk, {'batchId': batchId}).mappings().first()
        if not exists:
            return {"errFlag": 1, "message": "Production batch not found"}

        production_code = exists.get('production_code')
        old_planned_qty = float(exists.get('planned_qty') or 0.0)
        old_product_id = exists.get('product_id') 

        data = {
            'batchId': int(batchId),
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }
        set_parts = []
        
        manual_materials_passed = (rawMaterialsList is not None)
        product_param_passed = (productId is not None)
        product_will_change = False
        new_product_id = old_product_id

        quantity_param_passed = (quantity is not None and str(quantity) != '')
        quantity_will_change = False
        new_planned_qty = old_planned_qty

        if manual_materials_passed:
            product_will_change = True # Material source is changing
            new_product_id = None
            data['productId'] = None
            set_parts.append("product_id = :productId")
        
        elif product_param_passed:
            try:
                parsed_product_id = int(productId) if productId not in (None, "", "null") else None
            except Exception:
                 return {"errFlag": 1, "message": "Invalid productId format"}
            
            if parsed_product_id != old_product_id:
                product_will_change = True
                new_product_id = parsed_product_id
            
            data['productId'] = parsed_product_id
            set_parts.append("product_id = :productId")

        if quantity_param_passed:
            try:
                parsed_quantity = float(quantity)
                if parsed_quantity != old_planned_qty:
                    quantity_will_change = True
                    new_planned_qty = parsed_quantity
                data['plannedQty'] = parsed_quantity
                set_parts.append("planned_qty = :plannedQty")
            except Exception:
                return {"errFlag": 1, "message": "Invalid quantity"}
        if orderId is not None:
            data['orderId'] = int(orderId) if orderId not in (None, "", "null") else None
            set_parts.append("order_id = :orderId")
        if clientId is not None:
            data['clientId'] = int(clientId) if clientId not in (None, "", "null") else None
            set_parts.append("client_id = :clientId")
        if floor is not None:
            data['floor'] = floor
            set_parts.append("floor = :floor")
        if expectedCompletionDate is not None:
            data['expectedCompletionDate'] = expectedCompletionDate
            set_parts.append("expected_completion_date = :expectedCompletionDate")
        if productionHeadEmployeeId is not None:
            data['productionHeadEmployeeId'] = int(productionHeadEmployeeId) if productionHeadEmployeeId not in (None, "", "null") else None
            set_parts.append("production_head_employee_id = :productionHeadEmployeeId")
        if productionNotes is not None:
            data['productionNotes'] = productionNotes
            set_parts.append("production_notes = :productionNotes")
        if batchStatus is not None:
            data['batchStatus'] = batchStatus
            set_parts.append("batch_status = :batchStatus")
        if priority is not None:
            data['priority'] = int(priority) if priority not in (None, "", "null") else 0
            set_parts.append("priority = :priority")

        if not set_parts and stages is None and not manual_materials_passed:
            return 1 

        set_parts.append("updated_at = :updatedAt")
        set_parts.append("updated_admin_id = :updatedAdminId")

        update_sql = 'UPDATE production_batch SET \n'
        update_sql += ",\n".join(set_parts)
        update_sql += "\n WHERE id = :batchId"

        try:
            with db.engine.connect() as conn:
                trans = conn.begin()

                result = conn.execute(text(update_sql), data)

                # --- HANDLE RAW MATERIAL CHANGES ---
                
                # CASE 1: Manual materials list was provided (overrides everything)
                if manual_materials_passed:
                    self._return_all_materials(conn, batchId, production_code, adminUserId, data['updatedAt'])
                    self._deduct_manual_materials(conn, batchId, rawMaterialsList, production_code, adminUserId, data['updatedAt'])

                # CASE 2: No manual list, but Product ID changed
                elif product_will_change:
                    self._return_all_materials(conn, batchId, production_code, adminUserId, data['updatedAt'])
                    if new_product_id is not None:
                        self._deduct_materials_for_product(conn, batchId, new_product_id, new_planned_qty, production_code, adminUserId, data['updatedAt'])
                
                # CASE 3: No manual list, no product change, but quantity changed
                elif quantity_will_change:
                    # Apply delta-logic ONLY if it was a product-based batch
                    if old_product_id is not None:
                        delta_qty = float(new_planned_qty) - float(old_planned_qty)
                        
                        if delta_qty != 0:
                            try:
                                bom_sql = text('''
                                    SELECT prmc.id, prmc.raw_material_id, prmc.quantity, prmc.unit,
                                        rm.unit_of_measure AS rm_unit, rm.stock_qty AS rm_stock_qty, rm.unit_cost AS rm_unit_cost, rm.material_code AS rm_material_code, rm.material_name AS rm_material_name
                                    FROM product_raw_material_consumption prmc
                                    LEFT JOIN raw_materials rm ON prmc.raw_material_id = rm.id
                                    WHERE prmc.product_sku_id = :productId AND prmc.status = 1
                                ''')
                                bom_rows = conn.execute(bom_sql, {'productId': old_product_id}).mappings().all()
                            except Exception as e:
                                bom_rows = []
                                print("Warning: failed to fetch BOM during delta update for product", old_product_id, ":", e)

                            if bom_rows and len(bom_rows) > 0:
                                insufficient = []
                                changes = []
                                for b in bom_rows:
                                    try:
                                        rm_id = int(b['raw_material_id'])
                                        per_unit_qty = float(b['quantity'])
                                    except Exception:
                                        continue
                                    required_change = per_unit_qty * delta_qty
                                    current_stock = float(b['rm_stock_qty']) if b.get('rm_stock_qty') not in (None, '') else 0.0
                                    changes.append({ 'raw_material_id': rm_id, 'change_qty': required_change, 'unit': b.get('unit') or b.get('rm_unit') or None, 'unit_cost': float(b['rm_unit_cost']) if b.get('rm_unit_cost') not in (None, '') else None, 'current_stock': current_stock })
                                    if required_change > 0 and required_change > current_stock:
                                        insufficient.append({ 'raw_material_code': b.get('rm_material_code') or str(rm_id), 'raw_material_name': b.get('rm_material_name') or "", 'required_additional': required_change, 'available_qty': current_stock })

                                if len(insufficient) > 0:
                                    msg_parts = []
                                    for it in insufficient:
                                        name_str = f" ({it['raw_material_name']})" if it.get('raw_material_name') else ""
                                        msg_parts.append(f"Raw material {it['raw_material_code']}{name_str} needs additional {it['required_additional']}, available {it['available_qty']}")
                                    raise Exception("Insufficient raw materials for increased quantity: " + "; ".join(msg_parts))

                                for ch in changes:
                                    try:
                                        if ch['change_qty'] > 0:
                                            upd_sql = text(''' UPDATE raw_materials SET stock_qty = stock_qty - :qty, total_value = CASE WHEN unit_cost IS NOT NULL THEN (stock_qty - :qty) * unit_cost ELSE total_value END, stock_status = CASE WHEN (stock_qty - :qty) <= 0 THEN 'out-of-stock' WHEN (stock_qty - :qty) < min_stock_level THEN 'low-stock' ELSE 'in-stock' END, updated_at = :updatedAt, updated_admin_id = :updatedAdminId WHERE id = :rmId ''')
                                            conn.execute(upd_sql, { 'qty': ch['change_qty'], 'updatedAt': data['updatedAt'], 'updatedAdminId': adminUserId, 'rmId': ch['raw_material_id'] })
                                            total_cost = ch['unit_cost'] * ch['change_qty'] if ch.get('unit_cost') is not None else None
                                            ins_log_sql = text(''' INSERT INTO raw_material_consumption_receipt (production_batch_id, raw_material_id, consumed_qty, unit, unit_cost, total_cost, notes, created_at, created_admin_id, status) VALUES (:batchId, :rmId, :consumedQty, :unit, :unitCost, :totalCost, :notes, :createdAt, :createdAdminId, 1) ''')
                                            conn.execute(ins_log_sql, { 'batchId': batchId, 'rmId': ch['raw_material_id'], 'consumedQty': ch['change_qty'], 'unit': ch.get('unit'), 'unitCost': ch.get('unit_cost'), 'totalCost': total_cost, 'notes': f'Additional consumption due to update of batch {production_code}', 'createdAt': data['updatedAt'], 'createdAdminId': adminUserId })
                                        elif ch['change_qty'] < 0:
                                            return_qty = abs(ch['change_qty'])
                                            upd_sql = text(''' UPDATE raw_materials SET stock_qty = stock_qty + :qty, total_value = CASE WHEN unit_cost IS NOT NULL THEN (stock_qty + :qty) * unit_cost ELSE total_value END, stock_status = CASE WHEN (stock_qty + :qty) > min_stock_level THEN 'in-stock' WHEN (stock_qty + :qty) > 0 THEN 'low-stock' ELSE stock_status END, updated_at = :updatedAt, updated_admin_id = :updatedAdminId WHERE id = :rmId ''')
                                            conn.execute(upd_sql, { 'qty': return_qty, 'updatedAt': data['updatedAt'], 'updatedAdminId': adminUserId, 'rmId': ch['raw_material_id'] })
                                            total_cost = ch['unit_cost'] * return_qty if ch.get('unit_cost') is not None else None
                                            ins_log_sql = text(''' INSERT INTO raw_material_consumption_receipt (production_batch_id, raw_material_id, consumed_qty, unit, unit_cost, total_cost, notes, created_at, created_admin_id, status) VALUES (:batchId, :rmId, :consumedQty, :unit, :unitCost, :totalCost, :notes, :createdAt, :createdAdminId, 1) ''')
                                            conn.execute(ins_log_sql, { 'batchId': batchId, 'rmId': ch['raw_material_id'], 'consumedQty': ch['change_qty'], 'unit': ch.get('unit'), 'unitCost': ch.get('unit_cost'), 'totalCost': total_cost, 'notes': f'Returned to stock due to decrease of planned qty for batch {production_code}', 'createdAt': data['updatedAt'], 'createdAdminId': adminUserId })
                                    except Exception as e:
                                        raise Exception(f"Error adjusting raw material {ch.get('raw_material_id')}: {e}")

                # --- Update logic for stages and employee_jobs ---
                if stages is not None: 
                    # Delete old stages and batch-specific assignments
                    del_pbse_sql = text('''
                        DELETE FROM production_batch_stage_employees 
                        WHERE batch_stage_id IN (SELECT id FROM production_batch_stages WHERE batch_id = :batchId)
                    ''')
                    conn.execute(del_pbse_sql, {'batchId': batchId})

                    del_sql = text('DELETE FROM production_batch_stages WHERE batch_id = :batchId')
                    conn.execute(del_sql, {'batchId': batchId})

                    if isinstance(stages, (list, tuple)) and len(stages) > 0:
                        now_stages = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        all_manual_emp_ids = set()
                        for s in stages:
                            try:
                                if isinstance(s, dict):
                                    stage_id = int(s.get("stageId"))
                                    weightage = float(s.get("weightage", 0))
                                    manual_emp_ids = s.get("employeeIds", [])
                                else:
                                    stage_id = int(s)
                                    weightage = 0.0
                                    manual_emp_ids = []
                            except Exception:
                                continue
                            
                            ins_sql = text('''
                                INSERT INTO production_batch_stages
                                (batch_id, stage_id, stage_status, progress_percentage, weightage, end_at, notes, created_at, created_admin_id)
                                VALUES (:batchId, :stageId, 'pending', 0.00, :weightage, NULL, NULL, :createdAt, :createdAdminId)
                            ''')
                            pbs_res = conn.execute(ins_sql, { 'batchId': batchId, 'stageId': stage_id, 'weightage': weightage, 'createdAt': now_stages, 'createdAdminId': adminUserId })
                            batch_stage_id = pbs_res.lastrowid

                            if manual_emp_ids and isinstance(manual_emp_ids, list):
                                for emp_id in manual_emp_ids:
                                    try:
                                        emp_id = int(emp_id)
                                        all_manual_emp_ids.add(emp_id)
                                        pbse_sql = text('''
                                            INSERT INTO production_batch_stage_employees
                                            (batch_stage_id, employee_id, created_at, created_admin_id)
                                            VALUES (:batchStageId, :employeeId, :createdAt, :createdAdminId)
                                        ''')
                                        conn.execute(pbse_sql, {
                                            'batchStageId': batch_stage_id,
                                            'employeeId': emp_id,
                                            'createdAt': now_stages,
                                            'createdAdminId': adminUserId
                                        })
                                    except Exception as e:
                                        print(f"Warning: failed to update batch stage employee {emp_id}: {e}")
                            else:
                                # Fallback to global mapping
                                fetch_sql = text('''
                                    SELECT stage_employee_id
                                    FROM production_stage_employees
                                    WHERE production_stage_id = :stage_id
                                ''')
                                fetched = conn.execute(fetch_sql, {'stage_id': stage_id}).mappings().all()
                                for row in fetched:
                                    try:
                                        emp_id = int(row['stage_employee_id'])
                                        all_manual_emp_ids.add(emp_id)
                                        pbse_sql = text('''
                                            INSERT INTO production_batch_stage_employees
                                            (batch_stage_id, employee_id, created_at, created_admin_id)
                                            VALUES (:batchStageId, :employeeId, :createdAt, :createdAdminId)
                                        ''')
                                        conn.execute(pbse_sql, {
                                            'batchStageId': batch_stage_id,
                                            'employeeId': emp_id,
                                            'createdAt': now_stages,
                                            'createdAdminId': adminUserId
                                        })
                                    except Exception:
                                        continue

                        # Update overall jobs list
                        try:
                            if production_code:
                                del_jobs_sql = text('DELETE FROM employee_jobs WHERE job_code = :jobCode')
                                conn.execute(del_jobs_sql, {'jobCode': production_code})
                        except Exception as e:
                            print("Warning: failed to delete existing employee_jobs for job_code", production_code, ":", e)

                        now_jobs = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                        # Re-add production head
                        current_head_id = data.get('productionHeadEmployeeId')
                        if 'productionHeadEmployeeId' not in data:
                            sql_get_head = text('SELECT production_head_employee_id FROM production_batch WHERE id = :batchId')
                            head_res = conn.execute(sql_get_head, {'batchId': batchId}).mappings().first()
                            if head_res:
                                current_head_id = head_res.get('production_head_employee_id')
                        
                        if current_head_id is not None:
                            ej_h_sql = text(''' INSERT INTO employee_jobs (employee_id, job_code, status, created_at, created_admin_id) VALUES (:employeeId, :jobCode, 1, :createdAt, :createdAdminId) ''')
                            conn.execute(ej_h_sql, { 'employeeId': int(current_head_id), 'jobCode': production_code, 'createdAt': now_jobs, 'createdAdminId': adminUserId })

                        # Re-add all manually assigned employees to employee_jobs
                        for emp_id in all_manual_emp_ids:
                            try:
                                ej_ins_sql = text(''' INSERT INTO employee_jobs (employee_id, job_code, status, created_at, created_admin_id) VALUES (:employeeId, :jobCode, 1, :createdAt, :createdAdminId) ''')
                                conn.execute(ej_ins_sql, { 'employeeId': emp_id, 'jobCode': production_code, 'createdAt': now_jobs, 'createdAdminId': adminUserId })
                            except Exception as e:
                                if 'Duplicate entry' not in str(e):
                                    print("Warning: failed to re-add employee job for emp", emp_id, ":", e)

                elif 'productionHeadEmployeeId' in data: 
                    new_head_id = data.get('productionHeadEmployeeId')
                    if new_head_id is not None:
                        try:
                            check_sql = text(''' SELECT id FROM employee_jobs WHERE job_code = :jobCode AND employee_id = :employeeId LIMIT 1 ''')
                            chk = conn.execute(check_sql, {'jobCode': production_code, 'employeeId': int(new_head_id)}).fetchone()
                            if not chk:
                                now_head_job = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                                ej_sql = text(''' INSERT INTO employee_jobs (employee_id, job_code, status, created_at, created_admin_id) VALUES (:employeeId, :jobCode, 1, :createdAt, :createdAdminId) ''')
                                conn.execute(ej_sql, { 'employeeId': int(new_head_id), 'jobCode': production_code, 'createdAt': now_head_job, 'createdAdminId': adminUserId })
                        except Exception as e:
                            print("Warning: failed to ensure production head job during update:", e)

                trans.commit()
            return result.rowcount
        except Exception as e:
            if 'trans' in locals():
                trans.rollback()
            print("Error in updateProductionBatch:", e)
            return {"errFlag": 1, "message": str(e) or "Error while updating production batch"}

    def getAllProductionBatches(self):
        """Return list of batches ordered by created_at desc including stages, employees, and consumed materials."""
        
        # 1) fetch batch headers
        sql_headers = text('''
            SELECT pb.*, 
                   COALESCE(p.product_name, 'Manual Batch') AS product_name, 
                   c.client_name,
                   e_head.name as production_head_name
            FROM production_batch pb
            LEFT JOIN products_sku p ON pb.product_id = p.id
            LEFT JOIN clients c ON pb.client_id = c.id
            LEFT JOIN employees e_head ON pb.production_head_employee_id = e_head.id
            ORDER BY pb.priority DESC, pb.created_at DESC
        ''')
        with db.engine.connect() as conn:
            headers = conn.execute(sql_headers).mappings().all()

        if not headers:
            return []

        batch_ids = [h['id'] for h in headers]
        if not batch_ids:
            return headers

        # 2) fetch all stages for those batches
        stages_sql = text(f'''
            SELECT
                pbs.id AS batch_stage_id,
                pbs.batch_id,
                pbs.stage_id,
                ps.stage_name,
                ps.stage_head_employee_id,
                e_head.name as stage_head_name,
                pbs.stage_status,
                pbs.weightage,
                pbs.end_at,
                pbs.notes AS stage_notes,
                pbs.created_at AS stage_created_at,
                pbs.updated_at AS stage_updated_at
            FROM production_batch_stages pbs
            LEFT JOIN production_stage ps ON pbs.stage_id = ps.id
            LEFT JOIN employees e_head ON ps.stage_head_employee_id = e_head.id
            WHERE pbs.batch_id IN :batch_ids
            ORDER BY pbs.batch_id, pbs.id
        ''')
        
        # 3) fetch all assigned employees for those stages (batch-specific)
        emp_sql = text(f'''
            SELECT 
                pbse.batch_stage_id,
                pbse.employee_id,
                e.name as employee_name,
                e.email as employee_email,
                e.phone as employee_phone
            FROM production_batch_stage_employees pbse
            JOIN production_batch_stages pbs ON pbse.batch_stage_id = pbs.id
            LEFT JOIN employees e ON pbse.employee_id = e.id
            WHERE pbs.batch_id IN :batch_ids
        ''')

        # --- NEW 4) Fetch all consumed materials for these batches ---
        # We only select positive quantities, as negative values are "returns"
        materials_sql = text(f'''
            SELECT 
                rmcr.production_batch_id,
                rmcr.raw_material_id,
                rm.material_name,
                rmcr.consumed_qty,
                rmcr.unit
            FROM raw_material_consumption_receipt rmcr
            LEFT JOIN raw_materials rm ON rmcr.raw_material_id = rm.id
            WHERE rmcr.production_batch_id IN :batch_ids
              AND rmcr.consumed_qty > 0
            ORDER BY rmcr.production_batch_id
        ''')

        with db.engine.connect() as conn:
            stage_rows = conn.execute(stages_sql, {'batch_ids': tuple(batch_ids)}).mappings().all()
            emp_rows = conn.execute(emp_sql, {'batch_ids': tuple(batch_ids)}).mappings().all()
            material_rows = conn.execute(materials_sql, {'batch_ids': tuple(batch_ids)}).mappings().all() # NEW

        # 5) group employees by batch_stage_id
        emps_by_batch_stage = {}
        for emp in emp_rows:
            bs_id = emp['batch_stage_id']
            if bs_id not in emps_by_batch_stage:
                emps_by_batch_stage[bs_id] = []
            emps_by_batch_stage[bs_id].append({
                'employee_id': emp['employee_id'],
                'employee_name': emp['employee_name'],
                'employee_email': emp['employee_email'],
                'employee_phone': emp['employee_phone']
            })

        # 6) group stages by batch_id
        stages_by_batch = {}
        for s in stage_rows:
            batch_id = s['batch_id']
            if batch_id not in stages_by_batch:
                stages_by_batch[batch_id] = []
            
            stage_entry = dict(s)
            stage_entry['assigned_employees'] = emps_by_batch_stage.get(s['batch_stage_id'], [])
            stages_by_batch[batch_id].append(stage_entry)
            
        # --- NEW 7) Group consumed materials by batch_id ---
        materials_by_batch = {}
        for m in material_rows:
            batch_id = m['production_batch_id']
            if batch_id not in materials_by_batch:
                materials_by_batch[batch_id] = []
            
            materials_by_batch[batch_id].append({
                'raw_material_id': m['raw_material_id'],
                'material_name': m['material_name'],
                'consumed_qty': m['consumed_qty'],
                'unit': m['unit']
            })

        # 8) attach stages and materials to headers and return
        result = []
        for h in headers:
            hd = dict(h)
            hd['stages'] = stages_by_batch.get(hd['id'], [])
            hd['consumed_materials'] = materials_by_batch.get(hd['id'], []) # NEW
            result.append(hd)

        return result


    def getProductionBatchDetails(self, batchId):
        """
        Return single batch row, including product/client names,
        and the list of consumed raw materials.
        """
        # 1) Get the main batch details
        sql = text('''
            SELECT pb.*, 
                   COALESCE(p.product_name, 'Manual Batch') AS product_name, 
                   c.client_name,
                   e_head.name as production_head_name
            FROM production_batch pb
            LEFT JOIN products_sku p ON pb.product_id = p.id
            LEFT JOIN clients c ON pb.client_id = c.id
            LEFT JOIN employees e_head ON pb.production_head_employee_id = e_head.id
            WHERE pb.id = :batchId
        ''')
        with db.engine.connect() as conn:
            header = conn.execute(sql, {'batchId': batchId}).mappings().first()
        
        if not header:
            return None
        
        # 2) Get the consumed materials for this batch
        materials_sql = text(f'''
            SELECT 
                rmcr.raw_material_id,
                rm.material_name,
                rmcr.consumed_qty,
                rmcr.unit
            FROM raw_material_consumption_receipt rmcr
            LEFT JOIN raw_materials rm ON rmcr.raw_material_id = rm.id
            WHERE rmcr.production_batch_id = :batchId
              AND rmcr.consumed_qty > 0
        ''')
        
        # 3) Get stages and assigned employees for this batch
        stages_sql = text(f'''
            SELECT
                pbs.id AS batch_stage_id,
                pbs.stage_id,
                ps.stage_name,
                ps.stage_head_employee_id,
                e_head.name as stage_head_name,
                pbs.stage_status,
                pbs.weightage,
                pbs.end_at,
                pbs.notes AS stage_notes,
                pbs.created_at AS stage_created_at,
                pbs.updated_at AS stage_updated_at
            FROM production_batch_stages pbs
            LEFT JOIN production_stage ps ON pbs.stage_id = ps.id
            LEFT JOIN employees e_head ON ps.stage_head_employee_id = e_head.id
            WHERE pbs.batch_id = :batchId
            ORDER BY pbs.id
        ''')

        emp_sql = text(f'''
            SELECT 
                pbse.batch_stage_id,
                pbse.employee_id,
                e.name as employee_name,
                e.email as employee_email,
                e.phone as employee_phone
            FROM production_batch_stage_employees pbse
            JOIN production_batch_stages pbs ON pbse.batch_stage_id = pbs.id
            LEFT JOIN employees e ON pbse.employee_id = e.id
            WHERE pbs.batch_id = :batchId
        ''')

        with db.engine.connect() as conn:
            material_rows = conn.execute(materials_sql, {'batchId': batchId}).mappings().all()
            stage_rows = conn.execute(stages_sql, {'batchId': batchId}).mappings().all()
            emp_rows = conn.execute(emp_sql, {'batchId': batchId}).mappings().all()

        # 4) Group employees by batch_stage_id
        emps_by_stage = {}
        for emp in emp_rows:
            bs_id = emp['batch_stage_id']
            if bs_id not in emps_by_stage:
                emps_by_stage[bs_id] = []
            emps_by_stage[bs_id].append({
                'employee_id': emp['employee_id'],
                'employee_name': emp['employee_name'],
                'employee_email': emp['employee_email'],
                'employee_phone': emp['employee_phone']
            })

        # 5) Combine and return
        result = dict(header)
        result['consumed_materials'] = [dict(m) for m in material_rows]
        
        stages_list = []
        for s in stage_rows:
            sd = dict(s)
            sd['assigned_employees'] = emps_by_stage.get(s['batch_stage_id'], [])
            stages_list.append(sd)
        
        result['stages'] = stages_list
        
        return result


    def changeBatchStatus(self, batchId, status, adminUserId):
        """Change batch_status and update timestamps/admin. Return materials if cancelled."""
        
        # First get batch details to check current status
        sql_chk = text('SELECT id, production_code, batch_status FROM production_batch WHERE id = :batchId')
        with db.engine.connect() as conn:
            batch = conn.execute(sql_chk, {'batchId': batchId}).mappings().first()
        
        if not batch:
            return 0
        
        current_status = batch['batch_status']
        production_code = batch['production_code']
        
        try:
            with db.engine.connect() as conn:
                trans = conn.begin()
                
                # Update batch status
                update_sql = text('''
                    UPDATE production_batch
                    SET batch_status = :status, updated_at = :updatedAt, updated_admin_id = :updatedAdminId
                    WHERE id = :batchId
                ''')
                data = {
                    'batchId': batchId,
                    'status': status,
                    'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    'updatedAdminId': adminUserId
                }
                result = conn.execute(update_sql, data)
                
                # If changing TO cancelled status, return all materials
                if status == 'cancelled' and current_status != 'cancelled':
                    self._return_all_materials(conn, batchId, production_code, adminUserId, data['updatedAt'])
                    
                    # Also log a specific cancellation note
                    cancel_log_sql = text('''
                        INSERT INTO raw_material_consumption_receipt
                        (production_batch_id, raw_material_id, consumed_qty, unit, unit_cost, total_cost, notes, created_at, created_admin_id, status)
                        VALUES (:batchId, NULL, 0, NULL, NULL, NULL, :notes, :createdAt, :createdAdminId, 1)
                    ''')
                    conn.execute(cancel_log_sql, {
                        'batchId': batchId,
                        'notes': f'Batch {production_code} cancelled - all materials returned to stock',
                        'createdAt': data['updatedAt'],
                        'createdAdminId': adminUserId
                    })
                
                trans.commit()
                return result.rowcount
                
        except Exception as e:
            if 'trans' in locals():
                trans.rollback()
            print(f"Error in changeBatchStatus: {e}")
            return 0

    def getBatchDetailsForAudit(self, batchId): 
        """Fetch batch details for audit logging."""
        sql = text('''
            SELECT pb.*, 
                   COALESCE(p.product_name, 'Manual Batch') AS product_name, 
                   c.client_name,
                   e_head.name as production_head_name
            FROM production_batch pb
            LEFT JOIN products_sku p ON pb.product_id = p.id
            LEFT JOIN clients c ON pb.client_id = c.id
            LEFT JOIN employees e_head ON pb.production_head_employee_id = e_head.id
            WHERE pb.id = :batchId
        ''')
        with db.engine.connect() as conn:
            header = conn.execute(sql, {'batchId': batchId}).mappings().first()
        
        if not header:
            return None
        
        return dict(header)

    def updateBatchStageProgress(self, batchStageId, status, adminUserId, notes=None):
        """Update stage_status for a batch stage."""
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        status = status.lower()
        if status in ('complete', 'done'):
            final_status = 'complete'
            end_at = now
        elif status == 'pending':
            final_status = 'pending'
            end_at = None
        else:
            # in-progress or anything else
            final_status = 'in-progress'
            end_at = None

        sql = text('''
            UPDATE production_batch_stages
            SET stage_status = :status,
                end_at = :endAt,
                notes = :notes,
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :batchStageId
        ''')
        
        data = {
            'status': final_status,
            'endAt': end_at,
            'notes': notes,
            'updatedAt': now,
            'updatedAdminId': adminUserId,
            'batchStageId': batchStageId
        }
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
            
            if result.rowcount > 0:
                return 1
            else:
                # Check if the ID actually exists
                check_sql = text("SELECT id FROM production_batch_stages WHERE id = :id")
                exists = conn.execute(check_sql, {"id": batchStageId}).fetchone()
                if not exists:
                    return -1 # ID not found
                return 0 # Existing but no changes

    def isEmployeeAssignedToStage(self, batchStageId, employeeId):
        """
        Check if an employee is authorized to update a specific batch stage.
        Authorized if:
        - Production Head of the batch
        - Stage Head of the production stage
        - Listed as a worker (production_stage_employees) for that stage
        """
        try:
            sql = text("""
                SELECT pbs.id
                FROM production_batch_stages pbs
                JOIN production_batch pb ON pbs.batch_id = pb.id
                JOIN production_stage ps ON pbs.stage_id = ps.id
                WHERE pbs.id = :batchStageId
                AND (
                    pb.production_head_employee_id = :employeeId
                    OR ps.stage_head_employee_id = :employeeId
                    OR pbs.id IN (SELECT batch_stage_id FROM production_batch_stage_employees WHERE employee_id = :employeeId)
                )
            """)
            with db.engine.connect() as conn:
                res = conn.execute(sql, {'batchStageId': batchStageId, 'employeeId': employeeId}).fetchone()
            return True if res else False
        except Exception as e:
            print(f"Error checking employee assignment: {e}")
            return False

# singleton
    def updateBatchPriorities(self, priorityList, adminUserId):
        """
        Bulk update batch priorities based on positions.
        Expected priorityList format: [{"batchId": ID, "newPosition": POS}, ...]
        We'll map positions to priority values: priority = 1000000 - newPosition
        to ensure newPosition 1 is highest priority.
        """
        if not priorityList or not isinstance(priorityList, list):
            return {"errFlag": 1, "message": "Invalid or empty priority list"}

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        try:
            with db.engine.connect() as conn:
                trans = conn.begin()
                
                for item in priorityList:
                    batch_id = item.get("batchId")
                    new_position = item.get("newPosition")
                    
                    if batch_id is None or new_position is None:
                        continue
                    
                    # Logic: 1st position gets highest priority
                    # Using a large base to stay above default 0 priorities
                    new_priority = 1000000 - int(new_position)
                    
                    update_sql = text('''
                        UPDATE production_batch 
                        SET priority = :priority, updated_at = :updatedAt, updated_admin_id = :updatedAdminId
                        WHERE id = :batchId
                    ''')
                    conn.execute(update_sql, {
                        'priority': new_priority,
                        'updatedAt': timestamp,
                        'updatedAdminId': adminUserId,
                        'batchId': batch_id
                    })
                
                trans.commit()
            return 1
        except Exception as e:
            if 'trans' in locals():
                trans.rollback()
            print(f"Error in updateBatchPriorities: {e}")
            return {"errFlag": 1, "message": str(e) or "Error while updating batch priorities"}

    def deleteProductionBatch(self, batchId, adminUserId):
        """
        Safely delete a production batch:
        1. Check for production receipts or QC records (block if found).
        2. Return raw materials to stock.
        3. Delete stages and employee jobs.
        4. Delete batch.
        """
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 1. Fetch batch info
        sql_chk = text('SELECT id, production_code, batch_status FROM production_batch WHERE id = :batchId')
        with db.engine.connect() as conn:
            batch = conn.execute(sql_chk, {'batchId': batchId}).mappings().first()
        
        if not batch:
            return {"errFlag": 1, "message": "Production batch not found"}
        
        production_code = batch['production_code']

        # 2. Safety Checks (NO receipts, NO QC)
        with db.engine.connect() as conn:
            # Check receipts
            sql_receipts = text('SELECT count(*) FROM production_receipts WHERE production_batch_id = :batchId AND status = 1')
            receipt_count = conn.execute(sql_receipts, {'batchId': batchId}).scalar()
            if receipt_count > 0:
                return {"errFlag": 1, "message": "Cannot delete batch: items have already been received from production."}

            # Check QC
            sql_qc = text("SELECT count(*) FROM qc_records WHERE entity_type = 'production_batch' AND entity_id = :batchId AND status = 1")
            qc_count = conn.execute(sql_qc, {'batchId': batchId}).scalar()
            if qc_count > 0:
                return {"errFlag": 1, "message": "Cannot delete batch: quality checks have already been performed."}

        # 3. Proceed with deletion
        try:
            with db.engine.connect() as conn:
                trans = conn.begin()

                # Revert Raw Materials
                self._return_all_materials(conn, batchId, production_code, adminUserId, now)

                # Delete stages
                sql_del_stages = text('DELETE FROM production_batch_stages WHERE batch_id = :batchId')
                conn.execute(sql_del_stages, {'batchId': batchId})

                # Delete employee jobs
                sql_del_jobs = text('DELETE FROM employee_jobs WHERE job_code = :jobCode')
                conn.execute(sql_del_jobs, {'jobCode': production_code})

                # Delete the batch itself
                sql_del_batch = text('DELETE FROM production_batch WHERE id = :batchId')
                conn.execute(sql_del_batch, {'batchId': batchId})

                trans.commit()
            return 1
        except Exception as e:
            if 'trans' in locals():
                trans.rollback()
            print(f"Error deleting production batch {batchId}: {e}")
            return {"errFlag": 1, "message": str(e) or "Error while deleting production batch"}

productionBatchObj = ProductionBatchClass()
