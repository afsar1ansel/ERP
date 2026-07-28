from db import db
from sqlalchemy.sql import text

class MastersClass:
    
    def getTableCounts(self):
        """
        Get the count of records for all master tables
        Returns a dictionary with table names as keys and counts as values
        """
        try:
            with db.engine.connect() as conn:
                # Define the tables we want to count
                tables = [
                    'admin_users',
                    'brands',
                    'raw_material_categories', 
                    'products_sku',
                    'storage_locations',
                    'product_categories',
                    'production_stage',
                    'client_types',
                    'payment_terms',
                    'units_of_measurement',
                    
                ]
                
                counts = {}
                
                for table in tables:
                    sql_query = text(f"SELECT COUNT(*) as count FROM {table}")
                    result = conn.execute(sql_query)
                    row = result.first()
                    counts[table] = row[0] if row else 0
                
                return counts
                
        except Exception as e:
            print(f"Error in getTableCounts: {str(e)}")
            raise Exception(f"Database error: {str(e)}")

# Create a single instance of the class to be used by the routes
mastersObj = MastersClass()