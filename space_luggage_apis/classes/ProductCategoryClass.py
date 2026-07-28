
from db import db
from sqlalchemy.sql import text
from datetime import datetime
import cloudinary.uploader
from werkzeug.utils import secure_filename

class ProductCategoryClass:
    
    def upload_product_category_image(self, file):
        """Uploads a product category image to Cloudinary."""
        
        file.seek(0, 2)
        file_size = file.tell()
        file.seek(0)
        if file_size > 2 * 1024 * 1024: # 2MB limit
            return {"errFlag": 1, "message": "File size must be less than 2MB"}
        
        allowed_extensions = {'png', 'jpg', 'jpeg', 'webp'}
        filename = secure_filename(file.filename)
        if '.' not in filename or filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return {"errFlag": 1, "message": "Invalid file type. Allowed: PNG, JPG, JPEG, WEBP"}
        
        try:
            upload_result = cloudinary.uploader.upload(
                file,
                folder="product_category_images",
                transformation=[
                    {'width': 400, 'height': 400, 'crop': 'limit'},
                    {'quality': 'auto'},
                    {'format': 'webp'}
                ]
            )
            return {"errFlag": 0, "url": upload_result['secure_url'], "public_id": upload_result['public_id']}
        except Exception as e:
            return {"errFlag": 1, "message": f"Upload failed: {str(e)}"}

    def delete_product_category_image(self, public_id):
        """Deletes an image from Cloudinary."""
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get('result') == 'ok'
        except Exception:
            return False

    def getCategoriesWithProductCount(self):
        """Alternative method specifically for getting categories with product count"""
        sql = text('''
            SELECT 
                pc.id,
                pc.product_category_name,
                pc.product_description,
                pc.product_category_image,
                pc.product_category_image_public_id,
                pc.status,
                pc.created_at,
                pc.updated_at,
                pc.created_admin_id,
                pc.updated_admin_id,
                COUNT(ps.id) as product_count
            FROM product_categories pc
            LEFT JOIN products_sku ps ON pc.id = ps.product_category_id AND ps.status = 1
            WHERE pc.status = 1 
            GROUP BY pc.id
            ORDER BY pc.product_category_name
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql)
        return responseData.mappings().all()
    
    def addCategory(self, categoryName, description, imageFile, adminUserId):
        """Adds a new product category."""
        if self.chkDuplicateCategoryName(categoryName):
            return {"errFlag": 1, "message": "A product category with this name already exists"}

        image_url = ""
        image_public_id = None
        if imageFile and imageFile.filename != '':
            upload_result = self.upload_product_category_image(imageFile)
            if upload_result["errFlag"] == 1:
                return upload_result
            image_url = upload_result["url"]
            image_public_id = upload_result["public_id"]

        data = {
            'product_category_name': categoryName,
            'product_description': description,
            'product_category_image': image_url,
            'product_category_image_public_id': image_public_id,
            'status': 1,
            'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'created_admin_id': adminUserId,
        }

        sql = text('''
            INSERT INTO product_categories (product_category_name, product_description, product_category_image, product_category_image_public_id, status, created_at, created_admin_id) 
            VALUES (:product_category_name, :product_description, :product_category_image, :product_category_image_public_id, :status, :created_at, :created_admin_id)
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount

    def updateCategory(self, categoryId, categoryName, description, imageFile, adminUserId):
        """Updates an existing product category."""
        if self.chkDuplicateCategoryName(categoryName, categoryId):
            return {"errFlag": 1, "message": "Another product category with this name already exists"}

        current_category = self.getCategoryDetails(categoryId)
        if not current_category:
            return {"errFlag": 1, "message": "Category not found"}

        image_url = current_category[0]['product_category_image']
        image_public_id = current_category[0]['product_category_image_public_id']

        if imageFile and imageFile.filename != '':
            upload_result = self.upload_product_category_image(imageFile)
            if upload_result["errFlag"] == 1:
                return upload_result
            
            if image_public_id:
                self.delete_product_category_image(image_public_id)
            
            image_url = upload_result["url"]
            image_public_id = upload_result["public_id"]

        data = {
            'categoryId': categoryId,
            'product_category_name': categoryName,
            'product_description': description,
            'product_category_image': image_url,
            'product_category_image_public_id': image_public_id,
            'updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updated_admin_id': adminUserId,
        }

        sql = text('''
            UPDATE product_categories 
            SET product_category_name = :product_category_name,
                product_description = :product_description,
                product_category_image = :product_category_image,
                product_category_image_public_id = :product_category_image_public_id,
                updated_at = :updated_at,
                updated_admin_id = :updated_admin_id
            WHERE id = :categoryId
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount

    def getCategoryDetails(self, categoryId):
        """Fetches details for a single product category with product count."""
        sql = text('''
            SELECT 
                pc.*,
                COUNT(ps.id) as product_count
            FROM product_categories pc
            LEFT JOIN products_sku ps ON pc.id = ps.product_category_id AND ps.status = 1
            WHERE pc.id = :categoryId AND pc.status = 1
            GROUP BY pc.id
        ''')
        data = {'categoryId': categoryId}
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
        return responseData.mappings().all()
    
    def changeCategoryStatus(self, categoryId, status, adminUserId):
        """Changes the status of a product category."""
        data = {
            'categoryId': categoryId,
            'status': status,
            'updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updated_admin_id': adminUserId
        }

        sql = text('''
            UPDATE product_categories 
            SET status = :status, 
                updated_at = :updated_at,
                updated_admin_id = :updated_admin_id
            WHERE id = :categoryId
        ''')
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
            conn.commit()
        return responseData.rowcount

    def chkDuplicateCategoryName(self, categoryName, categoryId=None):
        """Checks for duplicate product category names."""
        if categoryId:
            sql = text('''
                SELECT id FROM product_categories 
                WHERE LOWER(product_category_name) = LOWER(:categoryName) AND id != :categoryId  
            ''')
            data = {'categoryName': categoryName, 'categoryId': categoryId}
        else:
            sql = text('''
                SELECT id FROM product_categories 
                WHERE LOWER(product_category_name) = LOWER(:categoryName)
            ''')
            data = {'categoryName': categoryName}
            
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
        
        return responseData.mappings().all()

    def getProductsByCategory(self, categoryId):
        """Get all products under a specific category with complete details"""
        sql = text('''
            SELECT 
                ps.*,
                b.brand_name,
                b.brand_code,
                pc.product_category_name
                
            FROM products_sku ps
            LEFT JOIN brands b ON ps.brand_id = b.id
            LEFT JOIN product_categories pc ON ps.product_category_id = pc.id
            WHERE ps.product_category_id = :categoryId AND ps.status = 1
            ORDER BY ps.product_name
        ''')
        data = {'categoryId': categoryId}
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
        return responseData.mappings().all()
productCategoryObj = ProductCategoryClass()