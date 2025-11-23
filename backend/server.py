from fastapi import FastAPI, HTTPException, Header, Response, Cookie, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient, DESCENDING
import os
from dotenv import load_dotenv
import httpx
import uuid

load_dotenv()

app = FastAPI()

# Get APP_URL from environment
APP_URL = os.getenv("APP_URL", "http://localhost:3000")

# CORS configuration - Allow all preview.emergentagent.com domains
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.preview\.emergentagent\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "finance_tracker")

client = MongoClient(MONGO_URL)
db = client[DATABASE_NAME]

# Collections
users_collection = db["users"]
partners_collection = db["partners"]
sales_collection = db["sales"]
expenses_collection = db["expenses"]
partner_payments_collection = db["partner_payments"]
investments_collection = db["investments"]
sessions_collection = db["user_sessions"]

# Initialize default partners if not exists
def init_partners():
    if partners_collection.count_documents({}) == 0:
        default_partners = [
            {"id": str(uuid.uuid4()), "name": "Silar", "share_percentage": 75.0, "capital_invested": 6150000.0, "created_at": datetime.now(timezone.utc)},
            {"id": str(uuid.uuid4()), "name": "Om", "share_percentage": 13.41, "capital_invested": 1100000.0, "created_at": datetime.now(timezone.utc)},
            {"id": str(uuid.uuid4()), "name": "Anurag", "share_percentage": 6.10, "capital_invested": 500000.0, "created_at": datetime.now(timezone.utc)},
            {"id": str(uuid.uuid4()), "name": "RK", "share_percentage": 3.66, "capital_invested": 300000.0, "created_at": datetime.now(timezone.utc)},
            {"id": str(uuid.uuid4()), "name": "Vijay", "share_percentage": 1.83, "capital_invested": 150000.0, "created_at": datetime.now(timezone.utc)},
        ]
        partners_collection.insert_many(default_partners)
        print("✅ Default partners initialized")
    else:
        # Update existing partners with capital_invested if not present
        for partner in partners_collection.find():
            if "capital_invested" not in partner:
                capital_map = {
                    "Silar": 6150000.0,
                    "Om": 1100000.0,
                    "Anurag": 500000.0,
                    "RK": 300000.0,
                    "Vijay": 150000.0
                }
                capital = capital_map.get(partner["name"], 0.0)
                partners_collection.update_one(
                    {"id": partner["id"]},
                    {"$set": {"capital_invested": capital}}
                )
        print("✅ Partners capital updated")

init_partners()

# Pydantic Models
class User(BaseModel):
    id: str = Field(alias="_id")
    email: str
    name: str
    picture: Optional[str] = None
    user_type: Optional[str] = "employee"
    created_at: datetime

    class Config:
        populate_by_name = True

class Partner(BaseModel):
    id: str
    name: str
    share_percentage: float
    created_at: datetime

class Sale(BaseModel):
    shoot_id: int
    date: str
    shoot_type: str
    total_time_hrs: float
    total_amount_inr: float
    received_by: str
    payment_mode: str
    cameraman: Optional[str] = None
    cameraman_mobile: Optional[str] = None
    customer_name: Optional[str] = None
    city: Optional[str] = None
    created_at: datetime

class Expense(BaseModel):
    date: str
    expense_type: str
    amount_inr: float
    description: Optional[str] = None
    paid_by: str
    payment_mode: str
    created_at: datetime

class PartnerPayment(BaseModel):
    date: str
    partner_id: str
    partner_name: str
    amount_inr: float
    month_year: str
    payment_mode: str
    description: Optional[str] = None
    created_at: datetime

class Investment(BaseModel):
    date: str
    partner_id: str
    partner_name: str
    amount_inr: float
    description: Optional[str] = None
    created_at: datetime

class UpdateSharesRequest(BaseModel):
    shares: List[dict]  # [{partner_id, share_percentage}]

