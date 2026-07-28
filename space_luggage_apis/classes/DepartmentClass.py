from db import db
from sqlalchemy.sql import text
from datetime import datetime

class DepartmentClass:

    def checkDuplicateDepartmentCode(self, departmentCode, departmentId=None):
        data = {'departmentCode': departmentCode}

        if departmentId:
            sql = text('SELECT * FROM departments WHERE department_code = :departmentCode AND id != :departmentId AND status = 1')
            data['departmentId'] = departmentId
        else:
            sql = text('SELECT * FROM departments WHERE department_code = :departmentCode AND status = 1')

        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
        return res.mappings().all()

    def checkDuplicateDepartmentName(self, departmentName, departmentId=None):
        data = {'departmentName': departmentName}

        if departmentId:
            sql = text('SELECT * FROM departments WHERE department_name = :departmentName AND id != :departmentId AND status = 1')
            data['departmentId'] = departmentId
        else:
            sql = text('SELECT * FROM departments WHERE department_name = :departmentName AND status = 1')

        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
        return res.mappings().all()

    def addDepartment(self, departmentCode, departmentName, departmentDescription, departmentHeadEmpId, location, employeesCount, budget, adminUserId):
        # Check duplicate department code
        duplicate_code = self.checkDuplicateDepartmentCode(departmentCode)
        if duplicate_code:
            return {"errFlag": 1, "message": "Department code already exists"}

        # Check duplicate department name
        duplicate_name = self.checkDuplicateDepartmentName(departmentName)
        if duplicate_name:
            return {"errFlag": 1, "message": "Department name already exists"}

        data = {
            'departmentCode': departmentCode,
            'departmentName': departmentName,
            'departmentDescription': departmentDescription,
            'departmentHeadEmpId': departmentHeadEmpId,
            'location': location,
            'employeesCount': employeesCount,
            'budget': budget,
            'status': 1,
            'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'createAdminId': adminUserId
        }

        sql = text('''
            INSERT INTO departments (
                department_code, 
                department_name,
                department_description,
                department_head_emp_id,
                location,
                employees_count,
                budget,
                status,
                created_at,
                create_admin_id)
            VALUES (
                :departmentCode,
                :departmentName,
                :departmentDescription,
                :departmentHeadEmpId,
                :location,
                :employeesCount,
                :budget,
                :status,
                :createdAt,
                :createAdminId)
        ''')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    def updateDepartment(self, departmentId, departmentCode, departmentName, departmentDescription, departmentHeadEmpId, location, employeesCount, budget, adminUserId):
        # Check duplicate department code excluding current department
        duplicate_code = self.checkDuplicateDepartmentCode(departmentCode, departmentId)
        if duplicate_code:
            return {"errFlag": 1, "message": "Department code already exists"}

        # Check duplicate department name excluding current department
        duplicate_name = self.checkDuplicateDepartmentName(departmentName, departmentId)
        if duplicate_name:
            return {"errFlag": 1, "message": "Department name already exists"}

        data = {
            'departmentId': departmentId,
            'departmentCode': departmentCode,
            'departmentName': departmentName,
            'departmentDescription': departmentDescription,
            'departmentHeadEmpId': departmentHeadEmpId,
            'location': location,
            'employeesCount': employeesCount,
            'budget': budget,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }

        sql = text('''
            UPDATE departments 
            SET department_code = :departmentCode, 
                department_name = :departmentName,
                department_description = :departmentDescription,
                department_head_emp_id = :departmentHeadEmpId,
                location = :location,
                employees_count = :employeesCount,
                budget = :budget,
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :departmentId
        ''')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    def getAllDepartments(self):
        sql = text('''SELECT d.* ,e.name as department_head_name ,e.employee_code as department_head_emp_code
                   FROM departments d
                   LEFT JOIN employees e ON d.department_head_emp_id = e.id
                   WHERE d.status = 1''')
        with db.engine.connect() as conn:
            res = conn.execute(sql)
        return res.mappings().all()

    def getDepartmentDetails(self, departmentId):
        sql = text('SELECT * FROM departments WHERE id = :departmentId and status = 1')
        with db.engine.connect() as conn:
            res = conn.execute(sql, {'departmentId': departmentId})
        return res.mappings().all()

    def changeDepartmentStatus(self, departmentId, status):
        data = {
            'departmentId': departmentId,
            'status': status,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        sql = text('UPDATE departments SET status = :status, updated_at = :updatedAt WHERE id = :departmentId')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

# Singleton instance
departmentObj = DepartmentClass()