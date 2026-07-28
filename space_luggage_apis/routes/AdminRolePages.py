from flask import Blueprint, request
from classes.AdminRolePagesClass import adminRolePageObj
from classes.AdminUsersClass import adminUserObj # Assuming this is your admin class

admin_role_pages_blueprint = Blueprint("admin_role_pages", __name__)

@admin_role_pages_blueprint.route("/admin-role-pages/add", methods=["POST"])
def addRolePage():
    try:
        page_name = request.form["page_name"]
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([page_name, token]):
        return {"errFlag": 1, "message": "All fields are required"}

    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        response = adminRolePageObj.addRolePage(page_name, admin_user_id)
        
        if isinstance(response, dict): # Handle duplicate error
            return response
        elif response > 0:
            return {"errFlag": 0, "message": "Role Page added successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to add role page"}
    except Exception as e:
        print(e) # For debugging
        return {"errFlag": 1, "message": "Error adding role page"}

@admin_role_pages_blueprint.route("/admin-role-pages/update", methods=["POST"])
def updateRolePage():
    try:
        page_id = request.form["page_id"]
        page_name = request.form["page_name"]
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([page_id, page_name, token]):
        return {"errFlag": 1, "message": "All fields are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        response = adminRolePageObj.updateRolePage(page_id, page_name, admin_user_id)
        
        if isinstance(response, dict): # Handle duplicate error
            return response
        elif response > 0:
            return {"errFlag": 0, "message": "Role Page updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update role page"}
    except Exception as e:
        print(e) # For debugging
        return {"errFlag": 1, "message": "Error updating role page"}

@admin_role_pages_blueprint.route("/admin-role-pages/get-all/<token>")
def getAllRolePages(token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        pages = adminRolePageObj.getAllRolePages()
        # Convert RowMapping objects to standard dictionaries
        return [dict(row) for row in pages]
    except Exception as e:
        print(e) # For debugging
        return {"errFlag": 1, "message": "Error fetching role pages"}

@admin_role_pages_blueprint.route("/admin-role-pages/change-status/<page_id>/<status>/<token>")
def changePageStatus(page_id, status, token):
    if status not in ["0", "1"]:
        return {"errFlag": 1, "message": "Status must be 0 (inactive) or 1 (active)"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        status_int = int(status)
        response = adminRolePageObj.changePageStatus(page_id, status_int, admin_user_id)
        
        if response > 0:
            return {"errFlag": 0, "message": "Page status updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update page status"}
    except Exception as e:
        print(e) # For debugging
        return {"errFlag": 1, "message": "Error updating page status"}