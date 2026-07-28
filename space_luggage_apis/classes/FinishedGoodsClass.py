from db import db
from sqlalchemy.sql import text
from datetime import datetime
import cloudinary.uploader
from werkzeug.utils import secure_filename
from decimal import Decimal, InvalidOperation

class FinishedGoodsClass:

    def upload_product_image(self, file):
        """Upload product image to Cloudinary with validation (2MB limit)."""
        
        # Validation: File size (2MB limit)
        if len(file.read()) > 2 * 1024 * 1024:  # 2MB in bytes
            file.seek(0)  # Reset file pointer
            return {"errFlag": 1, "message": "File size must be less than 2MB"}
        
        file.seek(0)  # Reset file pointer after checking size
        
        # Validation: File type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
        filename = secure_filename(file.filename)
        if '.' not in filename or filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return {"errFlag": 1, "message": "Invalid file type. Allowed: PNG, JPG, JPEG, GIF, BMP, WEBP"}
        
        try:
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                file,
                folder="finished_goods",
                transformation=[
                    {'width': 300, 'height': 300, 'crop': 'limit'},
                    {'quality': 'auto'},
                    {'format': 'auto'}
                ]
            )
            
            return {"errFlag": 0, "url": upload_result['secure_url'], "public_id": upload_result['public_id']}
            
        except Exception as e:
            return {"errFlag": 1, "message": f"Upload failed"}

    def delete_product_image(self, public_id):
        """Delete image from Cloudinary by public_id"""
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get('result') == 'ok'
        except Exception:
            return False

    def chkDuplicateSKU(self, sku_code, fgId=None):
        if not sku_code:
            return []
        if fgId:
            sql = text('SELECT id FROM finished_goods WHERE sku_code = :sku_code AND id != :fgId')
            params = {'sku_code': sku_code, 'fgId': fgId}
        else:
            sql = text('SELECT id FROM finished_goods WHERE sku_code = :sku_code')
            params = {'sku_code': sku_code}
        with db.engine.connect() as conn:
            res = conn.execute(sql, params)
        return res.mappings().all()

    def addFinishedGood(self, productName, productImageFile, 
                        skuCode, brandId, productCategoryId, stockQty, minLevel, maxLevel,
                        storageLocationId, unitPrice, rawMaterialCost, velocity,
                        goodsStatus, lastProduced, adminUserId):
        """Insert new finished_goods row with optional file upload"""
        # duplicate SKU check
        if skuCode:
            dup = self.chkDuplicateSKU(skuCode)
            if dup:
                return {"errFlag": 1, "message": "A finished good with this SKU already exists"}

        product_image_url =  ""   # default empty string
        product_image_public_id = ""

        # If a file is provided, upload and override product_image fields
        if productImageFile and getattr(productImageFile, "filename", "") != "":
            upload_res = self.upload_product_image(productImageFile)
            if upload_res.get("errFlag") == 1:
                return upload_res
            product_image_url = upload_res.get("url")
            product_image_public_id = upload_res.get("public_id")

        data = {
            'productName': productName,
            'productImage': product_image_url,
            'productImagePublicId': product_image_public_id,
            'skuCode': skuCode,
            'brandId': brandId,
            'productCategoryId': productCategoryId,
            'stockQty': float(stockQty) if stockQty not in (None, "") else 0,
            'minLevel': float(minLevel) if minLevel not in (None, "") else None,
            'maxLevel': float(maxLevel) if maxLevel not in (None, "") else None,
            'storageLocationId': int(storageLocationId) if storageLocationId not in (None, "") else None,
            'unitPrice': float(unitPrice) if unitPrice not in (None, "") else 0.00,
            'totalValue': 0.00,
            'rawMaterialCost': float(rawMaterialCost) if rawMaterialCost not in (None, "") else 0.00,
            'velocity': velocity,
            'goodsStatus': goodsStatus or 'in-stock',
            'lastProduced': lastProduced,
            'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'createdAdminId': adminUserId
        }

        try:
            data['totalValue'] = round(data['stockQty'] * data['unitPrice'], 2)
        except Exception:
            data['totalValue'] = 0.00

        sql = text('''
            INSERT INTO finished_goods (
                product_name, product_image, product_image_public_id, sku_code,
                brand_id, product_category_id, stock_qty, min_level, max_level,
                storage_location_id, unit_price, total_value, raw_material_cost,
                velocity, goods_status, last_produced, created_at, created_admin_id
            ) VALUES (
                :productName, :productImage, :productImagePublicId, :skuCode,
                :brandId, :productCategoryId, :stockQty, :minLevel, :maxLevel,
                :storageLocationId, :unitPrice, :totalValue, :rawMaterialCost,
                :velocity, :goodsStatus, :lastProduced, :createdAt, :createdAdminId
            )
        ''')

        try:
            with db.engine.connect() as conn:
                res = conn.execute(sql, data)
                fg_id = res.lastrowid
                conn.commit()
            return fg_id
        except Exception as e:
            print("Error in addFinishedGood:", e)
            return {"errFlag": 1, "message": "Error while adding finished good"}

    def validateFinishedGoodExists(self, fgId):
        sql = text('SELECT id, product_image_public_id FROM finished_goods WHERE id = :fgId')
        result = db.engine.connect().execute(sql, {'fgId': fgId}).fetchone()
        return result

    def updateFinishedGood(self, fgId, productName, productImageFile,
                           skuCode, brandId, productCategoryId, minLevel, maxLevel,
                           storageLocationId, unitPrice, rawMaterialCost, velocity,
                           goodsStatus, lastProduced, adminUserId):
        """Update finished_goods row with optional image replacement"""
        fg_row = self.validateFinishedGoodExists(fgId)
        if not fg_row:
            return {"errFlag": 1, "message": "Finished good not found"}

        # SKU duplicate check
        if skuCode:
            dup = self.chkDuplicateSKU(skuCode, fgId)
            if dup:
                return {"errFlag": 1, "message": "Another finished good with this SKU already exists"}

        current_image_public_id = fg_row['product_image_public_id'] if fg_row and 'product_image_public_id' in fg_row else None
        product_image_url = productImagePublicId or None
        product_image_public_id = current_image_public_id

        # If new file uploaded, upload and delete old
        if productImageFile and getattr(productImageFile, "filename", "") != "":
            upload_res = self.upload_product_image(productImageFile)
            if upload_res.get("errFlag") == 1:
                return upload_res
            product_image_url = upload_res.get("url")
            product_image_public_id = upload_res.get("public_id")
            # delete old image if available
            if current_image_public_id:
                try:
                    self.delete_product_image(current_image_public_id)
                except Exception:
                    pass

        data = {
            'fgId': fgId,
            'productName': productName,
            'productImage': product_image_url,
            'productImagePublicId': product_image_public_id,
            'skuCode': skuCode,
            'brandId': brandId,
            'productCategoryId': productCategoryId,
            'minLevel': float(minLevel) if minLevel not in (None, "") else None,
            'maxLevel': float(maxLevel) if maxLevel not in (None, "") else None,
            'storageLocationId': int(storageLocationId) if storageLocationId not in (None, "") else None,
            'unitPrice': float(unitPrice) if unitPrice not in (None, "") else 0.00,
            'rawMaterialCost': float(rawMaterialCost) if rawMaterialCost not in (None, "") else 0.00,
            'velocity': velocity,
            'goodsStatus': goodsStatus,
            'lastProduced': lastProduced,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }

        sql = text('''
            UPDATE finished_goods
            SET
                product_name = :productName,
                product_image = :productImage,
                product_image_public_id = :productImagePublicId,
                sku_code = :skuCode,
                brand_id = :brandId,
                product_category_id = :productCategoryId,
                min_level = :minLevel,
                max_level = :maxLevel,
                storage_location_id = :storageLocationId,
                unit_price = :unitPrice,
                raw_material_cost = :rawMaterialCost,
                velocity = :velocity,
                goods_status = :goodsStatus,
                last_produced = :lastProduced,
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :fgId
        ''')

        try:
            with db.engine.connect() as conn:
                res = conn.execute(sql, data)
                conn.commit()
            return res.rowcount
        except Exception as e:
            return {"errFlag": 1, "message": "Error while updating finished good"}


    def getAllFinishedGoods(self):
        sql = text('''
            SELECT 
                fg.*,
                b.brand_name, 
                c.product_category_name, 
                sl.location_label, 
                sl.current_occupancy, 
                sl.capacity,
                au_created.username as created_admin_name,
                au_updated.username as updated_admin_name,
                (SELECT MAX(pr.created_at) 
                 FROM production_receipts pr 
                 WHERE pr.finished_goods_id = fg.id) as last_production_date,
                (SELECT MAX(do.dispatch_date) 
                 FROM dispatch_orders do
                 JOIN dispatch_orders_items doi ON do.id = doi.dispatch_order_id
                 WHERE doi.product_id = fg.id) as last_dispatch_date
            FROM finished_goods fg
            LEFT JOIN brands b ON fg.brand_id = b.id
            LEFT JOIN product_categories c ON fg.product_category_id = c.id
            LEFT JOIN storage_locations sl ON fg.storage_location_id = sl.id
            LEFT JOIN admin_users au_created ON fg.created_admin_id = au_created.id
            LEFT JOIN admin_users au_updated ON fg.updated_admin_id = au_updated.id
            ORDER BY fg.created_at DESC
        ''')
        with db.engine.connect() as conn:
            res = conn.execute(sql)
        return res.mappings().all()

    def getFinishedGoodDetails(self, fgId):
        sql = text('''
            SELECT 
                fg.*,
                au_created.username as created_admin_name,
                au_updated.username as updated_admin_name,
                (SELECT MAX(pr.created_at) 
                 FROM production_receipts pr 
                 WHERE pr.finished_goods_id = fg.id) as last_production_date,
                (SELECT MAX(do.dispatch_date) 
                 FROM dispatch_orders do
                 JOIN dispatch_orders_items doi ON do.id = doi.dispatch_order_id
                 WHERE doi.product_id = fg.id) as last_dispatch_date
            FROM finished_goods fg
            LEFT JOIN admin_users au_created ON fg.created_admin_id = au_created.id
            LEFT JOIN admin_users au_updated ON fg.updated_admin_id = au_updated.id
            WHERE fg.id = :fgId
        ''')
        with db.engine.connect() as conn:
            res = conn.execute(sql, {'fgId': fgId}).mappings().all()
        if not res:
            return None
        return dict(res[0])

    def changeFinishedGoodStatus(self, fgId, status, adminUserId):
        sql = text('''
            UPDATE finished_goods
            SET status = :status, updated_at = :updatedAt, updated_admin_id = :updatedAdminId
            WHERE id = :fgId
        ''')
        data = {
            'fgId': fgId,
            'status': status,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }
        try:
            with db.engine.connect() as conn:
                res = conn.execute(sql, data)
                conn.commit()
            return res.rowcount
        except Exception as e:
            return 0

    def _get_fg_for_update(self, finished_good_id, conn):
        """
        Fetch the finished_goods row and lock it FOR UPDATE inside an open transaction.
        Returns mapping dict or None.
        """
        sql = text("""
            SELECT id, stock_qty, min_level
            FROM finished_goods
            WHERE id = :fgid
            LIMIT 1
            FOR UPDATE
        """)
        res = conn.execute(sql, {'fgid': finished_good_id}).mappings().all()
        return dict(res[0]) if res else None

    def _insert_fg_stock_adjustment(self, payload, conn):
        """
        Insert into fg_stock_adjustments table. Returns inserted id or rowcount fallback.
        payload keys: adjustment_type, finished_good_id, adjustment_qty, reason, notes,
                      status, created_at, created_admin_id
        """
        insert_sql = text("""
            INSERT INTO fg_stock_adjustments
            (adjustment_type, finished_good_id, adjustment_qty, reason, notes, status, created_at, created_admin_id)
            VALUES
            (:adjustment_type, :finished_good_id, :adjustment_qty, :reason, :notes, :status, :created_at, :created_admin_id)
        """)
        res = conn.execute(insert_sql, payload)
        inserted_id = getattr(res, "lastrowid", None) or res.rowcount
        return inserted_id

    def adjust_stock(self, finished_good_id, adjustment_type, adjustment_qty, admin_id,
                     reason=None, notes=None):
        """
        Apply adjustment based on adjustment_type ('increase'|'decrease') and positive adjustment_qty.
        Returns {"errFlag":0,...} on success or {"errFlag":1,...} on error.
        """
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # validate type
        adj_type = (adjustment_type or "").strip().lower()
        if adj_type not in ('increase', 'decrease'):
            return {"errFlag": 1, "message": "adjustmentType must be 'increase' or 'decrease'."}

        # validate qty (must be positive)
        try:
            qty = Decimal(str(adjustment_qty))
        except (InvalidOperation, Exception):
            return {"errFlag": 1, "message": "Invalid adjustmentQty. Must be numeric."}
        if qty <= 0:
            return {"errFlag": 1, "message": "adjustmentQty must be greater than zero."}

        # signed delta
        delta = qty if adj_type == 'increase' else (qty * Decimal('-1'))

        try:
            with db.engine.connect() as conn:
                trans = conn.begin()
                try:
                    fg = self._get_fg_for_update(finished_good_id, conn)
                    if not fg:
                        trans.rollback()
                        return {"errFlag": 1, "message": "Finished good not found."}

                    current = Decimal(str(fg.get('stock_qty') or '0'))
                    new_balance = current + delta

                    # Prevent negative balance
                    if new_balance < 0:
                        trans.rollback()
                        return {"errFlag": 1, "message": "Insufficient stock; cannot decrease below zero."}

                    # compute goods_status (simple)
                    goods_status = "in-stock"
                    min_lvl = fg.get('min_level')
                    try:
                        min_lvl_dec = Decimal(str(min_lvl)) if min_lvl is not None else None
                    except Exception:
                        min_lvl_dec = None

                    if new_balance <= 0:
                        goods_status = "out-of-stock"
                    elif (min_lvl_dec is not None) and (new_balance <= min_lvl_dec):
                        goods_status = "low-stock"

                    # update finished_goods
                    update_sql = text("""
                        UPDATE finished_goods
                        SET stock_qty = :new_qty,
                            goods_status = :goods_status,
                            updated_at = :updated_at,
                            updated_admin_id = :admin_id
                        WHERE id = :fgid
                    """)
                    conn.execute(update_sql, {
                        'new_qty': str(new_balance),
                        'goods_status': goods_status,
                        'updated_at': now,
                        'admin_id': admin_id,
                        'fgid': finished_good_id
                    })

                    # insert into fg_stock_adjustments (store adjustment_qty as positive)
                    adj_payload = {
                        'adjustment_type': adj_type,
                        'finished_good_id': finished_good_id,
                        'adjustment_qty': str(qty),
                        'reason': reason,
                        'notes': notes,
                        'status': 1,
                        'created_at': now,
                        'created_admin_id': admin_id
                    }
                    adj_id = self._insert_fg_stock_adjustment(adj_payload, conn)

                    trans.commit()
                    return {
                        "errFlag": 0,
                        "message": "Stock adjusted and logged.",
                        "oldBalance": str(current),
                        "newBalance": str(new_balance),
                        "adjustmentId": adj_id
                    }
                except Exception as ie:
                    try:
                        trans.rollback()
                    except Exception:
                        pass
                    print("adjust_stock error:", ie)
                    return {"errFlag": 1, "message": "Error during adjustment."}
        except Exception as e:
            print("DB connection error:", e)
            return {"errFlag": 1, "message": "Database error."}
    
    def getAllFGStockAdjustments(self):
        """
        Fetch all stock adjustment logs for finished goods,
        including finished good name.
        """
        sql = text('''
            SELECT 
                sa.id,
                sa.adjustment_type,
                sa.finished_good_id,
                fg.product_name AS finished_good_name,
                sa.adjustment_qty,
                sa.reason,
                sa.notes,
                sa.status,
                sa.created_at,
                sa.updated_at,
                sa.created_admin_id,
                sa.updated_admin_id
            FROM fg_stock_adjustments sa
            LEFT JOIN finished_goods fg 
                ON sa.finished_good_id = fg.id
            ORDER BY sa.created_at DESC
        ''')
        with db.engine.connect() as conn:
            response = conn.execute(sql).mappings().all()
        return [dict(r) for r in response]        
    

# singleton
finishedGoodsObj = FinishedGoodsClass()
