# Clients.py
from flask import Blueprint, request
from classes.ClientClass import clientObj
from classes.AdminUsersClass import adminUserObj
from classes.AuditLogClass import auditLogObj   
from db import db

clients_blueprint = Blueprint("clients", __name__)

@clients_blueprint.route("/clients/add", methods=["POST"])
def addClient():
    try:
        client_name = request.form["client_name"]
        contact_person = request.form["contact_person"]
        client_type = request.form["client_type"]
        email = request.form["email"]
        phone = request.form["phone"]
        website = request.form.get("website", "")
        gst_number = request.form.get("gst_number", "")
        credit_limit = request.form.get("credit_limit", 0)
        payment_terms = request.form.get("payment_terms", "")
        billing_address = request.form["billing_address"]
        billing_addr_city = request.form["billing_addr_city"]
        billing_addr_state = request.form["billing_addr_state"]
        billing_addr_pincode = request.form["billing_addr_pincode"]
        shipping_address = request.form.get("shipping_address", "")
        shipping_addr_city = request.form.get("shipping_addr_city", "")
        shipping_addr_state = request.form.get("shipping_addr_state", "")
        shipping_addr_pincode = request.form.get("shipping_addr_pincode", "")
        notes = request.form.get("notes", "")
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([client_name, contact_person, client_type, email, phone, billing_address, 
                billing_addr_city, billing_addr_state, billing_addr_pincode, token]):
        return {"errFlag": 1, "message": "All required fields are missing"}

    try:
        res = adminUserObj.validateToken(token)
        adminId=res[0]["id"]
        adminUsername=res[0].get("username", "")
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        response = clientObj.addClient(client_name, contact_person, client_type, email, phone, 
                                      website, gst_number, credit_limit, payment_terms, 
                                      billing_address, billing_addr_city, billing_addr_state, 
                                      billing_addr_pincode, shipping_address, shipping_addr_city, 
                                      shipping_addr_state, shipping_addr_pincode, notes, admin_user_id)
        
        if isinstance(response, dict):
            return response
        elif response > 0:
            #Audit Log
            try:
                auditLogObj.log_action(
                    adminId=adminId,
                    adminUsername=adminUsername,
                    action_type='CREATE',
                    detail=f'Client added: {client_name}',
                    object_table='clients',
                    object_id=response,
                    new_value={'client_name': client_name, 'contact_person': contact_person}
                    )
            except Exception as e:
                print("Error logging audit:", e)
            return {"errFlag": 0, "message": "Client added successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to add client"}
    except Exception as e:
        db.session.rollback()  
        print(f"DEBUG ERROR: {str(e)}")  
        return {  
            "errFlag": 1,  
            "message": "Error adding client",
            "debug_info": str(e)  
        }

