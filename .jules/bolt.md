## 2024-06-25 - React Map Re-render Bottleneck
**Learning:** Discovered an O(M*N) performance bottleneck where multi-pass array operations (like `.filter().reduce()`) were nested inside a `.map()` render loop over another array (`goals.map()`). This caused the entire transactions array to be iterated over and over for every single goal rendered on the screen.
**Action:** Always extract shared aggregations that don't depend on the current mapped item *outside* of the `.map()` loop, and wrap them in a `useMemo` block with a single-pass `for` loop to convert O(M*N) complexity back to O(N).
