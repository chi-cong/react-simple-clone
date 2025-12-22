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
  // 1. Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || prevProps[key] !== nextProps[key])
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // 2. Add new event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter((key) => prevProps[key] !== nextProps[key])
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
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

export const supportsMutation = true;
