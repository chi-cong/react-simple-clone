# The Work Loop

The "Work Loop" is the engine that drives your React application. It processes the Fiber tree unit by unit, allowing React to pause and resume work (in concurrent mode), although our implementation focuses on the synchronous foundation to keep it simple.

## The Loop

Open [workLoop.ts](../src/packages/reconciler/workLoop.ts). The core concept is incredibly simple:

```typescript
function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}
```

Instead of recursion (which utilizes the call stack and can't be easily interrupted), React uses a `while` loop with a global `workInProgress` pointer.

### `performUnitOfWork`

This function is responsible for processing a single Fiber node:

1.  **Begin Phase**: It calls `beginWork()` on the current fiber.
2.  **Navigation**:
    - If `beginWork` returns a **child**, that child becomes the next `workInProgress`.
    - If `beginWork` returns `null` (no more children), it means we reached a leaf node. We essentially "turn around" and perform the **Complete Phase** via `completeUnitOfWork()`.

### `completeUnitOfWork`

This handles the "upward" traversal:

1.  It calls `completeWork()` on the current fiber (creating DOM nodes, etc.).
2.  **Sibling Check**: If the fiber has a `sibling`, that sibling becomes the next `workInProgress`.
3.  **Parent Check**: If no sibling exists, it moves up to the `return` (parent) fiber and repeats the completion process.

## Traversal Visualization

The traversal creates a "Depth-First Search" (DFS) pattern:

1.  Root -> Child -> Child (Down)
2.  Leaf (Complete)
3.  Sibling (Right) -> Child (Down)
4.  Sibling (Complete) -> Parent (Complete) -> Parent Sibling...

Leaf is the node that has no children.\
You could also check [this](https://blog.ag-grid.com/inside-fiber-an-in-depth-overview-of-the-new-reconciliation-algorithm-in-react/#main-steps-of-the-work-loop), right below it there's a great animation to visualize this process.

## Synchronous Rendering

In this implementation, we use `renderRootSync`. This locks the main thread until the entire tree is processed.

```typescript
function renderRootSync(root) {
  prepareFreshStack(root);
  workLoop(); // Run until finished
  commitRoot(root, finishedWork); // Write to DOM
}
```

Real React splits this into time-sliced chunks (`requestIdleCallback` / Scheduler), but the underlying tree traversal logic (`beginWork` -> `completeWork`) is identical.

## FAQ

### Does `completeWork` render to the screen?

No. `completeWork` creates **Virtual DOM** nodes (or rather, the actual DOM instances in memory) but does not attach them to the document yet.

- **Phase 1 (Render)**: We traverse the tree, create fibers, and create DOM nodes in memory (Virtual DOM). This happens in `workLoop`.
- **Phase 2 (Commit)**: We traverse the finished tree and actually insert/update the nodes in the real document. This happens in `commitRoot`.

This separation allows React to discard the work in progress tree if something high priority interrupts it, without leaving the user with a broken UI.
