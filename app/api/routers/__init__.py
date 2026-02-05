from routers.cities import router as cities_router
from routers.work_orders import router as work_orders_router
from routers.work_order_items import router as work_order_items_router
from routers.labor_kits import router as labor_kits_router
from routers.labor_kit_items import router as labor_kit_items_router
from routers.aircraft import router as aircraft_router
from routers.dashboard import router as dashboard_router
from routers.tools import router as tools_router

__all__ = [
    "cities_router",
    "work_orders_router",
    "work_order_items_router",
    "labor_kits_router",
    "labor_kit_items_router",
    "aircraft_router",
    "dashboard_router",
    "tools_router",
]
