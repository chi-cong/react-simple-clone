# Child Reconciliation

This is the most complex part of React. "Reconciliation" is the process of comparing the current tree (fibers) with the new desired state (JSX elements) and deciding what to do (update, delete, or create).

## The Goal

We need to efficiently transform the `current` fiber tree into a `workInProgress` tree that matches `newChild`.

## Design Constraints (Diffing Algorithm)

React implements a heuristic **O(n)** algorithm based on two assumptions:

1.  **Different types produce different trees.**
2.  **Keys are stable.**

For a deeper dive into why a perfect tree comparison (O(n³)) is too expensive and the motivation behind this heuristic, please refer to the [Official React Documentation on Reconciliation](https://reactjs.org/docs/reconciliation.html#motivation).

## The Entry Point

Open [childFiber.ts](../src/packages/reconciler/childFiber.ts).

The main function is `reconcileChildFibers`. It acts as a router based on what `newChild` is:

```typescript
function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
  // 1. Handle Array (Lists)
  if (Array.isArray(newChild)) {
    return reconcileChildrenArray(...);
  }

  // 2. Handle Single Element (Common case)
  if (typeof newChild === 'object' && newChild !== null) {
    return reconcileSingleElement(...);
  }

  // 3. Handle Text
  if (typeof newChild === 'string' || typeof newChild === 'number') {
    return reconcileSingleTextNode(...);
  }

  // 4. Handle Deletion (null/false)
  return deleteRemainingChildren(...);
}
```

## Single Element Reconciliation

This handles the case where we want to render strictly **one** child (e.g., `return <div>...</div>`).
Even though it's "simple", there are several steps effectively implemented in `reconcileSingleElement`:

1.  **Iterate through current children**: We look at the `currentFirstChild` and its siblings. Remember, we might have had a list before, but now we only want one item.
2.  **Key Check**: Does the current child's `key` match the new element's `key`?
    - **If Match**: We proceed to check the type.
    - **If No Match**: We mark this current child for **deletion** (`deleteChild`) and move to its sibling.
3.  **Type Check** (If Key Matched):
    - **If Match**: Hooray! We found a fiber to reuse. We detach (delete) any _remaining_ siblings (because we only want one child) and return the reused fiber.
    - **If No Match**: The key was right but the type changed (e.g., `div` -> `p`). We must delete this child (and all siblings) and create a brand new fiber.
4.  **Fallback**: If we loop through all current children and find no match, we create a fresh fiber from the element.

### FAQ: Why delete remaining children?

You might ask: _"If I'm rendering a single element, why would there be siblings to delete?"_

**Answer**: The _previous_ render might have been a list!
Imagine changing from:

```jsx
// Previous Render (List)
<div>
  <span>A</span>
  <span>B</span>
  <span>C</span>
</div>
```

To:

```jsx
// Next Render (Single Element)
<div>
  <span>A</span>
</div>
```

In this case, we reuse `<span>A</span>`, but we **must** delete `<span>B</span>` and `<span>C</span>` because they are no longer part of the tree.

## Single Text Node

`reconcileSingleTextNode` follows extremely similar logic to `reconcileSingleElement`, but checks for `HostText` tags instead of element types. We optimize it slightly because text nodes don't have keys.

## Understanding Flags

During reconciliation, we tag fibers with "side effects" that the Commit phase will execute later.

- **`Placement`**: This means "Insert this node into the DOM".
  - We mark this when we create a **new** fiber (e.g., first render, or type mismatch like `div` -> `p`).
  - Also used if we move an item in a list (more on that later).
- **`Deletion`**: This means "Remove this node from the DOM".
  - We mark this on the **parent** (`returnFiber.deletions.push(child)`) when we find an old child that is no longer needed.
- **`Update`**: This means "Update the DOM attributes/text".
  - We mark this when we **reuse** a fiber but its props or text content have changed.

## Array Reconciliation (Lists)

When `newChild` is an array (e.g., `<ul>{items.map(...)}</ul>`), things get interesting. We need to handle insertions, deletions, and **moves** efficiently.

### Key Variables to Watch

In `reconcileChildrenArray`, we track state with a few important variables:

- `oldFiber`: Pointer to the current fiber in the "old" list we are comparing against.
- `newIndex`: The current index we are processing in the "new" array.
- `lastPlacedIndex`: The index of the last _reused_ fiber that was successfully placed. This is the magic number used to detect if a node needs to move (Placement).
- `oldFiber`: Pointer to the current fiber in the "old" list we are comparing against.
- `newIndex`: The current index we are processing in the "new" array.
- `lastPlacedIndex`: The index of the last _reused_ fiber that was successfully placed. This is the magic number used to detect if a node needs to move (Placement).

### The Algorithm: Three Phases

The function is structured into three distinct loops (phases) to handle different scenarios efficiently.

#### Phase 1: The Head Loop (Synchronous Optimization)

We start by iterating through both lists from the beginning `(oldFiber.index === newIndex)`.

- **Goal**: Match node-for-node at the start of the list.
- **Actions**:
  1.  Call `updateSlot`: Check if the key matches.
  2.  **If Mismatch**: Stop the loop immediately. We can no longer align items simply by index.
  3.  **If Match**:
      - Reuse the fiber.
      - Call `placeChild` to track its position (and update `lastPlacedIndex`).
      - Link it to the previous sibling.
      - **Continue** to the next item `i++`.

#### Phase 2: Simple Completion

If Phase 1 finishes, we check two simple cases:

1.  **New List is Done**: (`newIndex === newChildren.length`). Since we finished the new list, any remaining `oldFiber`s are unnecessary. **Delete** them.
2.  **Old List is Done**: (`oldFiber === null`). We finished the old list but still have new items. **Create** new fibers for the rest.

#### Phase 3: The Map Loop (Complex Moves)

If we stopped Phase 1 early (due to a key mismatch), it means the list structure has changed (e.g., insertion, deletion, or reorder).

1.  **Map Creation**: We scan the _remaining_ `oldFiber` list and create a `Map`, keyed by `key`.
2.  **Lookup Loop**: We iterate through the remaining `newChildren`.
    - **Found in Map**: Reuse the old fiber, mark it as `Placement` (move) if necessary.
    - **Not Found**: Create a brand new fiber.
3.  **Cleanup**: Delete any unused fibers left in the Map.

### Handling Moves (The `lastPlacedIndex`)

How do we know if an item "moved"? We don't compare it to its neighbor (since neighbors change). We use `lastPlacedIndex`.

- **Logic**: If `oldIndex < lastPlacedIndex`, mark as `Placement`.
- **Meaning**: "I used to be at index 5, but the last item we placed was at index 10. Since I'm being placed _after_ index 10 now, I must have 'jumped' backward or stayed behind while others moved ahead."

### Design Decision: Why the Map?

You might wonder: _"Why not search from the end or just scan the list?"_

**Constraint**: Fibers are a **singly linked list**. We cannot iterate backwards easily, preventing a "two-ended" search (like in Vue or Preact).

**Avoiding O(n²)**:
If we just scanned the old list linearly for every new item, it would be **O(n²)**.
To fix this, **Phase 3** explicitly creates a `Map`.

- **Benefit**: Lookups become **O(1)**, keeping the whole algorithm **O(n)**.
- **Trade-off**: The Map consumes extra memory.
  This is a calculated choice: We trade memory to guarantee performance even in complex reordering scenarios.

**The "Bad Case"**:
Because we can't search from the end, simple operations like **prepending** an item hit the slow path:

- **Old**: `[A, B]`
- **New**: `[C, A, B]`
  Phase 1 checks `A` vs `C` -> Mismatch! Immediate breakout.
  We are forced to map the entire remaining list (`A`, `B`) just to process `C` and then find `A` and `B` again. A two-ended search would have handled this much faster.
