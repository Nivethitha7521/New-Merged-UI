
export const validateMaxLength = (value: string, fieldName: string, maxLength: number = 30): string => {
  if (!value || !value.trim()) {
    return `${fieldName} is required`;
  }
  if (value.trim().length < 1) {
    return `${fieldName} must contain at least 1 character`;
  }
  if (value.length > maxLength) {
    return `${fieldName} cannot exceed ${maxLength} characters`;
  }
  return "";
};

export const validateLettersOnly = (value: string, fieldName: string): string => {
  if (!/[A-Za-z\s]/.test(value)) {
    return `${fieldName} can atleast contain one letter`;
  }
  return "";
};



export const validatePartnerName = (value: string, fieldName: string, maxLength: number = 30): string => {
  if (!value || !value.trim()) {
    return `${fieldName} is required`;
  }
  if (!/[A-Za-z]/.test(value)) {
    return `${fieldName} must contain at least one letter`;
  }
  if (value.trim().length > maxLength) {
    return `${fieldName} cannot exceed ${maxLength} characters`;
  }
  return "";
};