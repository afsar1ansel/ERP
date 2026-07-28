from flask import Blueprint, request
from classes.EmployeeClass import employeeObj
from classes.AdminUsersClass import adminUserObj
from classes.AuditLogClass import auditLogObj
import jwt, hashlib
from datetime import datetime

employees_blueprint = Blueprint("employees", __name__)

@employees_blueprint.route("/employees/add", methods=["POST"])
def addEmployee():
    try:
        employeeCode = request.form["employeeCode"]
        name = request.form["name"]
        phone = request.form["phone"]
        email = request.form["email"]
        departmentId = request.form["departmentId"]
        role = request.form["role"]
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([employeeCode, name, email, phone, departmentId, role, token]):
        return {"errFlag": 1, "message": " All fields are required"}

    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        response = employeeObj.addEmployee(employeeCode, name, phone, email, departmentId, role, admin_user_id)
        
        if isinstance(response, dict):
            return response
        elif response > 0:
            #AUDIT LOG IMPLEMENTATION: EMPLOYEE CREATION
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=adminUsername,
                    action_type='INSERT',
                    detail=f'Added new Employee: {name}',
                    object_table='employees',
                    object_id=response
                )
            except Exception as e:
                print("Error logging employee creation action:", e)
            return {"errFlag": 0, "message": "Employee added successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to add employee"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error adding employee"}

@employees_blueprint.route("/employees/update", methods=["POST"])
def updateEmployee():
    try:
        employeeId = request.form["employeeId"]
        employeeCode = request.form["employeeCode"]
        name = request.form["name"]
        phone = request.form["phone"]
        email = request.form["email"]
        departmentId = request.form["departmentId"]
        empStatus = request.form.get("empStatus", "Active")
        role = request.form["role"]
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([employeeId, employeeCode, name, email, phone, departmentId, role, token]):
        return {"errFlag": 1, "message": "All fields are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    #get existing employee details for audit log
    try:
        existing_employee = employeeObj.getEmployeeDetails(employeeId)
    except Exception as e:
        existing_employee = None
    try:
        response = employeeObj.updateEmployee(employeeId, employeeCode, name, phone, email, departmentId, role, empStatus, admin_user_id)
        
        if isinstance(response, dict):
            return response
        elif response > 0:
            #AUDIT LOG IMPLEMENTATION: EMPLOYEE UPDATE
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=adminUsername,
                    action_type='UPDATE',
                    detail=f'Updated Employee: {name}',
                    object_table='employees',
                    object_id=employeeId,
                    old_value=existing_employee
                )
            except Exception as e:
                print("Error logging employee update action:", e)
            return {"errFlag": 0, "message": "Employee updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update employee"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating employee"}

@employees_blueprint.route("/employees/get-all/<token>")
def getAllEmployees(token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        employees = employeeObj.getAllEmployees()

        # AUDIT LOG IMPLEMENTATION: GET ALL EMPLOYEES
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=admin_user_id,
                adminUsername=adminUsername,
                action_type='PAGE_VIEW',
                detail='Fetched all employees',
                object_table='employees'
            )
        except Exception as e:
            print("Error logging fetch all employees action:", e)
        return [dict(row) for row in employees]
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching employees"}

@employees_blueprint.route("/employees/get-details/<employeeId>/<token>")
def getEmployeeDetails(employeeId, token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        employee = employeeObj.getEmployeeDetails(employeeId)
        if employee:
            return dict(employee[0])
        else:
            return {"errFlag": 1, "message": "Employee not found"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching employee"}

@employees_blueprint.route("/employees/change-status/<employeeId>/<status>/<token>")
def changeEmployeeStatus(employeeId, status, token):
    if status not in ["0", "1"]:
        return {"errFlag": 1, "message": "Status must be 0 or 1"}
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    #get existing employee details for audit log
    try:
        existing_employee = employeeObj.getEmployeeDetails(employeeId)
    except Exception as e:
        existing_employee = None
    try:
        status = int(status)
        response = employeeObj.changeEmployeeStatus(employeeId, status)
        
        if response > 0:
            # AUDIT LOG IMPLEMENTATION: STATUS CHANGE
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=adminUsername,
                    action_type='STATUS_CHANGE',
                    detail=f'Changed status for Employee ID {employeeId} from {existing_employee[0]["emp_status"]} to {status}.',
                    object_table='employees',
                    object_id=employeeId,
                    old_value=existing_employee
                )
            except Exception as e:
                print("Error logging employee status change action:", e)
            return {"errFlag": 0, "message": "Employee status updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update employee status"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating employee status"}

@employees_blueprint.route("/employees/validate-user", methods=["POST"])
def validateEmployee():
    try:
        phone = request.form['phone']
        password = request.form['password']
    except Exception as e:
        return {'errFlag': 1, 'message': 'Invalid inputs fields'}

    if phone == "" or password == "":
        return {"errFlag": 1, "message": 'phone and password are required'}

    # Note: In this specific implementation, password is the employee_code itself (plain text in DB)
    try:
        response = employeeObj.validateEmployeeCred(phone, password)
    except Exception as e:
        print(f"Error during employee validation: {e}")
        return {'errFlag': 1, 'message': 'Internal server error during validation'}

    if len(response) == 0:
        # Optional: Log failure
        return {'errFlag': 1, 'message': 'Invalid phone or employee code'}

    try:
        # user found
        emp_row = response[0]
        employeeId = emp_row["id"]
        employeeName = emp_row.get("name", "N/A")

        # create stateless token
        dateTimeString = datetime.now().strftime("%Y%m%d%H%M%S")
        # Payload format: emp-<id>-<datetime>
        payload = f"emp-{employeeId}-{dateTimeString}"
        encodedJwt = jwt.encode({"payload": payload}, 'thirdeyecreative', algorithm="HS256")

        # AUDIT LOG IMPLEMENTATION: EMPLOYEE_LOGIN_SUCCESS ---
        try:
            auditLogObj.log_action(
                adminId=0, # 0 or special ID for employee actions if needed
                adminUsername=employeeName,
                action_type='LOGIN_SUCCESS',
                detail=f'Successful login by Employee: {employeeName} (ID: {employeeId})',
                object_table='employees',
                object_id=employeeId
            )
        except:
            pass
        
        # Fetch page access for employees (specifically 'employee_task')
        try:
            page_access = employeeObj.get_employee_page_access()
        except:
            page_access = []

        return {
            "errFlag": 0,
            "message": "Login Successful",
            "token": encodedJwt,
            "employeeName": employeeName,
            "employeeId": employeeId,
            "page_access": page_access
        }
    except Exception as e:
        print(f"Error during token generation/logging: {e}")
        return {'errFlag': 1, 'message': 'Error completing login process'}

@employees_blueprint.route("/employees/token/validate", methods=["POST"])
def validateToken():
    try:
        token = request.form['token']
        if token == "":
            return {'errFlag': 1, 'message': 'token is required'}
    except:
         return {'errFlag': 1, 'message': 'token is required'}
     
    try:
        employeeId = employeeObj.validateEmployeeToken(token)
        if employeeId == 0:
            return {'errFlag': 1, 'message': 'Invalid token'} 
        
        return {'errFlag': 0, 'message': 'Authorization successful', 'employeeId': employeeId}
    except:
        return {'errFlag': 1, 'message': 'Invalid token'}

@employees_blueprint.route("/employees/assigned-stages/<token>", methods=["GET"])
def getAssignedStages(token):
    try:
        # Statelessly validate employee token
        employeeId = employeeObj.validateEmployeeToken(token)
        if employeeId == 0:
            return {"errFlag": 1, "message": "Invalid or expired token"}
    except Exception as e:
        print(f"Error validating token: {e}")
        return {"errFlag": 1, "message": "Invalid token"}

    try:
        # Fetch assigned stages
        stages = employeeObj.getAssignedStages(employeeId)
        return {"errFlag": 0, "stages": stages}
    except Exception as e:
        print(f"Error fetching assigned stages: {e}")
        return {"errFlag": 1, "message": "Error fetching assigned stages"}