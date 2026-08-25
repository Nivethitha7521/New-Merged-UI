'use client';

import React from 'react';

import '../masterAdminGlobal.css';
import '@/styles/master-admin/masterAdmin.runtime.css';
export default function YenPosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
+    Primary YEN POS navigation is rendered globally:
+    - Sidebar mode -> YenPosModuleSideMenu in ClientLayout
+    - Tabs mode    -> ModuleNavigationTabs in ClientLayout
+
+    Keep this layout presentation-only so the four module entries are never
+    duplicated inside the page.
+  */
  return (
    <div className="ma-scope master-admin-page-shell item-master-layout yen-pos-layout">
           {children}
    </div>
  );
}