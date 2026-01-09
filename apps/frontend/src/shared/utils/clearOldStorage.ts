/**
 * Clears old localStorage keys from Zustand persist stores
 * Run once during migration from Zustand + localStorage to React Query
 */
export function clearOldStorage() {
  const oldKeys = [
    'events-storage',
    'transactions-storage',
    'demoInitialized', // Demo was using old stores
  ];

  const removed: string[] = [];
  oldKeys.forEach((key) => {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      removed.push(key);
      console.log(`✓ Removed old localStorage key: ${key}`);
    }
  });

  if (removed.length > 0) {
    console.log(`🧹 Cleanup complete: ${removed.length} old key(s) removed`);
  } else {
    console.log('✓ No old keys found - localStorage already clean');
  }

  return removed;
}
