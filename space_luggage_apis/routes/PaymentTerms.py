from flask import Blueprint, request
from classes.AdminUsersClass import adminUserObj
from classes.PaymentTermsClass import paymentTermObj

payment_terms_blueprint = Blueprint("payment_terms", __name__)

@payment_terms_blueprint.route("/payment-terms/get-payment-terms/<token>")
def getPaymentTerms(token):
    if token == "":
        return {"errFlag": 1, "message": "token is required"}
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        rows = paymentTermObj.getPaymentTerms()
        return [dict(r) for r in rows]
    except Exception:
        return {"errFlag": 1, "message": "error while fetching payment terms"}

@payment_terms_blueprint.route("/payment-terms/add-payment-term", methods=["POST"])
def addPaymentTerm():
    try:
        termName = request.form["termName"]
        token = request.form["token"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if termName == "" or token == "":
        return {"errFlag": 1, "message": "termName and token are required"}

    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        out = paymentTermObj.addPaymentTerm(termName, adminUserId)
        if isinstance(out, dict) and out.get("errFlag") == 1:
            return out
        elif out > 0:
            return {"errFlag": 0, "message": "Payment Term Added Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Add Payment Term"}
    except Exception:
        return {"errFlag": 1, "message": "error while adding payment term"}

@payment_terms_blueprint.route("/payment-terms/update-payment-term", methods=["POST"])
def updatePaymentTerm():
    try:
        paymentTermId = request.form["paymentTermId"]
        termName = request.form["termName"]
        token = request.form["token"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid inputs"}

    if paymentTermId == "" or termName == "" or token == "":
        return {"errFlag": 1, "message": "fields are missing"}

    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
        adminUserId = res[0]["id"]
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        out = paymentTermObj.updatePaymentTerm(paymentTermId, termName, adminUserId)
        if isinstance(out, dict) and out.get("errFlag") == 1:
            return out
        elif out > 0:
            return {"errFlag": 0, "message": "Payment Term Updated Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Update Payment Term"}
    except Exception:
        return {"errFlag": 1, "message": "error while updating payment term"}

@payment_terms_blueprint.route("/payment-terms/change-payment-term-status/<paymentTermId>/<status>/<token>")
def changePaymentTermStatus(paymentTermId, status, token):
    if token == "":
        return {"errFlag": 1, "message": "token is required"}
    try:
        res = adminUserObj.validateToken(token)
        if len(res) == 0:
            return {"errFlag": 1, "message": "Invalid Token"}
    except Exception:
        return {"errFlag": 1, "message": "Invalid Token"}

    try:
        out = paymentTermObj.changePaymentTermStatus(paymentTermId, status)
        if out > 0:
            return {"errFlag": 0, "message": "Payment Term Status Changed Successfully"}
        else:
            return {"errFlag": 1, "message": "Failed to Change Payment Term Status"}
    except Exception:
        return {"errFlag": 1, "message": "error while changing payment term status"}
