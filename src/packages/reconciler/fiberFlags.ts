export type Flags = number;

// Represents no side effect.
export const NoFlags = /*         */ 0b000000000000000000;
export const PerformedWork = /*   */ 0b0000000000000000000000000000001;
export const Placement = /*       */ 0b0000000000000000000000000000010;
export const ChildDeletion = /*   */ 0b0000000000000000000000000010000;
export const Update = /*          */ 0b000000000000000010;

// TODO: Add more flags as you expand functionality.
// For example:
// - ChildDeletion: To track when a child has been deleted.
// - Ref: To handle attaching/detaching refs.
// - Hydrating: For server-side rendering.
