# ☕ Coffee ERP Database Schema & Seeding Guide

This document provides the complete database schema reference and Coffee domain seeding instructions for **Space Coffee ERP**. 
Use this guide to generate realistic seed data for your database (e.g., via ChatGPT, Claude, or SQL seed scripts).

---

## 📌 Recommended Seeding Order (Foreign Key Dependency List)

To populate the database without running into foreign key constraint violations, seed tables in the following sequence:

1. **Phase 1: Basic Master Data**
   - `units_of_measurement`
   - `storage_locations`
   - `brands`
   - `product_categories`
   - `raw_material_categories`
   - `departments`
   - `jobs`
   - `client_types`
   - `payment_terms`
   - `qc_test_type`
   - `defect_types`

2. **Phase 2: Core Business Entities**
   - `vendors`
   - `clients`
   - `employees`
   - `admin_roles`
   - `admin_users`

3. **Phase 3: Material & Product Catalog**
   - `products_sku` (Coffee Products, e.g. Espresso Whole Bean 1kg, Arabica Medium Roast 250g)
   - `finished_goods` (Packaged Coffee Inventory)
   - `raw_materials` (Green Coffee Beans, Coffee Bags, Valves, Cardboard Boxes)
   - `vendor_raw_materials` / `raw_material_vendors`
   - `product_raw_material_consumption` (BOM - Bill of Materials recipes)

4. **Phase 4: Procurement & Purchasing**
   - `purchase_orders`
   - `purchase_order_items`
   - `vendor_stock_receipts`
   - `vendor_stock_receipt_items`

5. **Phase 5: Production & Roasting Batches**
   - `production_stage` (e.g., Green Bean Sorting, Roasting, Cooling, Grinding, Packaging)
   - `production_stage_categories`
   - `production_stage_employees`
   - `production_batch` (Roasting Batches)
   - `production_batch_stages`
   - `production_batch_stage_employees`
   - `production_receipts`
   - `raw_material_consumption_receipt`

6. **Phase 6: Orders & Dispatch**
   - `orders` (Coffee Customer Orders)
   - `order_status_history`
   - `dispatch_orders`
   - `dispatch_orders_items`

7. **Phase 7: Quality Control & Audit**
   - `qc_records` (Bean Cupping, Moisture Content, Roast Color Agtron Tests)
   - `stock_transactions`
   - `fg_stock_adjustments`
   - `company_info_settings`

---

## 🗂 Table-by-Table Schema & Coffee Seed Examples

---

### 1. `units_of_measurement`
**Description**: Measurement units for coffee beans, packaging, and liquids.
- **Columns**:
  - `id` (INT, Primary Key, Auto Increment)
  - `unit_name` (VARCHAR(100), e.g., 'KG', 'Grams', 'Bags', 'Boxes', 'Liters')
  - `status` (TINYINT(1), Default: 1)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)
- **Sample Seed SQL**:
  ```sql
  INSERT INTO units_of_measurement (id, unit_name, status) VALUES
  (1, 'KG', 1),
  (2, 'Grams', 1),
  (3, 'Jute Bags (60kg)', 1),
  (4, 'Packs', 1),
  (5, 'Cartons', 1);
  ```

---

### 2. `storage_locations`
**Description**: Roastery warehouse storage racks, silos, and cold rooms.
- **Columns**:
  - `id` (INT, Primary Key)
  - `aisle_no` (VARCHAR(50))
  - `rack_no` (VARCHAR(50))
  - `row_no` (VARCHAR(50))
  - `location_label` (VARCHAR(100))
  - `capacity` (DECIMAL(18,2))
  - `current_occupancy` (INT)
  - `status` (TINYINT(1))
- **Sample Seed SQL**:
  ```sql
  INSERT INTO storage_locations (id, aisle_no, rack_no, row_no, location_label, capacity, current_occupancy, status) VALUES
  (1, 'Aisle-A', 'Rack-1', 'Row-1', 'Green Bean Silo A1', 5000.00, 1200, 1),
  (2, 'Aisle-B', 'Rack-2', 'Row-3', 'Roasted Bean Bin B2', 2000.00, 450, 1),
  (3, 'Aisle-C', 'Rack-1', 'Row-1', 'Finished Goods Cold Storage', 10000.00, 3200, 1);
  ```

