from db import db
from sqlalchemy.sql import text

class GlobalSearchClass:
    def perform_search(self, search_term):
        """
        Performs a global search across multiple tables using UNION ALL.
        This version uses LOWER() to ensure case-insensitive searching.
        
        Args:
            search_term (str): The string to search for.

        Returns:
            list: A list of dictionaries, where each dictionary is a search result.
                  Returns an empty list if no results are found or an error occurs.
        """
        # Add wildcards for the LIKE query to find partial matches
        search_query = f"%{search_term.lower()}%"
        
        # This is a large, single SQL query that combines results from many tables.
        # Each SELECT statement is crafted to return the same set of columns:
        # id, display_text, sub_text, result_type
        # Using LOWER() on both sides of the LIKE comparison makes the search case-insensitive.
        sql = text("""
            -- Search Employees
            (SELECT id, name AS display_text, role AS sub_text, 'Employee' AS result_type
             FROM employees
             WHERE LOWER(employee_code) LIKE LOWER(:search_query) OR LOWER(name) LIKE LOWER(:search_query) OR LOWER(email) LIKE LOWER(:search_query) OR LOWER(role) LIKE LOWER(:search_query))

            UNION ALL

            -- Search Vendors
            (SELECT id, vendor_name AS display_text, contact_person AS sub_text, 'Vendor' AS result_type
             FROM vendors
             WHERE LOWER(vendor_name) LIKE LOWER(:search_query) OR LOWER(contact_person) LIKE LOWER(:search_query) OR LOWER(phone) LIKE LOWER(:search_query))

            UNION ALL

            -- Search Raw Materials
            (SELECT id, material_name AS display_text, material_code AS sub_text, 'Raw Material' AS result_type
             FROM raw_materials
             WHERE LOWER(material_code) LIKE LOWER(:search_query) OR LOWER(material_name) LIKE LOWER(:search_query))

            UNION ALL

            -- Search Finished Goods
            (SELECT id, product_name AS display_text, sku_code AS sub_text, 'Finished Good' AS result_type
             FROM finished_goods
             WHERE LOWER(product_name) LIKE LOWER(:search_query) OR LOWER(sku_code) LIKE LOWER(:search_query))

            UNION ALL

            -- Search Purchase Orders
            (SELECT id, po_number AS display_text, 'Purchase Order' AS sub_text, 'Purchase Order' AS result_type
             FROM purchase_orders
             WHERE LOWER(po_number) LIKE LOWER(:search_query))

            UNION ALL

            -- Search Production Batches
            (SELECT id, production_code AS display_text, 'Production Batch' AS sub_text, 'Production Batch' AS result_type
             FROM production_batch
             WHERE LOWER(production_code) LIKE LOWER(:search_query))

            UNION ALL

            -- Search Products SKU (and join to get batch code)
            -- *** IMPORTANT ***: The JOIN condition below assumes the foreign key in 'products_sku' is 'product_id'.
            -- Please verify this matches your database schema.
            (SELECT ps.id, ps.product_name AS display_text, pb.production_code AS sub_text, 'Product SKU' AS result_type
             FROM products_sku ps
             LEFT JOIN production_batch pb ON pb.product_id = ps.id
             WHERE LOWER(ps.product_name) LIKE LOWER(:search_query))

            UNION ALL

            -- Search Dispatch Orders (FIXED: Removed unnecessary CAST)
            (SELECT id, dispatch_id AS display_text, 'Dispatch Order' AS sub_text, 'Dispatch Order' AS result_type
             FROM dispatch_orders
             WHERE LOWER(dispatch_id) LIKE LOWER(:search_query))

            UNION ALL

            -- Search Clients
            (SELECT id, client_name AS display_text, contact_person AS sub_text, 'Client' AS result_type
             FROM clients
             WHERE LOWER(client_name) LIKE LOWER(:search_query) OR LOWER(contact_person) LIKE LOWER(:search_query) OR LOWER(phone) LIKE LOWER(:search_query) OR LOWER(website) LIKE LOWER(:search_query) OR LOWER(email) LIKE LOWER(:search_query))

            UNION ALL

            -- Search QC Records
            (SELECT id, item_name AS display_text, qc_code AS sub_text, 'QC Record' AS result_type
             FROM qc_records
             WHERE LOWER(qc_code) LIKE LOWER(:search_query) OR LOWER(item_name) LIKE LOWER(:search_query) OR LOWER(inspector_name) LIKE LOWER(:search_query))
            
            -- Limit the results for performance
            LIMIT 20;
        """)

        data = {'search_query': search_query}
        
        try:
            with db.engine.connect() as conn:
                responseData = conn.execute(sql, data)
                return responseData.mappings().all()
        except Exception as e:
            # It's good practice to log the error for debugging
            print(f"Error in global search: {e}")
            return []

# Instantiate the class so it can be imported and used easily
globalSearchObj = GlobalSearchClass()