from flask import Blueprint, request
from classes.CompanyInfoSettingsClass import companyInfoObj
from classes.AdminUsersClass import adminUserObj
from classes.AuditLogClass import auditLogObj

company_info_blueprint = Blueprint("company_info", __name__)

@company_info_blueprint.route("/company-info/get/<token>")
def getCompanyInfo(token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}

    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        out = companyInfoObj.getCompanyInfo()
        if out:
            # AUDIT LOG IMPLEMENTATION: GET COMPANY INFO
            try:
                auditLogObj.check_and_log_daily_action(
                    adminId=adminUserId,
                    adminUsername=adminUsername,
                    action_type='PAGE_VIEW',
                    detail='Fetched company info',
                    object_table='company_info'
                )
            except Exception as e:
                print("Error logging fetch company info action:", e)
            return out
        else:
            return {"errFlag": 0, "message": "No company info found", "data": None}
    except Exception as e:
        print("Error fetching company info:", e)
        return {"errFlag": 1, "message": "Error fetching company info"}


@company_info_blueprint.route("/company-info/upsert", methods=["POST"])
def updateCompanyInfo():
    try:
        companyName = request.form.get("companyName")
        gstin = request.form.get("gstin")
        phone = request.form.get("phone")
        email = request.form.get("email")
        address = request.form.get("address")
        token = request.form["token"]

        # Logo upload (optional file)
        companyLogoFile = request.files.get("companyLogo")
    except Exception:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not companyName or not token:
        return {"errFlag": 1, "message": "companyName and token are required"}

    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    # Handle logo file upload if provided
    logo_url = None
    logo_public_id = None
    try:
        if companyLogoFile and companyLogoFile.filename != '':
            upload_res = companyInfoObj.upload_company_logo(companyLogoFile)
            if isinstance(upload_res, dict) and upload_res.get("errFlag") == 1:
                return upload_res
            logo_url = upload_res.get("url")
            logo_public_id = upload_res.get("public_id")
    except Exception as e:
        print("Logo upload error in route:", e)
        return {"errFlag": 1, "message": "Error uploading logo"}

    try:
        out = companyInfoObj.upsertCompanyInfo(
            companyName, gstin, phone, email, address,
            logo_url, logo_public_id, admin_user_id
        )

        if isinstance(out, dict) and out.get("errFlag") == 1:
            return out
        elif isinstance(out, int) and out > 0:
            return {"errFlag": 0, "message": "Company info saved successfully", "companyId": out}
        elif out > 0:
            # AUDIT LOG IMPLEMENTATION: UPDATE COMPANY INFO
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='UPDATE',
                    detail='Updated company info',
                    object_table='company_info',
                    object_id=out
                )
            except Exception as e:
                print("Error logging update company info action:", e)
            return {"errFlag": 0, "message": "Company info updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to save company info"}
    except Exception as e:
        print("Error in updateCompanyInfo route:", e)
        return {"errFlag": 1, "message": "Error saving company info"}
