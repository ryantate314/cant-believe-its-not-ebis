# Schemas

Pydantic schemas for API request validation and response serialization.

## Naming Conventions

- `*Base` - Shared field definitions
- `*Create` - POST request input
- `*Update` - PUT/PATCH request input (all fields optional)
- `*Response` - API response output
- `*Brief` - Lightweight versions for nested data

## Reference

See [FastAPI SQL Database Tutorial](https://fastapi.tiangolo.com/tutorial/sql-databases/#create-pydantic-models-schemas-for-reading-creating) for details on this pattern.
