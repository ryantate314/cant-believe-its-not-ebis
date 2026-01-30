"""Factory for creating WorkOrder test instances."""

import factory
from uuid import uuid4
from datetime import datetime, date

from models.work_order import WorkOrder, WorkOrderStatus, PriorityLevel, WorkOrderType


class WorkOrderFactory(factory.Factory):
    """Factory for creating WorkOrder instances."""

    class Meta:
        model = WorkOrder

    id = factory.Sequence(lambda n: n + 1)
    uuid = factory.LazyFunction(uuid4)
    work_order_number = factory.Sequence(lambda n: f"TEST{n:05d}-01-2026")
    sequence_number = factory.Sequence(lambda n: n + 1)
    city_id = 1
    work_order_type = WorkOrderType.WORK_ORDER
    status = WorkOrderStatus.CREATED
    status_notes = None

    # Aircraft
    aircraft_registration = factory.Sequence(lambda n: f"N{n:05d}")
    aircraft_serial = factory.Sequence(lambda n: f"SN{n:05d}")
    aircraft_make = "Cessna"
    aircraft_model = "172"
    aircraft_year = 2020

    # Customer
    customer_name = factory.Sequence(lambda n: f"Customer {n}")
    customer_po_number = factory.Sequence(lambda n: f"PO-{n:03d}")

    # Dates
    due_date = factory.LazyFunction(lambda: date.today())
    created_date = factory.LazyFunction(datetime.utcnow)
    completed_date = None

    # Assignment
    lead_technician = "Test Technician"
    sales_person = "Test Sales"
    priority = PriorityLevel.NORMAL

    # Audit
    created_by = "test_user"
    updated_by = None
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)
