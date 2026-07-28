from db import db
from sqlalchemy.sql import text
from datetime import datetime

class AdminRolePageClass:

    def checkDuplicatePageName(self, page_name, page_id=None):
        """
        Checks if a page_name already exists in the admin_role_pages table.
        If page_id is provided, it excludes that ID from the check (used for updates).
        """
        data = {'page_name': page_name}

        if page_id:
            sql = text('SELECT * FROM admin_role_pages WHERE page_name = :page_name AND id != :page_id')
            data['page_id'] = page_id
        else:
            sql = text('SELECT * FROM admin_role_pages WHERE page_name = :page_name')
        
        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
        return res.mappings().all()

    def addRolePage(self, page_name, admin_user_id):
        """
        Adds a new page to the admin_role_pages table.
        """
        # Check for duplicate page_name
        duplicate_page = self.checkDuplicatePageName(page_name)
        if duplicate_page:
            return {"errFlag": 1, "message": "Page name already exists"}

        data = {
            'page_name': page_name,
            'status': 1,  # Default to active
            'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'createdAdminId': admin_user_id
        }

        sql = text('''
            INSERT INTO admin_role_pages (
                page_name,
                status,
                created_at,
                created_admin_id
            ) VALUES (
                :page_name,
                :status,
                :createdAt,
                :createdAdminId
            )
        ''')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    def updateRolePage(self, page_id, page_name, admin_user_id):
        """
        Updates an existing page's name.
        """
        # Check for duplicate page_name, excluding the current page
        duplicate_page = self.checkDuplicatePageName(page_name, page_id)
        if duplicate_page:
            return {"errFlag": 1, "message": "Page name already exists"}

        data = {
            'page_id': page_id,
            'page_name': page_name,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': admin_user_id
        }

        sql = text('''
            UPDATE admin_role_pages
            SET page_name = :page_name,
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :page_id
        ''')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    def getAllRolePages(self):
        """
        Fetches all role pages, joining with the admin table to get creator/updater names.
        This follows the pattern of your getAllEmployees method.
        """
        # Assuming your admin table is 'admins' and the name column is 'name'
        sql = text('''
            SELECT 
                arp.*
            FROM 
                admin_role_pages arp 
            ORDER BY 
                arp.page_name
        ''')
        
        with db.engine.connect() as conn:
            res = conn.execute(sql)
        
        return res.mappings().all()

    def changePageStatus(self, page_id, status, admin_user_id):
        """
        Changes the status (0 or 1) of a role page.
        """
        data = {
            'page_id': page_id,
            'status': status,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': admin_user_id 
        }

        # Note: I added updated_admin_id here, as it makes sense with your schema
        # and the token validation provides the ID.
        sql = text('''
            UPDATE admin_role_pages 
            SET status = :status, 
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :page_id
        ''')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

# Singleton instance
adminRolePageObj = AdminRolePageClass()