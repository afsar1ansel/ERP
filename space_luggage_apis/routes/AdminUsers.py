from flask import Blueprint,request
from db import db
from classes.AdminUsersClass import adminUserObj
from datetime import datetime
import jwt,hashlib
from classes.AuditLogClass import auditLogObj  

adminUsers_blueprint=Blueprint("adminUsers",__name__)


@adminUsers_blueprint.route("/admin-users/validate-user",methods=["POST"])
def validateUser():
    try:
        email = request.form['email']
        password = request.form['password']
    except Exception as e:
        # AUDIT LOG IMPLEMENTATION: LOGIN_FAILURE (Bad Input) ---
        auditLogObj.log_action(
            adminId=0,
            adminUsername='N/A',
            action_type='LOGIN_FAILURE',
            detail='Failed login attempt: Invalid input data format.',
            extra={'email_attempted': request.form.get('email', 'N/A')}
        )
        return {'errFlag': 1, 'message': 'Invalid inputs fields'}

    if email == "" or password == "":
        #  AUDIT LOG IMPLEMENTATION: LOGIN_FAILURE (Missing Fields) ---
        auditLogObj.log_action(
            adminId=0,
            adminUsername='N/A',
            action_type='LOGIN_FAILURE',
            detail=f'Failed login attempt: Missing email or password.',
            extra={'email_attempted': email}
        )
        return {"errFlag": 1, "message": 'email and password are required'}

    hashedPassword = hashlib.sha256(password.encode('utf-8')).hexdigest()

    response = adminUserObj.validateAdminCred(email, hashedPassword)

    if len(response) == 0:
        # AUDIT LOG IMPLEMENTATION: LOGIN_FAILURE (Invalid Creds) ---
        auditLogObj.log_action(
            adminId=0,
            adminUsername=email,
            action_type='LOGIN_FAILURE',
            detail=f'Failed login attempt: Invalid credentials for {email}',
            extra={'email_attempted': email}
        )
        return {'errFlag': 1, 'message': 'Invalid email or password'}

    # user found
    admin_row = response[0]
    adminId = admin_row["id"]
    adminEmail = admin_row["email"]
    adminUsername = admin_row.get("username", "")

    # create token
    dateTimeString = datetime.now().strftime("%Y%m%d%H%M%S")
    payload = f"{adminId}-{adminEmail}-{dateTimeString}"
    encodedJwt = jwt.encode({"payload": payload}, 'thirdeyecreative', algorithm="HS256")

    # store token in DB 
    adminUserObj.updateAdminUserToken(adminId, encodedJwt)

    # Fetch page access for the user's role and include in response
    try:
        role_id = admin_row.get('role_id') or admin_row.get('roleId') or admin_row.get('role')
        page_access = adminUserObj.get_pages_for_role(role_id)
    except Exception as e:
        print("Error fetching page access during login:", e)
        page_access = []

    # AUDIT LOG IMPLEMENTATION: LOGIN_SUCCESS ---

    auditLogObj.log_action(
        adminId,
        adminUsername,
        action_type='LOGIN_SUCCESS',
        detail=f'Successful login by Admin: {adminUsername} (ID: {adminId})',
        object_table='admin_users',
        object_id=adminId
    )
    
    return {
        "errFlag": 0,
        "message": "Login Successful",
        "token": encodedJwt,
        "username": adminUsername,
        "page_access": page_access
    }


