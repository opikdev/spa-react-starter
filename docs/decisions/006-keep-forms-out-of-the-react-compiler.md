# 006. Keep forms out of the React Compiler

- **Status**: accepted
- **Context**: The React Compiler memoizes components and values on their inputs. react-hook-form expects `register()` to run again on every render, and its `reset()` forgets fields until they do. Compiled, a second `reset()` left the edit form showing stale values, which only the end-to-end tests caught.
- **Decision**: Compile the app with the React Compiler, and start every component that uses react-hook-form with the `'use no memo'` directive. Read form state in child components with `useFormState`. An architecture test fails if a component imports react-hook-form without the directive.
- **Consequences**:
  - Forms behave as react-hook-form documents, and the rest of the app keeps automatic memoization.
  - Form components miss automatic memoization, which costs little at their size.
  - Drop the directive only after testing the form with the compiler, through `pnpm test`.
