import { Fiber, FiberRoot } from "./fiber";
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./workTags";
import {
  commitTextUpdate,
  commitUpdate,
  removeChildFromContainer,
} from "./hostConfig";
import {
  ChildDeletion,
  MutationMask,
  NoFlags,
  Passive,
  PassiveMask,
  Placement,
  Update,
} from "./fiberFlags";
import { commitPlacement } from "./commitHostEffects";
import {
  HasEffect as HookHasEffect,
  HookFlags,
  Passive as HookPassive,
} from "./effectTags";
import { FunctionComponentUpdateQueue } from "./fiberHooks";

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

  if (parentFiber.subtreeFlags & MutationMask) {
    let child = parentFiber.child;
    while (child !== null) {
      commitMutationEffects(root, child);
      child = child.sibling;
    }
  }
}

function commitReconciliationEffects(finishedWork: Fiber) {
  const flags = finishedWork.flags;
  if (flags & Placement) {
    commitPlacement(finishedWork); // or commitHostPlacement
    finishedWork.flags &= ~Placement;
  }
}

// This combined with commitMutationEffectsOnFiber
export function commitMutationEffects(root: FiberRoot, finishedWork: Fiber) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;

  switch (finishedWork.tag) {
    case FunctionComponent:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      break;
    case HostComponent:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      if (flags & Update) {
        const instance = finishedWork.stateNode;
        if (instance !== null) {
          const newProps = finishedWork.memoizedProps;
          const oldProps = current !== null ? current.memoizedProps : newProps;
          commitUpdate(instance, newProps, oldProps);
        }
      }
      break;
    case HostText:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      if (flags & Update) {
        const newText: string = finishedWork.memoizedProps;
        commitTextUpdate(finishedWork.stateNode, newText);
      }
      break;
    case HostRoot:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      break;
    default:
  }
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
    case HostComponent:
      // we only need to remove nearest host child,
      // but we still need to recurse this component to find
      // child function components that have to run cleanup function
      // ex: <div><NavBar /><Dashboard /><div>
      const prevHostParent = hostParent;
      hostParent = null;
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      hostParent = prevHostParent;
      if (hostParent !== null)
        removeChildFromContainer(hostParent, deletedFiber.stateNode);
      commitReconciliationEffects(deletedFiber);
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
  findParent: while (parent !== null) {
    switch (parent.tag) {
      case HostComponent:
        hostParent = parent.stateNode;
        break findParent;
      case HostRoot:
        hostParent = parent.stateNode.containerInfo;
        break findParent;
    }
    parent = parent.return;
  }
  if (hostParent === null) {
    throw new Error("Bug: No host parent found");
  }

  commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
}

// * _____useEffect section_______

function recursivelyTraversePassiveMountEffects(
  root: FiberRoot,
  parentFiber: Fiber
) {
  if (parentFiber.subtreeFlags & PassiveMask) {
    let child = parentFiber.child;
    while (child !== null) {
      commitPassiveMountEffects(root, child);
      child = child.sibling;
    }
  }
}

function commitHookPassiveEffectMount(flags: HookFlags, finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue === null ? null : updateQueue.lastEffect;
  if (lastEffect !== null) {
    // this is circular list, next should not be null at this point
    const firstEffect = lastEffect.next!;
    let effect = firstEffect;
    do {
      if ((effect.tag & flags) === flags) {
        const create = effect.create;
        effect.destroy = create();
      }
      effect = effect.next!;
    } while (effect !== firstEffect);
  }
}

export function commitPassiveMountEffects(
  root: FiberRoot,
  finishedWork: Fiber
) {
  const flags = finishedWork.flags;

  switch (finishedWork.tag) {
    case FunctionComponent:
      recursivelyTraversePassiveMountEffects(root, finishedWork);
      if (flags & Passive) {
        commitHookPassiveEffectMount(HookPassive | HookHasEffect, finishedWork);
      }
      break;
    case HostRoot:
      recursivelyTraversePassiveMountEffects(root, finishedWork);
  }
}

function commitHookPassiveUnmountEffects(
  finishedWork: Fiber,
  flags: HookFlags
) {
  const updateQueue: FunctionComponentUpdateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue === null ? null : updateQueue.lastEffect;
  if (lastEffect !== null) {
    // this is circular list, next should not be null at this point
    const firstEffect = lastEffect.next!;
    let effect = firstEffect;
    do {
      if ((effect.tag & flags) === flags) {
        const destroy = effect.destroy;
        if (destroy !== undefined) {
          effect.destroy = undefined;
          try {
            destroy();
          } catch (error) {
            console.error("Failed to call useEffect cleanup function: ", error);
          }
        }
      }
      effect = effect.next!;
    } while (effect !== firstEffect);
  }
}

function recursivelyTraversePassiveUnmountEffects(parentFiber: Fiber) {
  const deletions = parentFiber.deletions;
  if ((parentFiber.flags & ChildDeletion) !== NoFlags) {
    if (deletions !== null) {
      for (let i = 0; i < deletions.length; i++) {
        const childToDelete = deletions[i];
        commitPassiveUnmountInsideDeletedTree(childToDelete!);
      }
    }
  }

  if (parentFiber.subtreeFlags & PassiveMask) {
    let child = parentFiber.child;
    while (child !== null) {
      commitPassiveUnmountEffect(child);
      child = child.sibling;
    }
  }
}

function commitPassiveUnmountInsideDeletedTree(current: Fiber) {
  switch (current.tag) {
    case FunctionComponent:
      commitHookPassiveUnmountEffects(current, Passive);
      break;
  }

  let child = current.child;
  while (child !== null) {
    commitPassiveUnmountInsideDeletedTree(child);
    child = child.sibling;
  }
}

export function commitPassiveUnmountEffect(finishedWork: Fiber) {
  switch (finishedWork.tag) {
    case FunctionComponent:
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      if (finishedWork.flags & Passive)
        commitHookPassiveUnmountEffects(
          finishedWork,
          HookPassive | HookHasEffect
        );
      break;
    default:
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      break;
  }
}
