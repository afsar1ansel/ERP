from db import db
from sqlalchemy.sql import text
from datetime import date, datetime
import json,csv
import pytz
from io import StringIO
from flask import request, has_request_context
import re


class AuditLogClass:
    # Define a regex pattern for a JWT token (three base64-like parts separated by dots)
    # The pattern is: [base64_part].[base64_part].[base64_part]
    # JWT characters: A-Z, a-z, 0-9, -, _, .
    # The token is the most variable part of your URL, so we target it directly.
    # Note: We are using a simplified pattern `[A-Za-z0-9\-\._]+` to catch the token safely.
    TOKEN_PATTERN = r"([A-Za-z0-9\-\._]{10,}\.[A-Za-z0-9\-\._]{10,}\.[A-Za-z0-9\-\._]{10,})"
    TOKEN_PLACEHOLDER = "{token_stripped}"
    
    def _strip_token_from_route(self, route_path):
        """
        Finds and replaces the JWT token pattern within the route path with a placeholder.
        """
        if not route_path:
            return route_path
        
        # Use re.sub to find all occurrences of the token pattern and replace them
        # with the placeholder.
        cleaned_route = re.sub(self.TOKEN_PATTERN, self.TOKEN_PLACEHOLDER, route_path)
        return cleaned_route
    
    def get_request_metadata(self):
        """Extracts common metadata from the current request context."""
        metadata = {}
        if has_request_context():
            original_route = request.path
            # --- SECURITY FIX: STRIP TOKEN HERE ---
            metadata['route'] = self._strip_token_from_route(original_route)
            metadata['http_method'] = request.method
            metadata['ip_address'] = request.remote_addr
            metadata['user_agent'] = request.headers.get('User-Agent')
        return metadata

    # Helper function for JSON serialization
    def serialize_datetime(self, obj):
        """JSON serializer for objects not serializable by default json code"""
        if isinstance(obj, (datetime, date)):
            # Convert date/datetime objects to ISO format string
            return obj.isoformat()
        # Raise TypeError for other unserializable types
        raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")
        
    def log_action(self, adminId,adminUsername, action_type, detail, 
                   object_table=None, object_id=None, 
                   old_value=None, new_value=None, extra=None):
        """
        Inserts a record into the audit_logs table.
        
        :param admin_info: Dict with 'id' and 'username' of the admin.
        :param action_type: e.g., 'LOGIN', 'CREATE', 'UPDATE', 'PAGE_VIEW', 'STATUS_CHANGE'.
        :param detail: Short human-readable description of the action.
        :param object_table: Name of the affected table (e.g., 'admin_users', 'brands').
        :param object_id: ID of the affected row.
        :param old_value: JSON serializable dict of data before the change.
        :param new_value: JSON serializable dict of data after the change.
        :param extra: JSON serializable dict for any other context data.
        """
        try:
            # Get request-specific data
            req_meta = self.get_request_metadata()
            
            # Define IST timezone
            ist_timezone = pytz.timezone('Asia/Kolkata')
            current_time_ist = datetime.now(ist_timezone)

            # Prepare data for insertion
            data = {
                'event_time': current_time_ist.strftime("%Y-%m-%d %H:%M:%S"),
                'admin_id': adminId,
                'admin_username': adminUsername,
                'action_type': action_type,
                'detail': detail,
                'object_table': object_table,
                'object_id': str(object_id) if object_id is not None else None,
                'route': req_meta.get('route'),
                'http_method': req_meta.get('http_method'),
                'ip_address': req_meta.get('ip_address'),
                'user_agent': req_meta.get('user_agent'),
                # Convert dicts to JSON strings for database
                'old_value': json.dumps(old_value, default=self.serialize_datetime) if old_value is not None else None,
                'new_value': json.dumps(new_value, default= self.serialize_datetime) if new_value is not None else None,
                'extra': json.dumps(extra, default=self.serialize_datetime) if extra is not None else None,
                'created_at': current_time_ist.strftime("%Y-%m-%d %H:%M:%S")
            }
            
            sql = text("""
                INSERT INTO audit_logs (
                    event_time, admin_id, admin_username, action_type, detail, 
                    object_table, object_id, route, http_method, ip_address, 
                    user_agent, old_value, new_value, extra, created_at, status
                ) VALUES (
                    :event_time, :admin_id, :admin_username, :action_type, :detail, 
                    :object_table, :object_id, :route, :http_method, :ip_address, 
                    :user_agent, :old_value, :new_value, :extra, :created_at, 1
                )
            """)
            
        
            with db.engine.connect() as conn:
                conn.execute(sql, data)
                conn.commit()
        except Exception as e:
            # Handle logging error silently to avoid disrupting main app flow
            print(f"Audit log insertion failed: {e}")
            
    
    def check_and_log_daily_action(self, adminId, adminUsername, action_type, detail, object_table=None, object_id=None):
        """
        Logs a specific 'action_type' only once per day for a specific admin 
        and the current request route. Requires the detail message to be passed.

        :param adminId: The ID of the admin performing the action.
        :param adminUserName: The username of the admin.
        :param action_type: The type of action to log (e.g., 'PAGE_VIEW', 'DAILY_SEARCH').
        :param detail: The specific detail/message to be logged. (Required)
        :param object_table: Optional table name related to the action.
        :param object_id: Optional ID of the object related to the action.
        """
        try:
            req_meta = self.get_request_metadata()
            # unique key for the action per day
            daily_action_key = req_meta.get('route')
            
            admin_id = adminId
            admin_username = adminUsername
            ist_timezone = pytz.timezone('Asia/Kolkata')
            current_date = datetime.now(ist_timezone).strftime("%Y-%m-%d")

            # 1. Check if a log already exists for this admin, action_type, key, and today
            check_sql = text("""
                SELECT 1 FROM audit_logs 
                WHERE admin_id = :admin_id 
                  AND action_type = :action_type
                  AND route = :action_key 
                  AND DATE(event_time) = :current_date
                LIMIT 1
            """)
            check_data = {
                'admin_id': admin_id, 
                'action_type': action_type,
                'action_key': daily_action_key,
                'current_date': current_date
            }

            with db.engine.connect() as conn: 
                exists = conn.execute(check_sql, check_data).fetchone()

            # 2. If no log exists, create the log entry
            if not exists:
                
                self.log_action(
                    adminId=admin_id,
                    adminUsername=admin_username,
                    action_type=action_type,
                    detail=detail, 
                    object_table=object_table,
                    object_id=object_id,
                    extra={'route_logged': daily_action_key} 
                )

        except Exception as e:
            # Non-critical: Daily action check/log failed
            print(f"Daily audit log check failed (non-critical) for {action_type}: {e}")
        
    def getAllAuditLogs(self, page=1, per_page=20):
        """
        Fetches a paginated list of all audit logs.
        """
        offset = (page - 1) * per_page
        
        # Count total records for pagination
        count_sql = text("SELECT COUNT(*) FROM audit_logs")
        with db.engine.connect() as conn:
            total_count = conn.execute(count_sql).scalar()
            
        # Fetch paginated data, ordered by event_time descending
        sql = text('''
            SELECT * FROM audit_logs 
            ORDER BY event_time DESC 
            LIMIT :per_page OFFSET :offset
        ''')
        data = {'per_page': per_page, 'offset': offset}
        
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
        
        logs = responseData.mappings().all()
        logs = [dict(log) for log in logs]
        # Safely convert JSON strings (old_value, new_value) to dicts for API response
        for log in logs:
            log['old_value'] = json.loads(log['old_value']) if log['old_value'] else None
            log['new_value'] = json.loads(log['new_value']) if log['new_value'] else None

        return logs, total_count

    def getAuditLogsForDownload(self, start_date_str, end_date_str):
        """
        Fetches all audit logs within a given date range and returns a CSV string.
        Date strings are expected in 'YYYY-MM-DD' format.
        """
        
        # Ensure dates cover the entire day (from 00:00:00 on start_date to 23:59:59 on end_date)
        start_datetime = datetime.strptime(start_date_str, '%Y-%m-%d').strftime("%Y-%m-%d 00:00:00")
        end_datetime = datetime.strptime(end_date_str, '%Y-%m-%d').strftime("%Y-%m-%d 23:59:59")

        sql = text('''
            SELECT * FROM audit_logs
            WHERE event_time BETWEEN :start_time AND :end_time
            ORDER BY event_time ASC
        ''')
        data = {'start_time': start_datetime, 'end_time': end_datetime}
        
        with db.engine.connect() as conn:
            responseData = conn.execute(sql, data)
        
        logs = responseData.mappings().all()
        
        if not logs:
            return None, "No logs found for the specified date range."

        # Convert logs to CSV format
        si = StringIO()
        
        # Define the fields/columns for the CSV based on your table structure
        fieldnames = [
            'id', 'event_time', 'admin_id', 'admin_username', 'action_type', 
            'detail', 'object_table', 'object_id', 'route', 'http_method', 
            'ip_address', 'user_agent', 'old_value', 'new_value', 'extra', 
            'status', 'created_at'
        ]
        
        writer = csv.DictWriter(si, fieldnames=fieldnames, extrasaction='ignore')
        
        writer.writeheader()
        
        for log in logs:
            # Prepare data for CSV, converting JSON fields to strings
            row = dict(log)
            row['old_value'] = json.dumps(row['old_value']) if row['old_value'] else ''
            row['new_value'] = json.dumps(row['new_value']) if row['new_value'] else ''
            writer.writerow(row)
            
        csv_output = si.getvalue()
        si.close()
        
        return csv_output, None    
auditLogObj = AuditLogClass()