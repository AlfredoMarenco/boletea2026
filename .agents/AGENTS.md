# Project Rules & Customizations - Boletea 2026

## Strict Theme Compliance (Light & Dark Modes)
- **Universal Support**: All newly created or modified frontend UI pages, views, components, and interactive widgets MUST fully support both **Light** and **Dark** modes of the application.
- **Accents & Brand Identity**: The corporate accent colors (Rojo Boletea `#c90000` / `text-[#c90000]` / `bg-[#c90000]`) and neutral grayscale values must be preserved cleanly across both themes.
- **No theme-exclusive styling**: Do not force hardcoded backgrounds or text colors (e.g. `bg-white text-gray-900` or `bg-slate-900 text-white`) without utilizing the corresponding `dark:` utility classes (e.g., `bg-white dark:bg-background text-slate-900 dark:text-slate-100`).
- **Validation**: During verification, always confirm that components remain fully readable, contrasting, and aesthetically pleasing under both light and dark modes.

## Konva Multi-Drag Event Handling (Race Condition Prevention)
- **Problem Precedent**: Dragging multiple selected nodes (`SeatNode`, `Group`) in Konva triggers an `onDragEnd` event for **every single selected node** simultaneously upon mouse release. This causes a cascade of redundant state updates (race conditions) where subsequent events process stale closures and overwrite the correct new coordinates with the original ones.
- **Rule**: Whenever implementing batch drag-and-drop or multi-selection translation in `react-konva`, the `onDragEnd` handler MUST include a guard clause to process the coordinates **only once** and discard the redundant ghost events.
- **Implementation**: Clear the `dragStartRef` or tracker object on the first pass, and return early if it's already empty.
  ```tsx
  if (Object.keys(dragStartRef.current).length === 0) return; // Prevent race conditions from redundant Konva dragEnd events
  ```

## Block Structure Update & Tilted Geometry Handling (Center Invariance & Perpendicular Projection)
- **Problem Precedent**: Changing properties like `rowSpacing` or `seatSpacing` on tilted/rotated seat blocks caused the whole block to shift away from its original position on the canvas. Flat $X/Y$ sorting failed on tilted blocks, and anchoring to the first row shifted the block's bounding center.
- **Rule**: When recalculating block node layouts (`updateBlockStructure`):
  1. Compute the **invariant bounding center** $(\bar{X}, \bar{Y})$ across all seats in the block BEFORE mutating positions.
  2. Compute the row direction angle ($\theta$) from the first row and construct the perpendicular normal vector $\vec{u}_{\perp} = (-\sin\theta, \cos\theta)$.
  3. Sort rows by projecting row centers onto $\vec{u}_{\perp}$ ($\text{proj} = x \cdot u_{\perp,x} + y \cdot u_{\perp,y}$) rather than raw $X$ or $Y$ coordinates.
  4. Position each row baseline symmetrically relative to $(\bar{X}, \bar{Y})$ along $\vec{u}_{\perp}$ using $\text{offset}_i = (i - \frac{N-1}{2}) \cdot \text{rowSpacing}$.