# Auth Helper
async def get_current_user(request: Request):
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check session in database
    session = sessions_collection.find_one({
        "session_token": session_token,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    
    # Get user
    user_doc = users_collection.find_one({"id": session["user_id"]})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_doc["_id"] = user_doc["id"]
    return User(**user_doc)

# Routes
@app.get("/")
async def root():
    return {"message": "Finance Tracker API", "status": "running"}

@app.get("/api")
async def api_root():
    return {"message": "Finance Tracker API", "status": "running", "version": "1.0"}

# Auth endpoints
@app.get("/api/auth/google")
async def google_login(request: Request):
    # Get the origin from the request to determine correct redirect
    origin = request.headers.get("origin", APP_URL)
    # Ensure we use https
    if "preview.emergentagent.com" in origin:
        redirect_url = f"{origin}/dashboard"
    else:
        redirect_url = f"{APP_URL}/dashboard"
    
    auth_url = f"https://auth.emergentagent.com/?redirect={redirect_url}"
    return {"auth_url": auth_url}

@app.post("/api/auth/session")
async def create_session(session_id: str = Header(..., alias="X-Session-ID"), response: Response = None):
    # Get session data from Emergent auth
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            auth_response.raise_for_status()
            data = auth_response.json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to get session data: {str(e)}")
    
    # Check if user exists
    user = users_collection.find_one({"email": data["email"]})
    
    if not user:
        # Create new user
        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture"),
            "user_type": "employee",
            "created_at": datetime.now(timezone.utc)
        }
        users_collection.insert_one(user_doc)
    else:
        user_id = user["id"]
    
    # Store session
    session_token = data["session_token"]
    sessions_collection.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response = Response(content='{"status": "success"}', media_type="application/json")
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=7*24*60*60,
        path="/"
    )
    
    return response

