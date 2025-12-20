import { Fiber, FiberRoot } from "./fiber";
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./workTags";
import { removeChildFromContainer } from "./hostConfig";

export function recursivelyTraverseMutationEffects(
  root: FiberRoot,
  parentFiber: Fiber
) {
  const deletions = parentFiber.deletions;
  if (deletions !== null) {
    for (let i = 0; i < deletions.length; i++) {
      const childToDelete = deletions[i];
      commitDeletionEffects(root, parentFiber, childToDelete!);
    }
  }
}

export function commitReconciliationEffects(finishedWork: Fiber) {}

export function commitMutationEffect(root: FiberRoot, finishedWork: Fiber) {
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
 * Commits an update side effect (e.g., changing props on a DOM node).
 * @param finishedWork The fiber with the Update flag.
 */
export function commitWork(finishedWork: Fiber) {
  // TODO: Implement DOM update logic.
  // 1. Compare old and new props.
  // 2. Apply changes to the DOM node (finishedWork.stateNode).
  console.log("Committing update for", finishedWork.type);
}

let hostParent: Element | null = null;

function recursivelyTraverseDeletionEffects(
  finishedRoot: FiberRoot,
  nearestMountedAncestor: Fiber,
  parent: Fiber
) {
  let child = parent.child;
  while (child !== null) {
    commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, child);
    child = child.sibling;
  }
}

function commitDeletionEffectsOnFiber(
  finishedRoot: FiberRoot,
  nearestMountedAncestor: Fiber,
  deletedFiber: Fiber
) {
  switch (deletedFiber.tag) {
    case HostText:
      // TODO: When implementing useEffect, we must recurse here
      // even if we are a Host node to run cleanups of children.
      // We would set hostParent = null before recursing to avoid
      // multiple removeChild calls.

      if (hostParent !== null)
        removeChildFromContainer(hostParent, deletedFiber.stateNode);
      break;
    case FunctionComponent:
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      commitReconciliationEffects(deletedFiber);
      break;
    default:
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      break;
  }
}

/**
 * Commits a deletion side effect (removing a node from the DOM).
 * @param fiberToDelete The fiber to be deleted.
 */
export function commitDeletionEffects(
  root: FiberRoot,
  returnFiber: Fiber,
  deletedFiber: Fiber
) {
  let parent: Fiber | null = returnFiber;
  while (parent !== null) {
    switch (parent.tag) {
      case HostComponent:
        hostParent = parent.stateNode;
        break;
      case HostRoot:
        hostParent = parent.stateNode.containerInfo;
        break;
    }
    parent = parent.return;
  }
  if (hostParent === null) {
    throw new Error("Bug: No host parent found");
  }

  commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
}
