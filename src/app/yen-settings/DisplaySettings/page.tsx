'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch,
  Typography,
} from '@mui/material';
import {
  DarkModeOutlined,
  LightModeOutlined,
  PaletteOutlined,
  RestartAltOutlined,
  SaveOutlined,
  TextFieldsOutlined,
  TuneOutlined,
  LanguageOutlined,
  PaymentsOutlined,
  CheckCircleRounded,ViewSidebarOutlined,TabOutlined,
} from '@mui/icons-material';
import {
  DEFAULT_DISPLAY_SETTINGS,
  DisplayCurrency,
  DisplayFont,
  DisplayFontSize,
  DisplayLanguage,NavigationLayout,
  DisplaySettings,
  DisplayStyle,
  DisplayTheme,
  useDisplaySettings,
} from '@/contexts/DisplaySettingsContext';
import './DisplaySettings.css';

const ACCENT_COLORS = [
  { name: 'Blue', value: '#155eef' },
  { name: 'Green', value: '#039855' },
  { name: 'Purple', value: '#7f56d9' },
  { name: 'Orange', value: '#f79009' },
  { name: 'Red', value: '#d92d20' },
  { name: 'Pink', value: '#dd2590' },
  { name: 'Yellow', value: '#eaaa08' },
  { name: 'Teal', value: '#094a42' },
  { name: 'Indigo', value: '#444ce7' },
  { name: 'Gray', value: '#667085' },
];
const FONT_OPTIONS: DisplayFont[] = [
  'Inter',
  'Poppins',
  'Roboto',
  'Source Sans 3',
  'IBM Plex Sans',
  'Open Sans',
];

const FONT_PREVIEW_STACKS: Record<DisplayFont, string> = {
  Inter: 'Inter, Arial, sans-serif',
  Poppins: 'Poppins, Arial, sans-serif',
  Roboto: 'Roboto, Arial, sans-serif',
  'Source Sans 3': '"Source Sans 3", Arial, sans-serif',
  'IBM Plex Sans': '"IBM Plex Sans", Arial, sans-serif',
  'Open Sans': '"Open Sans", Arial, sans-serif',
};

const FONT_SIZE_PREVIEWS: Record<DisplayFontSize, string> = {
  small: '13px',
  medium: '15px',
  large: '17px',
};
const optionClass = (active: boolean) => `display-option ${active ? 'is-active' : ''}`;

