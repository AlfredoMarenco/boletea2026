---
name: laravel-backend-expert
description: Guidelines and patterns for expert Laravel 12 backend development, database optimization, transactions, and robust REST APIs.
---

# Laravel Backend Expert Skill

This skill documents architectural patterns, best practices, and database design principles for Boletea 2026.

## Guidelines

### 1. Controller Design (Skinny Controllers)
- Controllers must only handle HTTP routing, validation requests, and returning responses.
- Delegate complex business logic to Action classes (e.g., `App\Actions\ReserveSeatsAction`).
- Always use Form Requests for request validation instead of validating in controllers.

### 2. Database & Eloquent Optimization
- **Eager Loading**: Never lazy-load relationships in loops. Use `with()` to prevent N+1 query problems.
- **Transactions**: For multiple table insertions (like reserving/booking tickets), wrap them in `DB::transaction` with database locking (`lockForUpdate()`) to prevent race conditions during concurrent requests.
- **Chunking**: Use `chunk()` or `lazy()` when dealing with large record sets.

### 3. API & Response Formatting
- Return Eloquent API Resources (`JsonResource`) instead of raw model structures.
- Return explicit HTTP status codes:
  - `200 OK` for successful read actions.
  - `201 Created` for successful insertions.
  - `422 Unprocessable Entity` for validation errors.
  - `403 Forbidden` / `401 Unauthorized` for permissions.
