import json
from db import db
from sqlalchemy.sql import text
from datetime import datetime

class AdminRoleClass:

    def checkDuplicateRoleName(self, role_name, role_id=None):
        """
        Checks if a role_name already exists.
        If role_id is provided, it excludes that ID from the check (for updates).
        """
        data = {'role_name': role_name}

        if role_id:
            sql = text('SELECT * FROM admin_roles WHERE role_name = :role_name AND id != :role_id')
            data['role_id'] = role_id
        else:
            sql = text('SELECT * FROM admin_roles WHERE role_name = :role_name')
        
        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
        return res.mappings().all()

    def addAdminRole(self, role_name, page_access_list, admin_user_id):
        """
        Adds a new admin role.
        page_access_list is a Python list, e.g., [1, 2, 5]
        """
        # Check for duplicate role_name
        duplicate_role = self.checkDuplicateRoleName(role_name)
        if duplicate_role:
            return {"errFlag": 1, "message": "Role name already exists"}

        try:
            # Convert Python list [1, 5] to JSON string "[1, 5]"
            page_access_json = json.dumps(page_access_list)
        except Exception as e:
            return {"errFlag": 1, "message": "Invalid page access list format"}

        data = {
            'role_name': role_name,
            'page_access': page_access_json,
            'status': 1,
            'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'createdAdminId': admin_user_id
        }

        sql = text('''
            INSERT INTO admin_roles (
                role_name,
                page_access,
                status,
                created_at,
                created_admin_id
            ) VALUES (
                :role_name,
                :page_access,
                :status,
                :createdAt,
                :createdAdminId
            )
        ''')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    def updateAdminRole(self, role_id, role_name, page_access_list, admin_user_id):
        """
        Updates an existing admin role.
        """
        # Check for duplicate role_name, excluding this role_id
        duplicate_role = self.checkDuplicateRoleName(role_name, role_id)
        if duplicate_role:
            return {"errFlag": 1, "message": "Role name already exists"}

        try:
            # Convert Python list [1, 5] to JSON string "[1, 5]"
            page_access_json = json.dumps(page_access_list)
        except Exception as e:
            return {"errFlag": 1, "message": "Invalid page access list format"}

        data = {
            'role_id': role_id,
            'role_name': role_name,
            'page_access': page_access_json,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': admin_user_id
        }

        sql = text('''
            UPDATE admin_roles
            SET role_name = :role_name,
                page_access = :page_access,
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :role_id
        ''')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    def getAllAdminRoles(self):
        """
        Fetches all admin roles.
        It also joins with admin_role_pages to get the *names* of the pages.
        """
        # 1. Fetch all roles
        sql_roles = text('''
            SELECT 
                ar.*
            FROM 
                admin_roles ar
            ORDER BY 
                ar.role_name
        ''')
        
        with db.engine.connect() as conn:
            roles_res = conn.execute(sql_roles)
            roles = roles_res.mappings().all()

        if not roles:
            return []

        # 2. Fetch all pages for mapping IDs to names
        sql_pages = text('SELECT id, page_name FROM admin_role_pages')
        with db.engine.connect() as conn:
            pages_res = conn.execute(sql_pages)
            # Create a simple lookup dictionary: {1: "Dashboard", 2: "Settings"}
            page_map = {page['id']: page['page_name'] for page in pages_res.mappings().all()}

        # 3. Process roles to replace page IDs with page objects
        result = []
        for role in roles:
            role_dict = dict(role) # Convert from RowMapping
            
            # Safely parse the page_access JSON string
            page_ids = []
            if role_dict['page_access']:
                try:
                    # page_access is stored as string "[1, 5]", json.loads converts to list [1, 5]
                    page_ids = json.loads(role_dict['page_access'])
                except json.JSONDecodeError:
                    page_ids = [] # Handle bad data gracefully
            
            # Create a list of objects: [{"id": 1, "page_name": "Dashboard"}, ...]
            page_details = []
            if isinstance(page_ids, list):
                for page_id in page_ids:
                    page_name = page_map.get(page_id, "Unknown Page") # Get name from map
                    page_details.append({"id": page_id, "page_name": page_name})
            
            # Overwrite 'page_access' (which was just IDs) with the full details
            role_dict['page_access_details'] = page_details
            result.append(role_dict)

        return result


    def changeAdminRoleStatus(self, role_id, status, admin_user_id):
        """
        Changes the status (0 or 1) of an admin role.
        """
        data = {
            'role_id': role_id,
            'status': status,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': admin_user_id 
        }

        sql = text('''
            UPDATE admin_roles 
            SET status = :status, 
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :role_id
        ''')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    def getAdminRoleDetails(self, role_id):
        """
        Fetches details of a specific admin role by ID.
        """
        sql = text('''
            SELECT * FROM admin_roles WHERE id = :role_id
        ''')
        data = {'role_id': role_id}
        
        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
            role = res.mappings().first()
        
        return dict(role) if role else None
# Singleton instance
adminRoleObj = AdminRoleClass()