@app.get("/api/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@app.post("/api/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        sessions_collection.delete_many({"session_token": session_token})
    
    response = Response(content='{"status": "logged out"}', media_type="application/json")
    response.delete_cookie(key="session_token", path="/")
    return response

# Dashboard
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(request: Request, month: Optional[str] = None):
    await get_current_user(request)
    
    # Default to last month if not specified
    if not month:
        today = datetime.now()
        if today.month == 1:
            month = f"{today.year - 1}-12"
        else:
            month = f"{today.year}-{str(today.month - 1).zfill(2)}"
    
    # Parse month
    year, month_num = month.split("-")
    start_date = f"{year}-{month_num}-01"
    
    # Calculate end date
    if month_num == "12":
        end_date = f"{int(year)+1}-01-01"
    else:
        end_date = f"{year}-{str(int(month_num)+1).zfill(2)}-01"
    
    # Get sales
    sales = list(sales_collection.find({
        "date": {"$gte": start_date, "$lt": end_date}
    }))
    total_revenue = sum(sale["total_amount_inr"] for sale in sales)
    
    # Get expenses
    expenses = list(expenses_collection.find({
        "date": {"$gte": start_date, "$lt": end_date}
    }))
    total_expenses = sum(expense["amount_inr"] for expense in expenses)
    
    # Calculate profit
    profit = total_revenue - total_expenses
    
    return {
        "month": month,
        "revenue": total_revenue,
        "expenses": total_expenses,
        "profit": profit
    }

# Sales endpoints
@app.post("/api/sales")
async def create_sale(sale_data: dict, request: Request):
    await get_current_user(request)
    
    # Get next shoot_id
    last_sale = sales_collection.find_one(sort=[("shoot_id", DESCENDING)])
    next_shoot_id = (last_sale["shoot_id"] + 1) if last_sale else 1
    
    sale = {
        "id": str(uuid.uuid4()),
        "shoot_id": next_shoot_id,
        "date": sale_data["date"],
        "shoot_type": sale_data["shoot_type"],
        "total_time_hrs": sale_data["total_time_hrs"],
        "total_amount_inr": sale_data["total_amount_inr"],
        "received_by": sale_data["received_by"],
        "payment_mode": sale_data["payment_mode"],
        "cameraman": sale_data.get("cameraman"),
        "cameraman_mobile": sale_data.get("cameraman_mobile"),
        "customer_name": sale_data.get("customer_name"),
        "city": sale_data.get("city"),
        "created_at": datetime.now(timezone.utc)
    }
    
    sales_collection.insert_one(sale)
    return {"status": "success", "shoot_id": next_shoot_id}

@app.get("/api/sales")
async def get_sales(request: Request):
    await get_current_user(request)
    
    sales = list(sales_collection.find().sort("date", DESCENDING))
    for sale in sales:
        sale["_id"] = str(sale["_id"])
    return sales


@app.put("/api/sales/{sale_id}")
async def update_sale(sale_id: str, sale_data: dict, request: Request):
    await get_current_user(request)
    
    update_data = {
        "date": sale_data["date"],
        "shoot_type": sale_data["shoot_type"],
        "total_time_hrs": sale_data["total_time_hrs"],
        "total_amount_inr": sale_data["total_amount_inr"],
        "received_by": sale_data["received_by"],
        "payment_mode": sale_data["payment_mode"],
        "cameraman": sale_data.get("cameraman"),
        "cameraman_mobile": sale_data.get("cameraman_mobile"),
        "customer_name": sale_data.get("customer_name"),
        "city": sale_data.get("city"),
    }
    
    result = sales_collection.update_one({"id": sale_id}, {"$set": update_data})
    
    if result.modified_count > 0:
        return {"status": "success", "message": "Sale updated"}
    else:
        raise HTTPException(status_code=404, detail="Sale not found")


# Expenses endpoints
@app.post("/api/expenses")
async def create_expense(expense_data: dict, request: Request):
    await get_current_user(request)
    
    expense = {
        "id": str(uuid.uuid4()),
        "date": expense_data["date"],
        "expense_type": expense_data["expense_type"],
        "amount_inr": expense_data["amount_inr"],
        "description": expense_data.get("description"),
        "paid_by": expense_data["paid_by"],
        "payment_mode": expense_data["payment_mode"],
        "created_at": datetime.now(timezone.utc)
    }
    
    expenses_collection.insert_one(expense)
    return {"status": "success"}

@app.get("/api/expenses")
async def get_expenses(request: Request):
    await get_current_user(request)
    
    expenses = list(expenses_collection.find().sort("date", DESCENDING))
    for expense in expenses:
        expense["_id"] = str(expense["_id"])
    return expenses

@app.put("/api/expenses/{expense_id}")
async def update_expense(expense_id: str, expense_data: dict, request: Request):
    await get_current_user(request)
    
    update_data = {
        "date": expense_data["date"],
        "expense_type": expense_data["expense_type"],
        "amount_inr": expense_data["amount_inr"],
        "description": expense_data.get("description"),
        "paid_by": expense_data["paid_by"],
        "payment_mode": expense_data["payment_mode"],
    }
    
    result = expenses_collection.update_one({"id": expense_id}, {"$set": update_data})
    
    if result.modified_count > 0:
        return {"status": "success", "message": "Expense updated"}
    else:
        raise HTTPException(status_code=404, detail="Expense not found")

# Partner Payments endpoints


@app.put("/api/partner-payments/{payment_id}")
async def update_partner_payment(payment_id: str, payment_data: dict, request: Request):
    await get_current_user(request)
    
    update_data = {
        "date": payment_data["date"],
        "amount_inr": payment_data["amount_inr"],
        "month_year": payment_data["month_year"],
        "payment_mode": payment_data["payment_mode"],
        "description": payment_data.get("description"),
    }
    
    result = partner_payments_collection.update_one({"id": payment_id}, {"$set": update_data})
    
    if result.modified_count > 0:
        return {"status": "success", "message": "Partner payment updated"}
    else:
        raise HTTPException(status_code=404, detail="Partner payment not found")

@app.post("/api/partner-payments")
async def create_partner_payment(payment_data: dict, request: Request):
    await get_current_user(request)
    
    payment = {
        "id": str(uuid.uuid4()),
        "date": payment_data["date"],
        "partner_id": payment_data["partner_id"],
        "partner_name": payment_data["partner_name"],
        "amount_inr": payment_data["amount_inr"],
        "month_year": payment_data["month_year"],
        "payment_mode": payment_data["payment_mode"],
        "description": payment_data.get("description"),
        "created_at": datetime.now(timezone.utc)
    }
    
    partner_payments_collection.insert_one(payment)
    return {"status": "success"}

@app.get("/api/partner-payments")
async def get_partner_payments(request: Request):
    await get_current_user(request)
    
    payments = list(partner_payments_collection.find().sort("date", DESCENDING))
    for payment in payments:
        payment["_id"] = str(payment["_id"])
    return payments

# Investments endpoints
@app.post("/api/investments")
async def create_investment(investment_data: dict, request: Request):
    await get_current_user(request)
    
    investment = {
        "id": str(uuid.uuid4()),
        "date": investment_data["date"],
        "partner_id": investment_data["partner_id"],
        "partner_name": investment_data["partner_name"],
        "amount_inr": investment_data["amount_inr"],
        "description": investment_data.get("description"),
        "created_at": datetime.now(timezone.utc)
    }
    
    investments_collection.insert_one(investment)
    
    # Update partner's capital invested
    partner = partners_collection.find_one({"id": investment_data["partner_id"]})


@app.put("/api/investments/{investment_id}")
async def update_investment(investment_id: str, investment_data: dict, request: Request):
    await get_current_user(request)
    
    update_data = {
        "date": investment_data["date"],
        "amount_inr": investment_data["amount_inr"],
        "description": investment_data.get("description"),
    }
    
    result = investments_collection.update_one({"id": investment_id}, {"$set": update_data})
    
    if result.modified_count > 0:
        return {"status": "success", "message": "Investment updated"}
    else:
        raise HTTPException(status_code=404, detail="Investment not found")

    if partner:
        # Existing partner - add to their capital
        current_capital = partner.get("capital_invested", 0.0)
        new_capital = current_capital + investment_data["amount_inr"]
        partners_collection.update_one(
            {"id": investment_data["partner_id"]},
            {"$set": {"capital_invested": new_capital}}
        )
    else:
        # New partner - create entry with 0% share (to be updated manually)
        partners_collection.insert_one({
            "id": investment_data["partner_id"],
            "name": investment_data["partner_name"],
            "share_percentage": 0.0,
            "capital_invested": investment_data["amount_inr"],
            "created_at": datetime.now(timezone.utc)
        })
    
    return {"status": "success", "message": "Investment recorded and capital updated. Please update partner shares in Partners section."}

@app.get("/api/investments")
async def get_investments(request: Request):
    await get_current_user(request)
    
    investments = list(investments_collection.find().sort("date", DESCENDING))
    for investment in investments:
        investment["_id"] = str(investment["_id"])
    return investments

# Partners endpoints
@app.get("/api/partners")
async def get_partners(request: Request):
    await get_current_user(request)
    
    partners = list(partners_collection.find())
    for partner in partners:
        partner["_id"] = str(partner["_id"])
    return partners



@app.post("/api/partners")
async def create_partner(partner_data: dict, request: Request):
    await get_current_user(request)
    
    partner_id = str(uuid.uuid4())
    partner = {
        "id": partner_id,
        "name": partner_data["name"],
        "share_percentage": partner_data.get("share_percentage", 0.0),
        "capital_invested": partner_data.get("capital_invested", 0.0),
        "created_at": datetime.now(timezone.utc)
    }
    
    partners_collection.insert_one(partner)
    
    # If initial investment provided, create investment record
    if partner_data.get("capital_invested", 0) > 0:
        investment = {
            "id": str(uuid.uuid4()),
            "date": partner_data.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
            "partner_id": partner_id,
            "partner_name": partner_data["name"],
            "amount_inr": partner_data["capital_invested"],
            "description": "Initial investment",
            "created_at": datetime.now(timezone.utc)
        }
        investments_collection.insert_one(investment)
    
    return {"status": "success", "partner_id": partner_id, "message": "Partner added successfully"}

@app.put("/api/partners/shares")
async def update_partner_shares(shares_data: UpdateSharesRequest, request: Request):
    await get_current_user(request)
    
    # Validate total is 100%
    total = sum(share["share_percentage"] for share in shares_data.shares)
    if abs(total - 100.0) > 0.01:
        raise HTTPException(status_code=400, detail=f"Total shares must equal 100%. Current total: {total}%")
    
    # Update each partner
    for share in shares_data.shares:
        partners_collection.update_one(
            {"id": share["partner_id"]},
            {"$set": {"share_percentage": share["share_percentage"], "last_updated": datetime.now(timezone.utc)}}
        )
    
    return {"status": "success", "message": "Partner shares updated"}

# Reports
@app.get("/api/reports/monthly")
async def get_monthly_report(request: Request, month: str):
    await get_current_user(request)
    
    # Parse month
    year, month_num = month.split("-")
    start_date = f"{year}-{month_num}-01"
    
    # Calculate end date
    if month_num == "12":
        end_date = f"{int(year)+1}-01-01"
    else:
        end_date = f"{year}-{str(int(month_num)+1).zfill(2)}-01"
    
    # Get sales
    sales = list(sales_collection.find({
        "date": {"$gte": start_date, "$lt": end_date}
    }))
    total_revenue = sum(sale["total_amount_inr"] for sale in sales)
    
    # Get expenses
    expenses = list(expenses_collection.find({
        "date": {"$gte": start_date, "$lt": end_date}
    }))
    total_expenses = sum(expense["amount_inr"] for expense in expenses)
    
    # Calculate profit
    profit = total_revenue - total_expenses
    
    # Get partners and calculate distribution
    partners = list(partners_collection.find())
    partner_distribution = []
    for partner in partners:
        share_amount = profit * (partner["share_percentage"] / 100)
        partner_distribution.append({
            "name": partner["name"],
            "share_percentage": partner["share_percentage"],
            "amount": share_amount
        })
    
    return {
        "month": month,
        "revenue": total_revenue,
        "expenses": total_expenses,
        "profit": profit,
        "partner_distribution": partner_distribution,
        "sales_count": len(sales),
        "expenses_count": len(expenses)
    }

@app.get("/api/reports/yearly")
async def get_yearly_report(request: Request, year: int, month: Optional[int] = None):
    await get_current_user(request)
    
    # Get partners
    partners = list(partners_collection.find())
    
    if month:
        # Single month report
        month_str = f"{year}-{str(month).zfill(2)}"
        start_date = f"{year}-{str(month).zfill(2)}-01"
        
        if month == 12:
            end_date = f"{year+1}-01-01"
        else:
            end_date = f"{year}-{str(month+1).zfill(2)}-01"
        
        # Get sales and expenses for the month
        sales = list(sales_collection.find({"date": {"$gte": start_date, "$lt": end_date}}))
        expenses = list(expenses_collection.find({"date": {"$gte": start_date, "$lt": end_date}}))
        
        total_revenue = sum(sale["total_amount_inr"] for sale in sales)
        total_expenses = sum(expense["amount_inr"] for expense in expenses)
        profit = total_revenue - total_expenses
        
        monthly_data = [{
            "month": month_str,
            "revenue": total_revenue,
            "expenses": total_expenses,
            "profit": profit
        }]
        
        # Get partner payments for the specific month
        partner_summary = []
        for partner in partners:
            # Calculate total share for the month
            total_share = profit * (partner["share_percentage"] / 100)
            
            # Get total paid to this partner in the month
            payments = list(partner_payments_collection.find({
                "partner_id": partner["id"],
                "date": {"$gte": start_date, "$lt": end_date}
            }))
            total_paid = sum(payment["amount_inr"] for payment in payments)
            
            # Calculate due
            total_due = total_share - total_paid
            
            partner_summary.append({
                "partner_name": partner["name"],
                "total_share": total_share,
                "total_paid": total_paid,
                "total_due": total_due
            })
        
    else:
        # Full year report - all 12 months
        monthly_data = []
        
        for m in range(1, 13):
            start_date = f"{year}-{str(m).zfill(2)}-01"
            if m == 12:
                end_date = f"{year+1}-01-01"
            else:
                end_date = f"{year}-{str(m+1).zfill(2)}-01"
            
            # Get sales and expenses for each month
            sales = list(sales_collection.find({"date": {"$gte": start_date, "$lt": end_date}}))
            expenses = list(expenses_collection.find({"date": {"$gte": start_date, "$lt": end_date}}))
            
            total_revenue = sum(sale["total_amount_inr"] for sale in sales)
            total_expenses = sum(expense["amount_inr"] for expense in expenses)
            profit = total_revenue - total_expenses
            
            monthly_data.append({
                "month": f"{year}-{str(m).zfill(2)}",
                "revenue": total_revenue,
                "expenses": total_expenses,
                "profit": profit
            })
        
        # Get partner summary for the entire year
        partner_summary = []
        year_start = f"{year}-01-01"
        year_end = f"{year+1}-01-01"
        
        # Calculate total profit for the year
        all_sales = list(sales_collection.find({"date": {"$gte": year_start, "$lt": year_end}}))
        all_expenses = list(expenses_collection.find({"date": {"$gte": year_start, "$lt": year_end}}))
        
        yearly_revenue = sum(sale["total_amount_inr"] for sale in all_sales)
        yearly_expenses = sum(expense["amount_inr"] for expense in all_expenses)
        yearly_profit = yearly_revenue - yearly_expenses
        
        for partner in partners:
            # Calculate total share for the year
            total_share = yearly_profit * (partner["share_percentage"] / 100)
            
            # Get total paid to this partner in the year
            payments = list(partner_payments_collection.find({
                "partner_id": partner["id"],
                "date": {"$gte": year_start, "$lt": year_end}
            }))
            total_paid = sum(payment["amount_inr"] for payment in payments)
            
            # Calculate due
            total_due = total_share - total_paid
            
            partner_summary.append({
                "partner_name": partner["name"],
                "total_share": total_share,
                "total_paid": total_paid,
                "total_due": total_due
            })
    
    return {
        "year": year,
        "month": month,
        "monthly_data": monthly_data,
        "partner_summary": partner_summary
    }


# Users endpoint
@app.get("/api/users")
async def get_users(request: Request):
    await get_current_user(request)
    
    users = list(users_collection.find())
    for user in users:
        user["_id"] = str(user["_id"])
    return users

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
