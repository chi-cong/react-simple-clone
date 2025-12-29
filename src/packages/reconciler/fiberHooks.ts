import { Fiber } from "./fiber";
import SharedInternals from "./sharedInternals";
import {
  markUpdateLaneFromFiberToRoot,
  scheduleUpdateOnFiber,
} from "./workLoop";
import {
  Passive as HookPassive,
  HasEffect as HookHasEffect,
  HookFlags,
} from "./effectTags";

import { Passive as PassiveEffect } from "./fiberFlags";

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

export type Effect = {
  tag: HookFlags;
  create: () => (() => void) | void;
  destroy: (() => void) | void; // or inst in the latest react code
  deps: unknown[] | null;
  next: Effect | null;
};

export type FunctionComponentUpdateQueue = {
  lastEffect: Effect | null;
};

export type Dispatch<A> = (state: A) => void;
export type BasicStateAction<S> = ((state: S) => S) | S;

// AKA work-in-progress fiber
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

/**
 * * ______ useState section ______
 */
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

/**
 * * ______ useEffect section ______
 */

function areHookInputsEqual(nextDeps: unknown[], prevDeps: unknown[] | null) {
  if (prevDeps === null) return false;

  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}

function pushEffect(
  tag: HookFlags,
  destroy: (() => void) | void,
  create: () => (() => void) | void,
  deps: unknown[] | null
) {
  const effect: Effect = {
    tag,
    create,
    destroy,
    deps,
    // circular, this is lastEffect, firstEffect is lastEffect.next
    next: null,
  };

  let componenentUpdateQueue: FunctionComponentUpdateQueue | null =
    currentlyRenderingFiber?.updateQueue;
  if (componenentUpdateQueue === null) {
    componenentUpdateQueue = {
      lastEffect: null,
    };
    currentlyRenderingFiber!.updateQueue = componenentUpdateQueue;
  }
  const lastEffect = componenentUpdateQueue.lastEffect;
  if (lastEffect === null) {
    // First Effect: A, Last Effect: A
    componenentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    // First Effect: A, Last Effect: A
    const firstEffect = lastEffect.next;
    // A -> B
    lastEffect.next = effect;
    // B -> A
    effect.next = firstEffect;
    // Last Effect: B -> A
    componenentUpdateQueue.lastEffect = effect;
  }
  return effect;
}

function mountEffect(
  create: () => (() => void) | void,
  deps: unknown[] | null
) {
  const fiberFlags = PassiveEffect;
  const hookFlags = HookPassive;

  const hook = mountWorkInProgress();
  const nextDeps = deps === undefined ? null : deps;
  currentlyRenderingFiber!.flags |= fiberFlags;
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    undefined,
    create,
    nextDeps
  );
}

function updateEffect(
  create: () => (() => void) | void,
  deps: unknown[] | null
) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const effect: Effect = hook.memoizedState;
  const destroy = effect.destroy;

  // currentHook is null on initial mount when rerendering after
  // a render phase state update
  if (currentHook !== null) {
    if (nextDeps !== null) {
      const prevEffect: Effect = currentHook.memoizedState;
      const prevDeps = prevEffect.deps;
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        hook.memoizedState = pushEffect(HookPassive, destroy, create, nextDeps);
        return;
      }
    }
  }

  currentlyRenderingFiber!.flags |= PassiveEffect;
  hook.memoizedState = pushEffect(
    HookHasEffect | HookPassive,
    destroy,
    create,
    nextDeps
  );
}

const HookDispatcherOnMount = {
  useState: mountState,
  useEffect: mountEffect,
};

const HookDispatcherOnUpdate = {
  useState: updateState,
  useEffect: updateEffect,
};
