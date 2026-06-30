## 2024-06-30 - O(M*N) Complexity in DreamsTab
**Learning:** React `.map()` renders containing chained `.filter().reduce()` on large transaction arrays create O(M*N) bottlenecks (where M is goals count and N is transactions count).
**Action:** Extract array calculations (like totalIncome and actualSavings) that do not depend on the current iteration item out of the loop and wrap them in `useMemo`.
