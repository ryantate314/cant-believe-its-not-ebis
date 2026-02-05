"""Factory for creating LaborKitItem test instances."""

import factory
from uuid import uuid4
from datetime import datetime
from decimal import Decimal

from models.labor_kit_item import LaborKitItem


class LaborKitItemFactory(factory.Factory):
    """Factory for creating LaborKitItem instances."""

    class Meta:
        model = LaborKitItem

    id = factory.Sequence(lambda n: n + 1)
    uuid = factory.LazyFunction(uuid4)
    labor_kit_id = 1
    item_number = factory.Sequence(lambda n: n + 1)

    discrepancy = factory.Sequence(lambda n: f"Kit Discrepancy {n}")
    corrective_action = factory.Sequence(lambda n: f"Kit Corrective action {n}")
    notes = factory.Sequence(lambda n: f"Kit Notes {n}")
    category = "Maintenance"
    sub_category = "Routine"
    ata_code = "32-10"
    hours_estimate = Decimal("2.50")
    billing_method = "hourly"
    flat_rate = None
    department = "Avionics"
    do_not_bill = False
    enable_rii = False

    # Audit
    created_by = "test_user"
    updated_by = None
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)
