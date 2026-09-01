import { FaCashRegister, FaShoppingCart } from "react-icons/fa";
import { MenuItem } from "@/components/reports-layout/Sidebar";

export const menuItems: MenuItem[] = [
  {
    label: "Purchase Order (PO)",
    path: "/QlikReport/PurchaseOrder",
    icon: <FaShoppingCart />,
  },
  {
    label: "Sale Order (POS)",
    path: "/QlikReport/Pos",
    icon: <FaCashRegister />,
  },
];