---

### 3. `brands`
**Description**: Coffee brand labels under your company.
- **Columns**:
  - `id` (INT, Primary Key)
  - `brand_name` (VARCHAR(255))
  - `brand_description` (TEXT)
  - `brand_logo` (VARCHAR(255))
  - `status` (TINYINT(1))
- **Sample Seed SQL**:
  ```sql
  INSERT INTO brands (id, brand_name, brand_description, status) VALUES
  (1, 'RoastMasters Special Blend', 'Premium single-origin and specialty coffee roasts', 1),
  (2, 'Artisan Espresso Co.', 'Dark roast espresso beans and ground blends', 1);
  ```

---

### 4. `product_categories`
**Description**: Categories of finished coffee products.
- **Columns**:
  - `id` (INT, Primary Key)
  - `product_category_name` (VARCHAR(255))
  - `product_description` (TEXT)
  - `status` (TINYINT(1))
- **Sample Seed SQL**:
  ```sql
  INSERT INTO product_categories (id, product_category_name, product_description, status) VALUES
  (1, 'Whole Bean Coffee', 'Freshly roasted whole coffee beans in 250g, 500g, and 1kg bags', 1),
  (2, 'Ground Coffee', 'Finely ground coffee for Espresso, Drip, and French Press', 1),
  (3, 'Coffee Pods & Capsules', 'Single-serve Nespresso compatible capsules', 1);
  ```

---

### 5. `raw_material_categories`
**Description**: Categories for unroasted coffee beans, flavorings, and packaging.
- **Columns**:
  - `id` (INT, Primary Key)
  - `category_name` (VARCHAR(255))
  - `category_description` (TEXT)
  - `status` (TINYINT(1))
- **Sample Seed SQL**:
  ```sql
  INSERT INTO raw_material_categories (id, category_name, category_description, status) VALUES
  (1, 'Green Coffee Beans (Imported)', 'Raw unroasted Arabica and Robusta green coffee beans', 1),
  (2, 'Packaging Bags & Valves', 'Degassing valve coffee pouches and tin-tie bags', 1),
  (3, 'Outer Corrugated Boxes', 'Shipping cartons for 12x 250g retail packs', 1);
  ```

---

### 6. `vendors`
**Description**: Coffee bean estates/farms, importers, and packaging suppliers.
- **Columns**:
  - `id` (INT, Primary Key)
  - `vendor_name` (VARCHAR(255))
  - `contact_person` (VARCHAR(255))
  - `email` (VARCHAR(255))
  - `phone` (VARCHAR(30))
  - `address` (TEXT)
  - `city` (VARCHAR(100))
  - `state` (VARCHAR(100))
  - `gst_no` (VARCHAR(100))
  - `status` (TINYINT)
- **Sample Seed SQL**:
  ```sql
  INSERT INTO vendors (id, vendor_name, contact_person, email, phone, address, city, state, gst_no, status) VALUES
  (1, 'Chikmagalur Coffee Estates Ltd', 'Ramesh Gowda', 'orders@chikmagalurcoffee.in', '9876543210', 'Estate Rd 4', 'Chikmagalur', 'Karnataka', '29AAACG1234F1Z1', 1),
  (2, 'Ethiopian Yirgacheffe Exporters', 'Abebe Bikila', 'info@yirgacheffecoffee.com', '9812345678', 'Port Zone 2', 'Addis Ababa', 'Ethiopia', '29FOREIGN001', 1),
  (3, 'EcoPack Sustainable Bags Pvt Ltd', 'Ananya Roy', 'sales@ecopack.co.in', '9711223344', 'Plot 45 Industrial Area', 'Bengaluru', 'Karnataka', '29AAACE9876E1Z5', 1);
  ```

---

