# Performance Optimization - Future Task

## Issues Identified (Jan 12, 2026)

### ShopScreen Performance
- **Dynamic imports on every render** (lines 110-111)
  - `await import("firebase/firestore")` happens every time
  - Should be static import at top of file
- **Uncached Firestore queries**
  - Parts collection queried on every mount
  - No persistence or React Query caching
- **Missing loading skeletons**
  - Shows blank screen during load

### General App Performance
- **CarContext over-fetching**
  - Likely re-fetching on every screen mount
- **No memoization**
  - Expensive computations not cached
- **Large images not optimized**
  - Hero images load at full resolution

## Quick Fixes (Est. 30-60 min)

1. **Static imports** - Move dynamic imports to top
2. **Add React.memo** to expensive components
3. **useMemo** for filtered/computed data
4. **Loading skeletons** for better perceived performance

## Better Solutions (Est. 2-4 hours)

1. **React Query** - Add data caching layer
2. **Image optimization** - Resize/compress hero images
3. **Context optimization** - Split contexts, add selectors
4. **Code splitting** - Lazy load heavy screens

## Priority: MEDIUM
These issues existed before base model integration. Not blocking new features.
