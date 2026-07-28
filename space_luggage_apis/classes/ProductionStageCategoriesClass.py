# classes/ProductionStageCategoriesClass.py
from db import db
from sqlalchemy.sql import text
from datetime import datetime
import json

class ProductionStageCategoriesClass:

    def _now(self):
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # ---------- Helpers ----------

    def chkDuplicateCategoryName(self, categoryName, categoryId=None):
        """
        Check if category_name already exists.
        If categoryId is given -> exclude that ID (for update).
        """
        data = {"categoryName": categoryName}
        if categoryId:
            sql = text('''
                SELECT id 
                FROM production_stage_categories
                WHERE LOWER(category_name) = LOWER(:categoryName)
                  AND id != :categoryId
            ''')
            data["categoryId"] = categoryId
        else:
            sql = text('''
                SELECT id 
                FROM production_stage_categories
                WHERE LOWER(category_name) = LOWER(:categoryName)
            ''')

        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
            rows = res.mappings().all()
        return rows

    def getAllCategories(self):
        """
        Return all active categories (or all, depending on your need).
        """
        sql = text('''
            SELECT id, category_name, stages, status, created_at, updated_at
            FROM production_stage_categories
            WHERE status = 1
            ORDER BY category_name
        ''')
        with db.engine.connect() as conn:
            res = conn.execute(sql)
            return res.mappings().all()

    def getCategoryDetails(self, categoryId):
        sql = text('''
            SELECT * 
            FROM production_stage_categories
            WHERE id = :categoryId
        ''')
        with db.engine.connect() as conn:
            res = conn.execute(sql, {"categoryId": categoryId})
            return res.mappings().all()

    def changeCategoryStatus(self, categoryId, status, adminUserId):
        data = {
            "categoryId": categoryId,
            "status": int(status),
            "updatedAt": self._now(),
            "updatedAdminId": adminUserId
        }
        sql = text('''
            UPDATE production_stage_categories
            SET status = :status,
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :categoryId
        ''')

        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
            conn.commit()
        return res.rowcount

    # ---------- ADD ----------

    def addCategory(self, categoryName, stagesList, adminUserId):
        """
        stagesList -> Python list of stage_ids (ints) or objects.
        We will json.dumps and store in TEXT column 'stages'.
        """
        # 1) Duplicate name check
        dup = self.chkDuplicateCategoryName(categoryName)
        if dup:
            return {"errFlag": 1, "message": "Category name already exists"}

        # 2) Basic validation on stages list
        if not stagesList or not isinstance(stagesList, list):
            return {"errFlag": 1, "message": "At least one stage is required in the category"}

        # Validate weighted stages
        total_weightage = 0
        cleaned_stages = []
        for stage in stagesList:
            if isinstance(stage, dict):
                s_id = stage.get("stageId")
                weight = stage.get("weightage", 0)
                try:
                    s_id = int(s_id)
                    weight = float(weight)
                except (ValueError, TypeError):
                    return {"errFlag": 1, "message": f"Invalid stage info: {stage}"}
                
                cleaned_stages.append({"stageId": s_id, "weightage": weight})
                total_weightage += weight
            else:
                # Fallback for simple ID list if needed, but we expect objects
                try:
                    s_id = int(stage)
                    cleaned_stages.append({"stageId": s_id, "weightage": 0})
                except (ValueError, TypeError):
                    return {"errFlag": 1, "message": f"Invalid stage ID: {stage}"}

        # Optional: check if total weightage is 100
        # if total_weightage != 100:
        #    return {"errFlag": 1, "message": f"Total weightage must be 100. Current: {total_weightage}"}

        try:
            stages_json = json.dumps(cleaned_stages)
        except Exception:
            return {"errFlag": 1, "message": "Invalid stages format. Must be a JSON-serializable list."}

        data = {
            "categoryName": categoryName,
            "stages": stages_json,
            "status": 1,
            "createdAt": self._now(),
            "createdAdminId": adminUserId
        }

        sql = text('''
            INSERT INTO production_stage_categories
            (category_name, stages, status, created_at, created_admin_id)
            VALUES (:categoryName, :stages, :status, :createdAt, :createdAdminId)
        ''')

        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
            conn.commit()
        return res.rowcount

    # ---------- UPDATE ----------

    def updateCategory(self, categoryId, categoryName, stagesList, adminUserId):
        """
        Update category_name and stages list.
        """
        # Check duplicate name excluding current category
        dup = self.chkDuplicateCategoryName(categoryName, categoryId)
        if dup:
            return {"errFlag": 1, "message": "Another category with this name already exists"}

        if not stagesList or not isinstance(stagesList, list):
            return {"errFlag": 1, "message": "At least one stage is required in the category"}

        # Validate weighted stages
        total_weightage = 0
        cleaned_stages = []
        for stage in stagesList:
            if isinstance(stage, dict):
                s_id = stage.get("stageId")
                weight = stage.get("weightage", 0)
                try:
                    s_id = int(s_id)
                    weight = float(weight)
                except (ValueError, TypeError):
                    return {"errFlag": 1, "message": f"Invalid stage info: {stage}"}
                
                cleaned_stages.append({"stageId": s_id, "weightage": weight})
                total_weightage += weight
            else:
                try:
                    s_id = int(stage)
                    cleaned_stages.append({"stageId": s_id, "weightage": 0})
                except (ValueError, TypeError):
                    return {"errFlag": 1, "message": f"Invalid stage ID: {stage}"}

        try:
            stages_json = json.dumps(cleaned_stages)
        except Exception:
            return {"errFlag": 1, "message": "Invalid stages format. Must be a JSON-serializable list."}

        data = {
            "categoryId": categoryId,
            "categoryName": categoryName,
            "stages": stages_json,
            "updatedAt": self._now(),
            "updatedAdminId": adminUserId
        }

        sql = text('''
            UPDATE production_stage_categories
            SET category_name = :categoryName,
                stages = :stages,
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :categoryId
        ''')

        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
            conn.commit()
        return res.rowcount

    # ---------- Helper for Production Batch ----------

    def getStagesListByCategoryId(self, categoryId):
        """
        Used by ProductionBatchs to fetch stages array from StagesCategory.
        Returns Python list or [].
        """
        sql = text('''
            SELECT stages 
            FROM production_stage_categories
            WHERE id = :categoryId AND status = 1
        ''')
        with db.engine.connect() as conn:
            res = conn.execute(sql, {"categoryId": categoryId})
            row = res.mappings().first()

        if not row:
            return []

        try:
            stages_list = json.loads(row["stages"])
            return stages_list if isinstance(stages_list, list) else []
        except Exception:
            return []

productionStageCategoriesObj = ProductionStageCategoriesClass()
