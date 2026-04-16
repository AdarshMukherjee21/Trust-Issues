import time
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Import your OOP Predictors
from sub_modules.email_predictor import EmailPredictor
from sub_modules.sms_predictor import SMSPredictor

# Initialize Rate Limiter (limits based on user IP address)
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI App
app = FastAPI(title="Trust Issues API", version="1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Instantiate the ML engines (Loads the .pkl files into memory once on startup)
email_engine = EmailPredictor()
sms_engine = SMSPredictor()

# --- MIDDLEWARE ---
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """
    Middleware that tracks how long every request takes and adds it to the response headers.
    Great for monitoring performance.
    """
    start_time = time.time()
    
    # Process the request
    response = await call_next(request)
    
    # Calculate time and add to header
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time, 4))
    
    return response

# --- PYDANTIC MODELS (Data Validation) ---
class EmailRequest(BaseModel):
    subject: str
    body: str

class SMSRequest(BaseModel):
    text: str

# --- ROUTES ---

@app.get("/")
@limiter.limit("10/minute") # Basic rate limit for health check
async def root(request: Request):
    return {"status": "online", "message": "Trust Issues API is running."}

@app.post("/api/v1/predict/email")
@limiter.limit("30/minute") # Strict rate limit to prevent API abuse
async def check_email(request: Request, payload: EmailRequest):
    try:
        # Pass the validated data to our OOP engine
        result = email_engine.predict(payload.subject, payload.body)
        return {"status": "success", "data": result}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.post("/api/v1/predict/sms")
@limiter.limit("30/minute")
async def check_sms(request: Request, payload: SMSRequest):
    try:
        # Pass the validated data to our OOP engine
        result = sms_engine.predict(payload.text)
        return {"status": "success", "data": result}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})


@app.get("/api/v1/health")
@limiter.limit("10/minute") 
async def health_check(request: Request):
    """
    A simple health check endpoint to verify that the API is responsive.
    """
    return {"status": "healthy", "message": "Trust Issues API is up and running."}
# Run via: uvicorn app:app --reload