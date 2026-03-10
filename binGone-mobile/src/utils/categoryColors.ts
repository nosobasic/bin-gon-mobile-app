// Utility function to generate consistent hex color from category name

// Predefined colors for common categories to maintain visual consistency
const predefinedColors: { [key: string]: string } = {
  'Medical': '#FF6B35',
  'Food': '#9C27B0',
  'Clothes': '#2196F3',
  'Education': '#4CAF50',
  'Stationery': '#FF9800',
  'Books': '#795548',
  'Electronics': '#607D8B',
  'Furniture': '#8BC34A',
  'Toys': '#E91E63',
  'Sports': '#FF5722',
  'Athletic': '#FF5722',
  'Book': '#795548',
  'Category': '#9E9E9E',
};

// Extended color palette for dynamic categories
const colorPalette = [
  '#FF6B35', '#9C27B0', '#2196F3', '#4CAF50', '#FF9800', 
  '#795548', '#607D8B', '#8BC34A', '#E91E63', '#FF5722',
  '#3F51B5', '#009688', '#CDDC39', '#FFC107', '#FF9800',
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#00BCD4', '#4CAF50', '#FF5722', '#795548', '#E91E63',
  '#3F51B5', '#009688', '#CDDC39', '#FFC107', '#FF9800'
];

/**
 * Generates a consistent hex color for a category based on its name
 * @param categoryName - The name of the category
 * @returns A hex color string
 */
export const generateCategoryColor = (categoryName: string): string => {
  // Return predefined color if available
  if (predefinedColors[categoryName]) {
    return predefinedColors[categoryName];
  }

  // Generate color from category name for dynamic categories
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use absolute value and modulo to get index
  const colorIndex = Math.abs(hash) % colorPalette.length;
  return colorPalette[colorIndex];
};

/**
 * Gets all predefined category colors
 * @returns Object with category names as keys and colors as values
 */
export const getPredefinedColors = (): { [key: string]: string } => {
  return { ...predefinedColors };
};

/**
 * Gets the color palette for dynamic categories
 * @returns Array of hex color strings
 */
export const getColorPalette = (): string[] => {
  return [...colorPalette];
};
