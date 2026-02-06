from sqlalchemy import Integer, ForeignKey, Boolean, String
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from core.database import Base


class AircraftCustomer(Base):
    __tablename__ = "aircraft_customer"

    id: Mapped[int] = mapped_column(primary_key=True)
    aircraft_id: Mapped[int] = mapped_column(ForeignKey("aircraft.id"))
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    # Audit
    created_by: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
