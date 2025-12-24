import { createUpdate, enqueueUpdate } from "./classUpdateQueue";
import { FiberRoot } from "./fiber";
import { createFiberRoot } from "./fiberRoot";
import { scheduleUpdateOnFiber } from "./workLoop";

export function createContainer(containerInfo: Element) {
  return createFiberRoot(containerInfo);
}

export function updateContainer(element: any, container: FiberRoot) {
  const current = container.current;

  const lane = 1;
  const update = createUpdate(lane);
  update.payload = { element };

  const root = enqueueUpdate(current, update, lane);
  if (root !== null) {
    scheduleUpdateOnFiber(root, current, lane);
  }

  return lane;
}
