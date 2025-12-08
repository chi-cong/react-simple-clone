import { Fiber } from "./fiber";
import { createFiber } from "./fiber";

/**
 * This is a factory function that creates a reconciler function.
 * The `shouldTrackSideEffects` flag determines if we are in "mount" or "update" mode.
 * - During the initial mount (`mountChildFibers`), we don't need to track side effects
 *   like placements, updates, or deletions because everything is being created for the first time.
 * - During an update (`reconcileChildFibers`), we compare the new children with the old ones
 *   and need to track these side effects to apply them to the DOM later.
 *
 * @param shouldTrackSideEffects - A boolean indicating whether to track side effects.
 * @returns A `reconcileChildFibers` function.
 */
export const createChildReconciler = (shouldTrackSideEffects: boolean) => {
  // TODO: Implement this function. It should handle creating or updating a fiber for a text node.
  function updateTextNode(
    returnFiber: Fiber,
    current: Fiber | null,
    textContent: string
  ) {
    return null;
  }

  // TODO: Implement this function. It should handle creating or updating a fiber for a React element.
  function updateElement() {
    return null;
  }

  /**
   * Determines if a child fiber needs to be moved and updates its index.
   * In update mode, it compares the old index with the last placed index to detect reordering.
   *
   * @param newFiber The new fiber for the child.
   * @param lastPlacedIndex The index of the last child that was kept and didn't need to move.
   * @param newIndex The new index of the child in the children array.
   * @returns The new `lastPlacedIndex`.
   */
  function placeChild(
    newFiber: Fiber,
    lastPlacedIndex: number,
    newIndex: number
  ) {
    // In mount mode, we don't need to track placements.
    if (!shouldTrackSideEffects) {
      return lastPlacedIndex;
    }
    newFiber.index = newIndex;
    const current = newFiber.alternate;
    if (current) {
      const oldIndex = current.index;
      // If the old index is smaller than the last placed index, it means this node
      // has moved forward in the list of siblings, so we need to mark it for placement.
      if (oldIndex < lastPlacedIndex) {
        // TODO: Mark this fiber for placement.
        // e.g., newFiber.flags |= Placement;
        return lastPlacedIndex;
      } else {
        // This node is in a correct position relative to the previous ones.
        // We update the last placed index to this node's old index.
        return oldIndex;
      }
    } else {
      // This is a new fiber that needs to be inserted.
      // TODO: Mark this fiber for placement.
      // e.g., newFiber.flags |= Placement;
      return lastPlacedIndex;
    }
  }

  /**
   * This is the core reconciliation function for a set of children.
   * It diffs the new children against the old children (fibers) and creates/updates/deletes fibers as necessary.
   *
   * @param returnFiber The parent fiber.
   * @param currentFirstChild The first child fiber of the old tree.
   * @param newChild The new children (can be a single element, text, or an array of them).
   * @returns The new first child fiber.
   */
  function reconcileChildFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any
  ): Fiber | null {
    // TODO: This is the main missing piece. You need to implement the reconciliation logic here.
    // The logic will differ based on the type of `newChild`.

    // 1. Handle a single new child (object for an element, or string/number for a text node).
    //    - If `newChild` is an object, it's a React element.
    //    - If `newChild` is a string or number, it's a text node.
    //    - You'll need to compare it with `currentFirstChild` to see if you can reuse the old fiber.

    // 2. Handle multiple new children (when `newChild` is an array).
    //    - This is the most complex part. You'll iterate through the new children and the old children (fibers) simultaneously.
    //    - You'll need to handle creating new fibers, updating existing ones, and deleting old ones that are no longer present.
    //    - For efficient updates, you should handle keyed elements. This involves creating a map of old children by their key.

    // 3. Handle deletion of remaining old children.
    //    - After iterating through the new children, any remaining old children fibers need to be marked for deletion.

    return null; // Placeholder
  }
  return reconcileChildFibers;
};

// For the initial render. Side effects (like placement) are not tracked.
export const mountChildFibers = createChildReconciler(false);

// For subsequent updates. Side effects are tracked to update the DOM efficiently.
export const reconcileChildFibers = createChildReconciler(true);
