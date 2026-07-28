# BrandClass.py file:
from db import db
from sqlalchemy.sql import text
from datetime import datetime
import cloudinary.uploader
import os
from werkzeug.utils import secure_filename
class BrandClass:
    def upload_brand_logo(self, file):
        """Upload brand logo to Cloudinary with validation"""
        
        # Validation: File size (2MB limit)
        if len(file.read()) > 2 * 1024 * 1024:  # 2MB in bytes
            file.seek(0)  # Reset file pointer
            return {"errFlag": 1, "message": "File size must be less than 2MB"}
        
        file.seek(0)  # Reset file pointer after checking size
        
        # Validation: File type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
        filename = secure_filename(file.filename)
        if '.' not in filename or filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return {"errFlag": 1, "message": "Invalid file type. Allowed: PNG, JPG, JPEG, GIF, BMP, WEBP"}
        
        try:
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                file,
                folder="brand_logos",
                transformation=[
                    {'width': 300, 'height': 300, 'crop': 'limit'},
                    {'quality': 'auto'},
                    {'format': 'auto'}
                ]
            )
            
            return {"errFlag": 0, "url": upload_result['secure_url'], "public_id": upload_result['public_id']}
            
        except Exception as e:
            return {"errFlag": 1, "message": f"Upload failed"}

    def delete_brand_logo(self, public_id):
        """Delete logo from Cloudinary"""
        try:
            result = cloudinary.uploader.destroy(public_id)
            if result.get('result') == 'ok':
                return True
            return False
        except:
            return False

    def getBrands(self):
        sql = text('SELECT * FROM brands WHERE status = 1 ORDER BY brand_name')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql)
        return responseData.mappings().all()

    def chkDuplicateBrandCode(self, brandCode, brandId=None):
        if brandId:
            sql = text('''
                SELECT * FROM brands 
                WHERE brand_code = :brandCode AND id != :brandId  
            ''')
            data = {'brandCode': brandCode, 'brandId': brandId}
            with db.engine.connect() as conn:
                responseData = conn.execute(sql, data)
        else:
            sql = text('''
                SELECT * FROM brands 
                WHERE brand_code = :brandCode
            ''')
            data = {'brandCode': brandCode}
            with db.engine.connect() as conn:
                responseData = conn.execute(sql, data)
        
        return responseData.mappings().all()

    def chkDuplicateBrandName(self, brandName, brandId=None):
        if brandId:
            sql = text('''
                SELECT * FROM brands 
                WHERE LOWER(brand_name) = LOWER(:brandName) AND id != :brandId  
            ''')
            data = {'brandName': brandName, 'brandId': brandId}
            with db.engine.connect() as conn:
                responseData = conn.execute(sql, data)
        else:
            sql = text('''
                SELECT * FROM brands 
                WHERE LOWER(brand_name) = LOWER(:brandName)
            ''')
            data = {'brandName': brandName}
            with db.engine.connect() as conn:
                responseData = conn.execute(sql, data)
        
        return responseData.mappings().all()

    def addBrand(self, brandName, brandCode, brandLogoFile, adminUserId):
        # Check for duplicate brand name
        duplicate_name = self.chkDuplicateBrandName(brandName)
        if duplicate_name:
            return {"errFlag": 1, "message": "Brand with this name already exists"}

        # Check for duplicate brand code
        duplicate_code = self.chkDuplicateBrandCode(brandCode)
        if duplicate_code:
            return {"errFlag": 1, "message": "Brand code already exists"}

        # Handle logo upload
        brand_logo_url = ""
        brand_logo_public_id = ""
        
        if brandLogoFile and brandLogoFile.filename != '':
            upload_result = self.upload_brand_logo(brandLogoFile)
            if upload_result["errFlag"] == 1:
                return upload_result
            brand_logo_url = upload_result["url"]
            brand_logo_public_id = upload_result["public_id"]

        data = {
            'brandName': brandName,
            'brandCode': brandCode,
            'brandLogo': brand_logo_url,
            'brandLogoPublicId': brand_logo_public_id,
            'status': 1,
            'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'createdAdminId': adminUserId
        }

        sql = text('''
            INSERT INTO brands (brand_name, brand_code, brand_logo, brand_logo_public_id, status, created_at, created_admin_id) 
            VALUES (:brandName, :brandCode, :brandLogo, :brandLogoPublicId, :status, :createdAt, :createdAdminId)
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.lastrowid
    
    def updateBrand(self, brandId, brandName, brandCode, brandLogoFile, adminUserId):
        # Check for duplicate brand name (excluding current brand)
        duplicate_name = self.chkDuplicateBrandName(brandName, brandId)
        if duplicate_name:
            return {"errFlag": 1, "message": "Another brand with this name already exists"}

        # Check for duplicate brand code (excluding current brand)
        duplicate_code = self.chkDuplicateBrandCode(brandCode, brandId)
        if duplicate_code:
            return {"errFlag": 1, "message": "Brand code already exists"}

        # Get current logo to delete if needed
        current_brand = self.getBrandDetails(brandId)
        current_logo_public_id = current_brand[0]['brand_logo_public_id'] if current_brand else None

        # Handle new logo upload
        brand_logo_url = current_brand[0]['brand_logo'] if current_brand else ""
        brand_logo_public_id = current_logo_public_id
        
        if brandLogoFile and brandLogoFile.filename != '':
            upload_result = self.upload_brand_logo(brandLogoFile)
            if upload_result["errFlag"] == 1:
                return upload_result
            
            brand_logo_url = upload_result["url"]
            brand_logo_public_id = upload_result["public_id"]

            # Delete old logo if it exists
            if current_logo_public_id:
                self.delete_brand_logo(current_logo_public_id)

        data = {
            'brandId': brandId,
            'brandName': brandName,
            'brandCode': brandCode,
            'brandLogo': brand_logo_url,
            'brandLogoPublicId': brand_logo_public_id,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }

        sql = text('''
            UPDATE brands 
            SET brand_name = :brandName, 
                brand_code = :brandCode,
                brand_logo = :brandLogo,
                brand_logo_public_id = :brandLogoPublicId,
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :brandId
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount
    
    def getBrandDetails(self, brandId):
        sql = text('SELECT * FROM brands WHERE id = :brandId')
        data = {'brandId': brandId}
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
        return responseData.mappings().all()
    
    def changeBrandStatus(self, brandId, status):
        data = {
            'brandId': brandId,
            'status': status,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        sql = text('''
            UPDATE brands 
            SET status = :status, updated_at = :updatedAt
            WHERE id = :brandId
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount

brandObj = BrandClass()