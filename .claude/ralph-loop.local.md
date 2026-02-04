---
active: true
iteration: 1
max_iterations: 50
completion_promise: "INTEGRATION COMPLETE"
started_at: "2026-02-04T04:05:18Z"
---

Execute the full PRP workflow for the Audit History UI Integration feature.

SETUP (Do this FIRST before any PRP commands):
1. Create a new branch 'feature/audit-ui-integration' from main
2. Merge 'auditing' branch into it
3. Merge 'feature/work-order-poc' branch into it
4. Resolve any merge conflicts, keeping both features functional

CONTEXT:
- Feature description is at .claude/feature-descriptions/audit-ui-integration.md
- The auditing API is complete at /api/v1/audit/{entity_type}/{entity_id}
- Work Order UI exists with CRUD operations
- Both branches need to be merged before implementation

PHASES:
1. Run /prp-prd to generate PRD from the feature description
2. Run /prp-plan to create implementation plan
3. Run /prp-implement to execute the plan

CONSTRAINTS:
- Use existing shadcn/ui components
- Follow mobile-first design
- Use SWR for data fetching
- Keep it simple - no over-engineering
- Run tests to verify both features work after merge

Output <promise>INTEGRATION COMPLETE</promise> when all tests pass and you can see audit history in the Work Order UI.
