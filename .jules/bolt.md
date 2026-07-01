## 2024-07-01 - [Avoid chained multi-pass array operations in React renders]
**Learning:** Found multiple multi-pass array operations (like chained `.filter().reduce()`) used un-memoized during render. This is an anti-pattern as it recalculates on every render and iterates the array multiple times.
**Action:** Combine them into single-pass loops wrapped in `useMemo` to significantly reduce render overhead.
