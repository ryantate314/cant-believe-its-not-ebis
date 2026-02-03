from routers.cities import router as cities_router
from routers.work_orders import router as work_orders_router
from routers.work_order_items import router as work_order_items_router
from routers.labor_kits import router as labor_kits_router
from routers.labor_kit_items import router as labor_kit_items_router

__all__ = [
    "cities_router",
    "work_orders_router",
    "work_order_items_router",
    "labor_kits_router",
    "labor_kit_items_router",
]
