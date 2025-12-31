# Begin Work

If `workLoop` is the engine, `beginWork` is the steering wheel. It decides **how** to process a specific fiber based on its tag.

Open [beginWork.ts](../src/packages/reconciler/beginWork.ts).

## The Entry Point

The `beginWork` function is efficient because it usually doesn't do much work itself. It acts as a switch statement:

```typescript
export const beginWork = (current, workInProgress) => {
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress, ...);
    case HostText:
      return null;
    // ...
  }
};
```

Its goal is simple: **Calculate the new children for this fiber.**

## Component Updates

Different fiber types calculate children differently:

### 1. HostComponent (`<div>`, `<p>`)

For standard DOM elements, the "children" are simply the elements nested inside it in the JSX.

```typescript
function updateHostComponent(...) {
  const nextProps = workInProgress.pendingProps;
  const nextChildren = nextProps.children; // Just get children from props
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}
```

### 2. FunctionComponent (`<App />`)

For function components, we must **execute the function** to get the children.

```typescript
function updateFunctionComponent(...) {
  // Execute the component function!
  // This is where useState() hooks run.
  let nextChildren = renderWithHooks(...);

  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}
```

## Reconcile Children

Regardless of _how_ we got the children, the final step is always `reconcileChildren`. This function compares the `current` fiber's children (old) with the `nextChildren` (new) and flags differences.

We will explore strictly _how_ that comparison works in the next chapter.

## Key Takeaway

`beginWork` is the "downward" phase where:

1.  We check the component type.
2.  We generate the new children (either by reading props or running the component code).
3.  We pass those children to `reconcileChildren`.
