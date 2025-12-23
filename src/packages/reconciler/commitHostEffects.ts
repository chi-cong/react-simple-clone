import { Fiber } from "./fiber";
import { Placement } from "./fiberFlags";
import { appendChild, insertBefore } from "./hostConfig";
import { HostComponent, HostRoot, HostText } from "./workTags";

function insertOrAppendPlacementNode(
  node: Fiber,
  before: Element | null,
  parent: Element
) {
  const { tag } = node;
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost) {
    const stateNode = node.stateNode;
    if (before) {
      insertBefore(parent, stateNode, before);
    } else {
      appendChild(parent, stateNode);
    }
    return;
  }
  const child = node.child;
  if (child !== null) {
    insertOrAppendPlacementNode(child, before, parent);
    let letSibling = child.sibling;
    while (letSibling !== null) {
      insertOrAppendPlacementNode(letSibling, before, parent);
      letSibling = letSibling.sibling;
    }
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

    while (node.tag !== HostComponent && node.tag !== HostText) {
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
  let parent;
  if (hostParentFiber!.tag === HostComponent) {
    parent = hostParentFiber!.stateNode;
  } else {
    // HostRoot
    parent = hostParentFiber!.stateNode.containerInfo;
  }
  insertOrAppendPlacementNode(finishedWork, before, parent);
}
