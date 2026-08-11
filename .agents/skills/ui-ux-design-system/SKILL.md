---
name: ui-ux-design-system
description: High-fidelity styling constraints, responsive design rules, micro-interactions, and absolute dark/light mode compliance.
---

# UI/UX Design System Skill

This skill enforces high-fidelity design standards, consistency, micro-animations, and absolute dual theme compliance.

## Guidelines

### 1. Dual Theme Compliance
- Every component must look stunning in both light and dark modes.
- Avoid hardcoded values. Instead of `bg-white`, use `bg-white dark:bg-card` or `bg-white dark:bg-background`.
- Keep text contrasts high under both conditions (e.g. `text-slate-900 dark:text-slate-100`).

### 2. Interactions & Micro-Animations
- Interactive elements (buttons, links, circles) should have smooth transitions (`transition-all duration-200`).
- Add hover scaling (`hover:scale-105`) or active presses (`active:scale-95`) to elements to make the interface feel alive.
- Incorporate subtle micro-animations (like skeleton loading pulses) for async loading phases.
