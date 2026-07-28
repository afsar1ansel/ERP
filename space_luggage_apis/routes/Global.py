from flask import Blueprint, request
from classes.GlobalClass import globalSearchObj
from classes.AdminUsersClass import adminUserObj # Assuming you have this for token validation

# Create a Blueprint for global search routes
global_search_blueprint = Blueprint("global_search", __name__)

@global_search_blueprint.route("/global-search" , methods=["POST"])
def globalSearch():
    search_term = request.form.get('searchTerm', '').strip()
    token = request.form.get('token')

    if not search_term:
        return {"errFlag": 1, "message": "Search term 'searchTerm' is required in query parameters."}

    if not token:
        return {"errFlag": 1, "message": "Token is required."}

    # 2. Validate the user token
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        # adminUserId = res[0]["id"] # You can use this if you need to log who searched
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}

    # 3. Perform the search by calling the class method
    try:
        responseData = globalSearchObj.perform_search(search_term)
        
        # Convert the SQLAlchemy result to a list of dictionaries, which is JSON-friendly
        resJsonData = [dict(row) for row in responseData]
        
        return {"errFlag": 0, "results": resJsonData}
    
    except Exception as e:
        print(f"An exception occurred in the global search route: {e}")
        return {"errFlag": 1, "message": "An error occurred while fetching search results."}