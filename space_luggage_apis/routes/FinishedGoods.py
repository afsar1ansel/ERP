from flask import Blueprint, request
from classes.FinishedGoodsClass import finishedGoodsObj
from classes.AdminUsersClass import adminUserObj
import json
from classes.AuditLogClass import auditLogObj

finished_goods_blueprint = Blueprint("finished_goods", __name__)

@finished_goods_blueprint.route("/finished-goods/update", methods=["POST"])
def updateFinishedGood():
    try:
        fgId = request.form["fgId"]
        productName = request.form.get("productName")
        productImage = request.files.get("productImage")
        skuCode = request.form.get("skuCode")
        brandId = request.form.get("brandId")
        productCategoryId = request.form.get("productCategoryId")
        minLevel = request.form.get("minLevel")
        maxLevel = request.form.get("maxLevel")
        storageLocationId = request.form.get("storageLocationId")
        unitPrice = request.form.get("unitPrice")
        rawMaterialCost = request.form.get("rawMaterialCost")
        velocity = request.form.get("velocity")
        goodsStatus = request.form.get("goodsStatus")
        lastProduced = request.form.get("lastProduced")
        token = request.form["token"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not fgId or not token:
        return {"errFlag": 1, "message": "fgId and token are required"}

    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    # Audit log implementation: Pre-update (get existing details)
    try:
        existing_fg = finishedGoodsObj.getFinishedGoodDetails(int(fgId))
        if existing_fg:
            existing_fg_data = dict(existing_fg)
        else:
            existing_fg_data = None
    except Exception as e:
        existing_fg_data = None
    try:
        out = finishedGoodsObj.updateFinishedGood(
            fgId, productName, productImage, skuCode,
            brandId, productCategoryId, minLevel, maxLevel,
            storageLocationId, unitPrice, rawMaterialCost, velocity,
            goodsStatus, lastProduced, admin_user_id
        )
        if isinstance(out, dict):
            return out
        elif out > 0:
            # Audit log implementation: Post-update
            try:
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='UPDATE',
                    detail=f'Updated finished good with ID {fgId}.',
                    object_table='finished_goods',
                    object_id=fgId,
                    old_value=existing_fg_data,
                    new_value={
                        "productName": productName,
                        "productImage": productImage,
                        "skuCode": skuCode}
                )
            except Exception as e:
                print("Error logging finished good update action:", e)
            return {"errFlag": 0, "message": "Finished good updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update finished good"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating finished good"}


@finished_goods_blueprint.route("/finished-goods/get-all/<token>")
def getAllFinishedGoods(token):
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        rows = finishedGoodsObj.getAllFinishedGoods()
        # AUDIT LOG IMPLEMENTATION: GET ALL FINISHED GOODS
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=admin_user_id,
                adminUsername=admin_user_name,
                action_type='PAGE_VIEW',
                detail='Fetched all finished goods',
                object_table='finished_goods'
            )
        except Exception as e:
            print("Error logging fetch all finished goods action:", e)
        return [dict(r) for r in rows]
    except Exception as e:
        print("Error in getAllFinishedGoods route:", e)
        return {"errFlag": 1, "message": "Error fetching finished goods ", "e": str(e)}


@finished_goods_blueprint.route("/finished-goods/get-details/<fgId>/<token>")
def getFinishedGoodDetails(fgId, token):
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        out = finishedGoodsObj.getFinishedGoodDetails(int(fgId))
        if out:
            return out
        else:
            return {"errFlag": 1, "message": "Finished good not found"}
    except Exception as e:
        print("Error in getFinishedGoodDetails route:", e)
        return {"errFlag": 1, "message": "Error fetching finished good details"}


@finished_goods_blueprint.route("/finished-goods/change-status/<fgId>/<status>/<token>")
def changeFinishedGoodStatus(fgId, status, token):
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
        admin_user_name = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}
    if status not in ["0", "1"]:
        return {"errFlag": 1, "message": "Status must be 0 or 1"}
    
    # for audit log: get existing finished good details
    try:
        existing_fg = finishedGoodsObj.getFinishedGoodDetails(int(fgId))
        if existing_fg:
            existing_fg_data = dict(existing_fg)
        else:
            existing_fg_data = None
    except Exception as e:
        existing_fg_data = None
    try:
        out = finishedGoodsObj.changeFinishedGoodStatus(fgId, status, admin_user_id)
        if out > 0:
            # AUDIT LOG IMPLEMENTATION: FINISHED GOOD STATUS CHANGE
            try:
                old_status = existing_fg_data['goodsStatus'] if existing_fg_data else 'N/A'
                auditLogObj.log_action(
                    adminId=admin_user_id,
                    adminUsername=admin_user_name,
                    action_type='STATUS_CHANGE',
                    detail=f'Changed status for Finished Good ID {fgId} from {old_status} to {status}.',
                    object_table='finished_goods',
                    object_id=fgId
                )
            except Exception as e:
                print("Error logging finished good status change action:", e)
            return {"errFlag": 0, "message": "Finished good status changed successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to change finished good status"}
    except Exception as e:
        print("Error in changeFinishedGoodStatus route:", e)
        return {"errFlag": 1, "message": "Error changing finished good status"}
    

@finished_goods_blueprint.route("/finished-goods/stock-adjust", methods=["POST"])
def adjust_finished_goods_stock():
    """
    adjustmentType: 'increase' or 'decrease'
    adjustmentQty: positive number (e.g. 5)
    """
    try:
        token = request.form.get('token')
        finished_good_id = request.form.get('finishedGoodId')
        adjustment_type = request.form.get('adjustmentType')
        adjustment_qty = request.form.get('adjustmentQty')
        reason = request.form.get('reason')
        notes = request.form.get('notes')
    except Exception:
        return {"errFlag": 1, "message": "Invalid inputs."}

    if not token or not finished_good_id or not adjustment_type or not adjustment_qty:
        return {"errFlag": 1, "message": "token, finishedGoodId, adjustmentType and adjustmentQty are required."}

    # validate token
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]['id']
        admin_user_name = res[0].get("username", "N/A")
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        out = finishedGoodsObj.adjust_stock( finished_good_id,adjustment_type,
                                            adjustment_qty, admin_user_id,reason,notes
        )
        # AUDIT LOG IMPLEMENTATION: FINISHED GOOD STOCK ADJUSTMENT
        try:
            auditLogObj.log_action(
                adminId=admin_user_id,
                adminUsername=admin_user_name,
                action_type='STOCK_ADJUSTMENT',
                detail=f'Adjusted stock for Finished Good ID {finished_good_id} by {adjustment_qty} ({adjustment_type}). Reason: {reason}. Notes: {notes}',
                object_table='finished_goods',
                object_id=finished_good_id
            )
        except Exception as e:
            print("Error logging finished good stock adjustment action:", e)
        return out
    except Exception as e:
        print("Error in adjust_finished_goods_stock route:", e)
        return {"errFlag": 1, "message": "Error processing adjustment."}

#finished goods  stock adjustment logs


@finished_goods_blueprint.route("/finished-goods/get-fg-stock-adjustments/<token>")
def getAllFGStockAdjustmentsLogs(token):
    """
    API to fetch all finished goods stock adjustment logs.
    """
    if not token:
        return {"errFlag": 1, "message": "Token is required"}

    # Validate admin token
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    # Fetch stock adjustments
    try:
        rows = finishedGoodsObj.getAllFGStockAdjustments()
        return rows
    except Exception as e:
        print("Error in getAllFGStockAdjustments:", e)
        return {"errFlag": 1, "message": "Error fetching stock adjustment logs"}        