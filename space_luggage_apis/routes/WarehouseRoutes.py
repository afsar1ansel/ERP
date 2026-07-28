from flask import Blueprint, request
from classes.WarehouseClass import warehouseObj
from classes.AdminUsersClass import adminUserObj

warehouses_blueprint = Blueprint("warehouses", __name__)

@warehouses_blueprint.route("/warehouses/get-warehouses/<token>")
def getWarehouses(token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = warehouseObj.getWarehouses()
        resJsonData = [dict(row) for row in responseData]
        return resJsonData
    except Exception as e:
        return {"errFlag": 1, "message": "Error while fetching warehouses"}

@warehouses_blueprint.route("/warehouses/add-warehouse", methods=["POST"])
def addWarehouse():
    try:
        warehouseName = request.form["warehouseName"]
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid form inputs"}
    
    if not warehouseName or not token:
        return {"errFlag": 1, "message": "warehouseName and token are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token:"}
    
    try:
        responseData = warehouseObj.addWarehouse(warehouseName, adminUserId)
        
        if isinstance(responseData, dict) and responseData.get("errFlag") == 1:
            return responseData
        elif isinstance(responseData, int) and responseData > 0:
            return {"errFlag": 0, "message": "Warehouse Added Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Add Warehouse"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while adding warehouse"}


@warehouses_blueprint.route("/warehouses/update-warehouse", methods=["POST"])
def updateWarehouse():
    try:
        warehouseId = request.form["warehouseId"]
        warehouseName = request.form["warehouseName"]
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid form inputs"}
    
    if not warehouseId or not warehouseName or not token:
        return {"errFlag": 1, "message": "warehouseId, warehouseName and token are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = warehouseObj.updateWarehouse(warehouseId, warehouseName, adminUserId)
        
        if isinstance(responseData, dict) and responseData.get("errFlag") == 1:
            return responseData
        elif responseData > 0:
            return {"errFlag": 0, "message": "Warehouse Updated Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Update Warehouse"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while updating warehouse"}

@warehouses_blueprint.route("/warehouses/get-warehouse-details/<warehouseId>/<token>")
def getWarehouseDetails(warehouseId, token):
    if not token:
        return {"errFlag": 1, "message": "Token is required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        responseData = warehouseObj.getWarehouseDetails(warehouseId)
        
        if responseData:
            return dict(responseData[0])
        else:
            return {"errFlag": 1, "message": "Warehouse not found"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while fetching warehouse details"}

@warehouses_blueprint.route("/warehouses/change-warehouse-status/<warehouseId>/<status>/<token>")
def changeWarehouseStatus(warehouseId, status, token):
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
        responseData = warehouseObj.changeWarehouseStatus(warehouseId, status, adminUserId)

        if responseData > 0:
            return {"errFlag": 0, "message": "Warehouse Status Changed Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Change Warehouse Status"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error while changing warehouse status"}