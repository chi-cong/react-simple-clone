import {
  createContainer,
  updateContainer,
} from "../reconciler/fiberReconciler";
import SharedInternals from "../reconciler/sharedInternals";

export function createRoot(container: HTMLElement) {
  const root = createContainer(container);
  return {
    render(element: any) {
      updateContainer(element, root);
    },
  };
}

export const RSC = {
  createElement: (type: any, props: any, ...children: any[]) => {
    return {
      type,
      props: {
        ...props,
        children: children.length === 1 ? children[0] : children,
      },
    };
  },
};

export const useState = (
  initialState: (() => any) | any
): [any, (action: any) => void] => {
  return SharedInternals.Hook.useState(initialState);
};
