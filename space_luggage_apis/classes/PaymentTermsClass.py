from db import db
from sqlalchemy.sql import text
from datetime import datetime

class PaymentTermsClass:
    def getPaymentTerms(self):
        sql = text("SELECT * FROM payment_terms ORDER BY term_name")
        with db.engine.connect() as conn:
            res = conn.execute(sql)
        return res.mappings().all()

    def chkDuplicateTermName(self, termName, paymentTermId=None):
        if paymentTermId:
            sql = text("""
                SELECT id FROM payment_terms
                WHERE LOWER(term_name) = LOWER(:termName) AND id != :id
            """)
            data = {'termName': termName, 'id': paymentTermId}
        else:
            sql = text("""
                SELECT id FROM payment_terms
                WHERE LOWER(term_name) = LOWER(:termName)
            """)
            data = {'termName': termName}
        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
        return res.mappings().all()

    def addPaymentTerm(self, termName, adminUserId):
        if self.chkDuplicateTermName(termName):
            return {"errFlag": 1, "message": "Payment term already exists"}

        data = {
            'termName': termName,
            'status': 1,
            'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'createdAdminId': adminUserId
        }
        sql = text("""
            INSERT INTO payment_terms
            (term_name, status, created_at, created_admin_id)
            VALUES (:termName, :status, :createdAt, :createdAdminId)
        """)
        with db.engine.connect() as conn:
            r = conn.execute(sql, data)
            conn.commit()
        return r.rowcount

    def updatePaymentTerm(self, paymentTermId, termName, adminUserId):
        if self.chkDuplicateTermName(termName, paymentTermId):
            return {"errFlag": 1, "message": "Another payment term with this name already exists"}

        data = {
            'id': paymentTermId,
            'termName': termName,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }
        sql = text("""
            UPDATE payment_terms
            SET term_name = :termName,
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :id
        """)
        with db.engine.connect() as conn:
            r = conn.execute(sql, data)
            conn.commit()
        return r.rowcount

    def changePaymentTermStatus(self, paymentTermId, status):
        data = {
            'id': paymentTermId,
            'status': int(status),
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        sql = text("""
            UPDATE payment_terms
            SET status = :status,
                updated_at = :updatedAt
            WHERE id = :id
        """)
        with db.engine.connect() as conn:
            r = conn.execute(sql, data)
            conn.commit()
        return r.rowcount

paymentTermObj = PaymentTermsClass()
