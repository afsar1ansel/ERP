from flask import Blueprint, request, json
from classes.VendorsClass import vendorObj
from classes.AdminUsersClass import adminUserObj
import cloudinary.uploader
import os
from werkzeug.utils import secure_filename
from sqlalchemy import text
from collections import defaultdict
import pandas as pd
from openpyxl import Workbook
from flask import send_file
from io import BytesIO
from flask import send_file, make_response
import json
from helper.files import send_workbook_response
from openpyxl.worksheet.datavalidation import DataValidation
from classes.AuditLogClass import auditLogObj

vendors_blueprint = Blueprint("vendors", __name__)

@vendors_blueprint.route("/vendors/get-vendors/<token>")
def getVendors(token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0]["username"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = vendorObj.getVendors()
        resJsonData = [dict(row) for row in responseData]
        
        # AUDIT LOG IMPLEMENTATION: PAGE VIEW (Once per day per page)
        try:
            auditLogObj.check_and_log_daily_action(
            adminId=adminUserId,
            adminUsername=adminUsername,
            action_type='PAGE_VIEW',
            detail='Accessed Vendors page',
            object_table='vendors',
            object_id=0
            )
        except Exception as e:
            print("Error logging page view:", e)
            
        return resJsonData
    except Exception as e:
        return {"errFlag": 1, "message": "Error while fetching vendors"}

@vendors_blueprint.route("/vendors/add-vendor", methods=["POST"])
def addVendor():
    try:
        vendorName = request.form["vendorName"]
        contactPerson = request.form["contactPerson"]
        email = request.form.get("email", "")
        phone = request.form["phone"]
        address = request.form.get("address", "")
        city = request.form.get("city", "")
        state = request.form.get("state", "")
        pincode = request.form.get("pincode", "")
        gstNo = request.form.get("gstNo", "")
        panNo = request.form.get("panNo", "")
        bankName = request.form.get("bankName", "")
        accountNo = request.form.get("accountNo", "")
        ifscCode = request.form.get("ifscCode", "")
        paymentTerms = request.form.get("paymentTerms", "")
        creditLimit = request.form.get("creditLimit", 0)
        notes = request.form.get("notes", "")
        token = request.form["token"]
        
        # Handle vendor logo file upload
        vendorLogoFile = request.files.get("vendorLogo")
        
        # Parse raw materials if provided
        raw_materials = []
        raw_materials_json = request.form.get("raw_materials", "[]")
        try:
            raw_materials = json.loads(raw_materials_json)
        except:
            raw_materials = []
            
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid form inputs"}
    
    if not vendorName or not contactPerson or not phone or not token:
        return {"errFlag": 1, "message": "All fields are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0]["username"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = vendorObj.addVendor(
            vendorName, contactPerson, email, phone,
            address, city, state, pincode, gstNo, panNo, bankName, accountNo,
            ifscCode, paymentTerms, creditLimit, notes, adminUserId, vendorLogoFile, raw_materials
        )
        
        if isinstance(responseData, dict) and responseData.get("errFlag") == 1:
            return responseData
        elif isinstance(responseData, int) and responseData > 0:
            # AUDIT LOG IMPLEMENTATION: ADD VENDOR
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUsername,
                    action_type='INSERT',
                    detail=f'Added new vendor: {vendorName}',
                    object_table='vendors',
                    object_id=responseData
                    
                )
            except Exception as e:
                print("Error logging add vendor action:", e)
            return {"errFlag": 0, "message": "Vendor Added Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Add Vendor"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while adding vendor"}

@vendors_blueprint.route("/vendors/update-vendor", methods=["POST"])
def updateVendor():
    try:
        vendorId = request.form["vendorId"]
        vendorName = request.form["vendorName"]
        contactPerson = request.form["contactPerson"]
        email = request.form.get("email", "")
        phone = request.form["phone"]
        brandId = request.form.get("brandId")
        address = request.form.get("address", "")
        city = request.form.get("city", "")
        state = request.form.get("state", "")
        pincode = request.form.get("pincode", "")
        gstNo = request.form.get("gstNo", "")
        panNo = request.form.get("panNo", "")
        bankName = request.form.get("bankName", "")
        accountNo = request.form.get("accountNo", "")
        ifscCode = request.form.get("ifscCode", "")
        paymentTerms = request.form.get("paymentTerms", "")
        creditLimit = request.form.get("creditLimit", 0)
        notes = request.form.get("notes", "")
        token = request.form["token"]
        
        # Handle vendor logo file upload
        vendorLogoFile = request.files.get("vendorLogo")
        
        # Parse raw materials if provided
        raw_materials = []
        raw_materials_json = request.form.get("raw_materials", "[]")
        try:
            raw_materials = json.loads(raw_materials_json)
        except:
            raw_materials = None  # Use None to indicate no materials were provided
            
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid form inputs"}
    
    if not vendorId or not vendorName or not contactPerson or not phone or not token:
        return {"errFlag": 1, "message": "All fields are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0]["username"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = vendorObj.updateVendor(
            vendorId, vendorName, contactPerson, email, phone,
            address, city, state, pincode, gstNo, panNo, bankName, accountNo,
            ifscCode, paymentTerms, creditLimit, notes, adminUserId, vendorLogoFile, raw_materials
        )
        
        if isinstance(responseData, dict) and responseData.get("errFlag") == 1:
            return responseData
        elif responseData > 0:
            # AUDIT LOG IMPLEMENTATION: UPDATE VENDOR
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUsername,
                    action_type='UPDATE',
                    detail=f'Updated vendor: {vendorName} (ID: {vendorId})',
                    object_table='vendors',
                    object_id=vendorId
                )
            except Exception as e:
                print("Error logging update vendor action:", e)
            return {"errFlag": 0, "message": "Vendor Updated Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Update Vendor"}
    except Exception as e:
        print("Error updating vendor________________:", e)
        return {"errFlag": 1, "message": "Error while updating vendor"}

