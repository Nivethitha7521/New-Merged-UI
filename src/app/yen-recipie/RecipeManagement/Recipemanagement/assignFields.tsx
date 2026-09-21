

'use client';
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  ListItemText,
} from '@mui/material';

interface AssignFieldsFormProps {
  nutritionInfo: string[];
  cuisine: string;
  dietaryRestriction: string;
  storageInstruction: string;
  remark: string;
  validationErrors: {
    itemName: string;
    consumables: string;
    totalServings: string;
    nutritionInfo?: string;
    cuisine?: string;
    dietaryRestriction?: string;
    storageInstruction?: string;
  };
  setNutritionInfo: (value: string[]) => void;
  setCuisine: (value: string) => void;
  setDietaryRestriction: (value: string) => void;
  setStorageInstruction: (value: string) => void;
  setRemark: (value: string) => void;
  setValidationErrors: React.Dispatch<
    React.SetStateAction<{
      itemName: string;
      consumables: string;
      totalServings: string;
      nutritionInfo?: string;
      cuisine?: string;
      dietaryRestriction?: string;
      storageInstruction?: string;
    }>
  >;
  handleNutritionalInfoChange: (name: string, value: number) => void;
}

const AssignFieldsForm: React.FC<AssignFieldsFormProps> = ({
  nutritionInfo,
  cuisine,
  dietaryRestriction,
  storageInstruction,
  remark,
 // validationErrors,
  setNutritionInfo,
  setCuisine,
  setDietaryRestriction,
  setStorageInstruction,
  setRemark,
  setValidationErrors,
  handleNutritionalInfoChange,
}) => {
  return (
    <Box sx={{ mt: -60.5 }}>
      <Card sx={{ marginLeft: 58, width: 720, height: 140 }}>
        <CardContent>
          <label
            style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}
          >
            Assigning Fields
          </label>
          <Box sx={{ display: 'flex', gap: 2,  mt: -2 }}>
            <Box sx={{ width: 160 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Nutritional Information</InputLabel>
                <Select
                  multiple
                  label="Nutritional Information"
                  value={nutritionInfo}
                  onChange={(e) => {
                    setNutritionInfo(e.target.value as string[]);
                    setValidationErrors((prev) => ({
                      ...prev,
                      nutritionInfo: (e.target.value as string[]).length > 0 ? '' : 'At least one nutritional information is required',
                    }));
                  }}
                  renderValue={(selected) => selected.join(', ')}
                >
                  <MenuItem value="Calories">
                    <Checkbox checked={nutritionInfo.includes('Calories')} />
                    <ListItemText primary="Calories" />
                  </MenuItem>
                  <MenuItem value="Protein">
                    <Checkbox checked={nutritionInfo.includes('Protein')} />
                    <ListItemText primary="Protein" />
                  </MenuItem>
                </Select>
              </FormControl>
              {nutritionInfo.map((info, index) => (
                <TextField
                  key={index}
                  label={`${info} (grams)`}
                  type="number"
                  value={nutritionInfo.includes(info) ? 1 : 0}
                  onChange={(e) => handleNutritionalInfoChange(info, Number(e.target.value))}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    sx: { fontSize: '12px' },
                  }}
                />
              ))}
            </Box>
            <Box sx={{ width: 150 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Cuisine</InputLabel>
                <Select
                  value={cuisine}
                  label="Cuisine"
                  onChange={(e) => {
                    setCuisine(e.target.value);
                    setValidationErrors((prev) => ({
                      ...prev,
                      cuisine: e.target.value ? '' : 'Required',
                    }));
                  }}
                >
                  <MenuItem value="Indian">Indian</MenuItem>
                  <MenuItem value="Chinese">Chinese</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: 160 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Dietary Restrictions</InputLabel>
                <Select
                  value={dietaryRestriction}
                  label="Dietary Restrictions"
                  onChange={(e) => {
                    setDietaryRestriction(e.target.value);
                    setValidationErrors((prev) => ({
                      ...prev,
                      dietaryRestriction: e.target.value ? '' : 'Required',
                    }));
                  }}
                >
                  <MenuItem value="Gluten-Free">Gluten-Free</MenuItem>
                  <MenuItem value="Vegan">Vegan</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: 160 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Storage Instructions</InputLabel>
                <Select
                  value={storageInstruction}
                  label="Storage Instructions"
                  onChange={(e) => {
                    setStorageInstruction(e.target.value);
                    setValidationErrors((prev) => ({
                      ...prev,
                      storageInstruction: e.target.value ? '' : 'Required',
                    }));
                  }}
                >
                  <MenuItem value="Keep It In Refrigerator">Keep It In Refrigerator</MenuItem>
                  <MenuItem value="Keep It In Freezer">Keep It In Freezer</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ width: '60%', mt: 2, ml: 58 }}>
        <TextField
          label="Remark"
          multiline
          rows={20}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          fullWidth
          margin="normal"
          InputProps={{
            sx: { fontSize: '12px' },
          }}
        />
      </Box>
    </Box>
  );
};

export default AssignFieldsForm;
