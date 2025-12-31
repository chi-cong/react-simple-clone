# Fiber Implementation

## Define Fiber Interface

Open [fiber.ts](../src/packages/reconciler/fiber.ts) file, you will see the `Fiber` interface.

- `tag`: The type of the fiber, such as `HostComponent`, `FunctionComponent` or `HostRoot`.
- `key`: The key of the fiber, used for reconciliation.
- `type`: The DOM type of the fiber, such as 'div', 'p', 'button' or a function.
- `stateNode`: The DOM node associated with the fiber.
- `return`: A reference to the parent fiber.
- `child`: A reference to the first child fiber.
- `sibling`: A reference to the next sibling fiber.
- `alternate`: If you ever study about Computer graphics, you will know about double buffering. React use this technique to avoid visual artifacts during updates.\
  In short, the current fiber is the fiber that is currently being rendered, and the alternate fiber is the fiber that is being used to render the next update.

### What's the meaning of each tag ?

Take a look at [workTags.ts](../src/packages/reconciler/workTags.ts), you will see the `WorkTag` enum.

- `HostRoot`: The root of a React tree.
- `HostComponent`: A DOM element like 'div', 'p', etc.
- `HostText`: A text node.
- `FunctionComponent`: A function component.

### What's the meaning of each flag ?

Take a look at [fiberFlags.ts](../src/packages/reconciler/fiberFlags.ts), you will see the `FiberFlag` enum.

- `NoFlags`: No flags.
- `Placement`: The fiber is being placed in the DOM.
- `Update`: The fiber is being updated.
- `Deletion`: The fiber is being deleted.

### Why does React use bitwise ?

Bitwise operations are faster than other operations. It seems hard to read at first, but you will soon get used to it.

For other fields in fiber and flags/tags, I'll explain them in later chapters

## Element

This is how JSX looks like in after being transpiled.

- `type`: The type of the element, such as 'div', 'p', 'button' or a function.
- `key`: The key of the element, used for reconciliation.
- `props`: The props of the element.

## Fiber helpers

- `createFiber`: Create a new fiber.
- `createFiberFromElement`: Create a new fiber from an element.
- `createWorkInProgress`: Create a new work in progress fiber. This is the `alternate` fiber of the current fiber. It tries to reuse the existing alternate instead of creating a new one to save memory.
