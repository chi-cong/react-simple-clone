export type Flags = number;

// Represents no side effect.
export const NoFlags = /*         */ 0b0000000000000000000000000000000;
export const PerformedWork = /*   */ 0b0000000000000000000000000000001;
export const Placement = /*       */ 0b0000000000000000000000000000010;
export const ChildDeletion = /*   */ 0b0000000000000000000000000010000;
export const Update = /*          */ 0b0000000000000000000000000000100;
