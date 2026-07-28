from db import db
from sqlalchemy.sql import text
from datetime import datetime

class DefectTypeClass:
    
    def getDefectTypes(self):
        """Fetches all active defect types from the database."""
        sql = text('SELECT * FROM defect_types WHERE status = 1 ORDER BY defect_name')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql)
        return responseData.mappings().all()

    def addDefectType(self, defect_code, defect_name, category, severity, description, corrective_action, adminUserId):
        """Adds a new defect type."""
        # Check for duplicate defect code
        duplicate_check = self.chkDuplicateDefectCode(defect_code)
        if duplicate_check:
            return {"errFlag": 1, "message": "A defect type with this code already exists"}

        data = {
            'defect_code': defect_code,
            'defect_name': defect_name,
            'category': category,
            'severity': severity,
            'description': description,
            'corrective_action': corrective_action,
            'status': 1,
            'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'created_admin_id': adminUserId
        }

        sql = text('''
            INSERT INTO defect_types 
            (defect_code, defect_name, category, severity, description, corrective_action, status, created_at, created_admin_id) 
            VALUES (:defect_code, :defect_name, :category, :severity, :description, :corrective_action, :status, :created_at, :created_admin_id)
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount
    
    def updateDefectType(self, defect_types_id, defect_code, defect_name, category, severity, description, corrective_action, adminUserId):
        """Updates an existing defect type."""
        # Check for duplicate defect code (excluding the current defect type)
        duplicate_check = self.chkDuplicateDefectCode(defect_code, defect_types_id)
        if duplicate_check:
            return {"errFlag": 1, "message": "Another defect type with this code already exists"}

        data = {
            'defect_types_id': defect_types_id,
            'defect_code': defect_code,
            'defect_name': defect_name,
            'category': category,
            'severity': severity,
            'description': description,
            'corrective_action': corrective_action,
            'updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updated_admin_id': adminUserId
        }

        sql = text('''
            UPDATE defect_types 
            SET defect_code = :defect_code, 
                defect_name = :defect_name,
                category = :category,
                severity = :severity,
                description = :description,
                corrective_action = :corrective_action,
                updated_at = :updated_at,
                updated_admin_id = :updated_admin_id
            WHERE id = :defect_types_id
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount
    
    def getDefectTypeDetails(self, defect_types_id):
        """Fetches details for a single defect type."""
        sql = text('SELECT * FROM defect_types WHERE id = :defect_types_id')
        data = {'defect_types_id': defect_types_id}
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
        return responseData.mappings().all()
    
    def changeDefectTypeStatus(self, defect_types_id, status, adminUserId):
        """Changes the active/inactive status of a defect type."""
        data = {
            'defect_types_id': defect_types_id,
            'status': status,
            'updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updated_admin_id': adminUserId
        }

        sql = text('''
            UPDATE defect_types 
            SET status = :status, 
                updated_at = :updated_at,
                updated_admin_id = :updated_admin_id
            WHERE id = :defect_types_id
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount
    
    def chkDuplicateDefectCode(self, defect_code, defect_types_id=None):
        """Checks for duplicate defect codes to ensure uniqueness."""
        if defect_types_id:
            sql = text('''
                SELECT * FROM defect_types 
                WHERE LOWER(defect_code) = LOWER(:defect_code) AND id != :defect_types_id  
            ''')
            data = {'defect_code': defect_code, 'defect_types_id': defect_types_id}
        else:
            sql = text('''
                SELECT * FROM defect_types 
                WHERE LOWER(defect_code) = LOWER(:defect_code)
            ''')
            data = {'defect_code': defect_code}
            
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
        
        return responseData.mappings().all()


defectTypeObj = DefectTypeClass()