import { NoFlags } from "./fiberFlags";
import { FunctionComponent, HostComponent } from "./workTags";

export type Fiber = {
  tag: number;
  key: string | null;
  elementType: any;
  type: any;
  stateNode: any;
  return: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  index: number;
  ref: any;
  pendingProps: any;
  memoizedProps: any;
  updateQueue: any;
  memoizedState: any;
  dependencies: any;
  mode: number;
  effectTag: number;
  nextEffect: Fiber | null;
  firstEffect: Fiber | null;
  lastEffect: Fiber | null;
  expirationTime: number;
  childExpirationTime: number;
  alternate: Fiber | null;
  deletions: Array<Fiber> | null;
  flags: number;
  lanes: number;
  childLanes: number;
  subtreeFlags: number;
};

export type Element = {
  type: any;
  key: string | null;
  ref: any;
  props: any;
};

export type FiberRoot = {
  containerInfo: any;
  current: Fiber;
  finishedWork: Fiber | null;
  pendingLanes: number;
};

export const createFiber = (
  tag: number,
  pendingProps: any,
  key: string | null,
  mode: number
): Fiber => {
  return {
    tag,
    key,
    elementType: null,
    type: null,
    stateNode: null,
    return: null,
    child: null,
    sibling: null,
    index: 0,
    ref: null,
    pendingProps,
    memoizedProps: null,
    updateQueue: null,
    memoizedState: null,
    dependencies: null,
    mode,
    effectTag: 0,
    nextEffect: null,
    firstEffect: null,
    lastEffect: null,
    expirationTime: 0,
    childExpirationTime: 0,
    alternate: null,
    deletions: null,
    flags: NoFlags,
    lanes: 1,
    childLanes: 0,
    subtreeFlags: NoFlags,
  };
};

export const createFiberFromElement = (
  element: Element,
  mode: number
): Fiber => {
  let fiberTag;
  if (typeof element.type === "string") {
    fiberTag = HostComponent;
  } else {
    fiberTag = FunctionComponent;
  }

  const fiber = createFiber(fiberTag, element.props, element.key, mode);
  fiber.elementType = element.type;
  fiber.type = element.type;
  return fiber;
};

export const createWorkInProgress = (
  current: Fiber,
  pendingProps: any
): Fiber => {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode
    );
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // update
    workInProgress.pendingProps = pendingProps;

    workInProgress.effectTag = 0;
    workInProgress.flags = NoFlags;
    workInProgress.deletions = null;
  }

  workInProgress.flags = current.flags;
  workInProgress.child = current.child;
  workInProgress.childLanes = current.childLanes;
  workInProgress.lanes = current.lanes;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;

  return workInProgress;
};
