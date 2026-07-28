
from db import db
from sqlalchemy.sql import text
from datetime import datetime

class UnitOfMeasurementClass:
    
    def getUnits(self):
        """Fetches all active units from the database."""
        sql = text('SELECT * FROM units_of_measurement WHERE status = 1 ORDER BY unit_name')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql)
        return responseData.mappings().all()

    def addUnit(self, unitName, adminUserId):
        """Adds a new unit of measurement."""
        # Check for duplicate unit name
        duplicate_check = self.chkDuplicateUnitName(unitName)
        if duplicate_check:
            return {"errFlag": 1, "message": "A unit with this name already exists"}

        data = {
            'unitName': unitName,
            'status': 1,
            'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'createdAdminId': adminUserId
        }

        sql = text('''
            INSERT INTO units_of_measurement (unit_name, status, created_at, created_admin_id) 
            VALUES (:unitName, :status, :createdAt, :createdAdminId)
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount
    
    def updateUnit(self, unitId, unitName, adminUserId):
        """Updates an existing unit of measurement."""
        # Check for duplicate unit name (excluding the current unit)
        duplicate_check = self.chkDuplicateUnitName(unitName, unitId)
        if duplicate_check:
            return {"errFlag": 1, "message": "Another unit with this name already exists"}

        data = {
            'unitId': unitId,
            'unitName': unitName,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }

        sql = text('''
            UPDATE units_of_measurement 
            SET unit_name = :unitName, 
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :unitId
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount
    
    def getUnitDetails(self, unitId):
        """Fetches details for a single unit."""
        sql = text('SELECT * FROM units_of_measurement WHERE id = :unitId')
        data = {'unitId': unitId}
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
        return responseData.mappings().all()
    
    def changeUnitStatus(self, unitId, status, adminUserId):
        """Changes the active/inactive status of a unit."""
        data = {
            'unitId': unitId,
            'status': status,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }

        sql = text('''
            UPDATE units_of_measurement 
            SET status = :status, 
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :unitId
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount
    
    def chkDuplicateUnitName(self, unitName, unitId=None):
        """Checks for duplicate unit names to ensure uniqueness."""
        if unitId:
            sql = text('''
                SELECT * FROM units_of_measurement 
                WHERE LOWER(unit_name) = LOWER(:unitName) AND id != :unitId  
            ''')
            data = {'unitName': unitName, 'unitId': unitId}
        else:
            sql = text('''
                SELECT * FROM units_of_measurement 
                WHERE LOWER(unit_name) = LOWER(:unitName)
            ''')
            data = {'unitName': unitName}
            
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
        
        return responseData.mappings().all()

# Create a single instance of the class to be used by the routes
unitObj = UnitOfMeasurementClass()