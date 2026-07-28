from flask import Blueprint, request
from classes.ProductCategoryClass import productCategoryObj
from classes.AdminUsersClass import adminUserObj
from classes.AuditLogClass import auditLogObj

product_categories_blueprint = Blueprint("product_categories", __name__)

@product_categories_blueprint.route("/product-categories/get-categories/<token>")
def getCategories(token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        if not adminUserObj.validateToken(token):
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = adminUserObj.validateToken(token)[0]["id"]
        adminUsername = adminUserObj.validateToken(token)[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = productCategoryObj.getCategoriesWithProductCount()
        # AUDIT LOG IMPLEMENTATION: GET PRODUCT CATEGORIES
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=adminUserId,
                adminUsername=adminUsername,
                action_type='PAGE_VIEW',
                detail='Fetched product categories',
                object_table='product_categories'
            )
        except Exception as e:
            print("Error logging fetch product categories action:", e)
        return [dict(row) for row in responseData]
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching product categories"}

@product_categories_blueprint.route("/product-categories/add-category", methods=["POST"])
def addCategory():
    try:
        categoryName = request.form["productCategoryName"]
        description = request.form.get("productDescription", "")
        imageFile = request.files.get("productCategoryImage")
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
        adminUsername = res[0].get("username", "N/A")   
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = productCategoryObj.addCategory(categoryName, description, imageFile, adminUserId)
        
        if isinstance(responseData, dict) and responseData.get("errFlag") == 1:
            return responseData
        elif responseData > 0:
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUsername,
                    action_type='CREATE',
                    detail=f'Added product category: {categoryName}',
                    object_table='product_categories',
                    object_id=responseData
                )
            except Exception as e:
                print("Error logging add product category action:", e)
            return {"errFlag": 0, "message": "Product Category Added Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Add Product Category"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while adding category"}

@product_categories_blueprint.route("/product-categories/update-category", methods=["POST"])
def updateCategory():
    try:
        categoryId = request.form["categoryId"]
        categoryName = request.form["productCategoryName"]
        description = request.form.get("productDescription", "")
        imageFile = request.files.get("productCategoryImage")
        token = request.form["token"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid form inputs"}
    
    if not categoryId or not categoryName or not token:
        return {"errFlag": 1, "message": "Category ID, Name, and Token are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    #fetch existing category details for audit log
    try:
        existing_category = productCategoryObj.getCategoryDetails(categoryId)
    except Exception as e:
        existing_category = None
    try:
        responseData = productCategoryObj.updateCategory(categoryId, categoryName, description, imageFile, adminUserId)
        
        if isinstance(responseData, dict) and responseData.get("errFlag") == 1:
            return responseData
        elif responseData > 0:
            # AUDIT LOG IMPLEMENTATION: UPDATE PRODUCT CATEGORY
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUsername,
                    action_type='UPDATE',
                    detail=f'Updated product category: {categoryName} (ID: {categoryId})',
                    object_table='product_categories',
                    object_id=categoryId,
                    old_value=existing_category[0] if existing_category else None,
                    new_value={"categoryName": categoryName, "description": description}
                    
                )
            except Exception as e:  
                print("Error logging update product category action:", e)
            return {"errFlag": 0, "message": "Product Category Updated Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Update or no changes were made"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while updating category"}

@product_categories_blueprint.route("/product-categories/get-category-details/<categoryId>/<token>")
def getCategoryDetails(categoryId, token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        if not adminUserObj.validateToken(token):
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = productCategoryObj.getCategoryDetails(categoryId)
        if responseData:
            return dict(responseData[0])
        else:
            return {"errFlag": 1, "message": "Product category not found"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching details"}

@product_categories_blueprint.route("/product-categories/change-category-status/<categoryId>/<status>/<token>")
def changeCategoryStatus(categoryId, status, token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    if status not in ["0", "1"]:
        return {"errFlag": 1, "message": "Status must be 0 or 1"}
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    #get existing category details for audit log
    try:
        existing_category = productCategoryObj.getCategoryDetails(categoryId)
    except Exception as e:
        existing_category = None
    try:
        responseData = productCategoryObj.changeCategoryStatus(categoryId, status, adminUserId)
        if responseData > 0:
            #AUDIT LOG IMPLEMENTATION: CATEGORY STATUS CHANGE
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUsername,
                    action_type='UPDATE',
                    detail=f'Changed status of product category: {existing_category[0]["categoryName"]} (ID: {categoryId})',
                    object_table='product_categories',
                    object_id=categoryId,
                    old_value=existing_category[0] if existing_category else None,
                    new_value={"status": status}
                )
            except Exception as e:
                print("Error logging category status change action:", e)
            return {"errFlag": 0, "message": "Status Changed Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Change Status"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while changing status"}


@product_categories_blueprint.route("/product-categories/get-products-by-category/<categoryId>/<token>")
def getProductsByCategory(categoryId, token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        products = productCategoryObj.getProductsByCategory(categoryId)
        products_list = [dict(row) for row in products]
        
        # Convert counts to integers
        for product in products_list:
            if 'raw_material_count' in product:
                product['raw_material_count'] = int(product['raw_material_count'])
        
        return products_list
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching products by category"}