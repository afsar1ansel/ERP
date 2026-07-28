from flask import Blueprint
from classes.MastersClass import mastersObj
from classes.AdminUsersClass import adminUserObj

masters_blueprint = Blueprint("masters_api", __name__)

@masters_blueprint.route("/masters/get-table-counts/<token>")
def getTableCounts(token):
    """
    API endpoint to get record counts for all master tables
    """
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        counts = mastersObj.getTableCounts()
        return counts
    except Exception:
        return {"errFlag": 1, "message": "Error fetching table counts"}