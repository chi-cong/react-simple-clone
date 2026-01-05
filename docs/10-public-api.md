# Public API & Project Setup

We have built the entire engine. Now, how do we actually _use_ it?
How do we connect our `reconciler` code to a web page?

## 1. The Bridge: `fiberReconciler.ts`

Open [fiberReconciler.ts](../src/packages/reconciler/fiberReconciler.ts).

This file acts as the bridge between the **Public API** (what the user calls) and the **Internal Engine** (what we built).

It exposes two key functions:

### `createContainer`

This creates the `FiberRoot`—the absolute top of our tree. It takes a DOM element (the container) as an argument.

```typescript
export function createContainer(containerInfo: Element) {
  return createFiberRoot(containerInfo);
}
```

### `updateContainer`

This is called when you want to render something into that root. It creates an `Update` (just like `setState` does!) and schedules it on the `HostRoot` fiber.

```typescript
export function updateContainer(element: any, container: FiberRoot) {
  const root = enqueueUpdate(container.current, update, lane);
  scheduleUpdateOnFiber(root, container.current, lane);
}
```

## 1.1 The Host Update Queue: `classUpdateQueue.ts`

Open [classUpdateQueue.ts](../src/packages/reconciler/classUpdateQueue.ts).

While Function Components use `useState` (Hooks), the **HostRoot** uses a different queue implementation. The name `classUpdateQueue` is historical because React uses this same structure for Class Components, but here we use it to manage the Root's state.

> **Note**: Roughly speaking, `updateContainer` puts work _into_ this queue, and `beginWork` (Chapter 3) takes work _out_ of it via `processUpdateQueue`.

### Structure

It uses a **circular linked list** stored in a `shared` object.

```typescript
export type UpdateQueue<State> = {
  baseState: State;
  shared: {
    pending: Update<State> | null; // Circular list
  };
};
```

### Enqueuing (`enqueueUpdate`)

When `updateContainer` is called (via `root.render`), it creates an update and pushes it here.

```typescript
export function enqueueUpdate(fiber, update, lane) {
  const shared = fiber.updateQueue.shared;
  // ... pointer manipulation to append to circular list ...
  shared.pending = update;
}
```

### Processing (`processUpdateQueue`)

During the **Render Phase** (`beginWork`), we call `processUpdateQueue` for the HostRoot. It iterates through the pending updates and calculates the new state (the new `element` tree).

## 2. The Public API: `dom-client`

Open [dom-client/index.ts](../src/packages/dom-client/index.ts).

This is the package the user actually imports (like `react-dom/client`). It exposes `createRoot`.

```typescript
export function createRoot(container: HTMLElement) {
  const root = createContainer(container); // Call the bridge
  return {
    render(element: any) {
      updateContainer(element, root); // Call the bridge
    },
  };
}
```

## 3. The Object (`React`)

We also export the `RSC` object (React Simple Clone) which mimics the `React` object.
It exports `createElement` and our Hooks.

```typescript
export const RSC = {
  createElement: (type, props, ...children) => { ... },
};
export const useState = ...
export const useEffect = ...
```

## 4. Building the Project (Setup)

To make this run in a browser, we need two things:

### JSX Transformation

Browsers don't understand `<div />`. We need a build tool (like Vite or generic `tsc`) to transform JSX into `RSC.createElement(...)` calls.

In `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "RSC.createElement",
    "jsxFragmentFactory": "RSC.Fragment"
  }
}
```

**TypeScript Support (`jsx.d.ts`)**:
Even with the config above, TypeScript will complain about standard HTML tags (like `<div />`) because it doesn't know they are valid "RSC" elements.
We include `src/jsx.d.ts` to define the `JSX.IntrinsicElements` interface, telling TypeScript: "Yes, 'div' is a valid element, and it accepts these props."

### The ESM Challenge (`add-extensions.js`)

We are building for the browser using native ES Modules (ESM).

- **Browser Requirement**: Imports _must_ include the file extension: `import { Fiber } from './fiber.js'`.
- **TypeScript Behavior**: `tsc` outputs JS but _refuses_ to add `.js` extensions to imports. It keeps them as `import ... from './fiber'`.

This leads to 404 errors in the browser.
To fix this, we run a custom script `scripts/add-extensions.js` after the build. It scans the `.dist` folder and explicitly adds `.js` to every relative import path.

## Conclusion

We have traveled from the deepest internals of the `WorkLoop` all the way out to the `createRoot` call in the user's application.

You have now built a working, simplified clone of React.

- **Reconciler**: The engine (Fiber, Diffing, Commit).
- **Renderer**: The host config (DOM operations).
- **Public API**: The entry point (`createRoot`, Hooks).

That's it! That's how you can build a React clone. Whether you want to contribute to JS frameworks, create your own framework, impress interviewers, or just being curious how React works, I hope you find this helpful.