export default function DisplaySettingsPage() {
  const { settings, previewSettings, saveSettings, resetSettings } = useDisplaySettings();
  const [draft, setDraft] = useState<DisplaySettings>(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(settings), [settings]);

  const update = <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    previewSettings(next);
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const handleReset = () => {
    resetSettings();
    setDraft(DEFAULT_DISPLAY_SETTINGS);
    setSaved(false);
  };

  return (
    <Box className="display-settings-page">
      <Box className="display-settings-heading">
        <Box>
          <Typography component="h1">Display Settings</Typography>
          <Typography>Personalize the ERP appearance without changing any operational behavior.</Typography>
        </Box>
        <Box className="display-settings-actions">
          <Button variant="outlined" startIcon={<RestartAltOutlined />} onClick={handleReset}>Reset to Default</Button>
          <Button variant="contained" startIcon={saved ? <CheckCircleRounded /> : <SaveOutlined />} onClick={handleSave}>
            {saved ? 'Saved' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      <Box className="display-settings-grid">
      <Card className="display-settings-card display-navigation-card">
          <CardContent>
            <Box className="display-section-title">
             <ViewSidebarOutlined />
              <Box>
                <Typography>Navigation Layout</Typography>
                <span>Choose how module submenus are presented across the ERP.</span>
              </Box>
            </Box>
            <Box
              className="display-navigation-segmented"
              role="radiogroup"
              aria-label="Navigation layout"
            >
              <button
                type="button"
                role="radio"
                aria-checked={draft.navigationLayout === 'sidebar'}
                className={draft.navigationLayout === 'sidebar' ? 'is-active' : ''}
                onClick={() => update('navigationLayout', 'sidebar' as NavigationLayout)}
              >
               <ViewSidebarOutlined />
                <span>Sidebar</span>
                <small>Default</small>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={draft.navigationLayout === 'tabs'}
                className={draft.navigationLayout === 'tabs' ? 'is-active' : ''}
                onClick={() => update('navigationLayout', 'tabs' as NavigationLayout)}
             >
                <TabOutlined />
                <span>Tabs</span>
              </button>
            </Box>
          </CardContent>
        </Card>
        <Card className="display-settings-card display-theme-card">
          <CardContent>
            <Box className="display-section-title"><TuneOutlined /><Box><Typography>Theme</Typography><span>Choose the application brightness.</span></Box></Box>
            <Box className="display-two-options">
              <button className={optionClass(draft.theme === 'light')} onClick={() => update('theme', 'light' as DisplayTheme)}><LightModeOutlined /><span>Light Mode</span></button>
              <button className={optionClass(draft.theme === 'dark')} onClick={() => update('theme', 'dark' as DisplayTheme)}><DarkModeOutlined /><span>Dark Mode</span></button>
            </Box>
          </CardContent>
        </Card>

        <Card className="display-settings-card display-settings-card-wide">
          <CardContent>
            <Box className="display-section-title"><PaletteOutlined /><Box><Typography>Accent Color</Typography><span>Applied to interactive and selected UI elements.</span></Box></Box>
            <Box className="display-color-grid">
              {ACCENT_COLORS.map((color) => (
                <button key={color.value} className={`display-color-option ${draft.accentColor.toLowerCase() === color.value ? 'is-active' : ''}`} onClick={() => update('accentColor', color.value)}>
                  <span className="display-color-dot" style={{ backgroundColor: color.value }} />
                  <span>{color.name}</span>
                </button>
              ))}
              <label className="display-custom-color">
                <input type="color" value={draft.accentColor} onChange={(event) => update('accentColor', event.target.value)} />
                <span>Custom</span>
                <code>{draft.accentColor.toUpperCase()}</code>
              </label>
            </Box>
          </CardContent>
        </Card>

        <Card className="display-settings-card display-settings-card-wide">
          <CardContent>
            <Box className="display-section-title"><PaletteOutlined /><Box><Typography>UI Style</Typography><span>Switch the global visual treatment.</span></Box></Box>
            <Box className="display-style-grid">
              {(['classic', 'modern', 'glass'] as DisplayStyle[]).map((style) => (
                <button key={style} className={`${optionClass(draft.uiStyle === style)} display-style-option`} onClick={() => update('uiStyle', style)}>
                  <span className={`display-style-swatch is-${style}`}><i /><i /><i /></span>
                  <strong>{style === 'glass' ? 'Glassmorphism' : style[0].toUpperCase() + style.slice(1)}</strong>
                  <small>{style === 'modern' ? 'Default' : style === 'classic' ? 'Compact and familiar' : 'Blurred premium surfaces'}</small>
                </button>
              ))}
            </Box>
          </CardContent>
        </Card>

        <Card className="display-settings-card">
  <CardContent>
    <Box className="display-section-title">
      <TextFieldsOutlined />

      <Box>
        <Typography>Font Family</Typography>
        <span>Used throughout the ERP.</span>
      </Box>
    </Box>

    <Box className="display-font-family-layout">
      <FormControl fullWidth className="display-font-family-options">
        <RadioGroup
          value={draft.fontFamily}
          onChange={(event) =>
            update('fontFamily', event.target.value as DisplayFont)
          }
        >
          {FONT_OPTIONS.map((font) => (
            <FormControlLabel
              key={font}
              value={font}
              control={<Radio />}
              label={font}
            />
          ))}
        </RadioGroup>
      </FormControl>

      <Box
        className="display-contextual-preview display-font-preview"
        style={{
          fontFamily: FONT_PREVIEW_STACKS[draft.fontFamily],
        }}
      >
        <span>Font preview</span>

        <strong>
          Enterprise Resource Planning
        </strong>

        <p>
          Sales, inventory, purchase and financial operations.
        </p>
      </Box>
    </Box>
  </CardContent>
</Card>

        <Card className="display-settings-card">
  <CardContent>
    <Box className="display-section-title">
      <TextFieldsOutlined />

      <Box>
        <Typography>Font Size</Typography>
        <span>Scale text across every page.</span>
      </Box>
    </Box>

    <Box className="display-three-options">
      {(['small', 'medium', 'large'] as DisplayFontSize[]).map((size) => (
        <button
          key={size}
          className={optionClass(draft.fontSize === size)}
          onClick={() => update('fontSize', size)}
        >
          {size[0].toUpperCase() + size.slice(1)}
        </button>
      ))}
    </Box>

    <Box className="display-contextual-preview">
      <span>Size preview</span>

      <strong
        style={{
          fontSize: FONT_SIZE_PREVIEWS[draft.fontSize],
        }}
      >
        Enterprise application sample text
      </strong>

      <p
        style={{
          fontSize: FONT_SIZE_PREVIEWS[draft.fontSize],
        }}
      >
        This text changes immediately when you select a size.
      </p>
    </Box>
  </CardContent>
</Card>

        <Card className="display-settings-card">
          <CardContent>
            <Box className="display-section-title"><LanguageOutlined /><Box><Typography>Language</Typography><span>Additional languages can be added later.</span></Box></Box>
            <FormControlLabel control={<Switch checked={draft.language === 'en'} onChange={() => update('language', 'en' as DisplayLanguage)} />} label="English" />
          </CardContent>
        </Card>

        <Card className="display-settings-card">
          <CardContent>
            <Box className="display-section-title"><PaymentsOutlined /><Box><Typography>Currency Format</Typography><span>Used by the centralized currency formatter.</span></Box></Box>
            <RadioGroup row value={draft.currency} onChange={(event) => update('currency', event.target.value as DisplayCurrency)}>
              {(['INR', 'USD', 'EUR', 'GBP'] as DisplayCurrency[]).map((currency) => <FormControlLabel key={currency} value={currency} control={<Radio />} label={currency} />)}
            </RadioGroup>
          </CardContent>
        </Card>

        
      </Box>
    </Box>
  );
}
