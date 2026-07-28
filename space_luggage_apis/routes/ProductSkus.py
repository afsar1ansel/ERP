# //ProductSku.py
from flask import Blueprint, request
from db import db
from classes.ProductSkusClass import productSkuObj
from classes.AdminUsersClass import adminUserObj
import json
from classes.AuditLogClass import auditLogObj

product_skus_blueprint = Blueprint("product_skus", __name__)

@product_skus_blueprint.route("/product-skus/add", methods=["POST"])
def addProductSku():
    try:
        productName = request.form["productName"]
        brandId = request.form["brandId"]
        productCategoryId = request.form["productCategoryId"]
        minStockLevel = request.form.get("minStockLevel", 0)
        productDescription = request.form.get("productDescription", "")
        productImageFile = request.files.get("productImage")
        rawMaterialsJson = request.form.get("rawMaterials", "[]")
        labourFreightCharge = request.form.get("labourFreightCharge", 0)
        token = request.form["token"]
        
        # Parse raw materials JSON
        rawMaterials = json.loads(rawMaterialsJson)
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([productName, brandId, productCategoryId, token]):
        return {"errFlag": 1, "message": "Product name, brand, category and token are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        response = productSkuObj.addProductSku(productName, brandId, productCategoryId, productDescription, productImageFile, rawMaterials, admin_user_id, minStockLevel, labourFreightCharge)
        
        if isinstance(response, dict):
            return response
        elif response > 0:
            #AUDIT LOG IMPLEMENTATION: ADD PRODUCT SKU
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='INSERT',
                    detail=f'Added new Product SKU: {productName}',
                    object_table='product_skus',
                    object_id=response
                )
            except Exception as e:
                print("Error logging product SKU creation action:", e)
            return {"errFlag": 0, "message": "Product SKU added successfully", "productId": response}
        else:
            return {"errFlag": 1, "message": "Failed to add product SKU"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error adding product SKU ","error": str(e)}

@product_skus_blueprint.route("/product-skus/update", methods=["POST"])
def updateProductSku():
    try:
        productId = request.form["productId"]
        productName = request.form["productName"]
        brandId = request.form["brandId"]
        productCategoryId = request.form["productCategoryId"]
        minStockLevel = request.form.get("minStockLevel", 0)
        productDescription = request.form.get("productDescription", "")
        productImageFile = request.files.get("productImage")
        rawMaterialsJson = request.form.get("rawMaterials", "[]")
        labourFreightCharge = request.form.get("labourFreightCharge", 0)
        token = request.form["token"]
        
        # Parse raw materials JSON
        rawMaterials = json.loads(rawMaterialsJson)
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([productId, productName, brandId, productCategoryId, token]):
        return {"errFlag": 1, "message": "All required fields are missing"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    #fetch existing product SKU details for audit log
    try:
        existing_product_sku = productSkuObj.getProductSkuDetails(productId)
    except Exception as e:
        existing_product_sku = None
    try:
        response = productSkuObj.updateProductSku(productId, productName, brandId, productCategoryId, productDescription, productImageFile, rawMaterials, admin_user_id, minStockLevel, labourFreightCharge)
        
        if isinstance(response, dict):
            return response
        elif response > 0:
            #AUDIT LOG IMPLEMENTATION: UPDATE PRODUCT SKU
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='UPDATE',
                    detail=f'Updated Product SKU: {existing_product_sku["product_name"]} to {productName}',
                    object_table='product_skus',
                    object_id=productId,
                    old_value=existing_product_sku[0] if existing_product_sku else None,
                    new_value={
                        "product_name": productName,
                        "product_description": productDescription,
                        "product_image": existing_product_sku["product_image"],
                        "raw_materials": rawMaterials}
                )
            except Exception as e:
                print("Error logging product SKU update action:", e)    
            return {"errFlag": 0, "message": "Product SKU updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update product SKU"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating product SKU"}

@product_skus_blueprint.route("/product-skus/get-all/<token>")
def getAllProductSkus(token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        product_skus = productSkuObj.getAllProductSkus()
        # AUDIT LOG IMPLEMENTATION: GET ALL PRODUCT SKUS
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=admin_user_id,
                adminUsername=admin_user_name,
                action_type='PAGE_VIEW',
                detail='Fetched all product SKUs',
                object_table='product_skus'
            )
        except Exception as e:
            print("Error logging fetch all product SKUs action:", e)
        return [dict(row) for row in product_skus]
    except Exception as e:
        print(e)
        return {"errFlag": 1, "message": " 1Error fetching product SKUs"}

@product_skus_blueprint.route("/product-skus/get-details/<productId>/<token>")
def getProductSkuDetails(productId, token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        product_sku = productSkuObj.getProductSkuDetails(productId)
        if product_sku:
            product_data = dict(product_sku[0])
            # Get raw materials for this product
            raw_materials = productSkuObj.getProductRawMaterials(productId)
            product_data['rawMaterials'] = [dict(row) for row in raw_materials]
            return product_data
        else:
            return {"errFlag": 1, "message": "Product SKU not found"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching product SKU"}

@product_skus_blueprint.route("/product-skus/change-status/<productId>/<status>/<token>")
def changeProductSkuStatus(productId, status, token):
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
    #fetch existing product SKU details for audit log
    try:
        existing_product_sku = productSkuObj.getProductSkuDetails(productId)
    except Exception as e:
        existing_product_sku = None
    try:
        status = int(status)
        response = productSkuObj.changeProductSkuStatus(productId, status)
        
        if response > 0:
            #AUDIT LOG IMPLEMENTATION: PRODUCT SKU STATUS CHANGE
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='UPDATE',
                    detail=f'Updated Product SKU: {existing_product_sku["product_name"]} status to {status}',
                    object_table='product_skus',
                    object_id=productId,
                    old_value=existing_product_sku[0] if existing_product_sku else None,
                    new_value={"status": status}
                )
            except Exception as e:
                print("Error logging product SKU status change action:", e)
            return {"errFlag": 0, "message": "Product SKU status updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update product SKU status"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating product SKU status"}




# =============== BULK UPLOAD PRODUCT SKUS ===============
@product_skus_blueprint.route("/product-skus/bulk-upload", methods=["POST"])
def bulkUploadProductSku():
    try:
        token = request.form["token"]
        excel_file = request.files["excelFile"]
    except Exception:
        return {"errFlag": 1, "message": "Excel file or token missing"}

    # Validate token
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        result = productSkuObj.bulkUploadProductSkus(excel_file, admin_user_id)
        # AUDIT LOG IMPLEMENTATION: BULK UPLOAD PRODUCT SKUS
        try:
            auditLogObj.log_action(
                adminId=admin_user_id,
                adminUsername=admin_user_name,
                action_type='BULK_UPLOAD',
                detail='Bulk uploaded product SKUs via Excel',
                object_table='product_skus'
            )
        except Exception as e:
            print("Error logging bulk upload product SKUs action:", e)
        return result
    except Exception as e:
        print("Error in bulkUploadProductSku route:", e)
        return {"errFlag": 1, "message": "Error uploading product SKUs"}


# =============== DOWNLOAD BULK UPLOAD TEMPLATE ===============
@product_skus_blueprint.route("/product-skus/download-template/<token>", methods=["GET"])
def downloadProductSkuTemplate(token):
    #validate token
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception:   
        return {"errFlag": 1, "message": "Invalid Token"}
    try:
        return productSkuObj.generateBulkUploadTemplate()
    except Exception as e:
        print("Error generating template:", e)
        return {"errFlag": 1, "message": "Error generating Excel template"}
