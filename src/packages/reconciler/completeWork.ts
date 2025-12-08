import { Fiber } from "./fiber";

export const completeUnitOfWork = (unitOfWork: Fiber) => {};

export const completeWork = (current: Fiber | null, workInProgress: Fiber) => {
  const newProps = workInProgress.pendingProps;
};