@adminUsers_blueprint.route("/admin-users/add",methods=["POST"])
def addAdminUser():
    try:
        username=request.form["username"]
        email=request.form["email"]
        password=request.form["password"]
        role=request.form["role"]
        token=request.form["token"]
    except Exception as e:
        return {"errFlag":1,"message":"Invalid inputs"} 
    
    
    if username=="" or email=="" or  password=="" or  role=="":
        return {"errFlag":1,"message":"all fields are required"}
    
    if not token :
        return {"errFlag":1, "message":"token is required"}
    
    resToken=adminUserObj.validateToken(token)
    
    if resToken==0:
        return {"errFlag":1,"message":"Invalid token"}
    
    # Get details of the admin performing the action (creator)
    createdAdminId = resToken[0]["id"]
    createdAdminUsername = resToken[0].get("username", "N/A")
    
    hashedPassword=hashlib.sha256(password.encode("utf-8")).hexdigest()
    
    #checking email duplication
    checkEmailDuplicationData=adminUserObj.checkDuplicateEmail(email)
    
    if len(checkEmailDuplicationData)>0:
        return {"errFlag":1,"message":"email already registered"}
    
    try:
        addAdminUserRes=adminUserObj.addAdminUser(username,email,hashedPassword,role)
    
    except Exception  as e:
        return {"errFlag":1,"message":"error on adding user"} 
    
    
    if addAdminUserRes > 0:
        new_admin_id = addAdminUserRes
        
        # AUDIT LOG IMPLEMENTATION: CREATE ---
        try:
            auditLogObj.log_action(
                createdAdminId,
                createdAdminUsername,
                action_type='CREATE',
                detail=f'Created new Admin User: {username} (ID: {new_admin_id})',
                object_table='admin_users',
                object_id=new_admin_id,
                new_value={'username': username, 'email': email, 'role_id': role}
            )
        except Exception as e:
            pass  # Silently handle logging errors
        
        return {"errFlag":0,"message":"user added successfully"}
    
    return{"errFlag":1,"message":"error on adding user"}

@adminUsers_blueprint.route("/admin-users/get-all-Admin-users/<token>")
def getAllAdminUser(token):
    
    if token=="":
        return {"errFlag":1,"message":"token is required"}
        
    try:
        res=adminUserObj.validateToken(token)  
        if len(res)==0:
            return {"errFlag":1,"message":"Invalid token"}
        
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
        
    except Exception as e:
         return {"errFlag":1,"message":"Invalid token"}  
    
    #  AUDIT LOG IMPLEMENTATION: PAGE VIEW (Once per day per page)
    try:
        auditLogObj.check_and_log_daily_action(
        adminId=adminUserId,
        adminUsername=adminUsername,
        action_type='PAGE_VIEW',
        detail='Accessed Admin Users page',
        object_table='admin_users',
        object_id=0
        )
    except Exception as e:
        print("Error logging page view:", e)

    try:
        allAdminUsers=adminUserObj.getAllAdminUsers()
    except Exception as e:
        return {"errFlag":1,"message":"error while fetching"}    
    
    return [dict(row) for row in allAdminUsers]

@adminUsers_blueprint.route("/admin-users/get-admin-user/<adminUserId>/<token>")
def getAdminUser(adminUserId,token):
    if token=="":
        return {"errFlag":1,"message":"token is required"}
    
    try:
        res=adminUserObj.validateToken(token)  
        if len(res)==0:
            return {"errFlag":1,"message":"Invalid token"}
        
        adminUserId = res[0]["id"]
        adminUsername = res[0].get("username", "N/A")
        
    except Exception as e:
         return {"errFlag":1,"message":"Invalid token"}

    # AUDIT LOG IMPLEMENTATION: PAGE VIEW (Once per day per page)
    try:
        auditLogObj.check_and_log_daily_action(
        adminId=adminUserId,
        adminUsername=adminUsername,
        action_type='PAGE_VIEW',
        detail="Visited Admin User Details Page for ID: " + str(adminUserId), 
        object_table='admin_users',
        object_id=adminUserId
        )
    except Exception as e:
        pass
    
    try:
        adminUserData=adminUserObj.getAdminUserDetails(adminUserId)
    except Exception as e:
        return {"errFlag":1,"message":"error while fetching"}    
    return dict(adminUserData[0])
    
@adminUsers_blueprint.route("/admin-users/change-user-status/<status>/<adminUserId>/<token>")
def changeAdminUserStatus(token,status,adminUserId):
    
    if token=="":
        return {"errFlag":1,"message":"token is required"}
    
    try:
        resToken=adminUserObj.validateToken(token)  
        if len(resToken)==0:
            return {"errFlag":1,"message":"Invalid token"}
        
        # Get admin performing the action
        actingAdminId = resToken[0]["id"]
        actingAdminUsername = resToken[0].get("username", "N/A")
        
    except Exception as e:
         return {"errFlag":1,"message":"Invalid token"}  

    # --- AUDIT LOG IMPLEMENTATION: PRE-STATUS CHANGE (Get old status) ---
    old_admin_data = adminUserObj.getAdminUserDetails(adminUserId)
    old_status = old_admin_data[0]['status'] if old_admin_data and old_admin_data[0] else 'N/A'
    
    try:
        new_status = int(status)
    except ValueError:
        return {"errFlag": 1, "message": "Invalid status value (must be 0 or 1)"}

    
    response = adminUserObj.changeAdminUserStatus(adminUserId,new_status)
    
    if response > 0:
        
        # --- AUDIT LOG IMPLEMENTATION: STATUS_CHANGE ---
        target_username = old_admin_data[0]['username'] if old_admin_data and old_admin_data[0] else f'ID: {adminUserId}'
        auditLogObj.log_action(
            adminId=actingAdminId,
            adminUsername=actingAdminUsername,
            action_type='STATUS_CHANGE',
            detail=f'Changed status of Admin User {target_username} (ID: {adminUserId}) from {old_status} to {new_status}.',
            object_table='admin_users',
            object_id=adminUserId,
            old_value={'status': old_status},
            new_value={'status': new_status}
        )
        
        return {"errFlag":0,"message":"Status Changed Successfully"}
    else:
        return {"errFlag":1,"message":"Error Changing Status"}


