from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from routers import (
    cities_router,
    work_orders_router,
    work_order_items_router,
    labor_kits_router,
    labor_kit_items_router,
)

settings = get_settings()

app = FastAPI(
    title="Cirrus MRO API",
    description="Work Order Management System API",
    version="0.1.0",
)

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(cities_router, prefix=settings.api_v1_prefix)
app.include_router(work_orders_router, prefix=settings.api_v1_prefix)
app.include_router(work_order_items_router, prefix=settings.api_v1_prefix)
app.include_router(labor_kits_router, prefix=settings.api_v1_prefix)
app.include_router(labor_kit_items_router, prefix=settings.api_v1_prefix)


@app.get("/")
def root():
    return {"message": "Cirrus MRO API", "version": "0.1.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
