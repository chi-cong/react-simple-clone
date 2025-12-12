import { Fiber } from "./fiber";
import {
  HostComponent,
  HostRoot,
  HostText,
  FunctionComponent,
} from "./workTags";
import { reconcileChildFibers } from "./childFiber";
import { renderWithHooks } from "./fiberHooks";
import { PerformedWork } from "./fiberFlags";

/**
 * This is the "begin" phase of a fiber. It's responsible for:
 * 1. Updating the component's state and props.
 * 2. Calling render() for class components or the function for functional components.
 * 3. Reconciling the new children with the old children.
 *
 * @param current The old fiber (if it exists).
 * @param workInProgress The new fiber we are building.
 * @returns The next fiber to work on (the first child).
 */
export const beginWork = (
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null => {
  // Based on the fiber's tag, we delegate to a specific update function.
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostText:
      // Text nodes don't have children, so there's nothing to begin.
      return null;
    case FunctionComponent:
      return updateFunctionComponent(
        current,
        workInProgress,
        workInProgress.type,
        workInProgress.pendingProps
      );
    default:
      console.error("Unknown tag in beginWork", workInProgress.tag);
      return null;
  }
};

function updateHostRoot(current: Fiber | null, workInProgress: Fiber) {
  // For the root, we process the update queue to get the new state (the root element).
  const newChildren = workInProgress.memoizedState.element;
  // Then we reconcile the children.
  reconcileChildren(current, workInProgress, newChildren);
  return workInProgress.child;
}

function updateHostComponent(current: Fiber | null, workInProgress: Fiber) {
  const newChildren = workInProgress.pendingProps.children;
  reconcileChildren(current, workInProgress, newChildren);
  return workInProgress.child;
}

function updateFunctionComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  nextProps: any
) {
  let nextChildren = renderWithHooks(
    current,
    workInProgress,
    Component,
    nextProps
  );
  workInProgress.flags |= PerformedWork;
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  newChildren: any
) {
  // If there's a `current` fiber, we are in an update. Use the tracking reconciler.
  // Otherwise, it's an initial mount.
  const childReconciler = reconcileChildFibers; // This is the version that tracks side effects
  const currentFirstChild = current ? current.child : null;

  // This call is the bridge to your childFiber.ts file.
  // It creates the child fibers and links them.
  workInProgress.child = childReconciler(
    workInProgress,
    currentFirstChild,
    newChildren
  );
}
