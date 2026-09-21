"use client";

import React from "react";
import { ActionCenterProvider } from "@/components/InventoryControlTower/shared/components/action-center";

export default function InventoryControlTowerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ActionCenterProvider>{children}</ActionCenterProvider>;
}
