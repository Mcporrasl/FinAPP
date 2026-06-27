## 2025-02-28 - Un-memoized Array Operations in render loops
**Learning:** Chained `.filter().reduce()` operations inside `.map()` rendering loops create hidden O(M*N) performance bottlenecks in React, especially noticeable when transaction lists grow.
**Action:** Always extract un-memoized multi-pass array operations out of the `.map()` loop, combine them into single-pass loops where possible, and wrap them in `useMemo` to drastically reduce render overhead.
