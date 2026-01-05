# React Simple Clone Architecture Guide

Welcome to the architectural documentation for React Simple Clone. This guide is designed to walk you through the codebase by explaining the core concepts and phases of the React rendering engine.

> **Note**: This documentation reflects my personal learning and understanding of React's architecture. It may not perfectly align with the official React implementation or the exact mental models used by the React core team.

## Prerequisites

You should already familiar with the basics of React and React concepts. Also it's good to have a basic understanding of the React Fiber architecture. You could read [this article](https://blog.ag-grid.com/inside-fiber-an-in-depth-overview-of-the-new-reconciliation-algorithm-in-react/) to get a better understanding of the Fiber architecture or many other online articles explaining the Fiber architecture.

## Table of Contents

### Part 1: Core Structure & Implementation

- **[Our Fiber Implementation](./01-fiber-implementation.md)**
  - The specific `Fiber` interface in `fiber.ts`
  - The `current` vs `workInProgress` trees
- **[The Scheduler & Work Loop](./02-work-loop.md)**
  - How `workLoop` drives the engine in _synchronous_ mode
  - `performUnitOfWork` implementation basics

### Part 2: The Render Phase (Reconciliation)

- **[Begin Work](./03-begin-work.md)**
  - The "downward" pass
  - Creating and updating children
- **[Child Reconciliation](./04-reconciliation.md)**
  - The diffing algorithm
  - Handling lists and keys
- **[Complete Work](./05-complete-work.md)**
  - The "upward" pass
  - Creating DOM instances and bubbling flags

### Part 3: The Commit Phase

- **[Mutation Effects](./06-commit-phase.md)**
  - Applying changes to the real DOM
- **[Passive Effects](./07-passive-effects.md)**
  - `useEffect` scheduling and flushing
  - Mount vs Unmount phases

### Part 4: State & Logic

- **[Hooks Implementation](./08-hooks-implementation.md)**
  - How hooks are stored (Linked Lists)
  - `renderWithHooks` and the Cursor
  - `useState` implementation (Mount vs Update)
- **[Scheduling & The Trigger](./09-scheduling.md)**
  - `scheduleUpdateOnFiber`: The "Big Bang"
  - `performSyncWorkOnRoot`: The Orchestrator
  - The Full Cycle of Life

### Part 5: Public API & Setup

- **[Public API & Setup](./10-public-api.md)**
  - Connecting `reconciler` to `dom-client`
  - `createRoot` and `fiberReconciler.ts`
  - JSX & Build Configuration
