from db import db
from sqlalchemy.sql import text
from datetime import datetime

class WarehouseClass:
    
    def getWarehouses(self):
        """Fetches all active warehouses from the database."""
        sql = text('SELECT * FROM warehouses WHERE status = 1 ORDER BY warehouse_name')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql)
        return responseData.mappings().all()

    def addWarehouse(self, warehouseName, adminUserId):
        """Adds a new warehouse."""
        # Check for duplicate warehouse name
        duplicate_check = self.chkDuplicateWarehouseName(warehouseName)
        if duplicate_check:
            return {"errFlag": 1, "message": "A warehouse with this name already exists"}

        data = {
            'warehouseName': warehouseName,
            'status': 1,
            'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'createdAdminId': adminUserId
        }

        sql = text('''
            INSERT INTO warehouses (warehouse_name, status, created_at, created_admin_id) 
            VALUES (:warehouseName, :status, :createdAt, :createdAdminId)
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount
    
    def updateWarehouse(self, warehouseId, warehouseName, adminUserId):
        """Updates an existing warehouse."""
        # Check for duplicate warehouse name (excluding the current warehouse)
        duplicate_check = self.chkDuplicateWarehouseName(warehouseName, warehouseId)
        if duplicate_check:
            return {"errFlag": 1, "message": "Another warehouse with this name already exists"}

        data = {
            'warehouseId': warehouseId,
            'warehouseName': warehouseName,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }

        sql = text('''
            UPDATE warehouses 
            SET warehouse_name = :warehouseName, 
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :warehouseId
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount
    
    def getWarehouseDetails(self, warehouseId):
        """Fetches details for a single warehouse."""
        sql = text('SELECT * FROM warehouses WHERE id = :warehouseId')
        data = {'warehouseId': warehouseId}
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
        return responseData.mappings().all()
    
    def changeWarehouseStatus(self, warehouseId, status, adminUserId):
        """Changes the active/inactive status of a warehouse."""
        data = {
            'warehouseId': warehouseId,
            'status': status,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }

        sql = text('''
            UPDATE warehouses 
            SET status = :status, 
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :warehouseId
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount
    
    def chkDuplicateWarehouseName(self, warehouseName, warehouseId=None):
        """Checks for duplicate warehouse names to ensure uniqueness."""
        if warehouseId:
            sql = text('''
                SELECT * FROM warehouses 
                WHERE LOWER(warehouse_name) = LOWER(:warehouseName) AND id != :warehouseId  
            ''')
            data = {'warehouseName': warehouseName, 'warehouseId': warehouseId}
        else:
            sql = text('''
                SELECT * FROM warehouses 
                WHERE LOWER(warehouse_name) = LOWER(:warehouseName)
            ''')
            data = {'warehouseName': warehouseName}
            
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
        
        return responseData.mappings().all()

# Create a single instance of the class to be used by the routes
warehouseObj = WarehouseClass()