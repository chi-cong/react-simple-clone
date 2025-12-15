import { Fiber } from "./fiber";

export const completeUnitOfWork = (unitOfWork: Fiber) => {};

// these config can be found in ReactFiberConfigDOM.js
export const supportsMutation = true;
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
  src?: string | Blob | MediaSource | MediaStream; // TODO: Response
  srcSet?: string;
  loading?: "eager" | "lazy";
  onLoad?: (event: any) => void;
};

export function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  type: Type,
  newProps: Props
) {
  // mimic source code, supportsMutation config is true for DOM
  if (supportsMutation) {
  }
  return workInProgress.child;
}

export const completeWork = (current: Fiber | null, workInProgress: Fiber) => {
  const newProps = workInProgress.pendingProps;
};
