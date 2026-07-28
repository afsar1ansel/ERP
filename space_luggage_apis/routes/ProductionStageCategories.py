from flask import Blueprint, request
from classes.ProductionStageCategoriesClass import productionStageCategoriesObj
from classes.AdminUsersClass import adminUserObj
import json
from classes.AuditLogClass import auditLogObj

production_stage_categories_blueprint = Blueprint("production_stage_categories", __name__)


@production_stage_categories_blueprint.route("/production-stage-categories/get-all/<token>")
def getAllStageCategories(token):
    if token == "":
        return {"errFlag": 1, "message": "token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        rows = productionStageCategoriesObj.getAllCategories()
        # audit log
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=res[0]["id"],
                adminUsername=res[0].get("username", "N/A"),
                action_type='PAGE_VIEW',
                detail='Fetched all stage categories',
                object_table='production_stage_categories'
            )
        except Exception as e:
            print("Error logging fetch all stage categories action:", e)
        
        return [dict(r) for r in rows]
    except Exception:
        return {"errFlag": 1, "message": "Error while fetching stage categories"}

# ---------- Add ----------

@production_stage_categories_blueprint.route("/production-stage-categories/add", methods=["POST"])
def addStageCategory():
    try:
        categoryName = request.form["categoryName"]
        stages_json = request.form.get("stages", "[]")
        token = request.form["token"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not categoryName or not token:
        return {"errFlag": 1, "message": "categoryName and token are required"}

    # Parse stages array
    try:
        stages_list = json.loads(stages_json)
        if not isinstance(stages_list, list):
            stages_list = []
    except Exception:
        stages_list = []

    if not stages_list:
        return {"errFlag": 1, "message": "At least one stage is required"}

    # Validate token
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        out = productionStageCategoriesObj.addCategory(categoryName, stages_list, adminUserId)
        if isinstance(out, dict):
            return out
        elif out > 0:
            # audit log
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=res[0].get("username", "N/A"),
                    action_type='CREATE',
                    detail='Added stage category',
                    object_table='production_stage_categories',
                    object_id=out,
                    new_value={
                        "categoryName": categoryName,
                        "stages": stages_list
                    }
                )
            except Exception as e:
                print("Error logging add stage category action:", e)
            
            return {"errFlag": 0, "message": "Stage Category added successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to add Stage Category"}
    except Exception:
        return {"errFlag": 1, "message": "Error while adding Stage Category"}

# ---------- Update ----------

@production_stage_categories_blueprint.route("/production-stage-categories/update", methods=["POST"])
def updateStageCategory():
    try:
        categoryId = request.form["categoryId"]
        categoryName = request.form["categoryName"]
        stages_json = request.form.get("stages", "[]")
        token = request.form["token"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not categoryId or not categoryName or not token:
        return {"errFlag": 1, "message": "categoryId, categoryName and token are required"}

    # Parse stages
    try:
        stages_list = json.loads(stages_json)
        if not isinstance(stages_list, list):
            stages_list = []
    except Exception:
        stages_list = []

    if not stages_list:
        return {"errFlag": 1, "message": "At least one stage is required"}

    # Validate token
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}
    # fetch old category details for audit log
    try:
        oldCategorydetails = productionStageCategoriesObj.getCategoryDetails(categoryId)
    except Exception:
        return {"errFlag": 1, "message": "Error while fetching category name"}
    try:
        out = productionStageCategoriesObj.updateCategory(categoryId, categoryName, stages_list, adminUserId)
        if isinstance(out, dict):
            return out
        elif out > 0:
            # audit log
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=res[0].get("username", "N/A"),
                    action_type='UPDATE',
                    detail='Updated stage category',
                    object_table='production_stage_categories',
                    object_id=categoryId,
                    old_value={"categoryName": oldCategorydetails[0]["category_name"], "stages": oldCategorydetails[0]["stages"]},
                    new_value={"categoryName": categoryName, "stages": stages_list} 
                                    )
            except Exception as e:
                print("Error logging update stage category action:", e)
            return {"errFlag": 0, "message": "Stage Category updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update Stage Category"}
    except Exception:
        return {"errFlag": 1, "message": "Error while updating Stage Category"}



# ---------- Change Status ----------

@production_stage_categories_blueprint.route("/production-stage-categories/change-status/<categoryId>/<status>/<token>")
def changeStageCategoryStatus(categoryId, status, token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        out = productionStageCategoriesObj.changeCategoryStatus(categoryId, status, adminUserId)
        if out > 0:
            return {"errFlag": 0, "message": "Stage Category status updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update Stage Category status"}
    except Exception:
        return {"errFlag": 1, "message": "Error while updating Stage Category status"}
