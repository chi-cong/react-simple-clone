# Hooks Implementation

Hooks are the magic that allows functional components to have state and side effects. But purely functional components are stateless—so where is the data stored?

It's stored in the **Fiber**.

## The Data Structures

Open [fiberHooks.ts](../src/packages/reconciler/fiberHooks.ts).

To understand how hooks work, we must understand the three core types that power them: `Hook`, `Update`, and `Effect`.

### 1. The Hook (`Hook`)

This is the base unit. Each `useState` or `useEffect` call creates one `Hook` object, which are linked together in a list (`memoizedState`).

```typescript
export type Hook = {
  memoizedState: any; // Current value (state)
  baseState: any; // Baseline state before updates
  baseQueue: Update<any, any> | null;
  queue: any; // The UpdateQueue
  next: Hook | null; // Pointer to the next hook
};
```

### 2. The Update (`Update<S, A>`)

This represents a **single request** to change state (e.g., calling `setState(5)`).

```typescript
export type Update<S, A> = {
  lane: number; // Priority (sync vs async)
  action: A; // The new value or function (prevent => prev + 1)
  next: Update<S, A>; // Pointer to next update
};
```

_Note: In complex React, this also includes `eagerState` for optimization, but we removed it for simplicity._

### 3. The Update Queue (`UpdateQueue<S, A>`)

This structure manages the pending updates for a hook. It's attached to `hook.queue`.

```typescript
export type UpdateQueue<S, A> = {
  pending: Update<S, A> | null; // Circular linked list of updates
  dispatch: ((action: A) => any) | null; // The setState function itself
};
```

### 4. The Effect (`Effect`)

Used by `useEffect`. This represents a side effect that needs to run after commit.

```typescript
export type Effect = {
  tag: HookFlags; // Passive, Layout, etc.
  create: () => (() => void) | void; // The function you passed to useEffect
  destroy: (() => void) | void; // The cleanup function returned
  deps: unknown[] | null; // Dependency array
  next: Effect | null; // Pointer to next effect (circular list)
};
```

## The Cursor: `renderWithHooks`

How does React know which hook matches which `useState` call?
It uses a global cursor variable.

1.  **Reset**: Before rendering a component, `renderWithHooks` resets `workInProgressHook` to null.
2.  **Advance**: Every time valid `useState` or `useEffect` is called, we advance the cursor to the next hook in the list.
3.  **Persistence**:
    - **Mount**: We create new hook objects and append them to the list.
    - **Update**: We reuse existing hook objects from the `current` fiber (`currentHook`).

This logic is why **Hooks Rules** exist (don't call hooks inside loops/conditions). If the order changes, the cursor will point to the wrong hook!

## The Bridge: `SharedInternals`

You might wonder: "How does the `react` package (where `useState` is imported from) know about the `reconciler` package (where the logic lives)?"

The answer is **SharedInternals**.

This is a singleton object that acts as a bridge. The Reconciler "injects" the implementation (the dispatcher) into `SharedInternals.Hook`.

- **Why?** This decouples the API (`react`) from the implementation (`react-dom`, `react-native`). The same `useState` function works everywhere because the _renderer_ injects the correct logic at runtime.

## `useState` Implementation

We have two implementations depending on the phase:

### Why "Reducer"? (`basicStateReducer`)

Internally, `useState` is just a simplified `useReducer`. It uses a pre-defined reducer called `basicStateReducer`:

```typescript
function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  return typeof action === "function"
    ? (action as (state: S) => S)(state)
    : action;
}
```

This simple function handles the two ways you can call `setState`:

1.  **Direct Value**: `setState(5)` -> `action` is `5`, returns `5`.
2.  **Functional Update**: `setState(prev => prev + 1)` -> `action` is a function, calls it with current state.

### 1. `mountState` (Initial Render)

1.  Creates a new Hook object.
2.  Sets `memoizedState` to `initialState`.
3.  Creates an **Update Queue** for this hook.
4.  Binds the `dispatch` function (the "setState" function) to this specific fiber and queue.

### 2. `updateState` (Re-renders)

1.  Finds the existing hook using the cursor.
2.  **Process Updates**: It checks the `queue.pending`.
3.  It loops through all pending updates (e.g., `setState(c => c+1)`) and applies them to calculate the new `memoizedState`.
4.  Returns the new state.

## `useEffect` Implementation

Effects are slightly different. They don't just store state; they need to be executed later.

### The Effect List (`updateQueue`)

The Fiber has _another_ field called `updateQueue`. For Function Components, this stores a **Circular Linked List** of effects.

### `pushEffect`

When you call `useEffect`:

1.  We create an `Effect` object.
2.  We append it to the fiber's `updateQueue`.
3.  We start tracking dependencies (`deps`).

### Mount vs Update

- **Mount**: Always add the effect.
- **Update**: Compare `deps` with `prevDeps`.
  - If they are equal: Add the effect but **don't** mark it as needing execution (`HookPassive`).
  - If different: Add the effect and mark it with `HookHasEffect`.

## Dispatching Updates (`dispatchSetState`)

This is the function returned by `useState`. We'll cover how this triggers a re-render in the next chapter (**scheduling**).
For now, know that it:

1.  Creates an update object.
2.  Adds it to the hook's queue.
3.  Calls `scheduleUpdateOnFiber` to tell React "Something changed!".
