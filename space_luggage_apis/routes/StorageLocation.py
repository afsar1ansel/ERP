from flask import Blueprint, request
from classes.StorageLocationsClass import storageLocationsObj
from classes.AdminUsersClass import adminUserObj
from classes.AuditLogClass import auditLogObj

storage_locations_blueprint = Blueprint("storage_locations_api", __name__)

@storage_locations_blueprint.route("/locations/bulk-create", methods=["POST"])
def create_locations_bulk():
    """
    API endpoint to create a large number of storage locations at once.
    Expects a JSON payload with aisle, rack count, and row count.
    """
    try:
        aisle_no = request.form.get("aisle_no")
        num_racks = int(request.form.get("num_racks", 0))
        num_rows_per_rack = int(request.form.get("num_rows_per_rack", 0))
        capacity = request.form.get("capacity", 0.0) 
        token = request.form.get("token")

        if not all([aisle_no, token]) or num_racks <= 0 or num_rows_per_rack <= 0:
            return {"errFlag": 1, "message": "aisle_no, token, num_racks, and num_rows_per_rack are required and must be positive numbers."}

    except (ValueError, TypeError) as e:
        return {"errFlag": 1, "message": f"Invalid input. Please ensure numbers are correct. Error: {e}"}
    
    try:
        # Validate the user token
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUserName = res[0].get("username", "N/A")

        # Call the business logic method
        response = storageLocationsObj.create_locations_bulk(
            aisle_no, num_racks, num_rows_per_rack, capacity, adminUserId
        )
        
        if response.get("errFlag") == 1:
            return response
        # Audit log for bulk creation
        try:
          auditLogObj.log_action(
              adminId=adminUserId,
              adminUsername=adminUserName,
              action_type='INSERT',
              action_details=f"Created {response['count']} new storage locations",
                object_table='storage_locations',
                object_id=0
          )
        except Exception as e:
          print("Error logging bulk storage location creation:", e)
        return {"errFlag": 0, "message": f"Successfully created {response['count']} new storage locations."}
        
    except Exception as e:
        return {"errFlag": 1, "message": f"An unexpected error occurred: {e}"}

@storage_locations_blueprint.route("/locations/get-all/<token>")
def getAllStorageLocations(token):
    """
    API endpoint to get all storage locations
    """
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUserName = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        locations = storageLocationsObj.getAllStorageLocations()

        # Audit log for getting all storage locations
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=adminUserId,
                adminUsername=adminUserName,
                action_type='PAGE_VIEW',
                detail='Fetched all storage locations',
                object_table='storage_locations',
                object_id=0
            )
        except Exception as e:
            print("Error logging fetch all storage locations action:", e)
        return [dict(row) for row in locations]
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching storage locations", "error": str(e)}

@storage_locations_blueprint.route("/locations/get-by-id/<int:location_id>/<token>")
def getStorageLocationById(location_id, token):
    """
    API endpoint to get a specific storage location by ID
    """
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        location = storageLocationsObj.getStorageLocationById(location_id)
        if location:
            return dict(location)
        else:
            return {"errFlag": 1, "message": "Storage location not found"}
    except Exception as e:
        print(str(e))
        return {"errFlag": 1, "message": "Error fetching storage location "}

@storage_locations_blueprint.route("/locations/update", methods=["POST"])
def updateStorageLocation():
    """
    API endpoint to update an existing storage location
    Expects form data with location_id, aisle_no, rack_no, row_no, capacity, status, and token.
    """
    try:
        location_id = request.form["location_id"]
        aisle_no = request.form["aisle_no"]
        rack_no = request.form["rack_no"]
        row_no = request.form["row_no"]
        capacity = request.form.get("capacity", 0.0)
        status = request.form.get("status", 1)
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid form inputs"}

    if not all([location_id, aisle_no, rack_no, row_no, token]):
        return {"errFlag": 1, "message": "location_id, aisle_no, rack_no, row_no, and token are required"}

    try:
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
        adminUserName = res[0].get("username", "N/A")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}

    #fetch existing location details for audit log
    try:
        existing_location = storageLocationsObj.getStorageLocationById(location_id)
    except Exception as e:
        existing_location = None
    try:
        result = storageLocationsObj.updateStorageLocation(
            location_id, aisle_no, rack_no, row_no, capacity, status, adminUserId
        )
        if isinstance(result, dict) and result.get("errFlag") == 1:
            return result
        elif result > 0:
            # Audit log for storage location update
            try:
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUserName,
                    action_type='UPDATE',
                    action_details=f"Updated storage location ID {location_id}",
                    object_table='storage_locations',
                    object_id=location_id,
                    old_value=existing_location,
                    new_data={
                        "aisle_no": aisle_no,
                        "rack_no": rack_no,
                        "row_no": row_no,
                        "capacity": capacity,
                        "status": status
                    }
                )
            except Exception as e:
                print("Error logging storage location update:", e)
            return {"errFlag": 0, "message": "Storage location updated successfully"}
        else:
            return {"errFlag": 1, "message": "No storage location updated"}
    except Exception as e:
        return {"errFlag": 1, "message": f"Error updating storage location: {e}"}