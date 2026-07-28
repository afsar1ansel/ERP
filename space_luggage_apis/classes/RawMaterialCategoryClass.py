
from db import db
from sqlalchemy.sql import text
from datetime import datetime
import cloudinary.uploader
from werkzeug.utils import secure_filename

class RawMaterialCategoryClass:
    
    def upload_category_image(self, file):
        """Uploads a category image to Cloudinary with validation."""
        
        # Validation: File size (2MB limit)
        file.seek(0, 2) # Move to the end of the file
        file_size = file.tell()
        file.seek(0) # Reset file pointer
        if file_size > 2 * 1024 * 1024:
            return {"errFlag": 1, "message": "File size must be less than 2MB"}
        
        # Validation: File type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'webp'}
        filename = secure_filename(file.filename)
        if '.' not in filename or filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return {"errFlag": 1, "message": "Invalid file type. Allowed: PNG, JPG, JPEG, WEBP"}
        
        try:
            # Upload to Cloudinary in a specific folder
            upload_result = cloudinary.uploader.upload(
                file,
                folder="raw_material_category_images",
                transformation=[
                    {'width': 400, 'height': 400, 'crop': 'limit'},
                    {'quality': 'auto'},
                    {'format': 'webp'}
                ]
            )
            return {"errFlag": 0, "url": upload_result['secure_url'], "public_id": upload_result['public_id']}
        except Exception as e:
            return {"errFlag": 1, "message": f"Upload failed: {str(e)}"}

    def delete_category_image(self, public_id):
        """Deletes an image from Cloudinary using its public_id."""
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get('result') == 'ok'
        except Exception:
            return False

    def getCategories(self):
        """Fetches all active raw material categories with material count."""
        sql = text('''
            SELECT 
                rmc.*,
                COUNT(rm.id) as material_count
            FROM raw_material_categories rmc
            LEFT JOIN raw_materials rm ON rmc.id = rm.raw_material_category_id AND rm.status = 1
            WHERE rmc.status = 1 
            GROUP BY rmc.id
            ORDER BY rmc.category_name''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql)
        return responseData.mappings().all()

    def addCategory(self, categoryName, categoryDescription, categoryImageFile, adminUserId):
        """Adds a new raw material category."""
        if self.chkDuplicateCategoryName(categoryName):
            return {"errFlag": 1, "message": "A category with this name already exists"}

        image_url = ""
        image_public_id = None
        if categoryImageFile and categoryImageFile.filename != '':
            upload_result = self.upload_category_image(categoryImageFile)
            if upload_result["errFlag"] == 1:
                return upload_result
            image_url = upload_result["url"]
            image_public_id = upload_result["public_id"]

        data = {
            'categoryName': categoryName,
            'categoryDescription': categoryDescription,
            'categoryImage': image_url,
            'categoryImagePublicId': image_public_id,
            'status': 1,
            'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'createdAdminId': adminUserId,
        }

        sql = text('''
            INSERT INTO raw_material_categories (category_name, category_description, category_image, category_image_public_id, status, created_at, created_admin_id) 
            VALUES (:categoryName, :categoryDescription, :categoryImage, :categoryImagePublicId, :status, :createdAt, :createdAdminId)
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount

    def updateCategory(self, categoryId, categoryName, categoryDescription, categoryImageFile, adminUserId):
        """Updates an existing raw material category."""
        if self.chkDuplicateCategoryName(categoryName, categoryId):
            return {"errFlag": 1, "message": "Another category with this name already exists"}

        current_category = self.getCategoryDetails(categoryId)
        if not current_category:
            return {"errFlag": 1, "message": "Category not found"}

        image_url = current_category[0]['category_image']
        image_public_id = current_category[0]['category_image_public_id']

        if categoryImageFile and categoryImageFile.filename != '':
            upload_result = self.upload_category_image(categoryImageFile)
            if upload_result["errFlag"] == 1:
                return upload_result
            
            # If upload is successful, delete the old image
            if image_public_id:
                self.delete_category_image(image_public_id)
            
            image_url = upload_result["url"]
            image_public_id = upload_result["public_id"]

        data = {
            'categoryId': categoryId,
            'categoryName': categoryName,
            'categoryDescription': categoryDescription,
            'categoryImage': image_url,
            'categoryImagePublicId': image_public_id,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId,
        }

        sql = text('''
            UPDATE raw_material_categories 
            SET category_name = :categoryName,
                category_description = :categoryDescription,
                category_image = :categoryImage,
                category_image_public_id = :categoryImagePublicId,
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :categoryId
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount

    def getCategoryDetails(self, categoryId):
        """Fetches details for a single category."""
        sql = text('SELECT * FROM raw_material_categories WHERE id = :categoryId')
        data = {'categoryId': categoryId}
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
        return responseData.mappings().all()

    def changeCategoryStatus(self, categoryId, status, adminUserId):
        """Changes the active/inactive status of a category."""
        data = {
            'categoryId': categoryId,
            'status': status,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }

        sql = text('''
            UPDATE raw_material_categories 
            SET status = :status, 
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :categoryId
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount

    def chkDuplicateCategoryName(self, categoryName, categoryId=None):
        """Checks for duplicate category names."""
        if categoryId:
            sql = text('''
                SELECT id FROM raw_material_categories 
                WHERE LOWER(category_name) = LOWER(:categoryName) AND id != :categoryId  
            ''')
            data = {'categoryName': categoryName, 'categoryId': categoryId}
        else:
            sql = text('''
                SELECT id FROM raw_material_categories 
                WHERE LOWER(category_name) = LOWER(:categoryName)
            ''')
            data = {'categoryName': categoryName}
            
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
        
        return responseData.mappings().all()

    def getMaterialsByCategory(self, categoryId):
        """Get all raw materials under a specific category with complete details"""
        sql = text('''
            SELECT 
                rm.*,
                v.vendor_name,
                rmc.category_name
            FROM raw_materials rm
            LEFT JOIN vendors v ON rm.vendor_id = v.id
            LEFT JOIN raw_material_categories rmc ON rm.raw_material_category_id = rmc.id
            WHERE rm.raw_material_category_id = :categoryId AND rm.status = 1
            ORDER BY rm.material_name
        ''')
        data = {'categoryId': categoryId}
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
        return responseData.mappings().all()
    
# Create a single instance of the class
rawMaterialCategoryObj = RawMaterialCategoryClass()