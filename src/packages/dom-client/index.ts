import {
  createContainer,
  updateContainer,
} from "../reconciler/fiberReconciler";

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
