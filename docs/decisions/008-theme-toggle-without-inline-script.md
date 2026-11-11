# 008. Theme toggle without an inline script

- **Status**: accepted
- **Context**: People want light, dark, or their system's theme, and the page must not flash the wrong one before React runs. The usual fix is an inline script in `<head>`, which the CSP in [decision 005](005-strict-csp-and-trusted-types.md) blocks.
- **Decision**: Load `public/theme.js` synchronously in `<head>`. It reads the choice from `localStorage` and sets the `dark` class on `<html>` with `classList`, which isn't a Trusted Types sink. `useTheme` in `src/lib/theme.ts` saves later choices and follows system changes while the choice is System. The control is a `fieldset` of buttons with `aria-pressed`, because shadcn's `ToggleGroup` added 6 kB gzip to the first load.
- **Consequences**:
  - The right theme shows on first paint, and the CSP stays strict.
  - If storage is blocked, the app follows the system theme, and a choice lasts until the page reloads.
  - `theme.js` costs one small blocking request, served with `Cache-Control: no-cache`. Keep it tiny, and change it together with `src/lib/theme.ts`, since both read the same `theme` key.
