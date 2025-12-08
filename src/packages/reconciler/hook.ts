import { Fiber } from "./fiber";

let currentlyRenderingFiber: any = null;

export const renderWithHooks = (
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  props: any,
  secondArg: any
) => {
  currentlyRenderingFiber = workInProgress;
  workInProgress.memoizedState = null;
  return Component(props, secondArg);
};
