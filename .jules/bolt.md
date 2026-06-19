
## 2024-06-19 - Intl.NumberFormat Instantiation Bottleneck
**Learning:** Instantiating `Intl.NumberFormat` objects inside React component renders (or worse, inside `.map` or `.forEach` loops) is a significant performance bottleneck. The creation of these objects is computationally expensive, especially when re-renders are frequent or dealing with large lists (like `TransactionList`).
**Action:** Extract formatters using `Intl.NumberFormat` or `Intl.DateTimeFormat` to utility files and instantiate them exactly once globally. Reuse the memoized `.format()` method across all components.