@vendors_blueprint.route("/vendors/get-vendor-details/<vendorId>/<token>")
def getVendorDetails(vendorId, token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = vendorObj.getVendorDetails(vendorId)
        
        if responseData:
            return responseData
        else:
            return {"errFlag": 1, "message": "Vendor not found"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while fetching vendor details"}

@vendors_blueprint.route("/vendors/change-vendor-status/<vendorId>/<status>/<token>")
def changeVendorStatus(vendorId, status, token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    if status not in ['0', '1']:
        return {"errFlag": 1, "message": "Invalid status value"}
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0]["username"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    #  AUDIT LOG IMPLEMENTATION: PRE-STATUS CHANGE (Get old status)
    old_vendor_data = vendorObj.getVendorDetails(vendorId)
    old_status = old_vendor_data['status'] if old_vendor_data else 'N/A'
    try:
        responseData = vendorObj.changeVendorStatus(vendorId, status, adminUserId)

        if responseData > 0:
            # AUDIT LOG IMPLEMENTATION: CHANGE VENDOR STATUS
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUsername,
                    action_type='STATUS_CHANGE',
                    detail=f'Changed status for Vendor ID {vendorId} to {status}.',
                    object_table='vendors',
                    object_id=vendorId,
                    old_value={'status': old_status},  
                    new_value={'status': status}
                )
            except Exception as e:
                print("Error logging change vendor status action:", e)
            return {"errFlag": 0, "message": "Vendor Status Changed Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Change Vendor Status"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while changing vendor status"}
    

#### Bulk upload vendors via excel sheet
@vendors_blueprint.route("/vendors/bulk-upload", methods=["POST"])
def bulkUploadVendors():
    try:
        token = request.form["token"]
        if not token:
            return {"errFlag": 1, "message": "Token is required"}
        
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid token"}
        admin_user_id = res[0]["id"]
        admin_username = res[0]["username"]
        excel_file = request.files.get("file")
        if not excel_file:
            return {"errFlag": 1, "message": "Excel file is missing"}

        #Audit log for bulk upload
        try:
            auditLogObj.log_action(
                adminId=admin_user_id,
                adminUsername=admin_username,
                action_type='BULK_UPLOAD',
                detail='Bulk uploaded vendors via Excel sheet',
                object_table='vendors',
                object_id=0
            )
        except Exception as e:
            print("Error logging bulk upload action:", e)
        return vendorObj.bulkUploadVendors(excel_file, admin_user_id)

    except Exception as e:
        print("Bulk upload error:", e)
        return {"errFlag": 1, "message": "Something went wrong"}
    
@vendors_blueprint.route("/vendors/bulk-upload-template/download/<token>")
def downloadVendorTemplate(token):
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid token"}
    except Exception:
        return {"errFlag": 1, "message": "Invalid token"}
    return vendorObj.generateBulkUploadTemplate()