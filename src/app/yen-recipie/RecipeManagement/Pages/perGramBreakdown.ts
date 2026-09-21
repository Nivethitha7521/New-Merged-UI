import { PerGramBreakdown, IngredientItem } from '../Models/recipeModels';

export const buildPerGramBreakdown = (ing: IngredientItem): PerGramBreakdown | null => {
  const itemName = ing.ingredients;
  if (!itemName) return null;
  const pattern = /(\d+(?:\.\d+)?)\s*(LTRS?|LTR?|KGS?|GMS?|GM|ML|G|L)\b/gi;
  let matchedQty: number | null = null;
  let matchedUnit: string | null = null;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(itemName)) !== null) {
    matchedQty = parseFloat(match[1]);
    matchedUnit = match[2].toUpperCase().trim();
  }
  if (matchedQty === null) {
    const numbers = itemName.match(/(\d+(?:\.\d+)?)/g);
    if (numbers) {
      matchedQty = parseFloat(numbers[numbers.length - 1]);
      matchedUnit = 'G';
    }
  }
  if (!matchedQty || !matchedUnit) return null;
  let totalGrams: number;
  let gramFormula: string;
  const unit = matchedUnit.toUpperCase();
  if (['LT', 'LTR', 'LTRS', 'L'].includes(unit)) {
    totalGrams = matchedQty * 900;
    gramFormula = `${matchedQty} LTR × 900 = ${totalGrams}g`;
  } else if (unit === 'ML') {
    totalGrams = matchedQty * 0.9;
    gramFormula = `${matchedQty} ML × 0.9 = ${totalGrams}g`;
  } else if (['KG', 'KGS'].includes(unit)) {
    totalGrams = matchedQty * 1000;
    gramFormula = `${matchedQty} KG × 1000 = ${totalGrams}g`;
  } else {
    totalGrams = matchedQty;
    gramFormula = `${matchedQty} GM = ${totalGrams}g`;
  }
  const purchasePrice = parseFloat(((ing.perGramCost as number) * totalGrams).toFixed(2));
  const perGram = parseFloat((purchasePrice / totalGrams).toFixed(4));
  return {
    itemName,
    valueInName: `${matchedQty} ${matchedUnit}`,
    totalGrams,
    gramFormula,
    totalCost: purchasePrice,
    perGramCost: perGram,
    steps: [
      `1. Item Name      : ${itemName}`,
      `2. Value in Name  : ${matchedQty} ${matchedUnit}`,
      `3. Total Grams    : ${gramFormula}`,
      `4. Per Gram Cost  : ₹${purchasePrice} ÷ ${totalGrams}g = ₹${perGram}`,
    ],
  };
};