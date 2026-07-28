from flask import Flask
from flask_cors import CORS
from db import db
from dotenv import load_dotenv
import os

# Import Blueprints
from routes.AdminUsers import adminUsers_blueprint
from routes.Brands import brands_blueprint
from routes.UnitOfMeasurement import units_blueprint
from routes.RawMaterialCategory import raw_material_categories_blueprint
from routes.ProductCategory import product_categories_blueprint
from routes.Jobs import jobs_blueprint
from routes.Departments import departments_blueprint
from routes.Employees import employees_blueprint
from routes.WarehouseRoutes import warehouses_blueprint
from routes.StorageLocation import storage_locations_blueprint
from routes.RawMaterial import raw_materials_blueprint
from routes.Vendors import vendors_blueprint
from routes.ProductSkus import product_skus_blueprint
from routes.PurchaseOrder import purchase_orders_blueprint
from routes.Clients import clients_blueprint
from routes.Dispatch import dispatch_blueprint
from routes.ProductionStage import production_stage_blueprint
from routes.ProductionBatch import production_batches_blueprint
from routes.QcTestType import qc_test_types_blueprint
from routes.FinishedGoods import finished_goods_blueprint
from routes.QcRecords import qc_records_blueprint
from routes.VendorStockReceipts import vendor_stock_receipts_blueprint
from routes.DefectType import defect_types_blueprint
from routes.ProductionReceipts import production_receipts_blueprint
from routes.CompanyInfoSettings import company_info_blueprint
from routes.Global import global_search_blueprint
from routes.Masters import masters_blueprint
from routes.Reports import reports_blueprint   
from routes.Dashboard import dashboard_blueprint
from routes.ScheduleReports import schedule_reports_blueprint
from routes.AdminRolePages import admin_role_pages_blueprint
from routes.AdminRole import admin_roles_blueprint
from routes.ClientTypes import client_types_blueprint
from routes.PaymentTerms import payment_terms_blueprint
from routes.AuditLogs import auditlogs_blueprint
from routes.Order import orders_blueprint
from routes.ProductionStageCategories import production_stage_categories_blueprint
from routes.AIChat import ai_chat_blueprint



load_dotenv()

app = Flask(__name__)
CORS(app)

# DB Configuration

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DB_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
app.config['USE_X_SENDFILE'] = False

db.init_app(app)

# Register Blueprints
app.register_blueprint(adminUsers_blueprint , url_prefix='/api')
app.register_blueprint(brands_blueprint , url_prefix='/api')
app.register_blueprint(units_blueprint , url_prefix='/api')
app.register_blueprint(raw_material_categories_blueprint , url_prefix='/api')
app.register_blueprint(product_categories_blueprint , url_prefix='/api')
app.register_blueprint(jobs_blueprint , url_prefix='/api')
app.register_blueprint(departments_blueprint , url_prefix='/api')
app.register_blueprint(employees_blueprint , url_prefix='/api')
app.register_blueprint(warehouses_blueprint , url_prefix='/api')
app.register_blueprint(storage_locations_blueprint , url_prefix='/api')
app.register_blueprint(raw_materials_blueprint , url_prefix='/api')
app.register_blueprint(vendors_blueprint , url_prefix='/api')
app.register_blueprint(product_skus_blueprint , url_prefix='/api')
app.register_blueprint(purchase_orders_blueprint , url_prefix='/api')
app.register_blueprint(clients_blueprint , url_prefix='/api')
app.register_blueprint(dispatch_blueprint , url_prefix='/api')
app.register_blueprint(production_stage_blueprint , url_prefix='/api')
app.register_blueprint(production_batches_blueprint , url_prefix='/api')
app.register_blueprint(qc_test_types_blueprint , url_prefix='/api')
app.register_blueprint(finished_goods_blueprint , url_prefix='/api')
app.register_blueprint(qc_records_blueprint  , url_prefix='/api')
app.register_blueprint(vendor_stock_receipts_blueprint , url_prefix='/api')
app.register_blueprint(defect_types_blueprint , url_prefix='/api')
app.register_blueprint(production_receipts_blueprint , url_prefix='/api')
app.register_blueprint(company_info_blueprint   , url_prefix='/api')
app.register_blueprint(global_search_blueprint , url_prefix='/api')
app.register_blueprint(masters_blueprint    , url_prefix='/api')
app.register_blueprint(reports_blueprint    , url_prefix='/api')
app.register_blueprint(dashboard_blueprint    , url_prefix='/api')
app.register_blueprint(schedule_reports_blueprint    , url_prefix='/api')
app.register_blueprint(admin_role_pages_blueprint , url_prefix='/api')
app.register_blueprint(admin_roles_blueprint , url_prefix='/api')
app.register_blueprint(client_types_blueprint, url_prefix='/api')
app.register_blueprint(payment_terms_blueprint, url_prefix='/api')
app.register_blueprint(auditlogs_blueprint , url_prefix='/api')
app.register_blueprint(orders_blueprint , url_prefix='/api')
app.register_blueprint(production_stage_categories_blueprint , url_prefix='/api')
app.register_blueprint(ai_chat_blueprint, url_prefix='/api')




@app.route('/server-status')
def serverStatus():
    return "Server is running"


@app.cli.command("reset-coffee-db")
def reset_coffee_db_cli():
    """CLI command to purge luggage domain mock data and initialize Coffee ERP default admin."""
    from scripts.reset_for_coffee_domain import reset_database_for_coffee_domain
    reset_database_for_coffee_domain()


if __name__ == '__main__':
    app.run(debug=True,port=8090) # host='0.0.0.0'

