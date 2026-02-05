# API Testing Strategy

## Overview

Tests are organized into two categories:

- **`unit/`** - Test schemas, validators, and business logic in isolation (no database)
- **`integration/`** - Test API endpoints with a real database session

## Database Strategy

Integration tests use an **in-memory SQLite database**, not the production PostgreSQL. This is configured in `conftest.py`:

```python
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
```

Each test function gets a fresh database:
1. Tables are created before the test
2. Tables are dropped after the test
3. The `get_db` dependency is overridden to use the test session

No mocking of the database layer—queries run against real SQLAlchemy models and sessions.

## Fixtures

Common test data is created via pytest fixtures in `conftest.py`:

- `test_session` - Database session for the test
- `client` - HTTP client (`httpx.AsyncClient`) with dependency overrides
- `test_city`, `test_aircraft`, `test_work_order`, etc. - Pre-populated entities

Fixtures handle setup/teardown automatically and can be composed (e.g., `test_work_order` depends on `test_city` and `test_aircraft`).

## Factories

Located in `tests/factories/`, these use [factory_boy](https://factoryboy.readthedocs.io/) to generate model instances with sensible defaults:

```python
from tests.factories import WorkOrderFactory

# Create with defaults
work_order = WorkOrderFactory()

# Override specific fields
work_order = WorkOrderFactory(status=WorkOrderStatus.COMPLETED, customer_name="Acme")
```

Factories are useful when you need multiple instances or want fine-grained control over test data without the verbosity of manual construction.

## Running Tests

```bash
make api-test          # Run all tests
make api-test-cov      # Run with coverage report
```

Or directly with pytest:

```bash
cd app/api
uv run pytest tests/unit/           # Unit tests only
uv run pytest tests/integration/    # Integration tests only
uv run pytest -v                    # Verbose output
```
