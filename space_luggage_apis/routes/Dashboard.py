# File: Dashboard.py
from flask import Blueprint, request
from classes.AdminUsersClass import adminUserObj
from classes.DashboardClass import dashboardObj
from classes.AuditLogClass import auditLogObj

from sqlalchemy.sql import text

dashboard_blueprint = Blueprint("dashboard", __name__)


# Low stock : raw materials and finished goods 
@dashboard_blueprint.route("/dashboard/low-stock", methods=["POST"])
def low_stock_dashboard():
    '''
     Fetch raw materials and finished goods that
     are below or at their minimum stock levels.'''
     
    token = request.form.get('token')
    if not token:
        return {"errFlag":1, "message":"Token is required"}
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag":1, "message":"Invalid Token"}
    except Exception:
        return {"errFlag":1, "message":"Invalid Token"}

    try:
        # optional limit
        limit = int(request.form.get('limit', 8))
        data = dashboardObj.get_low_stock(limit=limit)

        return {
            "errFlag": 0,
            "raw_materials": data['raw_materials'],
            "finished_goods": data['finished_goods']
        }
    except Exception as e:
        print("Error in low_stock_dashboard:", e)
        return {"errFlag":1, "message": "Error fetching low stock"}


# Critical production 
@dashboard_blueprint.route("/dashboard/critical-production", methods=["POST"])
def critical_production():
    token = request.form.get('token')
    if not token:
        return {"errFlag":1, "message":"Token is required"}
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag":1, "message":"Invalid Token"}
    except Exception:
        return {"errFlag":1, "message":"Invalid Token"}

    try:
        rows = dashboardObj.get_critical_production()
        return {"errFlag":0, "due_soon": rows}
    except Exception as e:
        print("Error in critical_production:", e)
        return {"errFlag":1, "message":"Error fetching critical production orders"}


#Recent activities: GRN, PO, QC, Production, RMCR
@dashboard_blueprint.route("/dashboard/recent-activities", methods=["POST"])
def recent_activities():
    token = request.form.get('token')
    if not token:
        return {"errFlag":1, "message":"Token is required"}
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag":1, "message":"Invalid Token"}
    except Exception:
        return {"errFlag":1, "message":"Invalid Token"}

    try:
        since_days = int(request.form.get('since_days', 7))
        rows = dashboardObj.get_recent_activities(since_days=since_days, limit=50)
        return {"errFlag":0, "activities": rows}
    except Exception as e:
        print("Error in recent_activities:", e)
        return {"errFlag":1, "message":"Error fetching activities"}


@dashboard_blueprint.route("/dashboard/stats", methods=["POST"])
def dashboard_stats():
    '''
    Fetch key dashboard statistics:
    1. Total Production
    2. Low Stock Alert Count
    3. QC Pass Rate
    4. Avg. Vendor On-Time %
    '''
    
    token = request.form.get('token')
    if not token:
        return {"errFlag":1, "message":"Token is required"}
    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag":1, "message":"Invalid Token"}
        adminUserId = res[0]['id']
        adminUsername = res[0].get('username', 'N/A')
    except Exception:
        return {"errFlag":1, "message":"Invalid Token"}

    try:
        stats = dashboardObj.get_dashboard_stats()

        # AUDIT LOG IMPLEMENTATION: GET DASHBOARD STATS
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=adminUserId,
                adminUsername=adminUsername,
                action_type='PAGE_VIEW',
                detail='Fetched dashboard stats',
                object_table='dashboard_stats'
            )
        except Exception as e:
            print("Error logging fetch dashboard stats action:", e)
        return {"errFlag":0, "stats": stats}
    except Exception as e:
        print("Error in dashboard_stats:", e)
        return {"errFlag":1, "message":"Error fetching dashboard stats"}