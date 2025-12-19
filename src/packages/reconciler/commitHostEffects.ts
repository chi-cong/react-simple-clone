import { Fiber } from "./fiber";
import { Placement } from "./fiberFlags";
import { HostComponent, HostRoot } from "./workTags";

function insertOrAppendPlacementNode(
  node: Fiber,
  before: Element | null,
  parent: Element
) {
  const { tag } = node;
  const isHost = tag === HostComponent || tag === HostRoot;
  if (isHost) {
    const stateNode = node.stateNode;
    if (before) {
      parent.insertBefore(stateNode, before);
    } else {
      parent.appendChild(stateNode);
    }
  } else {
  }
}

function getHostSibling(fiber: Fiber) {
  let node: Fiber = fiber;

  siblings: while (true) {
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        return null;
      }
      node = node.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;

    while (node.tag !== HostComponent && node.tag !== HostRoot) {
      if (node.flags & Placement) {
        continue siblings;
      }
      if (node.child === null) {
        continue siblings;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }
    if (!(node.flags & Placement)) {
      // Found it!
      return node.stateNode;
    }
  }
}

function isHostParent(fiber: Fiber) {
  return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

export function commitPlacement(finishedWork: Fiber) {
  let hostParentFiber;
  let parentFiber = finishedWork.return;
  while (parentFiber !== null) {
    if (isHostParent(parentFiber)) {
      hostParentFiber = parentFiber;
      break;
    }
    parentFiber = parentFiber.return;
  }

  if (hostParentFiber === null) {
    throw new Error("Bug: No host parent found");
  }

  const before = getHostSibling(finishedWork);
  const parent = hostParentFiber!.stateNode;
  insertOrAppendPlacementNode(finishedWork, before, parent);
}
