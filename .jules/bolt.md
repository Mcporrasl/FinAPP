## 2024-05-18 - Avoid overzealous package modifications
**Learning:** Fixing a minor types issue in unrelated files by attempting to rewrite the library stack or modify package.json can break system constraints.
**Action:** Limit optimizations strictly to the code level without bringing in external libraries or refactoring types throughout the app, unless explicitly requested.
