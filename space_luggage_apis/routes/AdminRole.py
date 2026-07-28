import json
from flask import Blueprint, request
from classes.AdminRoleclass import adminRoleObj
from classes.AdminUsersClass import adminUserObj 
from classes.AuditLogClass import auditLogObj

admin_roles_blueprint = Blueprint("admin_roles", __name__)

@admin_roles_blueprint.route("/admin-roles/add", methods=["POST"])
def addAdminRole():
    try:
        role_name = request.form["role_name"]
        # Client sends a JSON string like "[1, 5, 12]"
        page_access_str = request.form.get("page_access", "[]") 
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([role_name, token]):
        return {"errFlag": 1, "message": "All fields are required"}

    try:
        # Convert the JSON string back into a Python list
        page_access_list = json.loads(page_access_str)
        if not isinstance(page_access_list, list):
             raise ValueError("page_access must be a list")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid page_access format. Must be a JSON array string."}

    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        response = adminRoleObj.addAdminRole(role_name, page_access_list, admin_user_id)
        
        if isinstance(response, dict): # Handle duplicate error
            return response
        elif response > 0:
            #AUDIT LOG IMPLEMENTATION: ROLE CREATION
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=adminUsername,
                    action_type='INSERT',
                    detail=f'Created new Admin Role: {role_name}',
                    object_table='admin_roles',
                    object_id=response
                )
            except Exception as e:
                print("Error logging role creation action:", e)
            return {"errFlag": 0, "message": "Admin Role added successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to add admin role"}
    except Exception as e:
        print(e)
        return {"errFlag": 1, "message": "Error adding admin role"}

@admin_roles_blueprint.route("/admin-roles/update", methods=["POST"])
def updateAdminRole():
    try:
        role_id = request.form["role_id"]
        role_name = request.form["role_name"]
        # Client sends a JSON string like "[1, 5, 12]"
        page_access_str = request.form.get("page_access", "[]")
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([role_id, role_name, token]):
        return {"errFlag": 1, "message": "All fields are required"}

    try:
        # Convert the JSON string back into a Python list
        page_access_list = json.loads(page_access_str)
        if not isinstance(page_access_list, list):
             raise ValueError("page_access must be a list")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid page_access format. Must be a JSON array string."}

    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        response = adminRoleObj.updateAdminRole(role_id, role_name, page_access_list, admin_user_id)
        
        if isinstance(response, dict): # Handle duplicate error
            return response
        elif response > 0:
            #AUDIT LOG IMPLEMENTATION: ROLE UPDATE
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=adminUsername,
                    action_type='UPDATE',
                    detail=f'Updated Admin Role: {role_name} (ID: {role_id})',
                    object_table='admin_roles',
                    object_id=role_id
                )
            except Exception as e:
                print("Error logging role update action:", e)
            return {"errFlag": 0, "message": "Admin Role updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update admin role"}
    except Exception as e:
        print(e)
        return {"errFlag": 1, "message": "Error updating admin role"}

@admin_roles_blueprint.route("/admin-roles/get-all/<token>")
def getAllAdminRoles(token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        roles = adminRoleObj.getAllAdminRoles()
        # AUDIT LOG IMPLEMENTATION: GET ALL ADMIN ROLES
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=admin_user_id,
                adminUsername=adminUsername,
                action_type='PAGE_VIEW',
                detail='Fetched all admin roles',
                object_table='admin_roles'
            )
        except Exception as e:
            print("Error logging fetch all roles action:", e)
        return roles
    except Exception as e:
        print(e)
        return {"errFlag": 1, "message": "Error fetching admin roles"}

@admin_roles_blueprint.route("/admin-roles/change-status/<role_id>/<status>/<token>")
def changeAdminRoleStatus(role_id, status, token):
    if status not in ["0", "1"]:
        return {"errFlag": 1, "message": "Status must be 0 (inactive) or 1 (active)"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    # AUDIT LOG IMPLEMENTATION: PRE-STATUS CHANGE (Get old status)
    old_admin_role_data = adminRoleObj.getAdminRoleDetails(role_id)
    old_status = old_admin_role_data['status'] if old_admin_role_data else 'N/A'
    try:
        status_int = int(status)
        response = adminRoleObj.changeAdminRoleStatus(role_id, status_int, admin_user_id)
        
        if response > 0:
            # AUDIT LOG IMPLEMENTATION: STATUS CHANGE (Post-action)
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=adminUsername,
                    action_type='STATUS_CHANGE',
                    detail=f'Changed status for Admin Role ID {role_id} from {old_status} to {status_int}.',
                    object_table='admin_roles',
                    object_id=role_id,
                    old_value={'status': old_status},
                    new_value={'status': status_int}
                )
            except Exception as e:
                print("Error logging role status change action:", e)
            return {"errFlag": 0, "message": "Role status updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update role status"}
    except Exception as e:
        print(e)
        return {"errFlag": 1, "message": "Error updating role status"}