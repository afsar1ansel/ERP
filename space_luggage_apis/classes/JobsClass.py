from db import db
from sqlalchemy.sql import text
from datetime import datetime

class JobClass:

    def checkDuplicateJobCode(self, jobCode, jobId=None):
        data = {'jobCode': jobCode}


        if jobId:
            sql = text('SELECT * FROM jobs WHERE job_code = :jobCode AND id != :jobId')
            data['jobId'] = jobId
        else:
            sql = text('SELECT * FROM jobs WHERE job_code = :jobCode')
        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
        return res.mappings().all()

    def addJob(self, jobCode, jobTitle, jobDescription, adminUserId):
        # Check duplicate job code
        duplicate_check = self.checkDuplicateJobCode(jobCode)
        if duplicate_check:
            return {"errFlag": 1, "message": "Job code already exists"}

        data = {
            'jobCode': jobCode,
            'jobTitle': jobTitle,
            'jobDescription': jobDescription,
            'status': 1,
            'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'createdAdminId': adminUserId
        }

        sql = text('''
            INSERT INTO jobs (
                job_code, 
                job_title,
                job_description,
                status,
                created_at,
                created_admin_id)
            VALUES (
                :jobCode,
                :jobTitle, 
                :jobDescription,
                :status,
                :createdAt,
                :createdAdminId)
        ''')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    def updateJob(self, jobId, jobCode, jobTitle, jobDescription, adminUserId):
        # Check duplicate job code excluding current job
        duplicate_check = self.checkDuplicateJobCode(jobCode, jobId)
        if duplicate_check:
            return {"errFlag": 1, "message": "Job code already exists"}

        data = {
            'jobId': jobId,
            'jobCode': jobCode,
            'jobTitle': jobTitle,
            'jobDescription': jobDescription,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }

        sql = text('''
            UPDATE jobs 
            SET job_code = :jobCode, 
                job_title = :jobTitle,
                job_description = :jobDescription,
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :jobId
        ''')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    def getAllJobs(self):

        sql = text('SELECT * FROM jobs WHERE status = 1 ORDER BY job_code')

        with db.engine.connect() as conn:
            res = conn.execute(sql)
        return res.mappings().all()

    def getJobDetails(self, jobId):
        sql = text('SELECT * FROM jobs WHERE id = :jobId and status = 1')
        with db.engine.connect() as conn:
            res = conn.execute(sql, {'jobId': jobId})
        return res.mappings().all()

    def changeJobStatus(self, jobId, status):
        data = {
            'jobId': jobId,
            'status': status,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        sql = text('UPDATE jobs SET status = :status, updated_at = :updatedAt WHERE id = :jobId')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    
# Singleton instance
jobObj = JobClass()