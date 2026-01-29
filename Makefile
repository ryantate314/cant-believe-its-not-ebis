.PHONY: ui-run api-run

api-run:
	cd app/api && uv run fastapi dev

ui-run:
	cd app/ui && yarn dev
