import { Fiber } from "./fiber";
import {
  HostComponent,
  HostRoot,
  HostText,
  FunctionComponent,
} from "./workTags";
import { reconcileChildFibers, mountChildFibers } from "./childFiber";
import { renderWithHooks } from "./fiberHooks";
import { PerformedWork } from "./fiberFlags";
import { processUpdateQueue } from "./classUpdateQueue";

/**
 * @param current The old fiber (if it exists).
 * @param workInProgress The new fiber we are building.
 * @returns The next fiber to work on (the first child).
 */
export const beginWork = (
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null => {
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
  processUpdateQueue(workInProgress);

  const nextState = workInProgress.memoizedState;
  const nextChildren = nextState.element;

  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

function updateHostComponent(current: Fiber | null, workInProgress: Fiber) {
  const nextProps = workInProgress.pendingProps;
  const nextChildren = nextProps.children;

  reconcileChildren(current, workInProgress, nextChildren);
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
  const childReconciler = current ? reconcileChildFibers : mountChildFibers;
  const currentFirstChild = current ? current.child : null;

  workInProgress.child = childReconciler(
    workInProgress,
    currentFirstChild,
    newChildren
  );
}
