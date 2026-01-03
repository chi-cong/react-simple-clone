import { Fiber } from "./fiber";
import { NoFlags, Update } from "./fiberFlags";
import {
  appendChild,
  createInstance,
  createTextInstance,
  finalizeInitialChildren,
} from "./hostConfig";
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./workTags";

export type Type = string;
export type Props = {
  autoFocus?: boolean;
  children?: any;
  disabled?: boolean;
  hidden?: boolean;
  suppressHydrationWarning?: boolean;
  dangerouslySetInnerHTML?: any;
  style?: {
    display?: string;
    viewTransitionName?: string;
    "view-transition-name"?: string;
    viewTransitionClass?: string;
    "view-transition-class"?: string;
    margin?: string;
    marginTop?: string;
    "margin-top"?: string;
    marginBottom?: string;
    "margin-bottom"?: string;
  };
  bottom?: null | number;
  left?: null | number;
  right?: null | number;
  top?: null | number;
  is?: string;
  size?: number;
  value?: string;
  defaultValue?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  multiple?: boolean;
  src?: string | Blob | MediaSource | MediaStream;
  srcSet?: string;
  loading?: "eager" | "lazy";
  onLoad?: (event: any) => void;
};

export function updateHostComponent(
  current: Fiber,
  workInProgress: Fiber,
  type: Type,
  newProps: Props
) {
  const oldProps = current.memoizedProps;
  if (oldProps === newProps) return;
  workInProgress.flags |= Update;
}

function bubbleProperties(completedWork: Fiber) {
  let subtreeFlags = NoFlags;

  let child = completedWork.child;
  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;

    child.return = completedWork;
    child = child.sibling;
  }
  completedWork.subtreeFlags |= subtreeFlags;
}

function appendAllChildren(parent: Element, workInProgress: Fiber) {
  let node = workInProgress.child;
  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      // append when founding physical node

      // React use appendInitialChildren, but for DOM it's identical to appendChild
      appendChild(parent, node.stateNode);
    } else if (node.child !== null) {
      // found a component, drill down to find its physical children.
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === workInProgress) return;

    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) return;
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}

export const completeWork = (current: Fiber | null, workInProgress: Fiber) => {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case FunctionComponent:
      bubbleProperties(workInProgress);
      return null;
    case HostComponent:
      const type = workInProgress.type;
      if (current !== null && workInProgress.stateNode !== null) {
        updateHostComponent(current, workInProgress, type, newProps);
      } else {
        if (!newProps) {
          bubbleProperties(workInProgress);
          return;
        }
        const instance = createInstance(type, newProps);
        appendAllChildren(instance, workInProgress);
        workInProgress.stateNode = instance;
        if (finalizeInitialChildren(instance, type, newProps))
          workInProgress.flags |= Update;
      }
      bubbleProperties(workInProgress);
      return null;
    case HostText:
      const newText = newProps;
      if (current !== null && workInProgress.stateNode !== null) {
        const oldText = current.memoizedProps;
        if (newText !== oldText) workInProgress.flags |= Update;
      } else {
        workInProgress.stateNode = createTextInstance(newText);
      }
      bubbleProperties(workInProgress);
      return null;
    case HostRoot:
      bubbleProperties(workInProgress);
  }
};
