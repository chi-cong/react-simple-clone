import { createWorkInProgress, Fiber, FiberRoot } from "./fiber";
import { beginWork } from "./beginWork";
import { HostRoot } from "./workTags";
import {
  commitMutationEffects,
  commitPassiveMountEffects,
  commitPassiveUnmountEffect,
} from "./commitWork";
import { completeWork } from "./completeWork";

const RootInProgress = 0;
const RootCompleted = 5;

// The current fiber being processed.
let workInProgress: Fiber | null = null;
let workInProgressRoot: FiberRoot | null = null;
let workInProgressRootExitStatus = RootInProgress;

const NO_PENDING_EFFECTS = 0;
const HAS_PENDING_EFFECTS = 1;
let pendingEffectsStatus: 0 | 1 = 0;
let pendingEffectsRoot: null | FiberRoot = null;

/** from ReactFiberLane */
function mergeLanes(lane: number, newLane: number) {
  return lane | newLane;
}

/**
 * Prepares the reconciler for a new render.
 * This sets up the initial fiber to begin work on.
 * @param root The root fiber of the tree to render.
 */
export function prepareFreshStack(root: FiberRoot) {
  workInProgressRoot = root;
  const rootWorkInProgress = createWorkInProgress(root.current, null);
  workInProgress = rootWorkInProgress;
  workInProgressRoot = root;
  workInProgressRootExitStatus = RootInProgress;

  // We skipped finishQueueingConcurrentUpdates()
  // because we apply updates immediately in dispatchSetState.

  return rootWorkInProgress;
}

function renderRootSync(root: FiberRoot) {
  if (workInProgressRoot !== root || workInProgress === null) {
    prepareFreshStack(root);
  }

  let exitStatus = workInProgressRootExitStatus;

  try {
    workLoop();
    exitStatus = workInProgressRootExitStatus;
  } catch (throwValue) {
    throw throwValue;
  }
  return exitStatus;
}

function commitRoot(root: FiberRoot, finishedWork: Fiber) {
  do {
    flushPassiveEffect();
  } while (pendingEffectsStatus !== NO_PENDING_EFFECTS);
  if (finishedWork === null) return;
  if (finishedWork === root.current)
    throw new Error("Cannot commit the same tree as before.");
  commitMutationEffects(root, finishedWork);
  root.current = finishedWork;
  root.finishedWork = null;

  pendingEffectsRoot = root;
  pendingEffectsStatus = HAS_PENDING_EFFECTS;
}

/**
 * This is actually performWorkOnRoot in ReactFiberWorkLoop but sync by default
 */
function performSyncWorkOnRoot(root: FiberRoot) {
  let exitStatus = renderRootSync(root);
  const finishedWork: Fiber = root.current.alternate as any;

  switch (exitStatus) {
    case RootInProgress:
      throw new Error("Root is not completed");
    case RootCompleted:
      break;
    default:
      throw new Error("Unknown root exit status.");
  }
  commitRoot(root, finishedWork);
  flushPassiveEffect();
}

function ensureRootIsScheduled(root: FiberRoot): void {
  /**
   * In the actual react source code, this function does not call
   * performSyncWorkOnRoot, it calls ensureScheduleIsScheduled instead.
   * But for the sake of simplicity, We treat everything as synchronous.
   */

  performSyncWorkOnRoot(root);
}

export function markUpdateLaneFromFiberToRoot(
  sourceFiber: Fiber,
  lane: number
) {
  let node = sourceFiber;

  sourceFiber.lanes = mergeLanes(sourceFiber.lanes, lane);
  let alternate = sourceFiber.alternate;
  if (alternate !== null) {
    alternate.lanes = mergeLanes(alternate.lanes, lane);
  }
  let parent = node.return;
  while (parent !== null) {
    parent.childLanes = mergeLanes(parent.childLanes, lane);
    alternate = parent.alternate;
    if (alternate !== null) {
      alternate.childLanes = mergeLanes(alternate.childLanes, lane);
    }
    node = parent;
    parent = node.return;
  }
  if (node.tag === HostRoot) {
    const root: FiberRoot = node.stateNode;
    return root;
  }
  return null;
}

export function scheduleUpdateOnFiber(
  root: FiberRoot,
  fiber: Fiber,
  lane: number
) {
  /** This replace markRootUpdated */
  root.pendingLanes = mergeLanes(root.pendingLanes, lane);
  ensureRootIsScheduled(root);
}

/**
 * The main work loop. It processes fibers one by one until the stack is empty.
 * This is the heart of the concurrent rendering model.
 */
export function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

/**
 * Processes a single fiber. It calls `beginWork` to create children,
 * and if there are no new children, it moves to `completeWork`.
 * @param unitOfWork The fiber to process.
 */
function performUnitOfWork(unitOfWork: Fiber) {
  const current = unitOfWork.alternate;
  // 1. Begin Work (Downward pass)
  // This function will return the next child fiber to process.
  const next = beginWork(current, unitOfWork);

  // We've finished the beginWork phase for this fiber.
  // Now, set its pending props to null as they've been processed.
  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next === null) {
    // If there's no child, we can start the "complete" phase for this fiber.
    // This is the start of the upward pass.
    completeUnitOfWork(unitOfWork);
  } else {
    // If there is a child, it becomes the next unit of work.
    workInProgress = next;
  }
}

function completeUnitOfWork(unitOfWork: Fiber) {
  let completedWork = unitOfWork;
  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    completeWork(current, completedWork);

    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }

    //@ts-ignore
    completedWork = returnFiber;
    workInProgress = returnFiber;
  } while (completedWork !== null);

  if (workInProgressRootExitStatus === RootInProgress) {
    workInProgressRootExitStatus = RootCompleted;
  }
}

function flushPassiveEffect() {
  if (pendingEffectsStatus === NO_PENDING_EFFECTS) return;
  pendingEffectsStatus = NO_PENDING_EFFECTS;
  const root = pendingEffectsRoot;
  if (root === null) return;
  pendingEffectsRoot = null;
  commitPassiveUnmountEffect(root.current);
  commitPassiveMountEffects(root, root.current);
}
