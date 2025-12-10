export type Flags = number;

// Represents no side effect.
export const NoFlags = /*         */ 0b000000000000000000;

// Represents a fiber that needs to be inserted into the DOM.
export const Placement = /*       */ 0b000000000000000001;

// Represents a fiber whose props or state have changed.
export const Update = /*          */ 0b000000000000000010;

// Represents a fiber that needs to be removed from the DOM.
export const Deletion = /*        */ 0b000000000000000100;

export const ChildDeletion = /*   */ 0b0000000000000000000000000010000;

// TODO: Add more flags as you expand functionality.
// For example:
// - ChildDeletion: To track when a child has been deleted.
// - Ref: To handle attaching/detaching refs.
// - Hydrating: For server-side rendering.
