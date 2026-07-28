from flask import Blueprint, request
from classes.QcTestTypeClass import qcTestTypeObj
from classes.AdminUsersClass import adminUserObj

qc_test_types_blueprint = Blueprint("qc_test_types", __name__)

@qc_test_types_blueprint.route("/qc-test-types/get-qc-test-types/<token>")
def getQcTestTypes(token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = qcTestTypeObj.getQcTestTypes()
        resJsonData = [dict(row) for row in responseData]
        return resJsonData
    except Exception as e:
        print("error ::::::",e)
        return {"errFlag": 1, "message": "Error while fetching QC test types"}

@qc_test_types_blueprint.route("/qc-test-types/add-qc-test-type", methods=["POST"])
def addQcTestType():
    try:
        testTypeName = request.form["testTypeName"]
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid form inputs"}
    
    if not testTypeName or not token:
        return {"errFlag": 1, "message": "testTypeName and token are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = qcTestTypeObj.addQcTestType(testTypeName, adminUserId)
        
        if isinstance(responseData, dict) and responseData.get("errFlag") == 1:
            return responseData
        elif isinstance(responseData, int) and responseData > 0:
            return {"errFlag": 0, "message": "QC Test Type Added Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Add QC Test Type"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while adding QC test type"}

@qc_test_types_blueprint.route("/qc-test-types/update-qc-test-type", methods=["POST"])
def updateQcTestType():
    try:
        testTypeId = request.form["testTypeId"]
        testTypeName = request.form["testTypeName"]
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid form inputs"}
    
    if not testTypeId or not testTypeName or not token:
        return {"errFlag": 1, "message": "testTypeId, testTypeName and token are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = qcTestTypeObj.updateQcTestType(testTypeId, testTypeName, adminUserId)
        
        if isinstance(responseData, dict) and responseData.get("errFlag") == 1:
            return responseData
        elif responseData > 0:
            return {"errFlag": 0, "message": "QC Test Type Updated Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Update QC Test Type"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while updating QC test type"}

@qc_test_types_blueprint.route("/qc-test-types/get-qc-test-type-details/<testTypeId>/<token>")
def getQcTestTypeDetails(testTypeId, token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = qcTestTypeObj.getQcTestTypeDetails(testTypeId)
        
        if responseData:
            return dict(responseData[0])
        else:
            return {"errFlag": 1, "message": "QC test type not found"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while fetching QC test type details"}

@qc_test_types_blueprint.route("/qc-test-types/change-qc-test-type-status/<testTypeId>/<status>/<token>")
def changeQcTestTypeStatus(testTypeId, status, token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = qcTestTypeObj.changeQcTestTypeStatus(testTypeId, status, adminUserId)

        if responseData > 0:
            return {"errFlag": 0, "message": "QC Test Type Status Changed Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Change QC Test Type Status"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while changing QC test type status"}