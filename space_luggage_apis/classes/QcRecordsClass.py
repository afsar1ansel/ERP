# QcRecordsClass.py
from db import db
from sqlalchemy.sql import text
from datetime import datetime
import cloudinary.uploader
import os
from werkzeug.utils import secure_filename

class QcRecordsClass:

    def upload_qc_image(self, file):
        """Upload QC image to Cloudinary with validation"""
        
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
                folder="qc_records",
                transformation=[
                    {'width': 300, 'height': 300, 'crop': 'limit'},
                    {'quality': 'auto'},
                    {'format': 'auto'}
                ]
            )
            
            return {"errFlag": 0, "url": upload_result['secure_url'], "public_id": upload_result['public_id']}
            
        except Exception as e:
            return {"errFlag": 1, "message": "Upload failed"}

    def delete_qc_image(self, public_id):
        """Delete image from Cloudinary"""
        try:
            result = cloudinary.uploader.destroy(public_id)
            if result.get('result') == 'ok':
                return True
            return False
        except:
            return False

    def checkDuplicateQcCode(self, qcCode, qcId=None):
        data = {'qcCode': qcCode}

        if qcId:
            sql = text('SELECT * FROM qc_records WHERE qc_code = :qcCode AND id != :qcId AND status = 1')
            data['qcId'] = qcId
        else:
            sql = text('SELECT * FROM qc_records WHERE qc_code = :qcCode AND status = 1')

        with db.engine.connect() as conn:
            res = conn.execute(sql, data)
        return res.mappings().all()


    # --- MODIFIED METHOD ---
    def addQcRecord(self, entityType, entityId, itemName, inspectorName, testTypeId, testParameters, remarks, result, defect_count, qcImageFile, adminUserId):
        qcCode = self.generate_qc_code()
        # Check duplicate QC code
        duplicate_code = self.checkDuplicateQcCode(qcCode)
        if duplicate_code:
            return {"errFlag": 1, "message": "QC code already exists"}

        # Handle QC image upload
        qc_image_url = ""
        qc_image_public_id = ""
        
        if qcImageFile and qcImageFile.filename != '':
            upload_result = self.upload_qc_image(qcImageFile)
            if upload_result["errFlag"] == 1:
                return upload_result
            qc_image_url = upload_result["url"]
            qc_image_public_id = upload_result["public_id"]

        data = {
            'qcCode': qcCode,
            'entityType': entityType,
            'entityId': entityId,
            'itemName': itemName,
            'inspectorName': inspectorName,
            'testTypeId': testTypeId,
            'testParameters': testParameters,
            'remarks': remarks,
            'result': result,
            'defectCount': defect_count,
            'qcImageUrl': qc_image_url,
            'qcImagePublicId': qc_image_public_id,
            'status': 1,
            'createdAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'createdAdminId': adminUserId
        }

        sql = text('''
            INSERT INTO qc_records (
                qc_code, 
                entity_type,
                entity_id,
                item_name,
                inspector_name,
                test_type_id,
                test_parameters,
                remarks,
                result,
                defect_count,
                qc_image_url,
                qc_image_public_id,
                status,
                created_at,
                created_admin_id)
            VALUES (
                :qcCode,
                :entityType, 
                :entityId,
                :itemName,
                :inspectorName,
                :testTypeId,
                :testParameters,
                :remarks,
                :result,
                :defectCount,
                :qcImageUrl,
                :qcImagePublicId,
                :status,
                :createdAt,
                :createdAdminId)
        ''')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    def updateQcRecord(self, qcId, qcCode, entityType, entityId, itemName, inspectorName, testTypeId, testParameters, remarks, result, defect_count, qcImageFile, adminUserId):
        # Check duplicate QC code excluding current record
        duplicate_code = self.checkDuplicateQcCode(qcCode, qcId)
        if duplicate_code:
            return {"errFlag": 1, "message": "QC code already exists"}

        # Get current QC record details for image cleanup
        current_record = self.getQcRecordDetails(qcId)
        current_image_public_id = current_record[0]['qc_image_public_id'] if current_record else None

        qc_image_url = current_record[0]['qc_image_url'] if current_record else ""
        qc_image_public_id = current_image_public_id
        
        if qcImageFile and qcImageFile.filename != '':
            upload_result = self.upload_qc_image(qcImageFile)
            if upload_result["errFlag"] == 1:
                return upload_result
            qc_image_url = upload_result["url"]
            qc_image_public_id = upload_result["public_id"]
            
            # Delete old image if it exists
            if current_image_public_id:
                self.delete_qc_image(current_image_public_id)

        data = {
            'qcId': qcId,
            'qcCode': qcCode,
            'entityType': entityType,
            'entityId': entityId,
            'itemName': itemName,
            'inspectorName': inspectorName,
            'testTypeId': testTypeId,
            'testParameters': testParameters,
            'remarks': remarks,
            'result': result,
            'defectCount': defect_count,
            'qcImageUrl': qc_image_url,
            'qcImagePublicId': qc_image_public_id,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'updatedAdminId': adminUserId
        }

        sql = text('''
            UPDATE qc_records 
            SET qc_code = :qcCode, 
                entity_type = :entityType,
                entity_id = :entityId,
                item_name = :itemName,
                inspector_name = :inspectorName,
                test_type_id = :testTypeId,
                test_parameters = :testParameters,
                remarks = :remarks,
                result = :result,
                defect_count = :defectCount,
                qc_image_url = :qcImageUrl,
                qc_image_public_id = :qcImagePublicId,
                updated_at = :updatedAt,
                updated_admin_id = :updatedAdminId
            WHERE id = :qcId
        ''')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    def getAllQcRecords(self):
        sql = text('''
            SELECT qr.*, tt.test_type_name 
            FROM qc_records qr 
            LEFT JOIN qc_test_type tt ON qr.test_type_id = tt.id 
            WHERE qr.status = 1 
            ORDER BY qr.created_at DESC
        ''')
        with db.engine.connect() as conn:
            res = conn.execute(sql)
        return res.mappings().all()

    def getQcRecordDetails(self, qcId):
        sql = text('''
            SELECT qr.*, tt.test_type_name 
            FROM qc_records qr 
            LEFT JOIN qc_test_type tt ON qr.test_type_id = tt.id 
            WHERE qr.id = :qcId AND qr.status = 1
        ''')
        with db.engine.connect() as conn:
            res = conn.execute(sql, {'qcId': qcId})
        return res.mappings().all()

    def changeQcRecordStatus(self, qcId, status):
        data = {
            'qcId': qcId,
            'status': status,
            'updatedAt': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        sql = text('UPDATE qc_records SET status = :status, updated_at = :updatedAt WHERE id = :qcId')
        
        with db.engine.connect() as conn:
            result = conn.execute(sql, data)
            conn.commit()
        
        return result.rowcount

    def getQcRecordsByResult(self, result):
        sql = text('''
            SELECT qr.*, tt.test_type_name 
            FROM qc_records qr 
            LEFT JOIN qc_test_type tt ON qr.test_type_id = tt.id 
            WHERE qr.result = :result AND qr.status = 1 
            ORDER BY qr.created_at DESC
        ''')
        with db.engine.connect() as conn:
            res = conn.execute(sql, {'result': result})
        return res.mappings().all()

    def getQcRecordsByEntity(self, entityType, entityId):
        sql = text('''
            SELECT qr.*, tt.test_type_name 
            FROM qc_records qr 
            LEFT JOIN qc_test_type tt ON qr.test_type_id = tt.id 
            WHERE qr.entity_type = :entityType AND qr.entity_id = :entityId AND qr.status = 1 
            ORDER BY qr.created_at DESC
        ''')
        with db.engine.connect() as conn:
            res = conn.execute(sql, {'entityType': entityType, 'entityId': entityId})
        return res.mappings().all()

    def generate_qc_code(self):
        """Generate unique QC code like QC-YYYY-XXX"""
        current_year = datetime.now().year
        sql = text("""
            SELECT qc_code
            FROM qc_records
            WHERE qc_code LIKE :pattern
            ORDER BY id DESC
            LIMIT 1
        """)
        with db.engine.connect() as conn:
            result = conn.execute(sql, {"pattern": f"QC-{current_year}-%"}).mappings().all()
        if result:
            last_number = int(result[0]["qc_code"].split("-")[-1])
            new_number = last_number + 1
        else:
            new_number = 1
        return f"QC-{current_year}-{new_number:03d}"

# Singleton instance
qcRecordObj = QcRecordsClass()