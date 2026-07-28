from db import db
from sqlalchemy.sql import text
from datetime import datetime

class ProductionStageClass:

    def checkDuplicateStageName(self, stage_name, stage_id=None):
        """Checks for duplicate production stage names."""
        data = {'stage_name': stage_name}
        if stage_id:
            sql = text('SELECT * FROM production_stage WHERE stage_name = :stage_name AND id != :stage_id AND status = 1')
            data['stage_id'] = stage_id
        else:
            sql = text('SELECT * FROM production_stage WHERE stage_name = :stage_name AND status = 1')
        
        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
        return res.mappings().all()

    def addProductionStage(self, stage_name, stage_head_employee_id, stage_employees, admin_user_id):
        """Adds a new production stage and its employees."""
        # Check for duplicate stage name
        if self.checkDuplicateStageName(stage_name):
            return {"errFlag": 1, "message": "A production stage with this name already exists."}

        with db.engine.connect() as conn:
            with conn.begin() as transaction:
                try:
                    stage_data = {
                        'stage_name': stage_name,
                        'stage_head_employee_id': stage_head_employee_id,
                        'status': 1,
                        'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        'created_admin_id': admin_user_id
                    }
                    
                    sql_stage = text('''
                        INSERT INTO production_stage (stage_name,  stage_head_employee_id, status, created_at, created_admin_id)
                        VALUES (:stage_name, :stage_head_employee_id, :status, :created_at, :created_admin_id)
                    ''')
                    
                    result = conn.execute(sql_stage, stage_data)
                    production_stage_id = result.lastrowid
                    
                    if not production_stage_id:
                        raise Exception("Failed to create production stage.")

                    # Add employees to the linking table
                    if stage_employees:
                        for employee in stage_employees:
                            employee_data = {
                                'production_stage_id': production_stage_id,
                                'stage_employee_id': employee['stage_employee_id'],
                                'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                                'created_admin_id': admin_user_id
                            }
                            sql_employee = text('''
                                INSERT INTO production_stage_employees (production_stage_id, stage_employee_id, created_at, created_admin_id)
                                VALUES (:production_stage_id, :stage_employee_id, :created_at, :created_admin_id)
                            ''')
                            conn.execute(sql_employee, employee_data)
                    
                    transaction.commit()
                    return production_stage_id
                
                except Exception as e:
                    print(e)
                    transaction.rollback()
                    return {"errFlag": 1, "message": f"An error occurred"}

    def updateProductionStage(self, stage_id, stage_name, stage_head_employee_id, stage_employees, admin_user_id):
        """Updates an existing production stage and its employees."""
        # Check for duplicate stage name
        if self.checkDuplicateStageName(stage_name, stage_id):
            return {"errFlag": 1, "message": "Another production stage with this name already exists."}
            
        with db.engine.connect() as conn:
            with conn.begin() as transaction:
                try:
                    stage_data = {
                        'stage_id': stage_id,
                        'stage_name': stage_name,
                        'stage_head_employee_id': stage_head_employee_id,
                        'updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        'update_admin_id': admin_user_id
                    }
                    
                    sql_stage = text('''
                        UPDATE production_stage 
                        SET stage_name = :stage_name,
                            stage_head_employee_id = :stage_head_employee_id,
                            updated_at = :updated_at,
                            update_admin_id = :update_admin_id
                        WHERE id = :stage_id
                    ''')
                    conn.execute(sql_stage, stage_data)

                    # Delete old employee associations
                    sql_delete_employees = text('DELETE FROM production_stage_employees WHERE production_stage_id = :stage_id')
                    conn.execute(sql_delete_employees, {'stage_id': stage_id})

                    # Add new employee associations
                    if stage_employees:
                        for employee in stage_employees:
                            employee_data = {
                                'production_stage_id': stage_id,
                                'stage_employee_id': employee['stage_employee_id'],
                                'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                                'created_admin_id': admin_user_id
                            }
                            sql_employee = text('''
                                INSERT INTO production_stage_employees (production_stage_id, stage_employee_id, created_at, created_admin_id)
                                VALUES (:production_stage_id, :stage_employee_id, :created_at, :created_admin_id)
                            ''')
                            conn.execute(sql_employee, employee_data)
                            
                    transaction.commit()
                    return stage_id
                
                except Exception as e:
                    transaction.rollback()
                    return {"errFlag": 1, "message": f"An error occurred"}

    def getAllProductionStages(self):
        """
        Retrieves all active production stages and includes a list of all
        employees tagged to each stage.
        """
        # SQL query to get all active production stages.
        sql_stages = text('''SELECT ps.* ,e.name as stage_head_name
                          FROM production_stage ps
                          LEFT JOIN employees e
                            ON ps.stage_head_employee_id = e.id
                          WHERE ps.status = 1 ORDER BY ps.stage_name ASC''')

        with db.engine.connect() as conn:
            # Execute the query and get the initial list of stages.
            active_stages_result = conn.execute(sql_stages).mappings().all()

            # If there are no active stages, return an empty list immediately.
            if not active_stages_result:
                return []

            # Prepare a dictionary to easily map employees to their stages.
            stages_map = {stage['id']: dict(stage) for stage in active_stages_result}
            
            # Initialize an empty 'employees' list for each stage.
            for stage_id in stages_map:
                stages_map[stage_id]['employees'] = []

            # Get a list of all stage IDs to use in the next query.
            stage_ids = list(stages_map.keys())

            # SQL query to get all employees for the active stages.
            sql_employees = text("""
                SELECT
                    e.*,
                    pse.production_stage_id
                FROM employees e
                JOIN production_stage_employees pse ON e.id = pse.stage_employee_id
                WHERE pse.production_stage_id IN :stage_ids
            """)

            # Execute the employee query.
            employees_result = conn.execute(sql_employees, {'stage_ids': tuple(stage_ids)}).mappings().all()

            # Assign employees to the correct stage.
            for employee in employees_result:
                stage_id = employee['production_stage_id']
                employee_data = dict(employee)
                del employee_data['production_stage_id']
                
                if stage_id in stages_map:
                    stages_map[stage_id]['employees'].append(employee_data)

        # Return the final list of stages, now populated with their employees.
        return list(stages_map.values())

    def getProductionStageDetails(self, stage_id):
        """Retrieves details for a single production stage, including its employees and stage head details."""
        # Get main stage details
        sql_stage = text('SELECT * FROM production_stage WHERE id = :stage_id AND status = 1')
        with db.engine.connect() as conn:
            stage_res = conn.execute(sql_stage, {'stage_id': stage_id}).mappings().first()
            if not stage_res:
                return None
            
            stage_details = dict(stage_res)
            
            # Get stage head employee details
            stage_head_id = stage_details.get('stage_head_employee_id')
            if stage_head_id:
                sql_stage_head = text('SELECT * FROM employees WHERE id = :employee_id')
                stage_head_res = conn.execute(sql_stage_head, {'employee_id': stage_head_id}).mappings().first()
                stage_details['stage_head_details'] = dict(stage_head_res) if stage_head_res else None
            else:
                stage_details['stage_head_details'] = None

            # Get associated employees with full details
            sql_employees = text('''
                SELECT e.* FROM employees e
                JOIN production_stage_employees pse ON e.id = pse.stage_employee_id
                WHERE pse.production_stage_id = :stage_id
            ''')
            employees_res = conn.execute(sql_employees, {'stage_id': stage_id}).mappings().all()
            
            stage_details['employees'] = [dict(row) for row in employees_res]
        
        return stage_details

    def changeProductionStageStatus(self, stage_id, status, admin_user_id):
        """Changes the status of a production stage (active/inactive)."""
        data = {
            'stage_id': stage_id,
            'status': status,
            'updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'update_admin_id': admin_user_id
        }
        sql = text('UPDATE production_stage SET status = :status, updated_at = :updated_at, update_admin_id = :update_admin_id WHERE id = :stage_id')
        with db.engine.connect() as conn:
            with conn.begin() as transaction:
                result = conn.execute(sql, data)
                transaction.commit()
        return result.rowcount

# Singleton instance
productionStageObj = ProductionStageClass()