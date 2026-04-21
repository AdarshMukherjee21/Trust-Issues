import os
import time
from fastapi import FastAPI, Request, HTTPException, Security
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Import your OOP Predictors and AI Learner
from sub_modules.email_predictor import EmailPredictor
from sub_modules.sms_predictor import SMSPredictor
from sub_modules.ai_learner import AILearner, ExplanationRequest, ExplanationResponse

# Initialize Rate Limiter (limits based on user IP address)
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI App
app = FastAPI(title="Trust Issues API", version="1.1")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ==========================================
# 1. SECURITY & MIDDLEWARE
# ==========================================

# CORS SETUP: Only allow requests from your specific frontends
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# API KEY SETUP: Protects against direct terminal/Postman attacks
API_KEY_SECRET = os.getenv("API_KEY")
api_key_header = APIKeyHeader(name="Trust-issue-API-Key", auto_error=True)

async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid API Key")
    return api_key

# TIMING MIDDLEWARE
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time, 4))
    return response

# ==========================================
# 2. INSTANTIATE ENGINES (Loads into RAM once)
# ==========================================
email_engine = EmailPredictor(
    subject_vec_path='pkl_files/tfidf_subject.pkl', 
    body_vec_path='pkl_files/tfidf_body.pkl', 
    model_path='pkl_files/email_model_etc.pkl'
)
sms_engine = SMSPredictor(
    vec_path='pkl_files/vectorizer.pkl', 
    model_path='pkl_files/model.pkl'
)
ai_learner = AILearner() # Initializes DSPy + Gemini

# ==========================================
# 3. PYDANTIC MODELS (Data Validation)
# ==========================================
class EmailRequest(BaseModel):
    subject: str
    body: str

class SMSRequest(BaseModel):
    text: str

# ==========================================
# 4. ROUTES
# ==========================================

@app.get("/")
@limiter.limit("10/minute")
async def root(request: Request):
    return {"status": "online", "message": "Trust Issues API is running. Unauthorized access is logged."}

@app.get("/api/v1/health")
@limiter.limit("10/minute") 
async def health_check(request: Request):
    return {"status": "healthy", "message": "Trust Issues API is up and running."}

# Protected Route: Needs X-API-Key in Header
@app.post("/api/v1/predict/email")
@limiter.limit("30/minute")
async def check_email(request: Request, payload: EmailRequest, api_key: str = Security(verify_api_key)):
    try:
        result = email_engine.predict(payload.subject, payload.body)
        return {"status": "success", "data": result}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

# Protected Route: Needs X-API-Key in Header
@app.post("/api/v1/predict/sms")
@limiter.limit("30/minute")
async def check_sms(request: Request, payload: SMSRequest, api_key: str = Security(verify_api_key)):
    try:
        result = sms_engine.predict(payload.text)
        return {"status": "success", "data": result}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

# Protected AI Route: Needs X-API-Key in Header
@app.post("/api/v1/explain", response_model=ExplanationResponse)
@limiter.limit("15/minute") # Stricter rate limit for LLM calls to save budget
async def explain_message(request: Request, payload: ExplanationRequest, api_key: str = Security(verify_api_key)):
    try:
        # Pass the validated Pydantic model directly to our DSPy class
        explanation = ai_learner.explain_spam(payload)
        return explanation
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

# Run via: uvicorn app:app --reload