### 7. `clients`
**Description**: Coffee buyers (cafes, wholesale distributors, supermarket chains, online customers).
- **Columns**:
  - `id` (INT, Primary Key)
  - `client_name` (VARCHAR(255))
  - `company_name` (VARCHAR(255))
  - `contact_person` (VARCHAR(255))
  - `email` (VARCHAR(255))
  - `phone` (VARCHAR(30))
  - `city` (VARCHAR(100))
  - `status` (TINYINT)
- **Sample Seed SQL**:
  ```sql
  INSERT INTO clients (id, client_name, company_name, contact_person, email, phone, city, status) VALUES
  (1, 'The Urban Roastery Cafe', 'Urban Roastery Pvt Ltd', 'Vikram Seth', 'purchasing@urbanroastery.com', '9888877771', 'Mumbai', 1),
  (2, 'Bean & Brew Chain', 'Bean & Brew Franchise Ltd', 'Priya Sharma', 'supply@beanandbrew.in', '9888877772', 'Bengaluru', 1),
  (3, 'Gourmet Mart Supermarkets', 'Gourmet Retail Corp', 'Karan Patel', 'vendor@gourmetmart.com', '9888877773', 'Delhi', 1);
  ```

---

### 8. `departments` & `jobs`
**Description**: Roastery organizational departments and job positions.
- **Departments Columns**: `id`, `department_name`, `status`
- **Jobs Columns**: `id`, `department_id`, `job_title`, `status`
- **Sample Seed SQL**:
  ```sql
  INSERT INTO departments (id, department_name, status) VALUES
  (1, 'Roasting & Production', 1),
  (2, 'Quality Control & Cupping', 1),
  (3, 'Grinding & Packaging', 1),
  (4, 'Sales & Warehouse Logistics', 1);

  INSERT INTO jobs (id, department_id, job_title, status) VALUES
  (1, 1, 'Head Master Roaster', 1),
  (2, 2, 'Q-Grader / QC Specialist', 1),
  (3, 3, 'Packaging Machine Operator', 1),
  (4, 4, 'Warehouse Logistics Manager', 1);
  ```

---

### 9. `employees`
**Description**: Staff working in the coffee roastery.
- **Columns**: `id`, `employee_code`, `name`, `phone`, `email`, `department_id`, `role`, `emp_status`
- **Sample Seed SQL**:
  ```sql
  INSERT INTO employees (id, employee_code, name, phone, email, department_id, role, emp_status) VALUES
  (1, 'EMP-COFFEE-001', 'Arjun Mehta', '9900112233', 'arjun.roaster@coffeeerp.com', 1, 'Head Master Roaster', 'active'),
  (2, 'EMP-COFFEE-002', 'Sneha Kapoor', '9900112244', 'sneha.qc@coffeeerp.com', 2, 'Q-Grader QC Lead', 'active'),
  (3, 'EMP-COFFEE-003', 'Rahul Nair', '9900112255', 'rahul.logistics@coffeeerp.com', 4, 'Warehouse Lead', 'active');
  ```

---

### 10. `products_sku`
**Description**: Master SKU catalog of finished coffee products.
- **Columns**:
  - `id` (INT, Primary Key)
  - `product_name` (VARCHAR(255))
  - `brand_id` (INT)
  - `product_category_id` (INT)
  - `min_stock_level` (INT)
  - `product_description` (TEXT)
  - `labour_freight_charge` (DECIMAL(10,2))
  - `status` (TINYINT)
- **Sample Seed SQL**:
  ```sql
  INSERT INTO products_sku (id, product_name, brand_id, product_category_id, min_stock_level, product_description, labour_freight_charge, status) VALUES
  (1, 'Arabica Dark Roast Whole Bean 1kg', 1, 1, 50, '100% Arabica single-origin roasted beans', 25.00, 1),
  (2, 'Espresso House Blend Ground Coffee 250g', 2, 2, 100, 'Finely ground espresso roast in degassing valve pouch', 10.00, 1),
  (3, 'Ethiopia Yirgacheffe Medium Roast Whole Bean 500g', 1, 1, 30, 'Specialty light-medium roast with floral & citrus notes', 15.00, 1);
  ```

---

