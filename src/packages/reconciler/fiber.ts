export type Fiber = {
  tag: number;
  key: string | null;
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
  };
};

export const createWorkInProgress = (
  current: Fiber,
  pendingProps: any
): Fiber => {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    // mount
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode
    );
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // update
    workInProgress.pendingProps = pendingProps;

    workInProgress.effectTag = 0;
    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
  }

  workInProgress.childExpirationTime = current.childExpirationTime;
  workInProgress.expirationTime = current.expirationTime;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;

  return workInProgress;
};
