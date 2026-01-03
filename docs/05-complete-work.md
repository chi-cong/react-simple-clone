# Complete Work

We have reached the "upward" phase of the traversal. While `beginWork` drills down, `completeWork` bubbles up.
This is where we **create the real DOM nodes** (but don't attach them to the document yet).

## The Goal

1.  **Create DOM Instances**: For `HostComponent` (`div`, `span`), create the actual `HTMLElement`.
2.  **Append Children**: Connect these new DOM nodes to build a detached DOM tree.
3.  **Diff Props**: If it's an update, check if attributes (like `className` or `style`) changed.
4.  **Bubble Flags**: Aggregate "side effect" flags from children to parents, so the root knows if _anything_ in the subtree needs an update.

## The Host Config Pattern

React is designed to be **platform agnostic**. The logic for diffing fibers (reconciliation) is the same whether you use React for Web, React Native, or a custom Terminal renderer.

To achieve this, React keeps the "host" logic (the part that actually touches the platform) in a separate file called `HostConfig`.

If you look at the [actual React source code](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberConfig.js), you might be surprised to see it's just an empty file with a throw error.

```javascript
// ReactFiberConfig.js in source
throw new Error("This module must be shimmed by a specific renderer.");
```

This is because `HostConfig` is **dependency injected** at build time. When you build `react-dom`, it swaps this file with `ReactFiberConfig.dom.js`. When you build `react-native`, it swaps it with the Native version.

**In our project**:
Since we are building a cloned `react-dom`, we simply hardcoded our `hostConfig.ts` to use browser DOM methods. You can see how React implements this part [here](https://github.com/facebook/react/blob/main/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js). We don't have to do exactly how React does it, we'll do it in a simple way but still get the job done.

### Key Host Config Methods

- `createInstance(type, props)`: `document.createElement(type)`.
- `appendChild(parent, child)`: `parent.appendChild(child)`.
- `finalizeInitialChildren(dom, type, props)`:
  - This sets initial attributes (`className`, `style`) via `commitUpdate`.
  - **Crucially**, it returns `true` if the element needs "auto-focus" or special handling _after_ insertion into the document.

## The Entry Point

Open [completeWork.ts](../src/packages/reconciler/completeWork.ts).

The `completeWork` function switches on the fiber tag, just like `beginWork`.

```typescript
export const completeWork = (current, workInProgress) => {
  switch (workInProgress.tag) {
    case FunctionComponent:
      bubbleProperties(workInProgress);
      return null;
    case HostComponent:
      // ... (Create or Update DOM)
      return null;
    case HostText:
      // ... (Create Text Node)
      return null;
  }
};
```

## Creating DOM Nodes (Mounting)

If `current` is null, we are mounting a new component.

1.  **Create Instance**: We call `createInstance` (wrapping `document.createElement`).
2.  **Append All Children**: This is crucial! We loop through the fiber's children (which are already completed because we are moving _up_ the tree) and append their DOM nodes to our new instance.
    - _Result_: A little detached DOM tree for this component.
3.  **Assign to StateNode**: We store the DOM element in `workInProgress.stateNode`.

```typescript
const instance = createInstance(type, newProps);
appendAllChildren(instance, workInProgress);
workInProgress.stateNode = instance;
```

## Updating DOM Nodes

If `current` exists, we check if props changed.

```typescript
const oldProps = current.memoizedProps;
if (oldProps === newProps) return;
workInProgress.flags |= Update;
```

## Bubbling Flags (`bubbleProperties`)

This is a vital optimizations. We merge all flags from the children into the parent's `subtreeFlags`.

- **Why?** So the root knows instantly if _any_ descendant needs work.
- **How?** Bitwise OR (`|=`).

```typescript
let subtreeFlags = NoFlags;
// Loop through children...
subtreeFlags |= child.subtreeFlags;
subtreeFlags |= child.flags;

completedWork.subtreeFlags |= subtreeFlags;
```

## Key Takeaway

By the time `completeUnitOfWork` finishes for the Root Fiber:

1.  We have a complete **Fiber Tree**.
2.  We have a parallel **Detached DOM Tree** (linked via `stateNode`).
3.  We have a list of **Side Effects** (creation, updates, deletions) ready for the Commit Phase.
