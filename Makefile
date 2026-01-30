.PHONY: ui-run api-run api-test api-test-cov ui-test ui-test-cov ui-test-e2e test

# Flyway version
FLYWAY_VERSION ?= 11

# Common Flyway Docker command
FLYWAY_CMD = docker run --rm \
	--env-file database/.env \
	-v $(PWD)/database/migrations:/flyway/sql:ro \
	--network host \
	flyway/flyway:$(FLYWAY_VERSION)

# Database migrations (Flyway)
db-info:
	$(FLYWAY_CMD) info

db-migrate:
	$(FLYWAY_CMD) migrate

db-validate:
	$(FLYWAY_CMD) validate

db-repair:
	$(FLYWAY_CMD) repair

db-baseline:
	$(FLYWAY_CMD) baseline -baselineVersion=1 -baselineDescription="baseline"

db-add:
	@if [ -z "$(DESC)" ]; then echo "Usage: make db-add DESC=description_here" && exit 1; fi
	docker run --rm \
		--env-file database/.env \
		-v $(PWD)/database/migrations:/flyway/sql \
		--network host \
		flyway/flyway:$(FLYWAY_VERSION) add -description="$(DESC)"

api-run:
	cd app/api && uv run fastapi dev

ui-run:
	cd app/ui && yarn dev

terraform-apply:
	terraform -chdir=infrastructure apply --var-file=config/dev.tfvars

# Testing
api-test:
	cd app/api && uv run --extra test pytest

api-test-cov:
	cd app/api && uv run --extra test pytest --cov --cov-report=term-missing --cov-fail-under=80

ui-test:
	cd app/ui && yarn test

ui-test-cov:
	cd app/ui && yarn test:coverage

ui-test-e2e:
	cd app/ui && yarn test:e2e

test: api-test ui-test