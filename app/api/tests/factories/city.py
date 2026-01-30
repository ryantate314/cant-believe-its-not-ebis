"""Factory for creating City test instances."""

import factory
from uuid import uuid4
from datetime import datetime

from models.city import City


class CityFactory(factory.Factory):
    """Factory for creating City instances."""

    class Meta:
        model = City

    id = factory.Sequence(lambda n: n + 1)
    uuid = factory.LazyFunction(uuid4)
    code = factory.Sequence(lambda n: f"K{n:03d}")
    name = factory.Sequence(lambda n: f"Test City {n}")
    is_active = True
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)
