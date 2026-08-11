'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  Box, IconButton, List, ListItem, ListItemIcon, ListItemText, Tooltip, Typography,
} from '@mui/material';
import {
  ChevronLeftRounded, ChevronRightRounded,
  RestaurantMenuOutlined, KitchenOutlined,
} from '@mui/icons-material';
import './RecipeModuleSideMenu.css';

interface RecipeModuleSideMenuProps {
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (item: { path: string; text: string }) => void;
}

const recipeModules = [
  { text: 'Recipe', path: '/yen-recipie/RecipeManagement', icon: <RestaurantMenuOutlined /> },
  { text: 'Store Kitchen Master', path: '/yen-recipie/StoreKitchenMaster', icon: <KitchenOutlined /> },
];

const RecipeModuleSideMenu: React.FC<RecipeModuleSideMenuProps> = ({ expanded, onToggle, onNavigate }) => {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || Boolean(pathname?.startsWith(`${path}/`));

  return (
    <Box className={`recipe-module-sidebar ${expanded ? 'is-expanded' : 'is-collapsed'}`}>
      <Box className="recipe-module-sidebar-header">
        <Tooltip title={!expanded ? 'YEN Recipe' : ''} placement="right" arrow>
          <Box className="recipe-module-brand">
            <Box className="recipe-module-logo"><RestaurantMenuOutlined /></Box>
            <Box className={`recipe-module-brand-content ${expanded ? 'is-visible' : ''}`}>
              <Typography className="recipe-module-sidebar-caption">MODULE</Typography>
              <Typography className="recipe-module-sidebar-title">YEN Recipe</Typography>
              <Typography className="recipe-module-sidebar-description">Recipe management</Typography>
            </Box>
          </Box>
        </Tooltip>
        <IconButton
          type="button"
          className="recipe-module-toggle"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse recipe navigation' : 'Expand recipe navigation'}
        >
          {expanded ? <ChevronLeftRounded /> : <ChevronRightRounded />}
        </IconButton>
      </Box>

      <List disablePadding className="recipe-module-list">
        {recipeModules.map((module) => (
          <Tooltip key={module.path} title={!expanded ? module.text : ''} placement="right" arrow>
            <ListItem
              button
              onClick={() => onNavigate({ path: module.path, text: module.text })}
              className={`recipe-module-item ${isActive(module.path) ? 'is-active' : ''}`}
            >
              <ListItemIcon className="recipe-module-icon">{module.icon}</ListItemIcon>
              <Box className={`recipe-module-label-wrapper ${expanded ? 'is-visible' : ''}`}>
                <ListItemText primary={module.text} primaryTypographyProps={{ className: 'recipe-module-label' }} />
              </Box>
            </ListItem>
          </Tooltip>
        ))}
      </List>
    </Box>
  );
};

export default RecipeModuleSideMenu;