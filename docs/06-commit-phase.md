# The Commit Phase

We have built the tree (`BeginWork`), diffed it (`Reconciliation`), and prepared the nodes (`CompleteWork`). Now, in the **Commit Phase**, we finally execute the side effects and update the screen.

## The Entry Point: `commitRoot`

Open [workLoop.ts](../src/packages/reconciler/workLoop.ts).

The work loop finishes by calling `commitRoot`. This function orchestrates the three sub-phases of the commit.

In React, there are 3 phases:

1.  **Before Mutation**: (Not implemented) - e.g., `getSnapshotBeforeUpdate`.
2.  **Mutation**: We apply changes to the DOM.
3.  **Layout**: (Not implemented) - e.g., `useLayoutEffect`.

Our clone focuses primarily on the **Mutation Phase**.

```typescript
function commitRoot(root: FiberRoot, finishedWork: Fiber) {
  // 1. Flush pending effects
  // ...

  // 2. The Mutation Phase: Apply changes to DOM
  commitMutationEffects(root, finishedWork);

  // 3. Swap the trees!
  root.current = finishedWork;

  // 4. Schedule Passive Effects
  // ...
}
```

## The Mutation Phase (`commitMutationEffects`)

Open [commitWork.ts](../src/packages/reconciler/commitWork.ts).

This function is the heart of the commit phase. It traverses the Fiber tree and applies changes to the DOM.

### 1. The Traversal (`recursivelyTraverseMutationEffects`)

Before applying effects to a node, we often check its children.
**Optimization**: We use a `MutationMask` (Placement | Update | ChildDeletion).

```typescript
if (parentFiber.subtreeFlags & MutationMask) {
  let child = parentFiber.child;
  while (child !== null) {
    commitMutationEffects(root, child);
    child = child.sibling;
  }
}
```

If the mask check fails, we **skip the entire subtree**. This makes React extremely fast for updates where deep children didn't change.

### 2. Handling Tags

We switch on the tag of the fiber:

- **`FunctionComponent`**:
  - Calls `recursivelyTraverseMutationEffects`.
  - Checks for `Placement` (if the component itself moved).
- **`HostComponent`**:
  - Calls `recursivelyTraverseMutationEffects`.
  - Checks for `Placement`.
  - **Crucially**: Checks for `Update` flag. If present, calls `commitUpdate` (diffing props like `style` or `className`).
- **`HostText`**:
  - Checks for `Update` flag. Calls `commitTextUpdate` (updating `node.textContent`).

### 3. Deletions (`commitDeletionEffects`)

Deletions are tricky because:

1.  We might be deleting a `FunctionComponent`, which isn't a DOM node itself.
2.  We need to find the **nearest parent DOM node** to call `removeChild`.

The `commitDeletionEffects` function:

1.  **Finds Parent**: Traverses up (`return` pointer) until it finds a `HostComponent` or `HostRoot`. this is the `hostParent`.
2.  **Recursively Unmounts**: If we delete a component, we must traverse _down_ its tree to find the actual DOM nodes to remove, while also unmounting any hooks (calling `useEffect` cleanup).
3.  **Removes from DOM**: Finally calls `removeChildFromContainer(hostParent, node)`.

### 4. Placements (`commitPlacement`)

Open [commitHostEffects.ts](../src/packages/reconciler/commitHostEffects.ts).

If a fiber has the `Placement` flag, we need to insert it into the DOM. This is handled in `commitPlacement`.

1.  **Find Host Parent**: Traverse up to find the nearest container (`div` or Root).
2.  **Find Insertion Point (`getHostSibling`)**:
    We need a stable DOM node to act as an anchor for insertion (`parentNode.insertBefore(newNode, anchor)`). The algorithm has three internal steps:

    - **Step 1: Upward Search**: If the current fiber has no sibling, we traverse _up_ the tree until we find a sibling or reach the Host Parent boundary.
    - **Step 2: Downward Search**: Once we have a sibling fiber, it might be a Component (not a DOM node). We must traverse _down_ its tree to find the first actual `HostComponent` or `HostText`.
    - **Step 3: Stability Check**: If the found host node has the `Placement` flag, it is **unstable** (it is moving too!). We cannot use it as an anchor. We loop back to Step 1 and try the _next_ sibling.

    - **Performance Note**: If we have multiple insertions in a row, this search becomes expensive (potentially **exponential** in worst cases) because we have to keep scanning past all the moving nodes to find one stable sibling. React acknowledges this and it's not changed when this document is written. Maybe you could be the one who find out a better algorithm for it ?

3.  **Insert**:
    - If a reference node ('before') is found -> `insertBefore`.
    - If no reference node is found -> `appendChild`.

## Swapping the Root (`root.current = finishedWork`)

This is the moment the "Work in Progress" officially becomes the "Current" state.

- Before this line, the screen shows the old tree.
- After this line, the internal fiber tree matches what we just applied to the DOM.

## Optimization: The Flag Check

Notice we don't traverse the whole tree blindly. We check `subtreeFlags`. If a fiber has `subtreeFlags === NoFlags`, we skip it entirely! This makes the commit phase extremely fast for small updates in large trees.
