import { createWorkInProgress, Fiber, Element } from "./fiber";
import { createFiber, createFiberFromElement } from "./fiber";
import { ChildDeletion, Placement } from "./fiberFlags";
import { FunctionComponent, HostText } from "./workTags";

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
  function useFiber(fiber: Fiber, pendingProps: any) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }

  function deleteChild(returnFiber: Fiber, childToDelete: Fiber) {
    if (!shouldTrackSideEffects) return;

    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
      returnFiber.flags |= ChildDeletion;
    } else {
      deletions.push(childToDelete);
    }
  }

  function createChild(returnFiber: Fiber, newChild: any): Fiber | null {
    if (
      (typeof newChild === "string" && newChild !== "") ||
      typeof newChild === "number" ||
      typeof newChild === "bigint"
    ) {
      const created = createFiber(
        HostText,
        "" + newChild,
        null,
        returnFiber.mode
      );
      created.return = returnFiber;
      return created;
    }

    if (typeof newChild === "object" && newChild !== null) {
      const created = createFiberFromElement(newChild, returnFiber.mode);
      created.return = returnFiber;
      return created;
    }

    return null;
  }

  function deleteRemainingChildren(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null
  ) {
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
  }

  function updateTextNode(
    returnFiber: Fiber,
    current: Fiber | null,
    textContent: string
  ) {
    if (current === null || current.tag !== HostText) {
      const created = createFiber(
        HostText,
        textContent,
        null,
        returnFiber.mode
      );
      created.return = returnFiber;
      return created;
    } else {
      const existing = useFiber(current, textContent);
      existing.return = returnFiber;
      return existing;
    }
  }

  function updateElement(
    returnFiber: Fiber,
    current: Fiber | null,
    element: Element
  ): Fiber {
    if (current !== null) {
      if (current.elementType === element.type) {
        const existing = useFiber(current, element.props);
        existing.return = returnFiber;
        return existing;
      }
    }
    // createFiberFromElement
    const created = createFiberFromElement(element, returnFiber.mode);
    created.type = element.type;
    created.return = returnFiber;
    return created;
  }

  function updateSlot(
    returnFiber: Fiber,
    oldFiber: Fiber | null,
    newChild: any
  ) {
    const key = oldFiber !== null ? oldFiber.key : null;

    if (
      (typeof newChild === "string" && newChild !== "") ||
      typeof newChild === "number" ||
      typeof newChild === "bigint"
    ) {
      // Text nodes don't have keys. If the previous node is implicitly keyed
      // we can continue to replace it without aborting even if it is not a text
      // node.
      if (key !== null) {
        return null;
      }
      return updateTextNode(returnFiber, oldFiber, "" + newChild);
    }

    if (typeof newChild === "object" && newChild !== null) {
      if (newChild.key === key) {
        return updateElement(returnFiber, oldFiber, newChild);
      } else {
        return null;
      }
    }

    return null;
  }

  function updateFromMap(
    existingChildren: Map<string | number, Fiber>,
    returnFiber: Fiber,
    newIndex: number,
    newChild: any
  ) {
    if (
      (typeof newChild === "string" && newChild !== "") ||
      typeof newChild === "number" ||
      typeof newChild === "bigint"
    ) {
      const matchedFiber = existingChildren.get(newIndex) || null;
      return updateTextNode(returnFiber, matchedFiber, "" + newChild);
    }

    if (typeof newChild === "object" && newChild !== null) {
      const matchedFiber =
        existingChildren.get(newChild.key === null ? newIndex : newChild.key) ||
        null;
    }
    return null;
  }

  function mapRemainingChildren(currentFirstChild: Fiber | null) {
    const existingChildren = new Map<string | number, Fiber>();
    let existingChild = currentFirstChild;
    while (existingChild !== null) {
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling;
    }
    return existingChildren;
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
    if (current !== null) {
      const oldIndex = current.index;
      // If the old index is smaller than the last placed index, it means this node
      // has moved forward in the list of siblings, so we need to mark it for placement.
      if (oldIndex < lastPlacedIndex) {
        newFiber.flags |= Placement;
        return lastPlacedIndex;
      } else {
        // This node is in a correct position relative to the previous ones.
        // We update the last placed index to this node's old index.
        return oldIndex;
      }
    } else {
      // This is a new fiber that needs to be inserted.
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    }
  }

  function placeSingleChild(newFiber: Fiber): Fiber {
    if (!shouldTrackSideEffects || newFiber.alternate === null) {
      newFiber.flags |= Placement;
    }
    return newFiber;
  }

  function reconcileSingleElement(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    element: Element
  ): Fiber {
    const key = element.key;
    let child = currentFirstChild;
    while (child !== null) {
      if (child.key === key) {
        const elementType = child.elementType;
        if (elementType === element.type) {
          deleteRemainingChildren(returnFiber, child.sibling);
          const existing = useFiber(child, element.props);
          return existing;
        }
        deleteRemainingChildren(returnFiber, child);
        break;
      } else {
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }
    const created = createFiberFromElement(element, returnFiber.mode);
    created.return = returnFiber;
    return created;
  }

  function reconcileSingleTextNode(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    textContent: string
  ) {
    if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
      deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
      const existing = useFiber(currentFirstChild, textContent);
      existing.return = returnFiber;
      return existing;
    }
    // The existing first child is not a text node so we need to create one
    // and delete the existing ones.
    deleteRemainingChildren(returnFiber, currentFirstChild);
    const created = createFiber(HostText, textContent, null, returnFiber.mode);
    created.return = returnFiber;
    return created;
  }

  function reconcileChildrenArray(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildren: Array<any>
  ) {
    let knownKeys: Set<string> | null = null;
    let resultingFirstChild: Fiber | null = null;
    let previousNewFiber: Fiber | null = null;

    let oldFiber = currentFirstChild;
    let newIndex = 0;
    let lastPlacedIndex = 0;
    let nextOldFiber = null;

    for (; oldFiber !== null && newIndex < newChildren.length; newIndex++) {
      if (oldFiber.index > newIndex) {
        nextOldFiber = oldFiber;
        oldFiber = null;
      } else {
        nextOldFiber = oldFiber.sibling;
      }
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIndex]);
      if (newFiber === null) {
        if (oldFiber === null) {
          oldFiber = nextOldFiber;
        }
        break;
      }

      if (shouldTrackSideEffects) {
        if (oldFiber && newFiber.alternate === null) {
          // We matched the slot, but we didn't reuse the existing fiber, so we
          // need to delete the existing child.
          deleteChild(returnFiber, oldFiber);
        }
      }

      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex);

      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    if (newIndex === newChildren.length) {
      // We've reached the end of the new children. We can delete the rest.
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    if (oldFiber === null) {
      for (; newIndex < newChildren.length; newIndex++) {
        const newFiber = createChild(returnFiber, newChildren[newIndex]);
        if (newFiber === null) continue;
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex);

        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
      }

      return resultingFirstChild;
    }

    const existingChildren = mapRemainingChildren(currentFirstChild);

    for (; newIndex < newChildren.length; newIndex++) {
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIndex,
        newChildren[newIndex]
      );
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          const currentFiber = newFiber.alternate;
          if (currentFiber !== null) {
            existingChildren.delete(
              currentFiber.key === null ? newIndex : currentFiber.index
            );
          }
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }

      if (shouldTrackSideEffects) {
        // Any existing children that weren't consumed above were deleted. We need
        // to add them to the deletion list.
        existingChildren.forEach((child) => deleteChild(returnFiber, child));
      }
    }

    return resultingFirstChild;
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
    if (typeof newChild === "object" && newChild !== null) {
      const firstChild = placeSingleChild(
        reconcileSingleElement(returnFiber, currentFirstChild, newChild)
      );
    }
    if (
      (typeof newChild === "string" && newChild !== null) ||
      typeof newChild === "number" ||
      typeof newChild === "bigint"
    ) {
      const firstChild = placeSingleChild(
        reconcileSingleTextNode(returnFiber, currentFirstChild, "" + newChild)
      );
      return firstChild;
    }
    if (Array.isArray(newChild)) {
      // const firstChild = placeSingleChild(
      //   reconcileChildrenArray(returnFiber, currentFirstChild, newChild)
      // );
      // return firstChild;
    }
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
