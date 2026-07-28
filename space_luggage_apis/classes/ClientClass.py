from db import db
from sqlalchemy.sql import text
from datetime import datetime
from openpyxl import Workbook
from openpyxl.worksheet.datavalidation import DataValidation
from flask import send_file
from io import BytesIO
import pandas as pd
from helper.files import send_workbook_response

class ClientClass:


    def checkDuplicateClientPhone(self, phone, client_id=None):
        data = {'phone': phone}

        if client_id:
            sql = text('SELECT * FROM clients WHERE phone = :phone AND id != :client_id')
            data['client_id'] = client_id
        else:
            sql = text('SELECT * FROM clients WHERE phone = :phone')
        
        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
        return res.mappings().all()

    def addClient(self, client_name, contact_person, client_type, email, phone, website, 
                 gst_number, credit_limit, payment_terms, billing_address, billing_addr_city, 
                 billing_addr_state, billing_addr_pincode, shipping_address, shipping_addr_city, 
                 shipping_addr_state, shipping_addr_pincode, notes, admin_user_id):
        

        # No longer checking for duplicate phone numbers

        data = {
            'client_name': client_name,
            'contact_person': contact_person,
            'client_type': client_type,
            'email': email,
            'phone': phone,
            'website': website,
            'gst_number': gst_number,
            'credit_limit': float(credit_limit) if credit_limit else 0.0,
            'payment_terms': payment_terms,
            'billing_address': billing_address,
            'billing_addr_city': billing_addr_city,
            'billing_addr_state': billing_addr_state,
            'billing_addr_pincode': billing_addr_pincode,
            'shipping_address': shipping_address,
            'shipping_addr_city': shipping_addr_city,
            'shipping_addr_state': shipping_addr_state,
            'shipping_addr_pincode': shipping_addr_pincode,
            'notes': notes,
            'status': 1,
            'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'created_admin_id': admin_user_id
        }

        sql = text('''
            INSERT INTO clients (
                client_name, contact_person, client_type, email, phone, website, 
                gst_number, credit_limit, payment_terms, billing_address, billing_addr_city, 
                billing_addr_state, billing_addr_pincode, shipping_address, shipping_addr_city, 
                shipping_addr_state, shipping_addr_pincode, notes, status, created_at, created_admin_id
            ) VALUES (
                :client_name, :contact_person, :client_type, :email, :phone, :website, 
                :gst_number, :credit_limit, :payment_terms, :billing_address, :billing_addr_city, 
                :billing_addr_state, :billing_addr_pincode, :shipping_address, :shipping_addr_city, 
                :shipping_addr_state, :shipping_addr_pincode, :notes, :status, :created_at, :created_admin_id
            )
        ''')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    def updateClient(self, client_id, client_name, contact_person, client_type, email, phone, 
                    website, gst_number, credit_limit, payment_terms, billing_address, 
                    billing_addr_city, billing_addr_state, billing_addr_pincode, shipping_address, 
                    shipping_addr_city, shipping_addr_state, shipping_addr_pincode, notes, admin_user_id):
        

        # No longer checking for duplicate phone numbers

        data = {
            'client_id': client_id,
            'client_name': client_name,
            'contact_person': contact_person,
            'client_type': client_type,
            'email': email,
            'phone': phone,
            'website': website,
            'gst_number': gst_number,
            'credit_limit': float(credit_limit) if credit_limit else 0.0,
            'payment_terms': payment_terms,
            'billing_address': billing_address,
            'billing_addr_city': billing_addr_city,
            'billing_addr_state': billing_addr_state,
            'billing_addr_pincode': billing_addr_pincode,
            'shipping_address': shipping_address,
            'shipping_addr_city': shipping_addr_city,
            'shipping_addr_state': shipping_addr_state,
            'shipping_addr_pincode': shipping_addr_pincode,
            'notes': notes,
            'updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updated_admin_id': admin_user_id
        }

        sql = text('''
            UPDATE clients 
            SET client_name = :client_name, 
                contact_person = :contact_person,
                client_type = :client_type,
                email = :email,
                phone = :phone,
                website = :website,
                gst_number = :gst_number,
                credit_limit = :credit_limit,
                payment_terms = :payment_terms,
                billing_address = :billing_address,
                billing_addr_city = :billing_addr_city,
                billing_addr_state = :billing_addr_state,
                billing_addr_pincode = :billing_addr_pincode,
                shipping_address = :shipping_address,
                shipping_addr_city = :shipping_addr_city,
                shipping_addr_state = :shipping_addr_state,
                shipping_addr_pincode = :shipping_addr_pincode,
                notes = :notes,
                updated_at = :updated_at,
                updated_admin_id = :updated_admin_id
            WHERE id = :client_id
        ''')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    def getAllClients(self):
        sql = text('SELECT * FROM clients WHERE status = 1 ORDER BY client_name')
        with db.engine.connect() as conn:
            res = conn.execute(sql)
        return res.mappings().all()

    def getClientDetails(self, client_id):
        sql = text('SELECT * FROM clients WHERE id = :client_id AND status = 1')
        with db.engine.connect() as conn:
            res = conn.execute(sql, {'client_id': client_id})
        return res.mappings().all()

    def changeClientStatus(self, client_id, status):
        data = {
            'client_id': client_id,
            'status': status,
            'updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        sql = text('UPDATE clients SET status = :status, updated_at = :updated_at WHERE id = :client_id')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount
    
    # bulk uploads


    def bulkUploadClients(self, excel_file, admin_user_id):
        """
        Bulk upload clients from Excel file
        """
        try:
            # Read Excel file
            df = pd.read_excel(excel_file, sheet_name="Clients")
        except Exception as e:
            return {"errFlag": 1, "message": "Could not read Excel file. Please check the format."}

        added_count = 0
        errors = []
        
        # Process each row
        for idx, row in df.iterrows():
            try:
                # Extract and validate required fields
                client_name = str(row.get("client_name", "")).strip()
                contact_person = str(row.get("contact_person_name", "")).strip()
                if contact_person.lower() == 'nan': contact_person = ""
                client_type = str(row.get("client_type", "")).strip()
                email = str(row.get("email", "")).strip()
                phone = str(row.get("phone", "")).strip()
                billing_address = str(row.get("billing_address", "")).strip()
                billing_addr_city = str(row.get("billing_addr_city", "")).strip()
                billing_addr_state = str(row.get("billing_addr_state", "")).strip()
                billing_addr_pincode = str(row.get("billing_addr_pincode", "")).strip()

                # Validate required fields
                if not all([client_name, contact_person, client_type, email, phone, 
                           billing_address, billing_addr_city, billing_addr_state, billing_addr_pincode]):
                    errors.append(f"Row {idx + 2}: Missing required fields")
                    continue

                # Validate email format
                if "@" not in email:
                    errors.append(f"Row {idx + 2}: Invalid email format")
                    continue

                # Extract optional fields
                website = str(row.get("website", "")).strip()
                gst_number = str(row.get("gst_number", "")).strip()
                credit_limit = float(row.get("credit_limit", 0)) if pd.notna(row.get("credit_limit")) else 0.0
                payment_terms = str(row.get("payment_terms", "")).strip()
                shipping_address = str(row.get("shipping_address", "")).strip()
                shipping_addr_city = str(row.get("shipping_addr_city", "")).strip()
                shipping_addr_state = str(row.get("shipping_addr_state", "")).strip()
                shipping_addr_pincode = str(row.get("shipping_addr_pincode", "")).strip()
                notes = str(row.get("notes", "")).strip()

                # No longer checking for duplicates

                # Add client
                result = self.addClient(
                    client_name, contact_person, client_type, email, phone, website,
                    gst_number, credit_limit, payment_terms, billing_address, billing_addr_city,
                    billing_addr_state, billing_addr_pincode, shipping_address, shipping_addr_city,
                    shipping_addr_state, shipping_addr_pincode, notes, admin_user_id
                )

                if isinstance(result, dict) and result.get("errFlag") == 1:
                    errors.append(f"Row {idx + 2}: {result['message']}")
                elif result == 1:
                    added_count += 1

            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")

        # Prepare response
        if errors:
            error_message = f"Successfully added {added_count} clients. Errors: " + "; ".join(errors[:5])  # Show first 5 errors
            return {"errFlag": 1, "message": error_message, "added_count": added_count, "error_count": len(errors)}
        else:
            return {"errFlag": 0, "message": f"Successfully added {added_count} clients", "added_count": added_count}

    def generateBulkUploadTemplate(self):
        """
        Generate Excel template for bulk client upload
        """
        try:
            # Create workbook and worksheet
            wb = Workbook()
            ws = wb.active
            ws.title = "Clients"

            # Define headers
            headers = [
                "client_name", "contact_person_name", "client_type", "email", "phone",
                "website", "gst_number", "credit_limit", "payment_terms",
                "billing_address", "billing_addr_city", "billing_addr_state", "billing_addr_pincode",
                "shipping_address", "shipping_addr_city", "shipping_addr_state", "shipping_addr_pincode",
                "notes"
            ]
            
            # Add headers to worksheet
            ws.append(headers)

            client_types = ["Business", "Indivisual"]
            dv_formula = '"' + ','.join(client_types) + '"'
            
            dv = DataValidation(
                type="list",
                formula1=dv_formula,
                allow_blank=True,
                showErrorMessage=True,
                errorStyle="stop",
                errorTitle="Invalid Input",
                error="Please select a valid Client Type from the dropdown list."
            )
            ws.add_data_validation(dv)
            dv.add('C2:C1000')  # Apply to client_type column

            # Create instructions sheet
            instruction_ws = wb.create_sheet("Instructions")
            
            instructions = [
                ["Bulk Client Upload Template - Instructions"],
                [""],
                ["Required Fields:", "client_name, contact_person, client_type, email, phone, billing_address, billing_addr_city, billing_addr_state, billing_addr_pincode"],
                [""],
                ["Field Descriptions:"],
                ["client_name", "Full name of the client company/individual"],
                ["contact_person", "Primary contact person name"],
                ["email", "Valid email address"],
                ["phone", "Contact phone number"],
                ["website", "Company website (optional)"],
                ["gst_number", "GST identification number (optional)"],
                ["credit_limit", "Credit limit in rupees (optional)"],
                ["payment_terms", "Payment terms e.g., Net 30 (optional)"],
                ["billing_address", "Complete billing address"],
                ["billing_addr_city", "Billing address city"],
                ["billing_addr_state", "Billing address state"],
                ["billing_addr_pincode", "Billing address pincode"],
                ["shipping_address", "Shipping address (optional)"],
                ["shipping_addr_city", "Shipping address city (optional)"],
                ["shipping_addr_state", "Shipping address state (optional)"],
                ["shipping_addr_pincode", "Shipping address pincode (optional)"],
                ["notes", "Additional notes (optional)"],
                [""],
                ["Important Notes:"],
                ["1. Do not modify the column headers"],
                ["2. Fill all required fields marked in the sample row"],
                ["3. Remove the sample row before uploading your data"],
                ["4. Ensure email format is correct"],
                ["5. Multiple clients can have the same name, email, or phone"]
            ]
            
            for instruction in instructions:
                instruction_ws.append(instruction)

            # Adjust column widths
            for column in ws.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                ws.column_dimensions[column_letter].width = adjusted_width

            # Return the workbook using your existing file helper
            return send_workbook_response(wb, "bulk_client_upload_template.xlsx")
            
        except Exception as e:
            print(f"Error generating template: {e}")
            return {"errFlag": 1, "message": f"Error generating template: {str(e)}"}

# Singleton instance
clientObj = ClientClass()