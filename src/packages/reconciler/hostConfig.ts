export function insertBefore(parent: Element, child: Element, before: Element) {
  parent.insertBefore(child, before);
}

export function appendChild(parent: Element, child: Element) {
  parent.appendChild(child);
}

export const removeChildFromContainer = (
  parentContainer: Element,
  child: Element
) => {
  parentContainer.removeChild(child);
};

export const supportsMutation = true;
