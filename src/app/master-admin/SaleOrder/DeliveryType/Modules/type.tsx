// // types.ts
// export interface DeliveryType {
//   deliveryTypeId: string;
//   deliveryType: string;
//   user?: string;
//   remarks?: string;
//   status: "active" | "deactivate";
// }

export enum ConfirmationAction {
  ADD = "add",
  UPDATE = "update",
  TOGGLE_STATUS = "toggleStatus",
  CANCEL = "cancel",
}
