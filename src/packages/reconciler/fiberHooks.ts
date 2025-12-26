import { Fiber } from "./fiber";
import SharedInternals from "./sharedInternals";
import {
  markUpdateLaneFromFiberToRoot,
  scheduleUpdateOnFiber,
} from "./workLoop";

export type Update<S, A> = {
  lane: number;
  action: A;
  hasEagerState: boolean;
  eagerState: S | null;
  next: Update<S, A>;
};

export type UpdateQueue<S, A> = {
  pending: Update<S, A> | null;
  lanes: number;
  dispatch: ((action: A) => any) | null;
  lastRenderedReducer: ((state: S, action: A) => S) | null;
  lastRenderedState: S | null;
};

export type Hook = {
  memoizedState: any;
  baseState: any;
  baseQueue: Update<any, any> | null;
  queue: any;
  next: Hook | null;
};

export type Dispatch<A> = (state: A) => void;
export type BasicStateAction<S> = ((state: S) => S) | S;

// the work-in-progress fiber
let currentlyRenderingFiber: Fiber | null = null;

let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  return typeof action === "function"
    ? (action as (state: S) => S)(state)
    : action;
}

export function renderWithHooks<Props>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props) => any,
  props: Props
) {
  currentlyRenderingFiber = workInProgress;

  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;

  workInProgressHook = null;
  currentHook = null;

  SharedInternals.Hook =
    current === null || current.memoizedState === null
      ? HookDispatcherOnMount
      : HookDispatcherOnUpdate;

  let children = Component(props);

  return children;
}

function mountWorkInProgress(): Hook {
  const hook: Hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };

  if (workInProgressHook === null) {
    currentlyRenderingFiber!.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook = workInProgressHook.next = hook;
  }
  return hook;
}

/** useState */
function dispatchSetState<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A
) {
  // hardcode lane, every update would be synchronize
  const lane = 1;

  const update: Update<S, A> = {
    lane,
    action,
    hasEagerState: false,
    eagerState: null,
    next: null as any,
  };

  const pending = queue.pending;
  if (pending === null) {
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  queue.pending = update;

  const root = markUpdateLaneFromFiberToRoot(fiber, lane);
  if (root !== null) {
    scheduleUpdateOnFiber(root, fiber, lane);
  }
}

function mountState<S>(initialState: (() => S) | S) {
  const hook = mountWorkInProgress();
  if (typeof initialState === "function") {
    const initialStateInitializer = initialState as () => S;
    initialState = initialStateInitializer();
  }
  hook.memoizedState = hook.baseState = initialState;
  const queue: UpdateQueue<S, BasicStateAction<S>> = {
    pending: null,
    lanes: 1,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState,
  };
  hook.queue = queue;
  const dispatch: Dispatch<BasicStateAction<S>> = dispatchSetState.bind(
    null,
    currentlyRenderingFiber!,
    hook.queue
  );
  queue.dispatch = dispatch;
  return [hook.memoizedState, dispatch];
}

function updateWorkInProgressHook() {
  let nextCurrentHook: Hook | null = null;
  if (currentHook === null) {
    // first hook in the component
    const current = currentlyRenderingFiber!.alternate;
    if (current !== null) {
      nextCurrentHook = current.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    // next hook in the component
    nextCurrentHook = currentHook.next;
  }

  if (nextCurrentHook === null) {
    throw new Error("Rendered more hooks than during the previous render.");
  }
  currentHook = nextCurrentHook;

  const newHook: Hook = {
    memoizedState: currentHook.memoizedState,
    baseState: currentHook.baseState,
    baseQueue: currentHook.baseQueue,
    queue: currentHook.queue,
    next: null,
  };

  if (workInProgressHook === null) {
    // This is the first hook in the list.
    currentlyRenderingFiber!.memoizedState = workInProgressHook = newHook;
  } else {
    // append to the end of the list
    workInProgressHook = workInProgressHook.next = newHook;
  }

  return workInProgressHook;
}

function updateState() {
  const hook = updateWorkInProgressHook();

  const queue = hook.queue;
  const pending = queue.pending;

  if (pending !== null) {
    queue.pending = null;

    const lastPendingUpdate = pending;
    const firstPendingUpdate = lastPendingUpdate.next;
    lastPendingUpdate!.next = null;

    let newState = hook.memoizedState;
    let update = firstPendingUpdate;
    while (update !== null) {
      const action = update.action;
      newState = basicStateReducer(newState, action);
      update = update.next;
    }
    hook.memoizedState = newState;
    hook.baseState = newState;
  }

  return [hook.memoizedState, queue.dispatch];
}

const HookDispatcherOnMount = {
  useState: mountState,
};

const HookDispatcherOnUpdate = {
  useState: updateState,
};
