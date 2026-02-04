"""Factory for creating LaborKit test instances."""

import factory
from uuid import uuid4
from datetime import datetime

from models.labor_kit import LaborKit


class LaborKitFactory(factory.Factory):
    """Factory for creating LaborKit instances."""

    class Meta:
        model = LaborKit

    id = factory.Sequence(lambda n: n + 1)
    uuid = factory.LazyFunction(uuid4)
    name = factory.Sequence(lambda n: f"Labor Kit {n}")
    description = factory.Sequence(lambda n: f"Description for labor kit {n}")
    category = "Engine"
    is_active = True

    # Audit
    created_by = "test_user"
    updated_by = None
    created_at = factory.LazyFunction(datetime.utcnow)
    updated_at = factory.LazyFunction(datetime.utcnow)
