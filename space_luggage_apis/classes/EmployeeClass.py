from db import db
from sqlalchemy.sql import text
from datetime import datetime
from collections import defaultdict
class EmployeeClass:

    def checkDuplicateEmployeeCode(self, employeeCode, employeeId=None):
        data = {'employeeCode': employeeCode}

        if employeeId:
            sql = text('SELECT * FROM employees WHERE employee_code = :employeeCode AND id != :employeeId')
            data['employeeId'] = employeeId
        else:
            sql = text('SELECT * FROM employees WHERE employee_code = :employeeCode')
        
        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
        return res.mappings().all()

    def checkDuplicateEmployeeEmail(self, email, employeeId=None):
        data = {'email': email}

        if employeeId:
            sql = text('SELECT * FROM employees WHERE email = :email AND id != :employeeId')
            data['employeeId'] = employeeId
        else:
            sql = text('SELECT * FROM employees WHERE email = :email')
        
        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
        return res.mappings().all()

    def addEmployee(self, employeeCode, name, phone, email, departmentId, role, adminUserId):
        # Check duplicate employee code
        duplicate_code = self.checkDuplicateEmployeeCode(employeeCode)
        if duplicate_code:
            return {"errFlag": 1, "message": "Employee code already exists"}

        # Check duplicate email
        duplicate_email = self.checkDuplicateEmployeeEmail(email)
        if duplicate_email:
            return {"errFlag": 1, "message": "Email already registered"}

        data = {
            'employeeCode': employeeCode,
            'name': name,
            'phone': phone,
            'email': email,
            'departmentId': departmentId,
            'role': role,
            'status': 1,
            'emp_status': 'Active',
            'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'createdAdminId': adminUserId
        }

        sql = text('''
            INSERT INTO employees (
                employee_code, 
                name,
                phone,
                email,
                department_id,
                role,
                status,
                emp_status,
                created_at,
                created_admin_id)
            VALUES (
                :employeeCode,
                :name, 
                :phone,
                :email,
                :departmentId,
                :role,
                :status,
                :emp_status,
                :createdAt,
                :createdAdminId)
        ''')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    def updateEmployee(self, employeeId, employeeCode, name, phone, email, departmentId, role, empStatus, adminUserId):
        # Check duplicate employee code excluding current employee
        duplicate_code = self.checkDuplicateEmployeeCode(employeeCode, employeeId)
        if duplicate_code:
            return {"errFlag": 1, "message": "Employee code already exists"}

        # Check duplicate email excluding current employee
        duplicate_email = self.checkDuplicateEmployeeEmail(email, employeeId)
        if duplicate_email:
            return {"errFlag": 1, "message": "Email already registered"}

        data = {
            'employeeId': employeeId,
            'employeeCode': employeeCode,
            'name': name,
            'phone': phone,
            'email': email,
            'departmentId': departmentId,
            'role': role,
            'empStatus': empStatus,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }

        sql = text('''
            UPDATE employees 
            SET employee_code = :employeeCode, 
                name = :name,
                phone = :phone,
                email = :email,
                department_id = :departmentId,
                role = :role,
                emp_status = :empStatus,
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :employeeId
        ''')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    def getAllEmployees(self):
        
        # 1) fetch all employees
        sql = text('''SELECT e.* ,
                    d.id as department_id,
                    d.department_name as department_name
                   FROM employees e
                   LEFT JOIN departments d ON e.department_id = d.id
                   WHERE e.status = 1
                   ORDER BY e.name''')
        with db.engine.connect() as conn:
            res = conn.execute(sql)
            
    
        employees = res.mappings().all()
        
        if not employees:
            return []
        
        # 2) collect employee ids
        emp_ids = [e['id'] for e in employees if e.get('id') is not None]
        if not emp_ids:
            # fallback: attach empty jobs and return
            return [dict(e, **{'current_jobs': []}) for e in employees]

        # 3) prepare dynamic placeholders for IN clause (:e0, :e1, ...)
        placeholders = []
        params = {}
        for i, eid in enumerate(emp_ids):
            key = f"e{i}"
            placeholders.append(f":{key}")
            params[key] = eid
        in_clause = ",".join(placeholders)

        # 4) fetch all active jobs for these employees in one query
        #    we select minimal useful fields for job display
        jobs_sql = text(f'''
            SELECT
                ej.id AS job_id,
                ej.employee_id,
                ej.job_code,
                ej.status AS job_status,
                ej.created_at AS job_created_at,
                ej.updated_at AS job_updated_at
            FROM employee_jobs ej
            WHERE ej.status = 1
            AND ej.employee_id IN ({in_clause})
            ORDER BY ej.employee_id, ej.created_at DESC
        ''')

        jobs_by_employee = defaultdict(list)
        with db.engine.connect() as conn:
            all_jobs = conn.execute(jobs_sql, params).mappings().all()
            for j in all_jobs:
                # convert RowMapping -> dict, optionally convert numeric types
                job = dict(j)
                # ensure numeric fields are proper types if needed (int)
                try:
                    job['job_id'] = int(job['job_id']) if job.get('job_id') is not None else None
                except:
                    pass
                
                jobs_by_employee[j['employee_id']].append(job)

        # 5) attach jobs to each employee dict
        result = []
        for e in employees:
            ed = dict(e)
            ed['current_jobs'] = jobs_by_employee.get(ed['id'], [])
            result.append(ed)

        return result
           

    def getEmployeeDetails(self, employeeId):
        sql = text('SELECT * FROM employees WHERE id = :employeeId and status = 1')
        with db.engine.connect() as conn:
            res = conn.execute(sql, {'employeeId': employeeId})
        return res.mappings().all()

    def changeEmployeeStatus(self, employeeId, status):
        data = {
            'employeeId': employeeId,
            'status': status,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        sql = text('UPDATE employees SET status = :status, updated_at = :updatedAt WHERE id = :employeeId')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    def validateEmployeeCred(self, phone, employeeCode):
        data = {
            'phone': phone,
            'employeeCode': employeeCode,
        }
        
        sql = text('''
            SELECT * FROM employees
            WHERE phone = :phone AND employee_code = :employeeCode AND status = 1
        ''')
        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
        
        return res.mappings().all()

    def validateEmployeeToken(self, token):
        import jwt
        try:
            decodedData = jwt.decode(token, "thirdeyecreative", algorithms=["HS256"])
            payload = decodedData['payload']
            if not str(payload).startswith("emp-"):
                return 0
                
            employeeId = int(payload.split("-")[1])
            return employeeId
        except Exception as e:
            print(f"Error validating employee token: {e}")
            return 0

    def get_employee_page_access(self):
        """
        Returns the page access for 'employee_task'.
        """
        try:
            sql = text("""
                SELECT id, page_name, page_route
                FROM admin_role_pages
                WHERE page_name = 'employee_task' AND status = 1
            """)
            with db.engine.connect() as conn:
                res = conn.execute(sql).mappings().all()
            return [dict(row) for row in res]
        except Exception as e:
            print(f"Error fetching employee page access: {e}")
            return []

    def getAssignedStages(self, employeeId):
        """
        Returns a list of production batch stages assigned to the employee.
        An employee is assigned if they are:
        - The stage head of the production_stage.
        - Listed in production_stage_employees for the stage.
        - The production head of the production_batch.
        """
        try:
            sql = text("""
                SELECT 
                    pbs.id as batch_stage_id,
                    pbs.batch_id,
                    pb.production_code,
                    pb.order_id,
                    ps.stage_name,
                    pbs.stage_status,
                    pb.planned_qty,
                    pb.completed_qty,
                    pb.floor,
                    pb.product_id,
                    COALESCE(p.product_name, 'Manual Batch') AS product_name,
                    pb.expected_completion_date,
                    pb.batch_status
                FROM production_batch_stages pbs
                JOIN production_batch pb ON pbs.batch_id = pb.id
                JOIN production_stage ps ON pbs.stage_id = ps.id
                LEFT JOIN products_sku p ON pb.product_id = p.id
                WHERE 
                    (ps.stage_head_employee_id = :employeeId 
                     OR pbs.stage_id IN (SELECT production_stage_id FROM production_stage_employees WHERE stage_employee_id = :employeeId)
                     OR pbs.id IN (SELECT batch_stage_id FROM production_batch_stage_employees WHERE employee_id = :employeeId)
                     OR pb.production_head_employee_id = :employeeId)
                    AND pb.batch_status != 'cancelled'
                ORDER BY pb.expected_completion_date ASC
            """)
            with db.engine.connect() as conn:
                res = conn.execute(sql, {'employeeId': employeeId}).mappings().all()
                stages = [dict(row) for row in res]

                # Fetch BOMs for associated products
                product_ids = {s['product_id'] for s in stages if s.get('product_id')}
                if product_ids:
                    # prepare placeholders
                    params = {f"p{i}": pid for i, pid in enumerate(product_ids)}
                    in_clause = ",".join([f":p{i}" for i in range(len(product_ids))])
                    
                    bom_sql = text(f'''
                        SELECT prmc.product_sku_id, prmc.raw_material_id, prmc.quantity, prmc.unit,
                               rm.material_name, rm.material_code, rm.unit_of_measure as rm_unit
                        FROM product_raw_material_consumption prmc
                        JOIN raw_materials rm ON prmc.raw_material_id = rm.id
                        WHERE prmc.product_sku_id IN ({in_clause}) AND prmc.status = 1
                    ''')
                    
                    bom_rows = conn.execute(bom_sql, params).mappings().all()
                    
                    # Group BOMs by product_id
                    boms_by_product = defaultdict(list)
                    for b in bom_rows:
                        boms_by_product[b['product_sku_id']].append(dict(b))

                    # Attach BOM to each stage
                    for s in stages:
                        pid = s.get('product_id')
                        # Calculate total needed based on planned_qty
                        bom_list = []
                        if pid in boms_by_product:
                            planned_qty = float(s.get('planned_qty', 0))
                            for m in boms_by_product[pid]:
                                m_dict = dict(m)
                                # total_required = BOM quantity * batch planned quantity
                                try:
                                    m_dict['total_required'] = format(float(m['quantity']) * planned_qty, ".4f")
                                except:
                                    m_dict['total_required'] = "0.0000"
                                bom_list.append(m_dict)
                        s['bill_of_materials'] = bom_list
                else:
                    for s in stages:
                        s['bill_of_materials'] = []

            return stages
        except Exception as e:
            print(f"Error fetching assigned stages for employee {employeeId}: {e}")
            return []

# Singleton instance
employeeObj = EmployeeClass()