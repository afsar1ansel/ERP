from db import db
from sqlalchemy.sql import text
from datetime import datetime

class QcTestTypeClass:
    
    def getQcTestTypes(self):
        """Fetches all active QC test types from the database."""
        sql = text('SELECT * FROM qc_test_type WHERE status = 1 ORDER BY test_type_name')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql)
        return responseData.mappings().all()

    def addQcTestType(self, testTypeName, adminUserId):
        """Adds a new QC test type."""
        # Check for duplicate test type name
        duplicate_check = self.chkDuplicateTestTypeName(testTypeName)
        if duplicate_check:
            return {"errFlag": 1, "message": "A QC test type with this name already exists"}

        data = {
            'testTypeName': testTypeName,
            'status': 1,
            'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'createdAdminId': adminUserId
        }

        sql = text('''
            INSERT INTO qc_test_type (test_type_name, status, created_at, created_admin_id) 
            VALUES (:testTypeName, :status, :createdAt, :createdAdminId)
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount
    
    def updateQcTestType(self, testTypeId, testTypeName, adminUserId):
        """Updates an existing QC test type."""
        # Check for duplicate test type name (excluding the current test type)
        duplicate_check = self.chkDuplicateTestTypeName(testTypeName, testTypeId)
        if duplicate_check:
            return {"errFlag": 1, "message": "Another QC test type with this name already exists"}

        data = {
            'testTypeId': testTypeId,
            'testTypeName': testTypeName,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }

        sql = text('''
            UPDATE qc_test_type 
            SET test_type_name = :testTypeName, 
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :testTypeId
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount
    
    def getQcTestTypeDetails(self, testTypeId):
        """Fetches details for a single QC test type."""
        sql = text('SELECT * FROM qc_test_type WHERE id = :testTypeId')
        data = {'testTypeId': testTypeId}
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
        return responseData.mappings().all()
    
    def changeQcTestTypeStatus(self, testTypeId, status, adminUserId):
        """Changes the active/inactive status of a QC test type."""
        data = {
            'testTypeId': testTypeId,
            'status': status,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }

        sql = text('''
            UPDATE qc_test_type 
            SET status = :status, 
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :testTypeId
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount
    
    def chkDuplicateTestTypeName(self, testTypeName, testTypeId=None):
        """Checks for duplicate QC test type names to ensure uniqueness."""
        if testTypeId:
            sql = text('''
                SELECT * FROM qc_test_type 
                WHERE LOWER(test_type_name) = LOWER(:testTypeName) AND id != :testTypeId  
            ''')
            data = {'testTypeName': testTypeName, 'testTypeId': testTypeId}
        else:
            sql = text('''
                SELECT * FROM qc_test_type 
                WHERE LOWER(test_type_name) = LOWER(:testTypeName)
            ''')
            data = {'testTypeName': testTypeName}
            
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
        
        return responseData.mappings().all()

# Create a single instance of the class to be used by the routes
qcTestTypeObj = QcTestTypeClass()