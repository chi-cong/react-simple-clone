import { Fiber } from "./fiber";

let didScheduleRenderPhase = false;

export const renderWithHooks = (
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  props: any
) => {
  didScheduleRenderPhase = false;
  return Component(props);
};
