'use client';

import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * GLOBAL, reusable permission-aware icon button.
 *
 * Drop this in place of any <IconButton> that performs an add/edit/delete
 * (or rollback/restore) action anywhere in the app. It checks permissions
 * itself via usePermissions() — no need to thread `canEdit`/`canDelete`
 * props through table/row/action-cell components.
 *
 * Rules encoded here (matches org-wide role/permission convention):
 *  - action="add"     -> requires "add" permission
 *  - action="edit"    -> requires "edit" permission
 *  - action="delete"  -> requires "delete" permission
 *  - rollback={true}  -> ALWAYS checked against "edit" permission,
 *                        regardless of the `action` prop. Use this for
 *                        Activate/Restore/Revert icons — rollback is
 *                        intentionally NOT a separate permission, it is
 *                        bundled under "edit" everywhere.
 *
 * If the user lacks permission, the button simply doesn't render
 * (returns null) — no disabled/greyed-out state, matching existing UX.
 */

export type PermissionAction = 'add' | 'edit' | 'delete' | 'read' | 'approve';

interface PermissionIconButtonProps {
  /** Top-level app/permission group, e.g. "masteradmin", "yenerp", "pos", "whatsapp". */
  app: string;
  /** Submodule key exactly as stored in the permissions document, e.g. "tax", "dineintax". */
  module: string;
  /** Action being gated. Ignored (forced to "edit") when `rollback` is true. */
  action: PermissionAction;
  /** Mark Activate/Restore/Revert-style icons — always gated on "edit". */
  rollback?: boolean;
  tooltip: string;
 onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  icon: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

const PermissionIconButton: React.FC<PermissionIconButtonProps> = ({
  app,
  module,
  action,
  rollback = false,
  tooltip,
  onClick,
  icon,
  className,
  ariaLabel,
  disabled,
}) => {
  const { hasPermission } = usePermissions();
  const effectiveAction: PermissionAction = rollback ? 'edit' : action;
  const allowed = hasPermission(app, module, effectiveAction);

const isDisabled = disabled || !allowed;
  return (
<Tooltip title={allowed ? tooltip : "You don't have permission for this action"} arrow>
        <span>
        <IconButton
          type="button"
          onClick={onClick}
          className={className}
          aria-label={ariaLabel || tooltip}
          disabled={isDisabled}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default PermissionIconButton;
