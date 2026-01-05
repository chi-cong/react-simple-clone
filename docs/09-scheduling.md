# Scheduling & The Trigger

In Chapter 1, we learned about the `workLoop`.
In Chapter 2-7, we learned how to Render, Commit, and Run Effects.
In Chapter 8, we learned how `setState` queues updates.

But... what connects `setState` (Chapter 8) to `workLoop` (Chapter 1)?
What actually _pushes the button_ to start the machine?

That is the **Scheduler**.

## The Entry Point: `scheduleUpdateOnFiber`

Open [workLoop.ts](../src/packages/reconciler/workLoop.ts).

This function is the "Big Bang". It is called whenever something changes (via `setState` or `root.render`). The name `schedule` is bit misleading, because it execute updates immediately. React updates are asynchronous so that's why it's named like this. I keep the original name because I want you can easily locate the function in React source code if you want to know how it actually works in real React.

```typescript
export function scheduleUpdateOnFiber(
  root: FiberRoot,
  fiber: Fiber,
  lane: number
) {
  // 1. Mark the root as having pending work
  root.pendingLanes = mergeLanes(root.pendingLanes, lane);
  // 2. Ensure the root is scheduled to run
  ensureRootIsScheduled(root);
}
```

### Finding the Root (`markUpdateLaneFromFiberToRoot`)

Before calling schedule, we need to know _which_ root to schedule. `setState` happens on a component strictly deep in the tree.
We traverse up using `return` pointers until we hit `HostRoot`.

## The Scheduler: `ensureRootIsScheduled`

In real React, this is where the `Scheduler` package comes in. It decides _when_ to run the callback (immediately? next frame? in 5 seconds?).

In our clone, we simplify this to be **Synchronous**:

```typescript
function ensureRootIsScheduled(root: FiberRoot) {
  performSyncWorkOnRoot(root); // <--- RUN NOW!
}
```

## The Execution: `performSyncWorkOnRoot`

This is the function that orchestrates the entire lifecycle we've documented.

```typescript
function performSyncWorkOnRoot(root: FiberRoot) {
  // 1. Render Phase (Chapters 3-5)
  let exitStatus = renderRootSync(root);

  // 2. Commit Phase (Chapter 6)
  const finishedWork = root.current.alternate;
  commitRoot(root, finishedWork);

  // 3. Passive Effects (Chapter 7)
  flushPassiveEffect();
}
```

### Critical: Why `flushPassiveEffect` here?

This line answers a bug we previously encountered: _"Why didn't my effects run on the first render?"_

1.  `renderRootSync` runs.
2.  `commitRoot` runs. Inside it, we populate `pendingEffectsRoot` and set the status to `HAS_PENDING_EFFECTS`. **But we don't run them yet!**
3.  `commitRoot` finishes.
4.  **`performSyncWorkOnRoot` calls `flushPassiveEffect()`**.

This ensures that _immediately_ after the DOM is updated, we flush the pending effects.

## The Cycle of Life

1.  **User Trigger**: User clicks button -> `setState`.
2.  **Queue**: `dispatchSetState` creates an Update and queues it.
3.  **Schedule**: `scheduleUpdateOnFiber` -> `ensureRootIsScheduled`.
4.  **Render**: `workLoop` processes the fibers, calculating the new tree.
5.  **Commit**: DOM is updated. Effects are scheduled.
6.  **Passive**: Effects run.
    - If an effect calls `setState`... GOTO Step 1!

Congratulations! You now understand the complete architecture of React.
