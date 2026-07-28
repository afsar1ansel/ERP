from db import db
from sqlalchemy.sql import text
from datetime import datetime
import jwt
import re
import json
class AdminUsers:   
    def validateAdminCred(self,email,password):
        
        data={
            "email":email,
            "password":password,
        }
        
        sql= text('''
                  SELECT * FROM admin_users
                  WHERE email=:email AND password=:password AND status=1
                  '''
                  )
        with db.engine.connect() as conn:
            res=conn.execute(sql,data)
        
        return res.mappings().all()    

    
    def updateAdminUserToken(self,adminId,token):
        data={
            "adminId":adminId,
            "token":token,
        }
        
        sql= text('''
                  UPDATE admin_users
                  SET token= :token
                  WHERE id= :adminId                 
                  '''
                  )
        with db.engine.connect() as conn:
            res=conn.execute(sql,data)
            conn.commit()
        return res.rowcount  
    

    def get_pages_for_role(self, role_id):
        """
        Return ordered list of pages for a given role_id.
        Tries to handle several storage formats for `admin_roles.page_access`:
         - JSON array of ids or names: [1,2] or ["dashboard","orders"]
         - CSV string: "1,2,3" or "dashboard,orders"
         - empty -> []
        Returns list of dicts: [{ "id": <int|null>, "page_name": <str>, "page_route": <str> }, ...]
        If you just need names, map result to [p['page_name'] for p in result].
        """
        try:
            if not role_id:
                return []

            # 1) Fetch page_access value for the role
            sql_role = text("""
                SELECT id, page_access
                FROM admin_roles
                WHERE id = :role_id AND status = 1
                LIMIT 1
            """)
            with db.engine.connect() as conn:
                role_row = conn.execute(sql_role, {'role_id': role_id}).mappings().first()

            if not role_row:
                return []

            raw_access = role_row.get('page_access')
            if raw_access is None:
                return []

            # 2) Normalize access into a python list (preserve order)
            access_list = []
            # try JSON first (handles: [1,2], ["dashboard","orders"])
            try:
                parsed = json.loads(raw_access) if isinstance(raw_access, str) else raw_access
                if isinstance(parsed, list):
                    access_list = parsed
                else:
                    # if JSON returned a single value, make it a list
                    access_list = [parsed]
            except Exception:
                # fallback: comma-separated string like "1,2,3" or "dashboard,orders"
                if isinstance(raw_access, str):
                    # split on comma and whitespace, remove empty items
                    access_list = [p.strip() for p in re.split(r'[,\s]+', raw_access) if p.strip()]
                else:
                    # unknown format -> return empty
                    return []

            if not access_list:
                return []

            # 3) Decide whether entries are numeric ids or page names/keys
            numeric_ids = []
            name_keys = []
            for a in access_list:
                # if a is already int -> numeric
                if isinstance(a, int):
                    numeric_ids.append(int(a))
                else:
                    # if string looks like an integer
                    s = str(a).strip()
                    if re.fullmatch(r'\d+', s):
                        numeric_ids.append(int(s))
                    else:
                        # treat as name/key
                        name_keys.append(s)

            pages = []
            with db.engine.connect() as conn:
                # If numeric ids present -> fetch rows by id
                if numeric_ids:
                    # fetch all matching rows
                    # we will build a dict by id to preserve requested order later
                    ids_tuple = tuple(numeric_ids)
                    sql_pages_by_id = text(f"""
                        SELECT id, page_name, page_route
                        FROM admin_role_pages
                        WHERE id IN :ids AND status = 1
                    """)
                    # Note: SQLAlchemy/pymysql supports passing a tuple for IN :ids
                    rows = conn.execute(sql_pages_by_id, {'ids': ids_tuple}).mappings().all()
                    page_by_id = {r['id']: {'id': r['id'], 'page_name': r['page_name'], 'page_route': r.get('page_route')} for r in rows}

                    # preserve order as in access_list numeric_ids
                    for nid in numeric_ids:
                        if nid in page_by_id:
                            pages.append(page_by_id[nid])
                        else:
                            # missing id -> still include placeholder so frontend can show missing info
                            pages.append({'id': nid, 'page_name': f'Unknown Page #{nid}', 'page_route': None})

                # If name_keys present -> try fetch by page_name or page_route (prefer page_name)
                if name_keys:
                    # fetch matching rows (use OR on page_name or page_route)
                    # We will fetch all rows that match any of the names, then preserve requested order.
                    sql_pages_by_name = text("""
                        SELECT id, page_name, page_route
                        FROM admin_role_pages
                        WHERE status = 1
                          AND (page_name IN :names OR page_route IN :names)
                    """)
                    # convert keys to tuple
                    names_tuple = tuple(name_keys)
                    rows = conn.execute(sql_pages_by_name, {'names': names_tuple}).mappings().all()
                    # map by both page_name and page_route -> to find in original order
                    map_by_name = {}
                    for r in rows:
                        if r.get('page_name'):
                            map_by_name[str(r['page_name']).strip().lower()] = {'id': r['id'], 'page_name': r['page_name'], 'page_route': r.get('page_route')}
                        if r.get('page_route'):
                            map_by_name[str(r['page_route']).strip().lower()] = {'id': r['id'], 'page_name': r['page_name'], 'page_route': r.get('page_route')}

                    for key in name_keys:
                        k = str(key).strip().lower()
                        if k in map_by_name:
                            pages.append(map_by_name[k])
                        else:
                            # Not found -> include placeholder
                            pages.append({'id': None, 'page_name': key, 'page_route': None})

            # Return pages (ordered). You can convert to a list of names if desired:
            # return [p['page_name'] for p in pages]
            return pages

        except Exception as e:
            print("Error in get_pages_for_role:", e)
            return []
    
    def validateToken(self,token):
        try:
            decodedData=jwt.decode(token,"thirdeyecreative",algorithms=["HS256"])          
            payload=decodedData['payload']   
            adminId=payload.split("-")[0]
                       
            data={
                "token":token,
                "adminId":adminId
                }
            
            sql=text('''
                    SELECT * FROM admin_users
                    WHERE id =:adminId AND token =:token
                    ''')
            
            with db.engine.connect() as conn:
                res=conn.execute(sql,data)
            
            return res.mappings().all()  
        
        except Exception as e:
            print(e)
            return 0
        
    def addAdminUser(self,username,email,password,role):
        data={
            "username":username,
            "email":email,
            "password":password,
            "role":role,
            "status":1,
            "createdDate":datetime.now().strftime("%Y-%m-%d")
        }  
        sql=text('''
                 INSERT INTO admin_users(
                  username,
                  email,
                  password,
                  role_id,
                  status,
                  created_date                      
                 )
                 VALUES(
                   :username,
                   :email,
                   :password,
                   :role,
                   :status,
                   :createdDate  
                 )
                 ''')
        with db.engine.connect() as conn:
            res=conn.execute(sql,data) 
            conn.commit()
            
        return res.lastrowid      
            
    def checkDuplicateEmail(self,email):
        data={"email":email}
        
        sql=text(
            '''
            SELECT * FROM admin_users
            WHERE email=:email
            '''
        )   
        
        with db.engine.connect() as conn:
            res=conn.execute(sql,data)   
            
        return res.mappings().all()   
            
    def checkDuplicateEmailForUpdate(self,email,changeAdminUserId):
        data={
            "email":email,
            "adminUserId":changeAdminUserId
            }
        
        sql=text(
            '''
            SELECT * FROM admin_users
            WHERE email=:email AND id!=:adminUserId
            '''
        )   
        
        with db.engine.connect() as conn:
            res=conn.execute(sql,data)   
            
        return res.mappings().all()   
    
    def getAllAdminUsers(self):
        
        sql=text('''
                 SELECT id,username,email,role_id,created_date,status FROM admin_users
                 ''')
        
        with db.engine.connect() as conn:
            res=conn.execute(sql)
            
        return res.mappings().all()

    
    def getAdminUserDetails(self,adminUserId):
        
        sql=text('''
                 SELECT id,username,email,role_id,created_date,status FROM admin_users
                 WHERE id=:adminUserId
                 ''')
        data={"adminUserId":adminUserId}
        with db.engine.connect() as conn:
            res=conn.execute(sql,data)
            
        return res.mappings().all()    
    
    
    def changeAdminUserStatus(self,adminUserId,status):
        data = {
            'adminUserId': adminUserId,
            'status': status
        }

        sql = text('''
            UPDATE admin_users SET status = :status WHERE id = :adminUserId
        ''')
        
        with db.engine.connect() as conn:
            response = conn.execute(sql,data)
            conn.commit()

        return response.rowcount 
    
    def updateAdminUserData(self,adminUserId,username,email,roleId):
        data = {
            'adminUserId': adminUserId,
            "username":username,
            "email":email,
            "roleId":roleId,
            
        }

        sql = text('''
            UPDATE admin_users 
            SET username = :username ,email=:email,role_id=:roleId
            WHERE id = :adminUserId
        ''')
        
        with db.engine.connect() as conn:
            response = conn.execute(sql,data)
            conn.commit()

        return response.rowcount
    
    
    def updateAdminUserPassword(self,adminUserId,password) :
        data = {
            'adminUserId': adminUserId,
            'password': password
        }

        sql = text('''
            UPDATE admin_users
            SET password = :password 
            WHERE id = :adminUserId
        ''')
        
        with db.engine.connect() as conn:
            response = conn.execute(sql,data)
            conn.commit()

        return response.rowcount 
    
 
adminUserObj=AdminUsers()        