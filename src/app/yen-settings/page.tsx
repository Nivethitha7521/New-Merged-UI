// src/app/yen-settings/page.tsx
"use client";

import React, { useState } from 'react';
import {
  Box,
  Button,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import SettingsIcon from '@mui/icons-material/Settings';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import BuildIcon from '@mui/icons-material/Build';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import { usePermissions } from '@/hooks/usePermissions';
import DateSettingsPage from './DateSettings/page';
import GRNPriceSettingPage from './GrnPriceSettingPage/page';
import './YenSettings.css';

interface SubSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  component: React.ComponentType;
}

interface SettingsMenuItem {
  id: string;
  title: string;
  icon: React.ReactElement;
  type: 'direct' | 'nested';
  path?: string;
  component?: React.ComponentType;
  subSettings?: SubSetting[];
}

const YenSettingsPage = () => {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canReadSettings = hasPermission('yenerp', 'settings', 'read');

  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('purchase');
  const [selectedSubSetting, setSelectedSubSetting] = useState<string>('date');
  const [openNested, setOpenNested] = useState<string | null>('purchase');

  const settingsMenu: SettingsMenuItem[] = [
    {
      id: 'purchase',
      title: 'Purchase Settings',
      icon: <ShoppingCartIcon sx={{ fontSize: 18 }} />,
      type: 'nested',
      subSettings: [
        {
          id: 'date',
          title: 'Date Setting',
          description: 'Purchase order date restrictions',
          icon: <DateRangeIcon sx={{ fontSize: 17 }} />,
          component: DateSettingsPage,
        },
        {
          id: 'grnprice',
          title: 'GRN Price Setting',
          description: 'GRN price tolerance controls',
          icon: <PriceCheckIcon sx={{ fontSize: 17 }} />,
          component: GRNPriceSettingPage,
        },
        {
          id: 'common',
          title: 'Common Setting',
          description: 'Purchase defaults and workflows',
          icon: <TuneIcon sx={{ fontSize: 17 }} />,
          component: () => (
            <Box>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Purchase Common Settings
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Configure common defaults and workflows for purchase module
              </Typography>
            </Box>
          ),
        },
        {
          id: 'general',
          title: 'General Setting',
          description: 'General purchase preferences',
          icon: <SettingsIcon sx={{ fontSize: 17 }} />,
          component: () => (
            <Box>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Purchase General Settings
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Configure general preferences and system defaults for purchase module
              </Typography>
            </Box>
          ),
        },
      ],
    },
  ];

  const handleMenuItemClick = (item: SettingsMenuItem) => {
    if (item.type === 'direct') {
      setSelectedMenuItem(item.id);
      setSelectedSubSetting('');
      setOpenNested(null);
      return;
    }

    setSelectedMenuItem(item.id);
    setOpenNested(openNested === item.id ? null : item.id);

    if (!selectedSubSetting) {
      setSelectedSubSetting(item.subSettings?.[0]?.id || '');
    }
  };

  const handleSubSettingClick = (subId: string) => {
    setSelectedSubSetting(subId);
  };

  const getActiveComponent = () => {
    const directItem = settingsMenu.find(
      (item) => item.id === selectedMenuItem && item.type === 'direct'
    );

    if (directItem?.component) return directItem.component;

    const selectedItem = settingsMenu.find((item) => item.id === selectedMenuItem);
    const subSetting = selectedItem?.subSettings?.find(
      (setting) => setting.id === selectedSubSetting
    );

    return subSetting?.component || DateSettingsPage;
  };

  const getActiveSettingMeta = () => {
    const selectedItem = settingsMenu.find((item) => item.id === selectedMenuItem);
    const subSetting = selectedItem?.subSettings?.find(
      (setting) => setting.id === selectedSubSetting
    );

    return {
      sectionTitle: selectedItem?.title || 'Settings',
      title: subSetting?.title || selectedItem?.title || 'Settings',
      description: subSetting?.description || 'Configure your application settings',
    };
  };

  const ActiveComponent = getActiveComponent();
  const activeMeta = getActiveSettingMeta();



  if (!canReadSettings) {
    return (
      <Box className="yen-settings-access-denied">
          <BuildIcon className="yen-settings-access-icon" />
          <Typography variant="h6" color="error" fontWeight={700}>
            Access Denied
          </Typography>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            You don&apos;t have permission to access Settings.
          </Typography>
          <Button variant="contained" onClick={() => router.push('/')}>
            Go to Dashboard
          </Button>
      </Box>
    );
  }

  return (
    <Box className="yen-settings-shell">
        <Paper elevation={0} className="yen-settings-nav-card">
          <Box className="yen-settings-nav-header">
            <Box className="yen-settings-nav-icon">
              <SettingsIcon />
            </Box>
            <Box>
              <Typography className="yen-settings-nav-title">Settings</Typography>
              <Typography className="yen-settings-nav-subtitle">
                Application configuration
              </Typography>
            </Box>
          </Box>

          <List className="yen-settings-menu-list" disablePadding>
            {settingsMenu.map((item) => (
              <React.Fragment key={item.id}>
                <ListItem disablePadding className="yen-settings-main-item">
                  <ListItemButton
                    onClick={() => handleMenuItemClick(item)}
                    selected={selectedMenuItem === item.id}
                    className="yen-settings-menu-button"
                  >
                    <ListItemIcon className="yen-settings-menu-icon">
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{ className: 'yen-settings-menu-text' }}
                    />
                    {item.type === 'nested' &&
                      (openNested === item.id ? (
                        <ExpandLess className="yen-settings-expand-icon" />
                      ) : (
                        <ExpandMore className="yen-settings-expand-icon" />
                      ))}
                  </ListItemButton>
                </ListItem>

                {item.type === 'nested' && item.subSettings && (
                  <Collapse in={openNested === item.id} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding className="yen-settings-sub-list">
                      {item.subSettings.map((subItem) => (
                        <ListItemButton
                          key={subItem.id}
                          selected={selectedSubSetting === subItem.id}
                          onClick={() => handleSubSettingClick(subItem.id)}
                          className="yen-settings-sub-button"
                        >
                          <ListItemIcon className="yen-settings-sub-icon">
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={subItem.title}
                            secondary={subItem.description}
                            primaryTypographyProps={{
                              className: 'yen-settings-sub-title',
                            }}
                            secondaryTypographyProps={{
                              className: 'yen-settings-sub-description',
                            }}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            ))}
          </List>
        </Paper>

        <Paper elevation={0} className="yen-settings-content-card">
          <Box className="yen-settings-content-header">
            <Box>
              <Typography className="yen-settings-eyebrow">
                {activeMeta.sectionTitle}
              </Typography>
              <Typography className="yen-settings-content-title">
                {activeMeta.title}
              </Typography>
              <Typography className="yen-settings-content-description">
                {activeMeta.description}
              </Typography>
            </Box>
          </Box>

          <Box className="yen-settings-content-body">
            <ActiveComponent />
          </Box>
        </Paper>
    </Box>
  );
};

export default YenSettingsPage;
