---
name: react-frontend-best-practices
description: Best practices for clean React component structure, strong TypeScript typing, hooks, performance, and state management.
---

# React Frontend Best Practices Skill

This skill outlines guidelines for building clean, high-performance React client pages.

## Guidelines

### 1. Component Structure & Typing
- Use explicit TypeScript interfaces for all component props.
- Keep components focused and single-purpose. Break down massive page structures into sub-components.
- Leverage React's `useMemo` and `useCallback` strategically to prevent costly recalculations during animations or dragging.

### 2. State & Data Fetching
- Utilize Inertia's native state-sharing and form utilities (`useForm`) for server data transfers.
- Use Axios only for non-blocking asynchronous actions (like locking seats on click).
- Do not store state redundantly. Derive as much UI state as possible from props or useMemo.
