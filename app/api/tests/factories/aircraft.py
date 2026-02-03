"""Factory for creating Aircraft test instances."""

import factory
from uuid import uuid4
from datetime import datetime

from models.aircraft import Aircraft


class AircraftFactory(factory.Factory):
    """Factory for creating Aircraft instances."""

    class Meta:
        model = Aircraft

    id = factory.Sequence(lambda n: n + 1)
    uuid = factory.LazyFunction(uuid4)
    registration_number = factory.Sequence(lambda n: f"N{n:05d}")
    serial_number = factory.Sequence(lambda n: f"SN{n:05d}")
    make = "Cirrus"
    model = "SR22"
    year_built = 2020
    meter_profile = None
    primary_city_id = None
    customer_name = factory.Sequence(lambda n: f"Customer {n}")
    aircraft_class = None
    fuel_code = None
    notes = None
    is_active = True

    # Audit
    created_by = "test_user"
    updated_by = None
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)
