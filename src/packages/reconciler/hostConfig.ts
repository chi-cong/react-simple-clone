export function insertBefore(parent: Element, child: Element, before: Element) {
  parent.insertBefore(child, before);
}

export function appendChild(parent: Element, child: Element) {
  parent.appendChild(child);
}

export function removeChildFromContainer(
  parentContainer: Element,
  child: Element
) {
  parentContainer.removeChild(child);
}

export function commitTextUpdate(textInstance: Element, newText: string) {
  textInstance.textContent = newText;
}

const isEvent = (key: string) => key.startsWith("on");
const isStyle = (key: string) => key === "style";
const isChildren = (key: string) => key === "children";
// Properties that are not events, styles, or children
const isProperty = (key: string) =>
  !isEvent(key) && !isStyle(key) && !isChildren(key);

export function commitUpdate(dom: Element, nextProps: any, prevProps: any) {
  // Get or create a map to store the actual attached listeners
  const domAny = dom as any;
  if (!domAny.__eventListeners) {
    domAny.__eventListeners = {};
  }
  const listeners = domAny.__eventListeners;

  // 1. Remove old event listeners using the ACTUALLY attached reference
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || prevProps[key] !== nextProps[key])
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      const actualListener = listeners[name];
      if (actualListener) {
        dom.removeEventListener(eventType, actualListener);
        delete listeners[name];
      }
    });

  // 2. Add new event listeners and store the reference
  Object.keys(nextProps)
    .filter(isEvent)
    .filter((key) => prevProps[key] !== nextProps[key])
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
      listeners[name] = nextProps[name]; // Store the actual attached reference
    });

  // 3. Remove deleted properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter((key) => !(key in nextProps))
    .forEach((name) => {
      (dom as any)[name] = "";
    });

  // 4. Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter((key) => prevProps[key] !== nextProps[key])
    .forEach((name) => {
      (dom as any)[name] = nextProps[name];
    });

  // 5. Handle Style updates
  // (A robust implementation would diff individual style keys)
  if (prevProps.style || nextProps.style) {
    const prevStyle = prevProps.style || {};
    const nextStyle = nextProps.style || {};

    // Remove old styles
    Object.keys(prevStyle).forEach((styleName) => {
      if (!(styleName in nextStyle)) {
        (dom as HTMLElement).style[styleName as any] = "";
      }
    });

    // Add new styles
    Object.keys(nextStyle).forEach((styleName) => {
      if (prevStyle[styleName] !== nextStyle[styleName]) {
        (dom as HTMLElement).style[styleName as any] = nextStyle[styleName];
      }
    });
  }
}

export function finalizeInitialChildren(
  domElement: Element,
  type: string,
  props: any
) {
  commitUpdate(domElement, props, {});

  // If there are actions that only happens after
  // the element being attached to the DOM, return false
  switch (type) {
    case "button":
    case "input":
    case "select":
    case "textarea":
      return !!props.autoFocus;
    case "img":
      return true;
    default:
      return false;
  }
}

export function createInstance(type: string, newProps: any) {
  const dom = document.createElement(type);
  commitUpdate(dom, newProps, {});
  return dom;
}

export function createTextInstance(newText: string) {
  return document.createTextNode(newText);
}

export const supportsMutation = true;
