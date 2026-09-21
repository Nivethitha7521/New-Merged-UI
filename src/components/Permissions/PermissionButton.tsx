'use client';

import React from 'react';
import { Button, ButtonProps, Tooltip } from '@mui/material';
import { usePermissions } from '@/hooks/usePermissions';
import type { PermissionAction } from './PermissionIconButton';

/**
 * GLOBAL, reusable permission-aware button — for "Add New" / "Import" /
 * "Export" style actions rendered as a full MUI <Button> (not an icon).
 * Same self-checking behaviour as PermissionIconButton: renders nothing
 * if the user lacks the permission.
 */

interface PermissionButtonProps extends Omit<ButtonProps, 'onClick' | 'action'> {
  app: string;
  module: string;
  action: PermissionAction;
  onClick: () => void;
  children: React.ReactNode;
}

const PermissionButton: React.FC<PermissionButtonProps> = ({
  app,
  module,
  action,
  onClick,
  children,disabled,
  ...buttonProps
}) => {
  const { hasPermission } = usePermissions();
const allowed = hasPermission(app, module, action);
const isDisabled = disabled || !allowed;
return (
  <Tooltip title={allowed ? '' : "You don't have permission for this action"} arrow>
    <span>
      <Button type="button" onClick={onClick} disabled={isDisabled} {...buttonProps}>
        {children}
      </Button>
    </span>
  </Tooltip>
);
};

export default PermissionButton;
