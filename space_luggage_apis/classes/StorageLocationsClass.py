from db import db
from sqlalchemy.sql import text
from sqlalchemy import insert
from datetime import datetime

class StorageLocationsClass:
    
    def create_locations_bulk(self, aisle_no, num_racks, num_rows_per_rack, capacity, adminUserId):
        """
        Generates and bulk-inserts storage locations for an aisle with a specified
        number of racks and rows per rack.
        This operation is transactional: it's all or nothing.
        """
        
        # 1. Generate all location combinations to be created
        locations_to_check = []
        for rack_num in range(1, num_racks + 1):
            for row_num in range(1, num_rows_per_rack + 1):
                locations_to_check.append({
                    'aisle': str(aisle_no),
                    'rack': str(rack_num),
                    'row': str(row_num)
                })

        if not locations_to_check:
            return {"errFlag": 1, "message": "No locations to generate. Check your input numbers."}

        # Use a transaction to ensure data integrity
        with db.engine.connect() as conn:
            with conn.begin() as transaction:
                try:
                    # 2. Check for any duplicates before attempting to insert
                    # This is crucial for preventing partial inserts on failure
                    existing_locations = []
                    for loc in locations_to_check:
                        sql_check = text("""
                            SELECT id FROM storage_locations 
                            WHERE aisle_no = :aisle AND rack_no = :rack AND row_no = :row
                        """)
                        result = conn.execute(sql_check, loc).first()
                        if result:
                            existing_locations.append(f"{loc['aisle']}-Rack{loc['rack']}-Row{loc['row']}")
                    
                    if existing_locations:
                        # If duplicates are found, the transaction will automatically roll back.
                        return {
                            "errFlag": 1, 
                            "message": f"Operation failed. The following locations already exist: {', '.join(existing_locations)}"
                        }

                    # 3. If no duplicates, prepare the data for bulk insertion
                    locations_to_insert = [
                        {
                            'aisle_no': loc['aisle'],
                            'rack_no': loc['rack'],
                            'row_no': loc['row'],
                            'capacity': capacity,
                            'status': 1,
                            'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                            'created_admin_id': adminUserId
                        } for loc in locations_to_check
                    ]

                    # 4. Perform the bulk insert
                    sql_insert = text("""
                        INSERT INTO storage_locations 
                        (aisle_no, rack_no, row_no, capacity, status, created_at, created_admin_id)
                        VALUES 
                        (:aisle_no, :rack_no, :row_no, :capacity, :status, :created_at, :created_admin_id)
                    """)
                    conn.execute(sql_insert, locations_to_insert)
                    
                    # If we reach here, the transaction will commit automatically.
                    return {"errFlag": 0, "count": len(locations_to_insert)}

                except Exception as e:
                    # The transaction will automatically roll back on any exception.
                    return {"errFlag": 1, "message": f"A database error occurred: {e}"}

    def getAllStorageLocations(self):
        """
        Get all storage locations from the database
        Returns all columns as a list of dictionaries
        """
        try:
            with db.engine.connect() as conn:
                sql_query = text("""
                    SELECT 
                        id,
                        aisle_no,
                        rack_no,
                        row_no,
                        location_label,
                        capacity,
                        current_occupancy,
                        status,
                        created_at,
                        updated_at,
                        created_admin_id,
                        updated_admin_id
                    FROM storage_locations 
                    ORDER BY id, CAST(rack_no AS UNSIGNED), CAST(row_no AS UNSIGNED)
                """)
                result = conn.execute(sql_query)
                
                # Convert rows to dictionaries properly
                locations = []
                for row in result:
                    location_dict = {
                        'id': row[0],
                        'aisle_no': row[1],
                        'rack_no': row[2],
                        'row_no': row[3],
                        'location_label': row[4],
                        'capacity': float(row[5]) if row[5] is not None else 0.0,
                        'current_occupancy': float(row[6]) if row[6] is not None else 0.0,
                        'status': row[7],
                        'created_at': row[8].strftime("%Y-%m-%d %H:%M:%S") if row[8] else None,
                        'updated_at': row[9].strftime("%Y-%m-%d %H:%M:%S") if row[9] else None,
                        'created_admin_id': row[10],
                        'updated_admin_id': row[11]
                    }
                    locations.append(location_dict)
                
                return locations
                
        except Exception as e:
            print(f"Error in getAllStorageLocations: {str(e)}")  # For debugging
            raise Exception(f"Database error: {str(e)}")

    def getStorageLocationById(self, location_id):
        """
        Get a specific storage location by ID
        Returns a single dictionary or None if not found
        """
        try:
            with db.engine.connect() as conn:
                sql_query = text("""
                    SELECT 
                        id,
                        aisle_no,
                        rack_no,
                        row_no,
                        location_label,
                        capacity,
                        current_occupancy,
                        status,
                        created_at,
                        updated_at,
                        created_admin_id,
                        updated_admin_id
                    FROM storage_locations 
                    WHERE id = :location_id
                """)
                result = conn.execute(sql_query, {'location_id': location_id})
                row = result.first()
                
                if row:
                    location_dict = {
                        'id': row[0],
                        'aisle_no': row[1],
                        'rack_no': row[2],
                        'row_no': row[3],
                        'location_label': row[4],
                        'capacity': float(row[5]) if row[5] is not None else 0.0,
                        'current_occupancy': float(row[6]) if row[6] is not None else 0.0,
                        'status': row[7],
                        'created_at': row[8].strftime("%Y-%m-%d %H:%M:%S") if row[8] else None,
                        'updated_at': row[9].strftime("%Y-%m-%d %H:%M:%S") if row[9] else None,
                        'created_admin_id': row[10],
                        'updated_admin_id': row[11]
                    }
                    return location_dict
                else:
                    return None
                
        except Exception as e:
            print(f"Error in getStorageLocationById: {str(e)}")  # For debugging
            raise Exception(f"Database error: {str(e)}")

    def updateStorageLocation(self, location_id, aisle_no, rack_no, row_no, capacity, status, adminUserId):
        """
        Update a storage location's details.
        """
        try:
            with db.engine.connect() as conn:
                sql = text("""
                    UPDATE storage_locations
                    SET aisle_no = :aisle_no,
                        rack_no = :rack_no,
                        row_no = :row_no,
                        capacity = :capacity,
                        status = :status,
                        updated_at = :updated_at,
                        updated_admin_id = :updated_admin_id
                    WHERE id = :location_id
                """)
                result = conn.execute(sql, {
                    "aisle_no": aisle_no,
                    "rack_no": rack_no,
                    "row_no": row_no,
                    "capacity": capacity,
                    "status": status,
                    "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "updated_admin_id": adminUserId,
                    "location_id": location_id
                })
                conn.commit()

                return result.rowcount  # Number of rows updated
            
        except Exception as e:
            return {"errFlag": 1, "message": f"Error updating storage location: {e}"}

# Create a single instance of the class to be used by the routes
storageLocationsObj = StorageLocationsClass()