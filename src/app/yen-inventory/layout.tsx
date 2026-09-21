import type { ReactNode } from "react";
import "./inventory-ui.css";
import "./inventory-dropdown.css";

interface YenInventoryLayoutProps {
  children: ReactNode;
}

export default function YenInventoryLayout({ children }: YenInventoryLayoutProps) {
  return <section className="yen-inventory-ui">{children}</section>;
}
