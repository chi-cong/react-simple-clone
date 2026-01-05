# Passive Effects (useEffect)

We have updated the DOM. Now it's time to run the "side effects" that the user requested via `useEffect`.

## What are "Passive" Effects?

"Passive" means they don't block the browser from painting. They run **asynchronously** after the commit phase is complete. This is crucial for performance—we don't want to freeze the UI while fetching data or logging analytics.

## Crucial Concept: Flags vs Tags

You might notice we have "Passive" defined in two places. It is vital not to confuse them!

### 1. Fiber Flags (`FiberFlags.Passive`)

- **Where**: Defined in [fiberFlags.ts](../src/packages/reconciler/fiberFlags.ts), lives on `fiber.flags`.
- **Purpose**: Marks the **Component (Fiber)** itself.
- **Meaning**: "This component _contains_ one or more effects that need to run."
- **Usage**: The committer checks this flag efficiently to decide whether to look at the `updateQueue`.

### 2. Hook Flags (`HookFlags.Passive`)

- **Where**: Defined in [effectTags.ts](../src/packages/reconciler/effectTags.ts), lives on `effect.tag` (inside the Update Queue).
- **Purpose**: Marks the **Specific Effect**.
- **Meaning**: "This specific `useEffect` call is passive."
- **Usage**: It distinguishes `useEffect` (Passive) from `useLayoutEffect` (Layout). We often combine it with `HasEffect` (e.g., `Passive | HasEffect`) to say "This is a passive effect AND it needs to run (deps changed)."

## Step 1: Scheduling (`commitRoot`)

Back in `workLoop.ts`, we saw that `commitRoot` doesn't run effects immediately. It **schedules** them.

```typescript
// workLoop.ts
function commitRoot(...) {
  // ... mutation work ...

  // Schedule effects to run "later"
  pendingEffectsRoot = root;
  pendingEffectsStatus = HAS_PENDING_EFFECTS;
}
```

In a real React environment, "later" means "in a new task" (via `Scheduler`). In our simplified clone, we process them in the _next_ `workLoop` tick or explicitly via `flushPassiveEffect`.

## Step 2: Flushing Effects

When we flush effects, we do it in two distinct passes:

1.  **Destroy (Unmount)**: Run the cleanup functions (`return () => { ... }`) from the _previous_ render.
2.  **Create (Mount)**: Run the effect functions (`useEffect(() => { ... })`) for the _current_ render.

```typescript
function flushPassiveEffect() {
  if (pendingEffectsStatus === NO_PENDING_EFFECTS) return;
  // 1. Cleanup first
  commitPassiveUnmountEffect(root.current);
  // 2. Then run new effects
  commitPassiveMountEffects(root, root.current);
}
```

## Step 3: Unmounting Effects (`commitPassiveUnmountEffect`)

Open [commitWork.ts](../src/packages/reconciler/commitWork.ts).

The unmount phase must happen _before_ the mount phase to ensure cleanups run before new effects setup.

```typescript
export function commitPassiveUnmountEffect(finishedWork: Fiber) {
  switch (finishedWork.tag) {
    case FunctionComponent:
      // 1. Traverse Children
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      // 2. Run Cleanup for Self
      if (finishedWork.flags & Passive) {
        commitHookPassiveUnmountEffects(
          finishedWork,
          HookPassive | HookHasEffect
        );
      }
      break;
    // ...
  }
}
```

### The Traversal & Deletions

The traversal (`recursivelyTraversePassiveUnmountEffects`) does two things:

1.  **Handle Deletions**: If a child was flagged for deletion during render (`ChildDeletion`), we must specifically hunt down all components inside that deleted branch and run their cleanup. This is handled by `commitPassiveUnmountInsideDeletedTree`.
2.  **Recurse Children**: It visits normal children to ensure deep-first unmounting.

### Processing the Queue (`commitHookPassiveUnmountEffects`)

React stores effects in a **circular linked list** on `fiber.updateQueue`:

- `updateQueue.lastEffect`: Points to the tail.
- `lastEffect.next`: Points to the head.

We iterate this list. If the effect tag matches, we execute the cleanup:

```typescript
const destroy = effect.destroy;
if (destroy !== undefined) {
  effect.destroy = undefined;
  destroy(); // <--- Run cleanup
}
```

## Step 4: Mounting Effects (`commitPassiveMountEffects`)

After all cleanups are done, we run the new effects.

```typescript
export function commitPassiveMountEffects(
  root: FiberRoot,
  finishedWork: Fiber
) {
  switch (finishedWork.tag) {
    case FunctionComponent:
      // 1. Traverse Children First
      recursivelyTraversePassiveMountEffects(root, finishedWork);
      // 2. Run Effect for Self
      if (finishedWork.flags & Passive) {
        commitHookPassiveEffectMount(HookPassive | HookHasEffect, finishedWork);
      }
      break;
    // ...
  }
}
```

### Processing the Queue (`commitHookPassiveEffectMount`)

We iterate the same circular list. This time, we run the `create` function and **save** the result as the `destroy` function for the next run.

```typescript
const create = effect.create;
effect.destroy = create(); // <--- Run effect & save cleanup
```

## Summary of the Full Render Cycle

1.  **Trigger**: `setState` or `render`.
2.  **Render Phase**:
    - `BeginWork`: Create Fibers.
    - `CompleteWork`: Create DOM nodes, bubble flags.
3.  **Commit Phase**:
    - `Mutation`: Apply changes to DOM (Insert/Delete/Update).
    - `Layout`: (Skipped).
    - **Passive Effects**: Run `useEffect` (Cleanup -> Create).

Congratulations! You have traced the entire lifecycle of a React update from start to finish.
