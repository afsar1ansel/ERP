import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def seed_bean_good_database():
    db_uri = os.getenv('DB_URI') or os.getenv('DATABASE_URL')
    host = os.getenv('MYSQL_HOST', 'localhost')
    user = os.getenv('MYSQL_USER', 'root')
    password = os.getenv('MYSQL_PASSWORD', 'admin123')
    database = os.getenv('MYSQL_DB', os.getenv('MYSQL_DATABASE', 'space_luggage_db'))
    port = int(os.getenv('MYSQL_PORT', '3306'))

    if db_uri and 'mysql' in db_uri:
        try:
            clean_uri = db_uri.split('://')[1]
            if '@' in clean_uri:
                user_pass, host_db = clean_uri.split('@')
                if ':' in user_pass:
                    user, password = user_pass.split(':', 1)
                else:
                    user = user_pass
                
                if '/' in host_db:
                    host_port, database = host_db.split('/', 1)
                    if '?' in database:
                        database = database.split('?')[0]
                    if ':' in host_port:
                        host, port_str = host_port.split(':')
                        port = int(port_str)
                    else:
                        host = host_port
        except Exception as e:
            print("Notice: Error parsing DB_URI string, using default env fallback parameters:", e)

    conn = pymysql.connect(host=host, user=user, password=password, database=database, port=port)


    statements = [
        "SET FOREIGN_KEY_CHECKS = 0;",
        "TRUNCATE TABLE units_of_measurement;",
        """INSERT INTO units_of_measurement (id, unit_name, status, created_admin_id) VALUES
        (1, "KG", 1, 1),
        (2, "Grams", 1, 1),
        (3, "Liters", 1, 1),
        (4, "Sachets / Pouches", 1, 1),
        (5, "Bottles (250ml)", 1, 1),
        (6, "Retail Boxes (10x Sachet)", 1, 1),
        (7, "Jute Bags (60kg)", 1, 1),
        (8, "Outer Master Cartons", 1, 1);""",

        "TRUNCATE TABLE storage_locations;",
        """INSERT INTO storage_locations (id, aisle_no, rack_no, row_no, capacity, current_occupancy, status, created_admin_id) VALUES
        (1, "Aisle-A", "Rack-1", "Row-1", 10000.00, 3500, 1, 1),
        (2, "Aisle-A", "Rack-2", "Row-1", 5000.00, 1800, 1, 1),
        (3, "Aisle-B", "Rack-1", "Row-2", 3000.00, 850, 1, 1),
        (4, "Aisle-C", "Rack-1", "Row-1", 2000.00, 600, 1, 1),
        (5, "Aisle-D", "Rack-3", "Row-2", 8000.00, 2400, 1, 1),
        (6, "Aisle-E", "Rack-2", "Row-4", 12000.00, 4100, 1, 1);""",

        "TRUNCATE TABLE brands;",
        """INSERT INTO brands (id, brand_code, brand_name, status, created_admin_id) VALUES
        (1, "BRD-BG-01", "Bean Good Specialty", 1, 1),
        (2, "BRD-BG-02", "Bean Good Artisan", 1, 1);""",

        "TRUNCATE TABLE product_categories;",
        """INSERT INTO product_categories (id, product_category_name, product_description, status, created_admin_id) VALUES
        (1, "Liquid Coffee Concentrates", "Brewed instant coffee shots in sachets and bottles (Classic & Flavored)", 1, 1),
        (2, "South Indian Filter Coffee", "Traditional chicory blended filter coffee powders (80/20 & 70/30)", 1, 1),
        (3, "Roasted Beans & Ground Coffee", "100% Arabica & House Blends in whole bean or custom grind", 1, 1),
        (4, "Gifting & Combo Bundles", "Multi-flavor concentrate trial packs and brew kits", 1, 1);""",

        "TRUNCATE TABLE raw_material_categories;",
        """INSERT INTO raw_material_categories (id, category_name, category_description, status, created_admin_id) VALUES
        (1, "Green Coffee Beans (Estate Sourced)", "Unroasted Arabica Plantation and Robusta Cherry beans from Karnataka", 1, 1),
        (2, "Chicory Powder & Extracts", "High grade roasted chicory root powder for filter blends", 1, 1),
        (3, "Natural Flavor Extracts", "Food-grade flavorings (Vanilla, Hazelnut, Caramel, Irish Cream, Chocolate)", 1, 1),
        (4, "Primary Packaging (Pouches & Bottles)", "Nitrogen flush sachets, glass bottles, and degassing valve pouches", 1, 1),
        (5, "Secondary Packaging (Boxes & Cartons)", "Retail tuck boxes, shipping corrugated boxes, and sticker labels", 1, 1);""",

        "TRUNCATE TABLE vendors;",
        """INSERT INTO vendors (id, vendor_name, contact_person, email, phone, address, city, state, gst_no, on_time_percentage, status, created_admin_id) VALUES
        (1, "Chikmagalur Specialty Coffee Estates", "H.R. Gowda", "supply@ckmcoffeeestates.in", "9845011223", "Mullayanagiri Road", "Chikmagalur", "Karnataka", "29AAACG4321F1Z2", 98.50, 1, 1),
        (2, "Coorg Agro & Chicory Processing Ltd", "K.P. Appanna", "orders@coorgchicory.com", "9880122334", "Industrial Area, Gonikoppal", "Kodagu", "Karnataka", "29AAACC9876E1Z4", 95.00, 1, 1),
        (3, "Flavors India Speciality Extract Co.", "Meera Deshmukh", "sales@flavorindia.co.in", "9711334455", "MIDC Phase II", "Mumbai", "Maharashtra", "27AAACF5566D1Z8", 96.20, 1, 1),
        (4, "FlexiPack Solutions Pvt Ltd", "Rajesh Sharma", "info@flexipack.in", "9822001122", "Peenya Industrial Estate", "Bengaluru", "Karnataka", "29AAACF1122B1Z9", 92.00, 1, 1);""",

        "TRUNCATE TABLE clients;",
        """INSERT INTO clients (id, client_name, contact_person, client_type, email, phone, billing_address, billing_addr_city, billing_addr_state, billing_addr_pincode, status, created_admin_id, created_at) VALUES
        (1, "Blinkit Quick Commerce", "Amit Saxena", "Quick Commerce", "vendor.coffee@blinkit.com", "9810011122", "Sector 32 Hub", "Gurugram", "Haryana", "122001", 1, 1, NOW()),
        (2, "Zepto Express Logistics", "Priya Menon", "Quick Commerce", "procurement@zepto.in", "9820022233", "Andheri East Hub", "Mumbai", "Maharashtra", "400069", 1, 1, NOW()),
        (3, "Nature Basket Gourmet", "Vikramaditya Roy", "Retail Chain", "supplychain@naturesbasket.co.in", "9830033344", "Indiranagar Store", "Bengaluru", "Karnataka", "560038", 1, 1, NOW()),
        (4, "Third Wave Cafe Network (B2B)", "Rohan Verma", "HoReCa Cafe", "b2b.orders@thirdwavecafe.in", "9840044455", "Connaught Place Outlet", "Delhi", "Delhi", "110001", 1, 1, NOW());""",

        "TRUNCATE TABLE departments;",
        """INSERT INTO departments (id, department_code, department_name, department_description, status, create_admin_id) VALUES
        (1, "DEPT-ROAST", "Roasting & Extraction", "Coffee roasting and liquid concentrate extraction", 1, 1),
        (2, "DEPT-PACK", "Flavor Infusion & Liquid Packaging", "Flavor blending, sachet filling, and outer boxing", 1, 1),
        (3, "DEPT-QC", "Quality Control & Lab", "Q-Grader cupping and Brix refractometer lab tests", 1, 1),
        (4, "DEPT-LOG", "Warehouse & Dispatch", "Raw green bean warehousing and client order fulfillment", 1, 1);""",

        "TRUNCATE TABLE jobs;",
        """INSERT INTO jobs (id, job_code, job_title, status, created_admin_id) VALUES
        (1, "JOB-001", "Head Master Roaster", 1, 1),
        (2, "JOB-002", "Extraction Plant Operator", 1, 1),
        (3, "JOB-003", "Liquid Blending Technician", 1, 1),
        (4, "JOB-004", "Senior Q-Grader & Lab Lead", 1, 1),
        (5, "JOB-005", "Dispatch & Inventory Manager", 1, 1);""",

        "TRUNCATE TABLE employees;",
        """INSERT INTO employees (id, employee_code, name, phone, email, department_id, role, emp_status, status, created_admin_id) VALUES
        (1, "EMP-BG-001", "Arjun Shetty", "9900112201", "arjun.shetty@beangood.in", 1, "Head Master Roaster", "active", 1, 1),
        (2, "EMP-BG-002", "Nikhil Kamath", "9900112202", "nikhil.extraction@beangood.in", 1, "Extraction Plant Operator", "active", 1, 1),
        (3, "EMP-BG-003", "Ananya Hegde", "9900112203", "ananya.qc@beangood.in", 3, "Senior Q-Grader & Lab Lead", "active", 1, 1),
        (4, "EMP-BG-004", "Suresh Kumar", "9900112204", "suresh.wh@beangood.in", 4, "Dispatch & Inventory Manager", "active", 1, 1);""",

        "TRUNCATE TABLE products_sku;",
        """INSERT INTO products_sku (id, product_name, brand_id, product_category_id, min_stock_level, product_description, labour_freight_charge, status, created_admin_id) VALUES
        (1, "Bean Good Liquid Coffee Concentrate - Classic (10x Sachets)", 1, 1, 100, "Rich brew concentrate in 15ml single serve sachets", 12.00, 1, 1),
        (2, "Bean Good Liquid Coffee Concentrate - Hazelnut (10x Sachets)", 1, 1, 100, "Infused natural hazelnut liquid coffee concentrate", 12.00, 1, 1),
        (3, "Bean Good Liquid Coffee Concentrate - Vanilla (10x Sachets)", 1, 1, 80, "Madagascar vanilla infused smooth coffee concentrate", 12.00, 1, 1),
        (4, "Bean Good Liquid Coffee Concentrate - Caramel (250ml Glass Bottle)", 1, 1, 50, "Multi-serve rich caramel liquid coffee brew", 20.00, 1, 1),
        (5, "Bean Good South Indian Filter Coffee 80:20 (250g)", 1, 2, 150, "80% Arabica/Robusta coffee blend with 20% premium chicory", 10.00, 1, 1),
        (6, "Bean Good South Indian Filter Coffee 70:30 (500g)", 1, 2, 100, "Strong traditional 70:30 coffee to chicory brew powder", 15.00, 1, 1),
        (7, "Bean Good Chikmagalur Medium Roast Whole Beans (500g)", 2, 3, 40, "100% Arabica estate single-origin whole bean coffee", 18.00, 1, 1);""",

        "TRUNCATE TABLE finished_goods;",
        """INSERT INTO finished_goods (id, product_name, sku_code, brand_id, product_category_id, stock_qty, min_level, max_level, unit_price, total_value, goods_status, status, created_admin_id) VALUES
        (1, "Bean Good Liquid Coffee Concentrate - Classic (10x Sachets)", "BG-LCC-CLS-10S", 1, 1, 450.00, 100, 2000, 249.00, 112050.00, "in_stock", 1, 1),
        (2, "Bean Good Liquid Coffee Concentrate - Hazelnut (10x Sachets)", "BG-LCC-HZL-10S", 1, 1, 380.00, 100, 2000, 279.00, 106020.00, "in_stock", 1, 1),
        (3, "Bean Good Liquid Coffee Concentrate - Vanilla (10x Sachets)", "BG-LCC-VAN-10S", 1, 1, 220.00, 80, 1500, 279.00, 61380.00, "in_stock", 1, 1),
        (4, "Bean Good Liquid Coffee Concentrate - Caramel (250ml Glass Bottle)", "BG-LCC-CAR-250B", 1, 1, 40.00, 50, 500, 399.00, 15960.00, "low_stock", 1, 1),
        (5, "Bean Good South Indian Filter Coffee 80:20 (250g)", "BG-FC-8020-250G", 1, 2, 600.00, 150, 2500, 199.00, 119400.00, "in_stock", 1, 1),
        (6, "Bean Good South Indian Filter Coffee 70:30 (500g)", "BG-FC-7030-500G", 1, 2, 310.00, 100, 1500, 349.00, 108190.00, "in_stock", 1, 1),
        (7, "Bean Good Chikmagalur Medium Roast Whole Beans (500g)", "BG-WB-CKM-500G", 2, 3, 30.00, 40, 500, 550.00, 16500.00, "low_stock", 1, 1);""",

        "TRUNCATE TABLE raw_materials;",
        """INSERT INTO raw_materials (id, material_code, material_name, raw_material_category_id, stock_qty, min_stock_level, unit_of_measure, vendor_id, unit_cost, total_value, stock_status, status, created_admin_id) VALUES
        (1, "RM-GREEN-ARABICA-PL", "Green Coffee Beans - Arabica Plantation AA", 1, 2200.00, 300, "KG", 1, 380.00, 836000.00, "in_stock", 1, 1),
        (2, "RM-GREEN-ROBUSTA-CH", "Green Coffee Beans - Robusta Cherry A", 1, 1500.00, 250, "KG", 1, 210.00, 315000.00, "in_stock", 1, 1),
        (3, "RM-CHICORY-ROASTED", "Roasted Chicory Root Powder (Grade A)", 2, 850.00, 150, "KG", 2, 95.00, 80750.00, "in_stock", 1, 1),
        (4, "RM-FLV-HAZELNUT", "Natural Hazelnut Liquid Flavor Essence", 3, 3.00, 5, "Liters", 3, 1450.00, 4350.00, "low_stock", 1, 1),
        (5, "RM-FLV-VANILLA", "Madagascar Vanilla Flavor Essence", 3, 2.00, 5, "Liters", 3, 1800.00, 3600.00, "low_stock", 1, 1),
        (6, "RM-PKG-SACHET-FOIL", "Aluminum Barrier Foil Sachet Film (15ml)", 4, 35000.00, 5000, "Sachets / Pouches", 4, 1.80, 63000.00, "in_stock", 1, 1),
        (7, "RM-PKG-TUCKBOX-10S", "Bean Good Outer Printed Tuck Box (Holds 10 Sachets)", 5, 4200.00, 800, "Retail Boxes (10x Sachet)", 4, 8.50, 35700.00, "in_stock", 1, 1);""",

        "TRUNCATE TABLE product_raw_material_consumption;",
        """INSERT INTO product_raw_material_consumption (id, product_sku_id, raw_material_id, quantity, unit, status, created_admin_id) VALUES
        (1, 2, 1, 0.2200, "KG", 1, 1),
        (2, 2, 4, 0.0050, "Liters", 1, 1),
        (3, 2, 6, 10.0000, "Sachets / Pouches", 1, 1),
        (4, 2, 7, 1.0000, "Retail Boxes (10x Sachet)", 1, 1),
        (5, 5, 1, 0.1200, "KG", 1, 1),
        (6, 5, 2, 0.1200, "KG", 1, 1),
        (7, 5, 3, 0.0500, "KG", 1, 1);""",

        "TRUNCATE TABLE production_stage;",
        """INSERT INTO production_stage (id, stage_name, status, created_admin_id) VALUES
        (1, "Green Bean Weighing & Destoning", 1, 1),
        (2, "Drum Roasting & Agtron Color Match", 1, 1),
        (3, "High Pressure Thermal Extraction (Liquid Concentrate)", 1, 1),
        (4, "Flavor Blending & Homogenization", 1, 1),
        (5, "Aseptic Sachet Filling & Nitrogen Sealing", 1, 1),
        (6, "Tuck Box Packaging & Shrink Wrapping", 1, 1);""",

        "TRUNCATE TABLE production_batch;",
        """INSERT INTO production_batch (id, production_code, product_id, planned_qty, completed_qty, client_id, floor, expected_completion_date, production_head_employee_id, batch_status, priority, created_admin_id, created_at) VALUES
        (1, "BATCH-BG-2026-081", 2, 1000.00, 1000.00, 1, 1, NOW() - INTERVAL 5 DAY, 1, "completed", 1, 1, NOW() - INTERVAL 10 DAY),
        (2, "BATCH-BG-2026-082", 1, 1500.00, 800.00, 2, 1, NOW() + INTERVAL 2 DAY, 1, "in_progress", 1, 1, NOW() - INTERVAL 4 DAY),
        (3, "BATCH-BG-2026-083", 5, 2000.00, 0.00, 3, 2, NOW() + INTERVAL 6 DAY, 2, "planned", 2, 1, NOW() - INTERVAL 1 DAY),
        (4, "BATCH-BG-2026-070", 2, 800.00, 300.00, 1, 1, NOW() - INTERVAL 7 DAY, 1, "in_progress", 1, 1, NOW() - INTERVAL 12 DAY),
        (5, "BATCH-BG-2026-072", 5, 1200.00, 450.00, 2, 2, NOW() - INTERVAL 3 DAY, 2, "in_progress", 1, 1, NOW() - INTERVAL 8 DAY);""",

        "TRUNCATE TABLE production_receipts;",
        """INSERT INTO production_receipts (id, production_batch_id, product_sku_id, finished_goods_id, received_qty, storage_location_id, notes, status, created_admin_id, created_at, updated_at) VALUES
        (1, 1, 2, 2, 1000.00, 5, "Received 1000 units from Hazelnut Batch #081 into FG Cold Storage", 1, 1, NOW() - INTERVAL 5 DAY, NOW()),
        (2, 2, 1, 1, 800.00, 5, "Partial receipt of 800 units Classic Concentrate Batch #082", 1, 1, NOW() - INTERVAL 2 DAY, NOW());""",

        "TRUNCATE TABLE orders;",
        """INSERT INTO orders (id, order_code, client_id, product_sku_id, quantity, order_status, status, expected_delivery_date, created_admin_id) VALUES
        (1, "ORD-BG-8801", 1, 1, 200.00, "completed", 1, "2026-07-28", 1),
        (2, "ORD-BG-8802", 1, 2, 250.00, "completed", 1, "2026-07-28", 1),
        (3, "ORD-BG-8803", 2, 5, 400.00, "processing", 1, "2026-08-02", 1),
        (4, "ORD-BG-8804", 3, 4, 80.00, "pending", 1, "2026-08-05", 1);""",

        "TRUNCATE TABLE qc_test_type;",
        """INSERT INTO qc_test_type (id, test_type_name, status, created_admin_id) VALUES
        (1, "Brix & Dissolved Solids % (Liquid Concentrate)", 1, 1),
        (2, "SCA Cupping & Flavor Profile Score", 1, 1),
        (3, "Moisture Content % (Green / Roasted Beans)", 1, 1),
        (4, "Sachet Seal Integrity & Burst Pressure", 1, 1);""",

        "TRUNCATE TABLE qc_records;",
        """INSERT INTO qc_records (id, qc_code, entity_type, entity_id, item_name, inspector_name, test_type_id, defect_count, remarks, result, status, created_admin_id, created_at) VALUES
        (1, "QC-BG-2026-001", "production_batch", "1", "Hazelnut Concentrate Batch #081", "Ananya Hegde", 1, 0, "Refractometer Brix read 28.5%. Perfect extraction consistency.", "pass", 1, 1, NOW() - INTERVAL 1 DAY),
        (2, "QC-BG-2026-002", "production_batch", "1", "Hazelnut Concentrate Batch #081", "Ananya Hegde", 4, 1, "1 sachet out of 100 failed leak test. Nitrogen pressure adjusted.", "pass", 1, 1, NOW() - INTERVAL 3 HOUR),
        (3, "QC-BG-2026-003", "raw_material", "1", "Arabica Plantation AA Lot #44", "Ananya Hegde", 3, 0, "Moisture at 11.2%. Ideal for immediate drum roasting.", "pass", 1, 1, NOW() - INTERVAL 2 DAY),
        (4, "QC-BG-2026-004", "finished_goods", "7", "Bean Good Chikmagalur Medium Roast Whole Beans", "Ananya Hegde", 2, 0, "SCA Cupping score 86.5/100. Notes of dark chocolate, toasted hazelnut, and balanced citric acidity.", "pass", 1, 1, NOW() - INTERVAL 4 HOUR),
        (5, "QC-BG-2026-005", "raw_material", "2", "Green Coffee Beans - Robusta Cherry A", "Ananya Hegde", 3, 0, "Moisture level tested at 10.8%. Passed bean density test.", "pass", 1, 1, NOW() - INTERVAL 1 HOUR);""",

        "TRUNCATE TABLE defect_types;",
        """INSERT INTO defect_types (id, defect_code, defect_name, category, severity, description, corrective_action, status, created_admin_id) VALUES
        (1, "DEF-COF-001", "Sour / Under-extracted Concentrate", "Liquid Concentrate", "High", "Refractometer Brix < 24.0%. Low TDS concentration causing acidic, hollow flavor profile.", "Increase extraction dwell time by 4 minutes & fine-tune roast profile.", 1, 1),
        (2, "DEF-COF-002", "Bitter / Over-extracted Dark Roast", "Roasting & Extraction", "Medium", "Agtron color score < 35. Scorched bean exterior causing harsh astringency.", "Shorten drum roasting cycle by 30 seconds and increase air cooling flow.", 1, 1),
        (3, "DEF-PKG-001", "Sachet Micro-Leakage & Pressure Drop", "Packaging & Filling", "Critical", "Nitrogen flush envelope leaks gas; internal pouch pressure drops < 1.2 bar.", "Clean heat sealing jaws and replace Teflon strip on packaging machine #2.", 1, 1),
        (4, "DEF-RM-001", "High Moisture Content in Green Beans", "Raw Materials", "High", "Moisture level > 12.5% in unroasted Arabica Plantation AA beans.", "Move jute bags to dehumidified storage aisle B-2 before roasting.", 1, 1),
        (5, "DEF-PKG-002", "Improper Outer Tuck Box Creasing", "Secondary Packaging", "Low", "Retail 10-sachet tuck box flaps misaligned by > 2mm.", "Adjust die-cutter feeder guide rail in secondary packaging line.", 1, 1);""",

        "SET FOREIGN_KEY_CHECKS = 1;"
    ]


    with conn.cursor() as cursor:
        for stmt in statements:
            cursor.execute(stmt)
        conn.commit()
    print("Bean Good Specialty Coffee Database & Dashboard Seeded Successfully!")

if __name__ == '__main__':
    seed_bean_good_database()
