import { Fiber } from "./fiber";
import SharedInternals from "./sharedInternals";

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
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;

  SharedInternals.Hook =
    current === null || current.memoizedState === null ? "" : "";

  return Component(props);
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
  const update: Update<S, A> = {
    lane: 1,
    action,
    hasEagerState: false,
    eagerState: null,
    next: null as any,
  };

  function findRoot(fiber: Fiber) {
    while (fiber.return !== null) {
      fiber = fiber.return;
    }
    return fiber;
  }

  const root = findRoot(fiber);
  if (root !== null) {
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

const HookDispatcherOnMount = {
  useState: mountState,
};
