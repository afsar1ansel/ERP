# classes/CompanyInfoSettingsClass.py
from db import db
from sqlalchemy.sql import text
from datetime import datetime
import cloudinary.uploader
from werkzeug.utils import secure_filename

class CompanyInfoSettingsClass:

    def upload_company_logo(self, file):
        """Upload company logo to Cloudinary with validation (<=5MB)."""
        try:
            # file size check (seek/tell method)
            file.seek(0, 2)
            size = file.tell()
            file.seek(0)
            if size > 5 * 1024 * 1024:
                return {"errFlag": 1, "message": "File size must be less than 5MB"}
        except Exception:
            pass

        allowed_extensions = {'png', 'jpg', 'jpeg', 'webp'}
        filename = secure_filename(file.filename or "")
        if '.' not in filename or filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return {"errFlag": 1, "message": "Invalid file type. Allowed: PNG, JPG, JPEG, WEBP"}

        try:
            upload_result = cloudinary.uploader.upload(
                file,
                folder="company_logos",
                transformation=[
                    {'width': 800, 'height': 800, 'crop': 'limit'},
                    {'quality': 'auto'},
                    {'format': 'auto'}
                ]
            )
            return {"errFlag": 0, "url": upload_result.get('secure_url'), "public_id": upload_result.get('public_id')}
        except Exception as e:
            print("Cloudinary upload error:", e)
            return {"errFlag": 1, "message": "Logo upload failed"}

    def getCompanyInfo(self):
        """Return latest active company info row (status = 1)."""
        sql = text('''
            SELECT * FROM company_info_settings
            WHERE status = 1
            ORDER BY id DESC
            LIMIT 1
        ''')
        with db.engine.connect() as conn:
            res = conn.execute(sql).mappings().all()
        if not res:
            return None
        return dict(res[0])

    def upsertCompanyInfo(self, companyName, gstin, phone, email, address,
                          logoUrl, logoPublicId, adminUserId):
        """
        Update existing active company row if exists; otherwise insert new row.
        - If updating and logoUrl/logoPublicId is None => DON'T change those columns.
        - Returns inserted row id (int) on insert, rowcount on update, or error dict.
        """
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Normalize empty strings to None so caller can pass '' and it won't erase fields
        if logoUrl == "":
            logoUrl = None
        if logoPublicId == "":
            logoPublicId = None

        # Check if any active row exists
        exists_sql = text('SELECT id FROM company_info_settings WHERE status = 1 ORDER BY id DESC LIMIT 1')
        with db.engine.connect() as conn:
            existing = conn.execute(exists_sql).mappings().all()

        try:
            if existing:
                # Update the latest active row but only set logo fields when provided
                company_id = existing[0]['id']

                # Build SET clauses dynamically so we don't overwrite logo fields with NULL/None
                set_clauses = [
                    "company_name = :companyName",
                    "gstin = :gstin",
                    "phone = :phone",
                    "email = :email",
                    "address = :address",
                    "updated_at = :updatedAt",
                    "updated_admin_id = :updatedAdminId"
                ]

                params = {
                    'companyId': company_id,
                    'companyName': companyName,
                    'gstin': gstin,
                    'phone': phone,
                    'email': email,
                    'address': address,
                    'updatedAt': now,
                    'updatedAdminId': adminUserId
                }

                # Only include logo columns when a new logo is provided (not None)
                if logoUrl is not None:
                    set_clauses.append("logo_url = :logoUrl")
                    params['logoUrl'] = logoUrl
                if logoPublicId is not None:
                    set_clauses.append("logo_public_id = :logoPublicId")
                    params['logoPublicId'] = logoPublicId

                # Join clauses into the final SQL
                set_sql = ",\n    ".join(set_clauses)
                sql_text = f'''
                    UPDATE company_info_settings
                    SET
                        {set_sql}
                    WHERE id = :companyId
                '''
                sql = text(sql_text)

                with db.engine.connect() as conn:
                    res = conn.execute(sql, params)
                    conn.commit()
                return res.rowcount  # usually >0 when updated
            else:
                # Insert new row (logo fields will be NULL if None)
                insert_sql = text('''
                    INSERT INTO company_info_settings
                    (company_name, gstin, phone, email, address, logo_url, logo_public_id, status, created_at, created_admin_id)
                    VALUES
                    (:companyName, :gstin, :phone, :email, :address, :logoUrl, :logoPublicId, 1, :createdAt, :createdAdminId)
                ''')
                params = {
                    'companyName': companyName,
                    'gstin': gstin,
                    'phone': phone,
                    'email': email,
                    'address': address,
                    'logoUrl': logoUrl,
                    'logoPublicId': logoPublicId,
                    'createdAt': now,
                    'createdAdminId': adminUserId
                }
                with db.engine.connect() as conn:
                    res = conn.execute(insert_sql, params)
                    # res.lastrowid works for many DBAPIs; if your DB returns different attr adjust accordingly
                    company_id = getattr(res, "lastrowid", None) or res.rowcount
                    conn.commit()
                return company_id
        except Exception as e:
            print("Error in upsertCompanyInfo:", e)
            return {"errFlag": 1, "message": "Error while saving company info"}

# singleton
companyInfoObj = CompanyInfoSettingsClass()
