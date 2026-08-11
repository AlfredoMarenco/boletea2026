# Project Rules & Customizations - Boletea 2026

## Strict Theme Compliance (Light & Dark Modes)
- **Universal Support**: All newly created or modified frontend UI pages, views, components, and interactive widgets MUST fully support both **Light** and **Dark** modes of the application.
- **Accents & Brand Identity**: The corporate accent colors (Rojo Boletea `#c90000` / `text-[#c90000]` / `bg-[#c90000]`) and neutral grayscale values must be preserved cleanly across both themes.
- **No theme-exclusive styling**: Do not force hardcoded backgrounds or text colors (e.g. `bg-white text-gray-900` or `bg-slate-900 text-white`) without utilizing the corresponding `dark:` utility classes (e.g., `bg-white dark:bg-background text-slate-900 dark:text-slate-100`).
- **Validation**: During verification, always confirm that components remain fully readable, contrasting, and aesthetically pleasing under both light and dark modes.