### 11. `finished_goods`
**Description**: Real-time stock levels of packaged coffee products.
- **Columns**:
  - `id` (INT, Primary Key)
  - `product_name` (VARCHAR(255))
  - `sku_code` (VARCHAR(50))
  - `brand_id` (INT)
  - `product_category_id` (INT)
  - `stock_qty` (DECIMAL(10,2))
  - `min_level` (INT)
  - `max_level` (INT)
  - `unit_price` (DECIMAL(10,2))
  - `total_value` (DECIMAL(12,2))
  - `goods_status` (VARCHAR(50))
- **Sample Seed SQL**:
  ```sql
  INSERT INTO finished_goods (id, product_name, sku_code, brand_id, product_category_id, stock_qty, min_level, max_level, unit_price, total_value, goods_status) VALUES
  (1, 'Arabica Dark Roast Whole Bean 1kg', 'SKU-COFFEE-WB1K', 1, 1, 240.00, 50, 500, 850.00, 204000.00, 'in_stock'),
  (2, 'Espresso House Blend Ground Coffee 250g', 'SKU-COFFEE-GC250', 2, 2, 520.00, 100, 1000, 280.00, 145600.00, 'in_stock'),
  (3, 'Ethiopia Yirgacheffe Medium Roast Whole Bean 500g', 'SKU-COFFEE-ETH500', 1, 1, 85.00, 30, 300, 620.00, 52700.00, 'in_stock');
  ```

---

### 12. `raw_materials`
**Description**: Inventory of unroasted green coffee beans and packaging supplies.
- **Columns**:
  - `id` (INT, Primary Key)
  - `material_code` (VARCHAR(50))
  - `material_name` (VARCHAR(255))
  - `raw_material_category_id` (INT)
  - `stock_qty` (DECIMAL(10,2))
  - `min_stock_level` (INT)
  - `unit_of_measure` (VARCHAR(50))
  - `vendor_id` (INT)
  - `unit_cost` (DECIMAL(12,2))
  - `total_value` (DECIMAL(14,2))
  - `stock_status` (VARCHAR(50))
- **Sample Seed SQL**:
  ```sql
  INSERT INTO raw_materials (id, material_code, material_name, raw_material_category_id, stock_qty, min_stock_level, unit_of_measure, vendor_id, unit_cost, total_value, stock_status) VALUES
  (1, 'RM-GREEN-ARABICA-CKM', 'Green Coffee Beans - Arabica Plantation A', 1, 1250.00, 200, 'KG', 1, 320.00, 400000.00, 'in_stock'),
  (2, 'RM-GREEN-YIRGACHEFFE', 'Green Coffee Beans - Ethiopia Yirgacheffe Grade 1', 1, 450.00, 100, 'KG', 2, 580.00, 261000.00, 'in_stock'),
  (3, 'RM-BAG-VALVE-250G', 'Matte Black 250g Coffee Pouch with Valve', 2, 5000.00, 500, 'Packs', 3, 12.50, 62500.00, 'in_stock');
  ```

---

### 13. `product_raw_material_consumption` (Bill of Materials / BOM)
**Description**: Recipe ratio for roasting and packaging 1 unit of product SKU.
- **Columns**: `id`, `product_sku_id`, `raw_material_id`, `quantity`, `unit`, `status`
- **Sample Seed SQL**:
  ```sql
  -- 1kg Roasted Coffee requires ~1.18kg Green Beans (accounting for 15-18% roast shrinkage weight loss)
  INSERT INTO product_raw_material_consumption (id, product_sku_id, raw_material_id, quantity, unit, status) VALUES
  (1, 1, 1, 1.1800, 'KG', 1), -- 1kg Arabica Dark Roast requires 1.18kg Arabica Green Beans
  (2, 2, 1, 0.2950, 'KG', 1), -- 250g Espresso Ground requires 0.295kg Green Beans
  (3, 2, 3, 1.0000, 'Packs', 1); -- 1 Pouch Valve Bag per 250g pack
  ```

---

