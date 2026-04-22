// services/grnSettingsService.ts - Using purchaseApi

import purchaseApi from '@/utils/api';

export interface GrnSettings {
  isActive: boolean;
  maxPercentageAbove: number;
}

export interface PriceValidationResponse {
  valid: boolean;
  message: string;
  isActive: boolean;
  poPrice: number;
  grnPrice: number;
  maxAllowed?: number;
  maxPercentage?: number;
  percentageDifference?: number;
}

class GrnSettingsService {
  
  async getSettings(): Promise<GrnSettings> {
    try {
      const response = await purchaseApi.get('/grn-settings/');
      
      if (response.data) {
        return {
          isActive: response.data.isActive,
          maxPercentageAbove: response.data.maxPercentageAbove,
        };
      }
      // Return default settings if API fails
      return { isActive: true, maxPercentageAbove: 10.0 };
    } catch (error) {
      console.error('Failed to fetch GRN settings:', error);
      return { isActive: true, maxPercentageAbove: 10.0 };
    }
  }

  async validatePrice(poPrice: number, grnPrice: number, itemName: string): Promise<PriceValidationResponse> {
    try {
      const response = await purchaseApi.post('/grn-settings/validate-price/', {
        poPrice,
        grnPrice,
        itemName,
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Price validation error:', error);
      
      // If validation fails (like 400 error), check if we have validation data in response
      if (error.response?.data) {
        return error.response.data;
      }
      
      // Default to allow if validation fails
      return { 
        valid: true, 
        message: 'Validation service unavailable', 
        isActive: false, 
        poPrice, 
        grnPrice 
      };
    }
  }
}

export const grnSettingsService = new GrnSettingsService();