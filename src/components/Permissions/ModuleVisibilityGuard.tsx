'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * GLOBAL wrapper that hides an entire submodule section (table + dialogs)
 * when the current role has no "read" permission for it, or has it
 * explicitly hidden. Wrap each submodule's top-level block with this
 * instead of writing `if (!isModuleVisible(...)) return null;` by hand
 * in every page.tsx.
 *
 * Usage:
 *   <ModuleVisibilityGuard app="masteradmin" module="tax">
 *     <TaxTableContainer ... />
 *   </ModuleVisibilityGuard>
 */
interface ModuleVisibilityGuardProps {
  app: string;
  module: string;
  children: React.ReactNode;
}

const ModuleVisibilityGuard: React.FC<ModuleVisibilityGuardProps> = ({ app, module, children }) => {
  const { isModuleVisible } = usePermissions();
  if (!isModuleVisible(app, module)) return null;
  return <>{children}</>;
};

export default ModuleVisibilityGuard;
