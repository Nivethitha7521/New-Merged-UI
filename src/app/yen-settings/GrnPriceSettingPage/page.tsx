// app/yen-settings/GRNPriceSetting/page.tsx - SIMPLIFIED VERSION
'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Chip,
  Stack,
  IconButton,
  Divider,
  Container,
  Slider,
  InputAdornment,
  Paper
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import {
  fetchGRNPriceSettings,
  saveGRNPriceSettings,
  updateIsActive,
  updateMaxPercentageAbove,
  clearError
} from '../Features/GRNSettingsSlice';
import { useRouter } from 'next/navigation';

const GRNPriceSettingPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  
  const { settings, loading, saving, error, lastUpdated } = useSelector(
    (state: RootState) => state.grnPriceSettings
  );

  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    dispatch(fetchGRNPriceSettings());
  }, [dispatch]);

  const handleIsActiveChange = (checked: boolean) => {
    dispatch(updateIsActive(checked));
  };

  const handleMaxPercentageChange = (value: number) => {
    dispatch(updateMaxPercentageAbove(value));
  };

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      await dispatch(saveGRNPriceSettings({
        isActive: settings.isActive,
        maxPercentageAbove: settings.maxPercentageAbove
      })).unwrap();
      
      setSuccessMessage(`GRN price settings saved! Max allowed: ${settings.maxPercentageAbove}% above PO price`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleReset = () => {
    dispatch(updateIsActive(false));
    dispatch(updateMaxPercentageAbove(10));
    setSuccessMessage('Reset to default: Disabled, Max 10%');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const currentPercentage = settings?.maxPercentageAbove || 10;
  const isActive = settings?.isActive || false;

  if (loading && !settings) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#f5f5f5',
      p: 3
    }}>
      <Container maxWidth="md">
        
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => router.push('/yen-settings')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            GRN Price Settings
          </Typography>
          <Chip 
            label={isActive ? "Active" : "Inactive"} 
            color={isActive ? "success" : "default"}
            sx={{ ml: 2 }}
          />
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {/* Main Settings Card */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <PriceChangeIcon color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h6" fontWeight="bold">
                GRN Price Tolerance Rules
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Enable/Disable Switch */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#fafafa' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => handleIsActiveChange(e.target.checked)}
                    color="primary"
                    size="medium"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Enable Price Tolerance Check
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      When enabled, GRN prices above PO price will be restricted based on the percentage below
                    </Typography>
                  </Box>
                }
              />
            </Paper>

            {/* Max Percentage Setting */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Maximum Allowed Percentage Above PO Price
              </Typography>
              
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={8}>
                  <Slider
                    value={currentPercentage}
                    onChange={(_, value) => handleMaxPercentageChange(value as number)}
                    min={0}
                    max={100}
                    step={1}
                    valueLabelDisplay="auto"
                    disabled={!isActive}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 10, label: '10%' },
                      { value: 25, label: '25%' },
                      { value: 50, label: '50%' },
                      { value: 75, label: '75%' },
                      { value: 100, label: '100%' }
                    ]}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    type="number"
                    value={currentPercentage}
                    onChange={(e) => {
                      let val = Number(e.target.value);
                      if (isNaN(val)) val = 0;
                      if (val < 0) val = 0;
                      if (val > 100) val = 100;
                      handleMaxPercentageChange(val);
                    }}
                    disabled={!isActive}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      inputProps: { min: 0, max: 100, step: 1 }
                    }}
                    size="medium"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Rules Explanation */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
                How it works:
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Example with ₹100 PO price:</strong>
                <br />
                • ₹90, ₹95, ₹100 → ✅ Always Allowed
                <br />
                • ₹105, ₹{Math.floor(100 * (1 + currentPercentage / 100))} → ✅ Allowed (within {currentPercentage}%)
                <br />
                • ₹{Math.floor(100 * (1 + currentPercentage / 100)) + 1} and above → ❌ Blocked
              </Typography>
            </Paper>

            {!isActive && (
              <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                ⚠️ Price tolerance check is currently <strong>disabled</strong>. Any GRN price will be accepted without restriction.
              </Alert>
            )}

            {/* Last Updated */}
            {lastUpdated && (
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2, textAlign: 'right' }}>
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </Typography>
            )}

            {/* Action Buttons */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'flex-end',
              mt: 3,
              pt: 2,
              borderTop: 1,
              borderColor: 'divider'
            }}>
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={handleReset}
                disabled={saving}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                size="large"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default GRNPriceSettingPage;