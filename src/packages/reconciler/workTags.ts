export type WorkTag =
  | typeof FunctionComponent
  | typeof HostRoot
  | typeof HostComponent
  | typeof HostText;

export const FunctionComponent = 0;
export const HostRoot = 3; // The root of a React tree.
export const HostComponent = 5; // A DOM element like 'div', 'p', etc.
export const HostText = 6; // A text node.
