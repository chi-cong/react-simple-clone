// updateQueue.ts
import { Fiber } from "./fiber";
import { markUpdateLaneFromFiberToRoot } from "./workLoop";

export type Update<State> = {
  /**
   * The actual data change.
   * For HostRoot, this is the { element } object.
   * For Components, this is the partial state or state updater function.
   */
  lane: number;
  payload: any;
  next: Update<State> | null;
};

export type UpdateQueue<State> = {
  /**
   * The state at the beginning of the render.
   */
  baseState: State;

  /**
   * The "Inbox".
   * This is where new updates (from root.render or setState) land.
   * It is "shared" because it's accessed by both the UI and the Render Loop.
   */
  shared: {
    pending: Update<State> | null;
  };
};

export function createUpdate(lane: number): Update<unknown> {
  const update: Update<unknown> = {
    lane,
    payload: null,
    next: null,
  };
  return update;
}

export function enqueueUpdate<State>(
  fiber: Fiber,
  update: Update<State>,
  lane: number
) {
  const updateQueue = fiber.updateQueue;
  if (updateQueue === null) return null;
  const shared = updateQueue.shared;
  const pending = shared.pending;

  if (pending === null) {
    // This is the first update. Create a circular list.
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }

  shared.pending = update;
  return markUpdateLaneFromFiberToRoot(fiber, lane);
}

export function initializeUpdateQueue<State>(fiber: Fiber): void {
  const queue: UpdateQueue<State> = {
    baseState: fiber.memoizedState,
    shared: {
      pending: null,
    },
  };

  fiber.updateQueue = queue;
}

export function processUpdateQueue<State>(workInProgress: Fiber) {
  const queue: UpdateQueue<State> = workInProgress.updateQueue;
  let pendingQueue = queue.shared.pending;
  if (pendingQueue !== null) {
    queue.shared.pending = null;

    // The pending queue is circular. Disconnect the pointer between first
    // and last so that it's non-circular.
    const lastPendingUpdate = pendingQueue;
    const firstPendingUpdate = lastPendingUpdate.next;
    lastPendingUpdate.next = null;

    let newState = queue.baseState;
    let update = firstPendingUpdate;

    while (update !== null) {
      const payload = update.payload;
      let partialState;

      if (typeof payload === "function") {
        partialState = payload(newState);
      } else {
        partialState = payload;
      }
      newState = { ...newState, ...partialState };
      update = update.next;
    }

    workInProgress.memoizedState = newState;
    queue.baseState = newState;
  }
}
