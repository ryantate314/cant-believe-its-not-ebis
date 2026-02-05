from crud.city import get_cities, get_city_by_uuid
from crud.work_order import (
    get_work_orders,
    get_work_order_by_uuid,
    create_work_order,
    update_work_order,
    delete_work_order,
)
from crud.work_order_item import (
    get_work_order_items,
    get_work_order_item_by_uuid,
    create_work_order_item,
    update_work_order_item,
    delete_work_order_item,
)
from crud.labor_kit import (
    get_labor_kits,
    get_labor_kit_by_uuid,
    create_labor_kit,
    update_labor_kit,
    delete_labor_kit,
    apply_labor_kit_to_work_order,
)
from crud.labor_kit_item import (
    get_labor_kit_items,
    get_labor_kit_item_by_uuid,
    create_labor_kit_item,
    update_labor_kit_item,
    delete_labor_kit_item,
)
from crud.aircraft import (
    get_aircraft_list,
    get_aircraft_by_uuid,
    create_aircraft,
    update_aircraft,
    delete_aircraft,
)

__all__ = [
    "get_cities",
    "get_city_by_uuid",
    "get_work_orders",
    "get_work_order_by_uuid",
    "create_work_order",
    "update_work_order",
    "delete_work_order",
    "get_work_order_items",
    "get_work_order_item_by_uuid",
    "create_work_order_item",
    "update_work_order_item",
    "delete_work_order_item",
    "get_labor_kits",
    "get_labor_kit_by_uuid",
    "create_labor_kit",
    "update_labor_kit",
    "delete_labor_kit",
    "apply_labor_kit_to_work_order",
    "get_labor_kit_items",
    "get_labor_kit_item_by_uuid",
    "create_labor_kit_item",
    "update_labor_kit_item",
    "delete_labor_kit_item",
    "get_aircraft_list",
    "get_aircraft_by_uuid",
    "create_aircraft",
    "update_aircraft",
    "delete_aircraft",
]
