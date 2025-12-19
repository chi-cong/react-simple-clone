import { Fiber, FiberRoot } from "./fiber";
import { FunctionComponent, HostComponent, HostText } from "./workTags";
import { Placement, Update } from "./fiberFlags";

export function recursivelyTraverseMutationEffects(
  root: FiberRoot,
  finishedWork: Fiber
) {}

export function commitReconciliationEffects(finishedWork: Fiber) {}

export function commitMutationEffect(
  root: FiberRoot,
  finishedWork: Fiber,
  committedLanes: number
) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;

  switch (finishedWork.tag) {
    case FunctionComponent:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      break;
    case HostComponent:
      break;
  }
}

/**
 * Commits a placement side effect (inserting a node into the DOM).
 * @param finishedWork The fiber with the Placement flag.
 */
export function commitPlacement(finishedWork: Fiber) {
  // TODO: Implement DOM insertion logic.
  // 1. Find the parent DOM node.
  // 2. Find the correct sibling to insert before.
  // 3. Insert the node (finishedWork.stateNode).
  console.log("Committing placement for", finishedWork.type);
}

/**
 * Commits an update side effect (e.g., changing props on a DOM node).
 * @param finishedWork The fiber with the Update flag.
 */
export function commitWork(finishedWork: Fiber) {
  // TODO: Implement DOM update logic.
  // 1. Compare old and new props.
  // 2. Apply changes to the DOM node (finishedWork.stateNode).
  console.log("Committing update for", finishedWork.type);
}

/**
 * Commits a deletion side effect (removing a node from the DOM).
 * @param fiberToDelete The fiber to be deleted.
 */
export function commitDeletion(fiberToDelete: Fiber) {
  // TODO: Implement DOM removal logic.
  // 1. Find the parent DOM node.
  // 2. Remove the child node (fiberToDelete.stateNode).
  console.log("Committing deletion for", fiberToDelete.type);
}