@adminUsers_blueprint.route("/admin-users/update-admin-user",methods=["POST"])
def updateAdminUser():
    try:
        username = request.form['username']
        email = request.form['email']
        roleId = request.form['roleId']
        password = request.form.get('password', '')
        token = request.form['token']
        changeAdminUserId=request.form["adminUserId"]
    except Exception as e:
        return {"errFlag":1,"message":"Invalid Inputs",}
    
    if username == '' or email == '' or roleId == '' or token == '' or changeAdminUserId == '':
        return {"errFlag":1,"message":"Data is missing"}
    
    try:
        resToken = adminUserObj.validateToken(token)
        
        if len(resToken) == 0:
            return {"errFlag":1,"message":"Invalid Token"}
        
        # Get admin performing the action
        actingAdminId = resToken[0]["id"]
        actingAdminUsername = resToken[0].get("username", "N/A")
            
    except Exception as e:
        return {"errFlag":1,"message":"Invalid Token"}

    # --- AUDIT LOG IMPLEMENTATION: PRE-UPDATE (Get old data) ---
    old_admin_data = adminUserObj.getAdminUserDetails(changeAdminUserId)
    old_value = dict(old_admin_data[0]) if old_admin_data else None
    
    
    duplicateResponseData = adminUserObj.checkDuplicateEmailForUpdate(email,changeAdminUserId)

    if len(duplicateResponseData) > 0:
        return {"errFlag":1,"message":"Email Already registered"}
    
    # Assume success initially
    updated_fields = 0
    
    # Update user data (username, email, roleId)
    updateUserCount = adminUserObj.updateAdminUserData(changeAdminUserId,username,email,roleId)
    updated_fields += updateUserCount
    
    if password!= '':
        hashedPassword = hashlib.sha256(password.encode('utf-8')).hexdigest()
        updatePasswordCount = adminUserObj.updateAdminUserPassword(changeAdminUserId,hashedPassword)
        updated_fields += updatePasswordCount
    
    if updated_fields > 0:
        # --- AUDIT LOG IMPLEMENTATION: UPDATE ---
        new_value = {
            'username': username, 
            'email': email, 
            'role_id': roleId, 
            'password_changed': password != ''
        }
        
        auditLogObj.log_action(
            adminId=actingAdminId,
            adminUsername=actingAdminUsername,
            action_type='UPDATE',
            detail=f'Updated details for Admin User {username} (ID: {changeAdminUserId}). Password {"was" if password else "was not"} reset.',
            object_table='admin_users',
            object_id=changeAdminUserId,
            old_value=old_value,
            new_value=new_value
        )
        
        return {"errFlag":0,"message":"updated Data Saved Successfully"}

    # If nothing was updated
    return {"errFlag":1,"message":"No changes were detected or update failed."}


@adminUsers_blueprint.route("/admin-users/token/validate",methods=['POST'])
def validateAdminToken():
    try:
        token=request.form['token']
        
        if token=="":
            return {'errFlag':1,'message':'token is required'}
    except:
         return {'errFlag':1,'message':'token is required'}
     
    try:
        res=adminUserObj.validateToken(token)
        if len(res)==0:
            return {'errFlag':1,'message':'Invalid token'} 
        adminId=res[0]['id']
        
        return {'errFlag':0,'message':'Authorization successful','adminId':adminId}
    except:
        return {'errFlag':1,'message':'Invalid token'}      

        
          
    