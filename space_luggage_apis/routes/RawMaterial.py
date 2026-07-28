
from flask import Blueprint, request
from classes.RawMaterialClass import rawMaterialObj
from classes.AdminUsersClass import adminUserObj
from db import db
from datetime import datetime
from sqlalchemy.sql import text
from classes.AuditLogClass import auditLogObj

raw_materials_blueprint = Blueprint("raw_materials", __name__)

@raw_materials_blueprint.route("/raw-materials/add", methods=["POST"])
def addRawMaterial():
    try:
        materialCode = request.form["materialCode"]
        materialName = request.form["materialName"]
        materialDescription = request.form.get("materialDescription", "")
        rawMaterialCategoryId = request.form["rawMaterialCategoryId"]
        vendorIds_str = request.form.get("vendorIds", "")
        specification = request.form.get("specification", "")
        stockQty = request.form.get("stockQty", 0)
        minStockLevel = request.form.get("minStockLevel", "")
        maxStockLevel = request.form.get("maxStockLevel", "")
        unitOfMeasure = request.form["unitOfMeasure"]
        storageLocationId = request.form.get("storageLocationId", "")
        unitCost = request.form.get("unitCost", 0.0)
        materialImageFile = request.files.get("materialImage")
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([materialCode, materialName, rawMaterialCategoryId, unitOfMeasure, token]):
        return {"errFlag": 1, "message": "All required fields are missing"}
    
    try:
        stockQty = float(stockQty) if stockQty else 0
        minStockLevel = float(minStockLevel) if minStockLevel else None
        maxStockLevel = float(maxStockLevel) if maxStockLevel else None
        unitCost = float(unitCost) if unitCost else 0.0
        
        vendorIds = []
        if vendorIds_str:
             vendorIds = [int(v_id.strip()) for v_id in vendorIds_str.split(',') if v_id.strip()]

    except ValueError:
        return {"errFlag": 1, "message": "Invalid numeric format"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        response = rawMaterialObj.addRawMaterial(materialCode, materialName, materialDescription, rawMaterialCategoryId, vendorIds, specification, stockQty, minStockLevel, maxStockLevel, unitOfMeasure, storageLocationId, unitCost, materialImageFile, admin_user_id)
        
        if isinstance(response, dict):
            return response
        elif response > 0:
            #AUDIT LOG IMPLEMENTATION: RAW MATERIAL CREATION
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='INSERT',
                    detail=f'Created new Raw Material: {materialName}',
                    object_table='raw_materials',
                    object_id=response
                )
            except Exception as e:
                print("Error logging raw material creation action:", e)
            return {"errFlag": 0, "message": "Raw material added successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to add raw material"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error adding raw material"}

@raw_materials_blueprint.route("/raw-materials/update", methods=["POST"])
def updateRawMaterial():
    try:
        materialId = request.form["materialId"]
        materialCode = request.form["materialCode"]
        materialName = request.form["materialName"]
        materialDescription = request.form.get("materialDescription", "")
        rawMaterialCategoryId = request.form["rawMaterialCategoryId"]
        vendorIds_str = request.form.get("vendorIds", "")
        specification = request.form.get("specification", "")
        stockQty = request.form.get("stockQty", 0)
        minStockLevel = request.form.get("minStockLevel", "")
        maxStockLevel = request.form.get("maxStockLevel", "")
        unitOfMeasure = request.form["unitOfMeasure"]
        storageLocationId = request.form.get("storageLocationId", "")
        unitCost = request.form.get("unitCost", 0.0)
        materialImageFile = request.files.get("materialImage")
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([materialId, materialCode, materialName, rawMaterialCategoryId, unitOfMeasure, token]):
        return {"errFlag": 1, "message": "All required fields are missing"}
    
    try:
        stockQty = float(stockQty) if stockQty else 0
        minStockLevel = float(minStockLevel) if minStockLevel else None
        maxStockLevel = float(maxStockLevel) if maxStockLevel else None
        unitCost = float(unitCost) if unitCost else 0.0
        
        vendorIds = []
        if vendorIds_str:
             vendorIds = [int(v_id.strip()) for v_id in vendorIds_str.split(',') if v_id.strip()]

    except ValueError:
        return {"errFlag": 1, "message": "Invalid numeric format"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    #fetch existing raw material details for audit log
    try:
        existing_raw_material = rawMaterialObj.getRawMaterialDetails(materialId)
        if existing_raw_material:
            existing_raw_material = dict(existing_raw_material[0])
        else:
            existing_raw_material = None
    except Exception as e:
        existing_raw_material = None
    try:
        response = rawMaterialObj.updateRawMaterial(materialId, materialCode, materialName, materialDescription, rawMaterialCategoryId, vendorIds, specification, stockQty, minStockLevel, maxStockLevel, unitOfMeasure, storageLocationId, unitCost, materialImageFile, admin_user_id)
        
        if isinstance(response, dict):
            return response
        elif response > 0:
            #AUDIT LOG IMPLEMENTATION: RAW MATERIAL UPDATE
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='UPDATE',
                    detail=f'Updated Raw Material: {existing_raw_material["materialName"]} to {materialName}',
                    object_table='raw_materials',
                    object_id=materialId,
                    old_value=existing_raw_material
                    
                )
            except Exception as e:
                print("Error logging raw material update action:", e)
            return {"errFlag": 0, "message": "Raw material updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update raw material"}
    except Exception as e:
        print("Error in updateRawMaterial route:_______________",e)
        return {"errFlag": 1, "message": "Error updating raw material"}

@raw_materials_blueprint.route("/raw-materials/get-all/<token>")
def getAllRawMaterials(token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        raw_materials = rawMaterialObj.getAllRawMaterials()

        #AUDIT LOG IMPLEMENTATION: RAW MATERIAL VIEW (Once per day per page)
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=admin_user_id,
                adminUsername=admin_user_name,
                action_type='PAGE_VIEW',
                detail='Fetched all raw materials',
                object_table='raw_materials'
            )
        except Exception as e:
            print("Error logging fetch all raw materials action:", e)
        return [dict(row) for row in raw_materials]
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching raw materials"}

@raw_materials_blueprint.route("/raw-materials/get-details/<materialId>/<token>")
def getRawMaterialDetails(materialId, token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        raw_material = rawMaterialObj.getRawMaterialDetails(materialId)
        if raw_material:
            return dict(raw_material[0])
        else:
            return {"errFlag": 1, "message": "Raw material not found"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching raw material"}

@raw_materials_blueprint.route("/raw-materials/change-status/<materialId>/<status>/<token>")
def changeRawMaterialStatus(materialId, status, token):
    if status not in ["0", "1"]:
        return {"errFlag": 1, "message": "Status must be 0 or 1"}
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    #fetch existing raw material details for audit log
    try:
        existing_raw_material = rawMaterialObj.getRawMaterialDetails(materialId)
        if existing_raw_material:
            existing_raw_material = dict(existing_raw_material[0])
        else:
            existing_raw_material = None
    except Exception as e:
        existing_raw_material = None
    try:
        status = int(status)
        response = rawMaterialObj.changeRawMaterialStatus(materialId, status)
        
        if response > 0:
            #AUDIT LOG IMPLEMENTATION: RAW MATERIAL STATUS CHANGE
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='STATUS_CHANGE',
                    detail=f'Changed status for Raw Material ID {materialId} from {existing_raw_material["status"]} to {status}.',
                    object_table='raw_materials',
                    object_id=materialId,
                    old_value=existing_raw_material
                )
            except Exception as e:
                print("Error logging raw material status change action:", e)
            return {"errFlag": 0, "message": "Raw material status updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update raw material status"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating raw material status"}

@raw_materials_blueprint.route("/raw-materials/get-by-category-ids", methods=["POST"])
def getRawMaterialByCategoryIds():
    """
    Accepts form-data with:
    - token: "your_auth_token"
    - categoryIds: "1,2,3" (a comma-separated string of numbers)
    
    Returns: {"errFlag": 0, "data": [{...}, {...}]}
    """
    # 1. Parse form data
    try:
        # Get the comma-separated string of IDs and the token from the form
        categoryIds_str = request.form.get("categoryIds")
        token = request.form.get("token")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid form inputs"}

    # 2. Validate that required fields were sent
    if not categoryIds_str or not token:
        return {"errFlag": 1, "message": "categoryIds and token are required fields"}
    
    # 3. Validate the authentication token
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        # adminUserId = res[0]["id"] # Not needed for fetching data, but validation is good practice
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    # 4. Process the categoryIds string into a list of integers
    try:
        # Split the string by commas, remove any whitespace, and convert each part to an integer
        categoryIds = [int(id_str.strip()) for id_str in categoryIds_str.split(',')]
        if not categoryIds:
             return {"errFlag": 1, "message": "categoryIds cannot be empty"}
    except ValueError:
        return {"errFlag": 1, "message": "categoryIds must be a comma-separated string of numbers (e.g., '1,2,3')"}
    
    # 5. Call the class method to fetch data
    try:
        rows = rawMaterialObj.getMaterialsByCategories(categoryIds)
        
        # 6. Format the successful response
        data_to_return = [dict(row) for row in rows]
        return {"errFlag": 0, "data": data_to_return}

    except Exception as e:
        return {"errFlag": 1, "message": "Error while fetching materials"}



####Bulk uploads raw materials via excel sheet
@raw_materials_blueprint.route("/raw-materials/bulk-upload", methods=["POST"])
def bulkUploadRawMaterials():
    try:
        token = request.form["token"]
        if not token:
            return {"errFlag": 1, "message": "Token is required"}
        
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")

        excel_file = request.files.get("file")
        if not excel_file:
            return {"errFlag": 1, "message": "Excel file is missing"}

        #Audit log for bulk upload
        try:
            auditLogObj.log_action(
                adminId=admin_user_id,
                adminUsername=admin_user_name,
                action_type='BULK_UPLOAD',
                detail='Bulk uploaded raw materials via Excel sheet',
                object_table='raw_materials',
                object_id=0
            )
        except Exception as e:
            print("Error logging bulk upload action:", e)
        return rawMaterialObj.bulkUploadRawMaterials(excel_file, admin_user_id)

    except Exception as e:
        print("Bulk upload error:", e)
        return {"errFlag": 1, "message": "Something went wrong"}
    
@raw_materials_blueprint.route("/raw-materials/bulk-upload-template/download/<token>")
def downloadTemplate(token):
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid token"}
    return rawMaterialObj.generateBulkUploadTemplate()
    
