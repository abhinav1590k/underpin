# Bug Report

## Pagination skips the first page

- **Location:** `src/services/taskService.js`, `getPaginated`
- **Expected:** `page=1&limit=2` returns the first two tasks.
- **Actual:** The offset is calculated as `page * limit`, so page 1 starts at index 2.
- **Discovery:** The service pagination test failed when it requested the first page.
- **Fix:** Calculate the zero-based offset as `(page - 1) * limit`.

## Status filters match substrings

- **Location:** `src/services/taskService.js`, `getByStatus`
- **Expected:** A status filter returns only tasks whose status equals the requested status.
- **Actual:** `status.includes(requestedStatus)` also matches partial values such as `in`.
- **Discovery:** The exact-status service test demonstrated that a partial query could return unrelated tasks.
- **Fix:** Compare `task.status === status`.

## Assignment design

`PATCH /tasks/:id/assign` requires a non-empty string, trims surrounding whitespace, returns `404` for a missing task, and returns `409` when a task already has an assignee. Reassignment is rejected to avoid silently changing ownership; a future product decision could introduce an explicit reassignment operation.
