from db import db
from sqlalchemy.sql import text
from datetime import datetime

class ClientTypesClass:
    def getClientTypes(self):
        sql = text("SELECT * FROM client_types ORDER BY type_name")
        with db.engine.connect() as conn:
            res = conn.execute(sql)
        return res.mappings().all()

    def chkDuplicateTypeName(self, typeName, clientTypeId=None):
        if clientTypeId:
            sql = text("""
                SELECT id FROM client_types
                WHERE LOWER(type_name) = LOWER(:typeName) AND id != :id
            """)
            data = {'typeName': typeName, 'id': clientTypeId}
        else:
            sql = text("""
                SELECT id FROM client_types
                WHERE LOWER(type_name) = LOWER(:typeName)
            """)
            data = {'typeName': typeName}
        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
        return res.mappings().all()

    def addClientType(self, typeName, adminUserId):
        # duplicate check
        if self.chkDuplicateTypeName(typeName):
            return {"errFlag": 1, "message": "Client type already exists"}

        data = {
            'typeName': typeName,
            'status': 1,
            'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'createdAdminId': adminUserId
        }
        sql = text("""
            INSERT INTO client_types
            (type_name, status, created_at, created_admin_id)
            VALUES (:typeName, :status, :createdAt, :createdAdminId)
        """)
        with db.engine.connect() as conn:
            r = conn.execute(sql, data)
            conn.commit()
        return r.rowcount

    def updateClientType(self, clientTypeId, typeName, adminUserId):
        # duplicate check (exclude current)
        if self.chkDuplicateTypeName(typeName, clientTypeId):
            return {"errFlag": 1, "message": "Another client type with this name already exists"}

        data = {
            'id': clientTypeId,
            'typeName': typeName,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }
        sql = text("""
            UPDATE client_types
            SET type_name = :typeName,
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :id
        """)
        with db.engine.connect() as conn:
            r = conn.execute(sql, data)
            conn.commit()
        return r.rowcount

    def changeClientTypeStatus(self, clientTypeId, status):
        data = {
            'id': clientTypeId,
            'status': int(status),
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        sql = text("""
            UPDATE client_types
            SET status = :status,
                updated_at = :updatedAt
            WHERE id = :id
        """)
        with db.engine.connect() as conn:
            r = conn.execute(sql, data)
            conn.commit()
        return r.rowcount

clientTypeObj = ClientTypesClass()