### 14. `production_stage` & `production_batch`
**Description**: Coffee Roasting stages and active Roasting Batches.
- **Roasting Stages**:
  ```sql
  INSERT INTO production_stage (id, stage_name, status) VALUES
  (1, 'Green Bean Weighing & Destoning', 1),
  (2, 'Drum Roasting (210°C - First Crack)', 1),
  (3, 'Cooling Tray & Agtron Color Check', 1),
  (4, 'Grinding & Degassing Rest', 1),
  (5, 'Automatic Pouch Filling & Nitrogen Flush', 1);
  ```

- **Roasting Batches**:
  ```sql
  INSERT INTO production_batch (id, production_code, product_id, planned_qty, completed_qty, client_id, floor, expected_completion_date, production_head_employee_id, batch_status, priority) VALUES
  (1, 'BATCH-ROAST-2026-001', 1, 500.00, 500.00, 1, 1, '2026-08-05 18:00:00', 1, 'completed', 1),
  (2, 'BATCH-ROAST-2026-002', 3, 250.00, 120.00, 2, 1, '2026-08-10 18:00:00', 1, 'in_progress', 2);
  ```

---

### 15. `orders`
**Description**: Sales orders placed by cafes and retail stores.
- **Columns**: `id`, `order_code`, `client_id`, `product_sku_id`, `quantity`, `order_status`, `expected_delivery_date`
- **Sample Seed SQL**:
  ```sql
  INSERT INTO orders (id, order_code, client_id, product_sku_id, quantity, order_status, expected_delivery_date) VALUES
  (1, 'ORD-COFFEE-1001', 1, 1, 50.00, 'completed', '2026-08-01'),
  (2, 'ORD-COFFEE-1002', 2, 2, 200.00, 'processing', '2026-08-06'),
  (3, 'ORD-COFFEE-1003', 3, 3, 30.00, 'pending', '2026-08-09');
  ```

---

### 16. `qc_test_type` & `qc_records`
**Description**: Quality Control testing (Cupping score, Moisture content %, Agtron Roast Color Index).
- **Sample Seed SQL**:
  ```sql
  INSERT INTO qc_test_type (id, test_type_name, status) VALUES
  (1, 'Specialty Coffee Cupping Score (SCA 100 pt)', 1),
  (2, 'Green Bean Moisture Content % (Ideal 10-12%)', 1),
  (3, 'Roast Color Agtron Index (Light/Medium/Dark)', 1);

  INSERT INTO qc_records (id, qc_code, entity_type, entity_id, item_name, inspector_name, test_type_id, defect_count, remarks, result, status) VALUES
  (1, 'QC-COFFEE-001', 'production_batch', '1', 'Arabica Dark Roast Batch #1', 'Sneha Kapoor', 1, 0, 'SCA Cupping Score: 86.5/100. Excellent body & caramel finish.', 'PASSED', 'completed');
  ```

---

## 🤖 Prompt for Other AI (ChatGPT / Claude) to Generate SQL Seeds

You can copy and paste this exact prompt into ChatGPT or Claude to generate realistic Coffee ERP SQL `INSERT` seed scripts:

```text
Act as a Senior Database Administrator. Please generate a complete MySQL SQL seeding script for a Coffee Manufacturing & Roasting ERP system based on the schema definitions below.

Rules:
1. Generate realistic Coffee business data (e.g. Green Coffee Beans Arabica/Robusta, Single Origin Ethiopia/Colombia, Master Roaster employees, Roasting & Cupping QC tests, Cafe clients).
2. Generate clean SQL `INSERT INTO table_name (columns...) VALUES (...)` statements.
3. Wrap all INSERT statements between `SET FOREIGN_KEY_CHECKS = 0;` and `SET FOREIGN_KEY_CHECKS = 1;`.
4. Ensure primary keys start from 1 and match across foreign key references.

Tables to seed with 5-10 realistic Coffee domain rows each:
- units_of_measurement
- storage_locations
- brands
- product_categories
- raw_material_categories
- vendors
- clients
- departments
- jobs
- employees
- products_sku
- finished_goods
- raw_materials
- product_raw_material_consumption
- production_stage
- production_batch
- orders
- qc_test_type
- qc_records
```
