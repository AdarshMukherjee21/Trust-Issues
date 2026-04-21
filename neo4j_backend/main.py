from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pyngrok import ngrok

from database import neo4j_db
from sub_modules.firebase_updater import FirebaseUpdater

# Import our new Modular Routers
from routers import users, friends, threats, graph_viz

PORT = 8000
FIREBASE_CRED_PATH = "trust-issues-v1-firebase-adminsdk-fbsvc-dbb0590da2.json" 
firebase_manager = FirebaseUpdater(FIREBASE_CRED_PATH)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n Booting up Modular Backend...")
    ngrok_tunnel = ngrok.connect(PORT)
    public_url = ngrok_tunnel.public_url
    print(f" Ngrok Tunnel: {public_url}")
    
    firebase_manager.update_backend_status(is_active=True, url=public_url)
    
    yield 
    
    print("\n🛑 Shutting down...")
    firebase_manager.update_backend_status(is_active=False, url="")
    ngrok.disconnect(public_url)
    ngrok.kill()
    neo4j_db.close()

app = FastAPI(title="Trust Issues Graph API", lifespan=lifespan)

# ==========================================
# 🛡️ CORS MIDDLEWARE SETUP
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (Perfect for development with Ngrok/Vercel/Localhost)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, OPTIONS)
    allow_headers=["*"],  # Allows all headers (Crucial for passing your Authorization Bearer tokens)
)

# Register the Routers
app.include_router(users.router)
app.include_router(friends.router)
app.include_router(threats.router)
app.include_router(graph_viz.router)