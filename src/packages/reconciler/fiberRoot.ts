import { initializeUpdateQueue } from "./classUpdateQueue";
import { createFiber, FiberRoot } from "./fiber";
import { HostRoot } from "./workTags";

export function createFiberRoot(containerInfo: Element): FiberRoot {
  const root: FiberRoot = {
    containerInfo,
    current: null as any,
    finishedWork: null,
    pendingLanes: 0,
  };

  const uninitializedFiber = createFiber(HostRoot, null, null, 0);

  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;

  initializeUpdateQueue(uninitializedFiber);

  return root;
}