@clients_blueprint.route("/clients/update", methods=["POST"])
def updateClient():
    try:
        client_id = request.form["client_id"]
        client_name = request.form["client_name"]
        contact_person = request.form["contact_person"]
        client_type = request.form["client_type"]
        email = request.form["email"]
        phone = request.form["phone"]
        website = request.form.get("website", "")
        gst_number = request.form.get("gst_number", "")
        credit_limit = request.form.get("credit_limit", 0)
        payment_terms = request.form.get("payment_terms", "")
        billing_address = request.form["billing_address"]
        billing_addr_city = request.form["billing_addr_city"]
        billing_addr_state = request.form["billing_addr_state"]
        billing_addr_pincode = request.form["billing_addr_pincode"]
        shipping_address = request.form.get("shipping_address", "")
        shipping_addr_city = request.form.get("shipping_addr_city", "")
        shipping_addr_state = request.form.get("shipping_addr_state", "")
        shipping_addr_pincode = request.form.get("shipping_addr_pincode", "")
        notes = request.form.get("notes", "")
        token = request.form["token"]
    except Exception as e:
      
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([client_id, client_name, contact_person, client_type, email, phone, 
                billing_address, billing_addr_city, billing_addr_state, billing_addr_pincode, token]):
        return {"errFlag": 1, "message": "All required fields are missing"}
    
    try:
        res = adminUserObj.validateToken(token)
        adminId=res[0]["id"]
        adminUsername=res[0].get("username", "")
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    # fetch client details for audit log old values
    try:
        client = clientObj.getClientDetails(client_id)
        client = dict(client[0])  # Convert to dict for easier handling
        if not client:
            return {"errFlag": 1, "message": "Client not found"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching client details"}
    
    try:
        response = clientObj.updateClient(client_id, client_name, contact_person, client_type, email, phone, 
                                        website, gst_number, credit_limit, payment_terms, 
                                        billing_address, billing_addr_city, billing_addr_state, 
                                        billing_addr_pincode, shipping_address, shipping_addr_city, 
                                        shipping_addr_state, shipping_addr_pincode, notes, admin_user_id)
        
        if isinstance(response, dict):
            return response
        elif response > 0:
            #Audit Log
            try:
                auditLogObj.log_action(
                    adminId=adminId,
                    adminUsername=adminUsername,
                    action_type='UPDATE',
                    detail=f'Client updated: {client_name} (ID: {client_id})',
                    object_table='clients',
                    object_id=client_id,
                    old_value=client,  # Could be fetched if needed
                    new_value={'client_name': client_name, 'contact_person': contact_person}
                    )
            except Exception as e:
                print("Error logging audit:", e)
            return {"errFlag": 0, "message": "Client updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update client"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating client"}

@clients_blueprint.route("/clients/get-all/<token>")
def getAllClients(token):
    try:
        res = adminUserObj.validateToken(token)
        adminId=res[0]["id"]
        adminUsername=res[0].get("username", "")
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        clients = clientObj.getAllClients()
        #Audit logs once per day per page
        
        try:
            auditLogObj.check_and_log_daily_action(
                adminId=adminId,
                adminUsername=adminUsername,
                action_type='PAGE_VIEW',
                detail='Accessed Clients page',
                object_table='clients',
                object_id=0
            )
        except Exception as e:
            print("Error logging page view:", e)
        return [dict(row) for row in clients]
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching clients"}

@clients_blueprint.route("/clients/get-details/<client_id>/<token>")
def getClientDetails(client_id, token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        client = clientObj.getClientDetails(client_id)
        if client:
            return dict(client[0])
        else:
            return {"errFlag": 1, "message": "Client not found"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching client"}

@clients_blueprint.route("/clients/change-status/<client_id>/<status>/<token>")
def changeClientStatus(client_id, status, token):
    if status not in ["0", "1"]:
        return {"errFlag": 1, "message": "Status must be 0 or 1"}
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId= res[0]["id"]
        adminUsername=res[0].get("username","")
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    #get client details for audit log old values
    try:
        client = clientObj.getClientDetails(client_id)
        client = dict(client[0])
        if not client:
            return {"errFlag": 1, "message": "Client not found"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching client details"}
    
    
    try:
        status = int(status)
        response = clientObj.changeClientStatus(client_id, status)
        
        if response > 0:
            #Audit Log
            try:
                action = 'ACTIVATE' if status == 1 else 'DEACTIVATE'
                auditLogObj.log_action(
                    adminId=adminUserId,
                    adminUsername=adminUsername,
                    action_type=action,
                    detail=f'Client status changed: {client["client_name"]} (ID: {client_id}) to {status}',
                    object_table='clients',
                    object_id=client_id,
                    old_value={'status': client['status']},
                    new_value={'status': status}
                    )
            except Exception as e:
                print("Error logging audit:", e)
            return {"errFlag": 0, "message": "Client status updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update client status"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating client status"}
    

@clients_blueprint.route("/clients/bulk-upload", methods=["POST"])
def bulkUploadClients():
    """
    Bulk upload clients via Excel sheet
    Expected form data:
    - token: authentication token
    - file: Excel file with client data
    """
    try:
        token = request.form["token"]
        if not token:
            return {"errFlag": 1, "message": "Token is required"}
        
        # Validate token
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid token"}
        admin_user_id = res[0]["id"]
        adminUsername=res[0].get("username","")

        # Check if file is provided
        excel_file = request.files.get("file")
        if not excel_file:
            return {"errFlag": 1, "message": "Excel file is missing"}

        #Audit log for bulk upload
        try:
            auditLogObj.log_action(
                adminId=admin_user_id,
                adminUsername=adminUsername,
                action_type='BULK_UPLOAD',
                detail='Initiated bulk upload of clients via Excel',
                object_table='clients',
                object_id=0
            )
        except Exception as e:
            print("Error logging bulk upload action:", e)
        # Call the bulk upload method from ClientClass
        return clientObj.bulkUploadClients(excel_file, admin_user_id)

    except Exception as e:
        print("Bulk upload error:", e)
        return {"errFlag": 1, "message": "Something went wrong during bulk upload"}

@clients_blueprint.route("/clients/bulk-upload-template/download/<token>")
def downloadClientTemplate(token):
    """
    Download Excel template for bulk client upload
    """
    try:
        # Validate token
        res = adminUserObj.validateToken(token)
        if not res:
            return {"errFlag": 1, "message": "Invalid token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid token"}
    
    # Generate and return the template
    return clientObj.generateBulkUploadTemplate()