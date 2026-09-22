---
name: mobile-first-frontend
description: Design, implement, or review public and registrant UI in apps/frontend where phone navigation, touch interaction, responsive forms, schedules, results, tables, or registration journeys matter. Use for every user-facing frontend change in this repository; skip API-only work and manager or admin UI unless the user includes them.
---

# Mobile-first frontend

Treat a phone as the primary interface. Base styles must form a complete, usable design without responsive prefixes. Use `sm:`, `md:`, and `lg:` to add space or restructure the layout for larger screens, never to rescue an incomplete phone layout.

## Design and implementation

- Start at 390 x 844. Also support 360 x 800 and 430 x 932 before reviewing desktop at 1440 x 900.
- Preserve the shared shadcn tokens and use components from `packages/ui` before creating local equivalents.
- Keep primary navigation and every required action available on phones. Put collapsed navigation in a working shadcn Sheet or Drawer.
- Give standalone touch controls a target of at least 44 x 44 CSS pixels. A larger label may provide the target for Checkbox and Radio controls.
- Stack actions on narrow screens when translated labels could collide. Do not shorten required labels to make a desktop arrangement fit.
- Keep the primary action close to the content it completes. Wizards must show the current step and keep Back and Continue or payment actions unambiguous.
- Let dense result and participant tables scroll inside their own container. Add a visible phone-only cue when columns continue off-screen. Never hide domain fields to avoid responsive work.
- Do not use page-level clipping to conceal layout overflow. Fix the responsible component and reserve horizontal scrolling for data regions that need it.
- Use suitable input types, labels, autocomplete hints, and visible keyboard focus. Do not rely on hover to expose information or actions.
- Respect safe-area insets for fixed or edge-aligned controls. Respect reduced-motion preferences.

## Browser acceptance

Use the browser-tools skill and test the changed journey at 360, 390, and 430 CSS pixels. At each width:

1. Complete the main interaction, including the mobile menu and the longest translated labels relevant to the change.
2. Confirm `document.documentElement.scrollWidth === document.documentElement.clientWidth` on ordinary pages.
3. Confirm every visible interactive element stays inside the viewport and can be reached without hover.
4. For intentional table overflow, confirm the table container scrolls while the document does not.
5. Capture at least one phone screenshot when handing off a material visual change.

Then check 1440 x 900 to catch regressions introduced by the phone layout. Report the tested widths and any intentional local overflow.
