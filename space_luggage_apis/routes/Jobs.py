from flask import Blueprint, request
from classes.JobsClass import jobObj
from classes.AdminUsersClass import adminUserObj

jobs_blueprint = Blueprint("jobs", __name__)

@jobs_blueprint.route("/jobs/add", methods=["POST"])
def addJob():
    try:
        jobCode = request.form["jobCode"]
        jobTitle = request.form["jobTitle"]
        jobDescription = request.form.get("jobDescription", "")
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([jobCode, jobTitle, token]):
        return {"errFlag": 1, "message": "Job code, title and token are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        response = jobObj.addJob(jobCode, jobTitle, jobDescription, admin_user_id)
        
        if isinstance(response, dict):
            return response
        elif response > 0:
            return {"errFlag": 0, "message": "Job added successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to add job"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error adding job"}

@jobs_blueprint.route("/jobs/update", methods=["POST"])
def updateJob():
    try:
        jobId = request.form["jobId"]
        jobCode = request.form["jobCode"]
        jobTitle = request.form["jobTitle"]
        jobDescription = request.form.get("jobDescription", "")
        token = request.form["token"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if not all([jobId, jobCode, jobTitle, token]):
        return {"errFlag": 1, "message": "All fields are required"}
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        admin_user_id = res[0]["id"]
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        response = jobObj.updateJob(jobId, jobCode, jobTitle, jobDescription, admin_user_id)
        
        if isinstance(response, dict):
            return response
        elif response > 0:
            return {"errFlag": 0, "message": "Job updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update job"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating job"}

@jobs_blueprint.route("/jobs/get-all/<token>")
def getAllJobs(token):
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        jobs = jobObj.getAllJobs()
        return [dict(row) for row in jobs]
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching jobs"}

@jobs_blueprint.route("/jobs/get-details/<jobId>/<token>")
def getJobDetails(jobId, token):
    
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        job = jobObj.getJobDetails(jobId)
        if job:
            return dict(job[0])
        else:
            return {"errFlag": 1, "message": "Job not found"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error fetching job"}

@jobs_blueprint.route("/jobs/change-status/<jobId>/<status>/<token>")
def changeJobStatus(jobId, status, token):
    if status not in ["0", "1"]:
        return {"errFlag": 1, "message": "Status must be 0 or 1"}
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception as e:
        return {"errFlag": 1, "message": "Invalid Token"}
    
    try:
        status = int(status)
        response = jobObj.changeJobStatus(jobId, status)
        
        if response > 0:
            return {"errFlag": 0, "message": "Job status updated successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to update job status"}
    except Exception as e:
        return {"errFlag": 1, "message": "Error updating job status"}


