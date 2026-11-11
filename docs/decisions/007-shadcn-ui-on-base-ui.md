# 007. shadcn/ui on Base UI

- **Status**: accepted
- **Context**: Hand-written shadcn-style components had their own variant names and no `components.json`, so `shadcn add` couldn't extend them, and new components didn't fit. The strict CSP in [decision 005](005-strict-csp-and-trusted-types.md) rules out any component that injects a `<style>` tag.
- **Decision**: Generate `src/components/ui/` with the shadcn CLI's default style, `base-nova`, which builds on Base UI, and its default `neutral` base color. Keep upstream code and names, and change only these accessibility deltas: 44px targets on coarse pointers, a solid focus outline, reduced motion, and token values that meet WCAG 2.2 AA in both themes. Use `AlertDialog` for confirmations, because they need an answer.
- **Consequences**:
  - `pnpm exec shadcn add <component>` adds components that match. The `shadcn` dev dependency pins the CLI and provides `shadcn/tailwind.css`.
  - Base UI's scroll lock sets styles through the CSSOM, which the CSP allows, and the end-to-end tests open dialogs on a scrolling page with no violations. Radix Dialog injects a `<style>` tag, so the `radix-*` styles stay out.
  - Each added component needs the coarse-pointer delta and an end-to-end run, as [docs/architecture.md](../architecture.md#ui-components) lists.
  - Upstream classes cost CSS: the budget went from 6 kB to 8 kB gzip.
