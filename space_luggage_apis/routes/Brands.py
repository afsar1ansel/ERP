from flask import Blueprint, request
from classes.BrandsClass import brandObj
from classes.AdminUsersClass import adminUserObj
from classes.AuditLogClass import auditLogObj 

brands_blueprint = Blueprint("brands", __name__)

@brands_blueprint.route("/brands/get-brands/<token>")
def getBrands(token):
    if token == "":
        return {"errFlag": 1, "message": "token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "") 
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    # AUDIT LOG IMPLEMENTATION: PAGE VIEW (Once per day per page)
    try:
        auditLogObj.check_and_log_daily_action(
        adminId=adminUserId,
        adminUsername=adminUsername,
        action_type='PAGE_VIEW',
        detail='Accessed Brands page',
        object_table='brands',
        object_id=0
        )
    except Exception as e:
        print("Error logging page view:", e)
    try:
        responseData = brandObj.getBrands()
        resJsonData = [dict(row) for row in responseData]
        return resJsonData
    except Exception as e:
        return {"errFlag": 1, "message": "error while fetching brands"}

@brands_blueprint.route("/brands/add-brand", methods=["POST"])
def addBrand():
    try:
        brandName = request.form["brandName"]
        brandCode = request.form["brandCode"]
        brandLogoFile = request.files.get("brandLogo")
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}
    
    if brandName == "" or token == "" or brandCode == "":
        return {"errFlag": 1, "message": "Brand name, brand code and token are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        # brandObj.addBrand returns a dict (error) or last_insert_id (success)
        response = brandObj.addBrand(brandName, brandCode, brandLogoFile, adminUserId)
        
        # Handle both dict (error) and int (success) return types
        if isinstance(response, dict) and response.get("errFlag") == 1:
            return response 
        elif isinstance(response, int) and response > 0:
            new_brand_id = response
            
            #  AUDIT LOG IMPLEMENTATION: CREATE
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUsername,
                    action_type='CREATE',
                    detail=f'Created new Brand: {brandName} (ID: {new_brand_id})',
                    object_table='brands',
                    object_id=new_brand_id, 
                    new_value={'brandName': brandName, 'brandCode': brandCode}
                )
            except Exception as e:
                print("Error logging create action:", e)
                
            return {"errFlag": 0, "message": "Brand Added Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Add Brand"}
    except Exception as e:
        return {"errFlag": 1, "message": "error while adding brand"}

@brands_blueprint.route("/brands/update-brand", methods=["POST"])
def updateBrand():
    try:
        brandId = request.form["brandId"]
        brandName = request.form["brandName"]
        brandCode = request.form["brandCode"]
        brandLogoFile = request.files.get("brandLogo")
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Inputs"}
    
    # Pre-validation for token
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}

    # AUDIT LOG IMPLEMENTATION: PRE-UPDATE (Get old data)
    old_brand_data = brandObj.getBrandDetails(brandId)
    old_value = dict(old_brand_data[0]) if old_brand_data and old_brand_data[0] else None

    try:
        # brandObj.updateBrand returns a dict (error) or rowcount (success)
        response = brandObj.updateBrand(brandId, brandName, brandCode, brandLogoFile, adminUserId)
        
        if isinstance(response, dict) and response.get("errFlag") == 1:
            return response
        
        elif isinstance(response, int) and response > 0:

            # AUDIT LOG IMPLEMENTATION: UPDATE (Post-action)
        
            new_value = {
                'brandName': brandName, 
                'brandCode': brandCode, 
                'logo_changed': brandLogoFile and brandLogoFile.filename != ''
            }
            
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUsername,
                    action_type='UPDATE',
                    detail=f'Updated Brand details for ID: {brandId} ({brandName})',
                    object_table='brands',
                    object_id=brandId,
                    old_value=old_value,
                    new_value=new_value
                )
            except Exception as e:
                print("Error logging update action:", e)
           
            return {"errFlag": 0, "message": "Brand updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update Brand"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while updating brand"}


@brands_blueprint.route("/brands/change-brand-status/<status>/<brandId>/<token>")
def changeBrandStatus(status, brandId, token):
    if token == "" or brandId is None or status is None:
        return {"errFlag": 1, "message": "Missing required parameters"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    #  AUDIT LOG IMPLEMENTATION: PRE-STATUS CHANGE (Get old status)
    old_brand_data = brandObj.getBrandDetails(brandId)
    old_status = old_brand_data[0]['status'] if old_brand_data and old_brand_data[0] else 'N/A'
    new_status = None
    try:
        new_status = int(status)
    except:
         return {"errFlag": 1, "message": "Invalid status value"}
    
    try:
        response = brandObj.changeBrandStatus(brandId, new_status)
    except Exception as e:
        return {"errFlag": 1, "message": "Error Changing Status"} 
    
    if response > 0:
        # AUDIT LOG IMPLEMENTATION: STATUS CHANGE (Post-action)
        auditLogObj.log_action(
            adminId=adminUserId,
            adminUsername=adminUsername,
            action_type='STATUS_CHANGE',
            detail=f'Changed status for Brand ID {brandId} from {old_status} to {new_status}.',
            object_table='brands',
            object_id=brandId,
            old_value={'status': old_status},
            new_value={'status': new_status}
        )
        return {"errFlag": 0, "message": "Status Changed Successfully"}
    else:
        return {"errFlag": 1, "message": "Error Changing Status (no changes made)"}