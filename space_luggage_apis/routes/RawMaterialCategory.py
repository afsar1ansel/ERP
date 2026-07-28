
from flask import Blueprint, request
from classes.RawMaterialCategoryClass import rawMaterialCategoryObj
from classes.AdminUsersClass import adminUserObj
from classes.AuditLogClass import auditLogObj

raw_material_categories_blueprint = Blueprint("raw_material_categories", __name__)

@raw_material_categories_blueprint.route("/raw-material-categories/get-categories/<token>")
def getCategories(token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        # Validate token
        res=adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUserName = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = rawMaterialCategoryObj.getCategories()
        # AUDIT LOG IMPLEMENTATION: GET CATEGORIES
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=adminUserId,
                adminUsername=adminUserName,
                action_type='PAGE_VIEW',
                detail='Fetched raw material categories',
                object_table='raw_material_categories'
            )
        except Exception as e:
            print("Error logging fetch categories action:", e)
        return [dict(row) for row in responseData]
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching categories"}

@raw_material_categories_blueprint.route("/raw-material-categories/add-category", methods=["POST"])
def addCategory():
    try:
        categoryName = request.form["categoryName"]
        categoryDescription = request.form.get("categoryDescription", "") # Optional field
        categoryImageFile = request.files.get("categoryImage") # Optional file
        token = request.form["token"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid form inputs"}
    
    if not categoryName or not token:
        return {"errFlag": 1, "message": "Category Name and Token are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUserName = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = rawMaterialCategoryObj.addCategory(categoryName, categoryDescription, categoryImageFile, adminUserId)
        
        if isinstance(responseData, dict) and responseData.get("errFlag") == 1:
            return responseData
        elif responseData > 0:
            # AUDIT LOG IMPLEMENTATION: ADD CATEGORY
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUserName,
                    action_type='CREATE',
                    detail=f'Added new raw material category: {categoryName}',
                    object_table='raw_material_categories',
                    object_id=responseData
                )
            except Exception as e:
                print("Error logging add category action:", e)
            return {"errFlag": 0, "message": "Category Added Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Add Category"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while adding category"}

@raw_material_categories_blueprint.route("/raw-material-categories/update-category", methods=["POST"])
def updateCategory():
    try:
        categoryId = request.form["categoryId"]
        categoryName = request.form["categoryName"]
        categoryDescription = request.form.get("categoryDescription", "")
        categoryImageFile = request.files.get("categoryImage")
        token = request.form["token"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid form inputs"}
    
    if not categoryId or not categoryName or not token:
        return {"errFlag": 1, "message": "Category ID, Category Name, and Token are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUserName = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    #fetch existing category details for audit log
    try:
        existing_category = rawMaterialCategoryObj.getCategoryDetails(categoryId)
    except Exception as e:
        existing_category = None
    try:
        responseData = rawMaterialCategoryObj.updateCategory(categoryId, categoryName, categoryDescription, categoryImageFile, adminUserId)
        
        if isinstance(responseData, dict) and responseData.get("errFlag") == 1:
            return responseData
        elif responseData > 0:
            # AUDIT LOG IMPLEMENTATION: UPDATE CATEGORY
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUserName,
                    action_type='UPDATE',
                    detail=f'Updated raw material category: {categoryName} (ID: {categoryId})',
                    object_table='raw_material_categories',
                    object_id=categoryId,
                    old_value=existing_category[0] if existing_category else None,
                    new_value={'categoryName': categoryName, 'categoryDescription': categoryDescription}    
                )
            except Exception as e:
                print("Error logging update category action:", e)
            return {"errFlag": 0, "message": "Category Updated Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Update Category or no changes were made"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while updating category"}

@raw_material_categories_blueprint.route("/raw-material-categories/get-category-details/<categoryId>/<token>")
def getCategoryDetails(categoryId, token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        if not adminUserObj.validateToken(token):
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = rawMaterialCategoryObj.getCategoryDetails(categoryId)
        if responseData:
            return dict(responseData[0])
        else:
            return {"errFlag": 1, "message": "Category not found"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching category details"}

@raw_material_categories_blueprint.route("/raw-material-categories/change-category-status/<categoryId>/<status>/<token>")
def changeCategoryStatus(categoryId, status, token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUserName = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    #fetch existing category details for audit log
    try:
        existing_category = rawMaterialCategoryObj.getCategoryDetails(categoryId)
    except Exception as e:
        existing_category = None
    try:
        responseData = rawMaterialCategoryObj.changeCategoryStatus(categoryId, status, adminUserId)
        if responseData > 0:
            # AUDIT LOG IMPLEMENTATION: CHANGE CATEGORY STATUS
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUserName,
                    action_type='STATUS_CHANGE',
                    detail=f'Changed status for Raw Material Category ID {categoryId} to {status}.',
                    object_table='raw_material_categories',
                    object_id=categoryId,
                    old_value=existing_category[0] if existing_category else None,
                    new_value={'status': status}
                )
            except Exception as e:
                print("Error logging change category status action:", e)
            return {"errFlag": 0, "message": "Status Changed Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Change Status"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while changing status"}
    
@raw_material_categories_blueprint.route("/raw-material-categories/get-materials-by-category/<categoryId>/<token>")
def getMaterialsByCategory(categoryId, token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        materials = rawMaterialCategoryObj.getMaterialsByCategory(categoryId)
        materials_list = [dict(row) for row in materials]
        
        # Convert counts to integers
        for material in materials_list:
            if 'used_in_products_count' in material:
                material['used_in_products_count'] = int(material['used_in_products_count'])
        
        return materials_list
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching materials by category"}    
