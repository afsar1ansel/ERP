from flask import Blueprint, request
from classes.DepartmentClass import departmentObj
from classes.AdminUsersClass import adminUserObj
from classes.AuditLogClass import auditLogObj

departments_blueprint = Blueprint("departments", __name__)

@departments_blueprint.route("/departments/add", methods=["POST"])
def addDepartment():
    try:
        departmentCode = request.form["departmentCode"]
        departmentName = request.form["departmentName"]
        departmentDescription = request.form.get("departmentDescription", "")
        departmentHeadEmpId = request.form.get("departmentHeadEmpId", 0)
        location = request.form.get("location", "")
        employeesCount = request.form.get("employeesCount", 0)
        budget = request.form.get("budget", 0.0)
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([departmentCode, departmentName, token]):
        return {"errFlag": 1, "message": "Department code, name and token are required"}
    
    try:
        employeesCount = int(employeesCount) if employeesCount else 0
        budget = float(budget) if budget else 0.0
    except ValueError:
        return {"errFlag": 1, "message": "Invalid employees count or budget format"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        response = departmentObj.addDepartment(departmentCode, departmentName, departmentDescription, departmentHeadEmpId, location, employeesCount, budget, admin_user_id)
        
        if isinstance(response, dict):
            return response
        elif response > 0:
            #AUDIT LOG IMPLEMENTATION: DEPARTMENT CREATION
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='INSERT',
                    detail=f'Created new Department: {departmentName}',
                    object_table='departments',
                    object_id=response
                )
            except Exception as e:
                print("Error logging department creation action:", e)
            return {"errFlag": 0, "message": "Department added successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to add department"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error adding department", "error": str(e)}

@departments_blueprint.route("/departments/update", methods=["POST"])
def updateDepartment():
    try:
        departmentId = request.form["departmentId"]
        departmentCode = request.form["departmentCode"]
        departmentName = request.form["departmentName"]
        departmentDescription = request.form.get("departmentDescription", "")
        departmentHeadEmpId = request.form.get("departmentHeadEmpId", 0)
        location = request.form.get("location", "")
        employeesCount = request.form.get("employeesCount", 0)
        budget = request.form.get("budget", 0.0)
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([departmentId, departmentCode, departmentName, token]):
        return {"errFlag": 1, "message": "Department ID, code, name and token are required"}
    
    try:
        employeesCount = int(employeesCount) if employeesCount else 0
        budget = float(budget) if budget else 0.0
    except ValueError:
        return {"errFlag": 1, "message": "Invalid employees count or budget format"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    # fetch existing department details for audit log
    try:
        existing_department = departmentObj.getDepartmentDetails(departmentId)
    except Exception as e:
        existing_department = None

    try:
        response = departmentObj.updateDepartment(departmentId, departmentCode, departmentName, departmentDescription, departmentHeadEmpId, location, employeesCount, budget, admin_user_id)
        
        if isinstance(response, dict):
            return response
        elif response > 0:
            #AUDIT LOG IMPLEMENTATION: DEPARTMENT UPDATE
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='UPDATE',
                    detail=f'Updated Department: {departmentName} (ID: {departmentId})',
                    object_table='departments',
                    object_id=departmentId,
                    old_value=existing_department[0] if existing_department else None,
                    new_value={
                        "departmentCode": departmentCode,
                        "departmentName": departmentName,
                        "departmentDescription": departmentDescription})
            except Exception as e:
                print("Error logging department update action:", e)
            return {"errFlag": 0, "message": "Department updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update department"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating department" , "error": str(e)}

@departments_blueprint.route("/departments/get-all/<token>")
def getAllDepartments(token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        departments = departmentObj.getAllDepartments()
        # AUDIT LOG IMPLEMENTATION: GET ALL DEPARTMENTS
        try:
            auditLogObj.check_and_log_daily_action(
                    adminId=adminUserId,
                    adminUsername=adminUsername,
                    action_type='PAGE_VIEW',
                    detail='Accessed Departments page',
                    object_table='departments',
                    object_id=0
                )
        except Exception as e:
            print("Error logging page view:", e)
        return [dict(row) for row in departments]
    except Exception as e:
        print(e)
        return {"errFlag": 1, "message": "Error fetching departments"}

@departments_blueprint.route("/departments/get-details/<departmentId>/<token>")
def getDepartmentDetails(departmentId, token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        department = departmentObj.getDepartmentDetails(departmentId)
        if department:
            return dict(department[0])
        else:
            return {"errFlag": 1, "message": "Department not found"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching department"}

@departments_blueprint.route("/departments/change-status/<departmentId>/<status>/<token>")
def changeDepartmentStatus(departmentId, status, token):
    if status not in ["0", "1"]:
        return {"errFlag": 1, "message": "Status must be 0 or 1"}
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    #get existing department details for audit log
    try:
        existing_department = departmentObj.getDepartmentDetails(departmentId)
    except Exception as e:
        existing_department = None
    try:
        status = int(status)
        response = departmentObj.changeDepartmentStatus(departmentId, status)
        
        if response > 0:
            #AUDIT LOG IMPLEMENTATION: DEPARTMENT STATUS CHANGE
            try:
                old_status = existing_department[0]['status'] if existing_department and existing_department[0] else 'N/A'
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUsername,
                    action_type='STATUS_CHANGE',
                    detail=f'Changed status for Department ID {departmentId} from {old_status} to {status}.',
                    object_table='departments',
                    object_id=departmentId
                )
            except Exception as e:  
                print("Error logging department status change action:", e)
            return {"errFlag": 0, "message": "Department status updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update department status"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating department status"}