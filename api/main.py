import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes.auth import router as auth_router
from routes.server_admin import router as admin_router
from routes.roles import router as roles_router
from routes.users import router as users_router
from routes.bot import router as bot_router
from routes.blueprints import router as blueprints_router
from routes.user_blueprints import router as user_blueprints_router
from routes.ores import router as ores_router
from routes.resource_inventory import router as resource_inventory_router
from routes.misc_inventory import router as misc_inventory_router
from routes.permissions import router as permissions_router
from database.connection import test_db_connection
from services.background_tasks import start_background_tasks, stop_background_tasks, get_background_tasks_status
from sqlalchemy import text

# Load environment variables
load_dotenv()

class _HealthFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return "/health" not in record.getMessage()

logging.getLogger("uvicorn.access").addFilter(_HealthFilter())

# Test database connection
test_db_connection()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background tasks
    await start_background_tasks()
    try:
        yield
    finally:
        # Shutdown: Stop background tasks
        await stop_background_tasks()

app = FastAPI(
    title=os.getenv("APP_NAME", "Auth API"),
    version=os.getenv("APP_VERSION", "1.0.0"),
    lifespan=lifespan
)

# Add CORS middleware for your frontend
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Auth API is running!"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "background_tasks": get_background_tasks_status()
    }

# Include auth routes
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])

# Include admin routes  
app.include_router(admin_router, prefix="/api/admin", tags=["administration"])

# Include role routes
app.include_router(roles_router, prefix="/api/admin/roles", tags=["roles"])

# Include user routes
app.include_router(users_router, prefix="/api/admin/users", tags=["users"])

# Include bot routes (called by Gibbs, not the frontend)
app.include_router(bot_router, prefix="/api/bot", tags=["bot"])

# Include blueprint routes
app.include_router(blueprints_router, prefix="/api/admin/blueprints", tags=["blueprints"])
app.include_router(user_blueprints_router, prefix="/api/user/blueprints", tags=["user-blueprints"])
app.include_router(ores_router, prefix="/api/admin/ores", tags=["ores"])
app.include_router(resource_inventory_router, prefix="/api/inventory/resources", tags=["inventory"])
app.include_router(misc_inventory_router,     prefix="/api/inventory/misc",      tags=["misc-inventory"])
app.include_router(permissions_router, prefix="/api/admin/permissions", tags=["permissions"])

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    uvicorn.run("main:app", host=host, port=port, reload=debug)

