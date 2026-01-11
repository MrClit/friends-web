# useDeletingStore

## Overview

`useDeletingStore` is a Zustand store that manages global UI state for tracking whether a deletion operation is in progress. This is used to prevent unnecessary API requests during and after delete mutations in TanStack Query.

## Why It's Needed

TanStack Query does not provide a built-in way to globally disable queries during mutations. When a delete mutation succeeds, the component may re-render before unmounting, causing queries to refetch automatically if their `enabled` condition becomes true again. This leads to 404 requests for deleted resources.

By using a global store, we can disable related queries during the deletion process and keep them disabled until the component unmounts, avoiding wasted network requests.

## Usage

### In Query Hooks

Use the `isDeleting` state to conditionally enable queries:

```typescript
const isDeleting = useDeletingStore((state) => state.isDeleting);

return useQuery({
  queryKey: ['events', id],
  queryFn: () => fetchEvent(id),
  enabled: !!id && !isDeleting, // Disable if deleting
  // ... other options
});
```

### In Mutation Hooks

Set the deleting state during the mutation lifecycle:

```typescript
const setDeleting = useDeletingStore((state) => state.setDeleting);

return useMutation({
  mutationFn: deleteEvent,
  onMutate: () => {
    setDeleting(true); // Disable queries
  },
  onSuccess: () => {
    // Do not reset here to prevent re-enabling before unmount
  },
  onError: () => {
    setDeleting(false); // Re-enable on error
  },
});
```

## Benefits

- Prevents 404 requests after successful deletions
- Improves user experience by avoiding unnecessary loading states
- Follows TanStack Query best practices combined with external state management
- Minimal performance impact with Zustand's efficient reactivity

## Alternatives Considered

- Using `useIsMutating` from TanStack Query: Doesn't prevent re-enabling after success
- Pure TanStack Query: No built-in global disable mechanism
- Component-level state: Doesn't work for cross-component queries
