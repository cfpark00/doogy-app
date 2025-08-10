# Designer's Guide to Customizing Colors

## How to Edit Colors

1. Open the file `src/theme/index.ts` in any text editor
2. Find the `colors` object at the top of the file
3. Change the hex color values (e.g., '#007AFF' to '#FF6B6B')
4. Save the file
5. Reload the app to see your changes

## Color Categories

### Primary Colors
- `primary`: Main brand color (currently blue)
- `primaryLight`: Lighter version for hover/active states
- `primaryDark`: Darker version for emphasis

### Secondary Colors
- `secondary`: Accent color for special elements
- `secondaryLight`: Lighter accent variant
- `secondaryDark`: Darker accent variant

### Background Colors
- `background`: Main app background
- `surface`: Card/panel backgrounds
- `surfaceLight`: Lighter surface variant

### Text Colors
- `textPrimary`: Main text color
- `textSecondary`: Less important text
- `textPlaceholder`: Input placeholder text
- `textOnPrimary`: Text that appears on primary color backgrounds

### Chat Specific
- `userBubble`: Background color for user messages
- `assistantBubble`: Background color for AI messages
- `userText`: Text color in user messages
- `assistantText`: Text color in AI messages

### UI Elements
- `border`: Border lines
- `divider`: Divider lines between sections
- `inputBackground`: Text input field backgrounds

### Status Colors
- `success`: Success messages/indicators (green)
- `warning`: Warning messages (orange)
- `error`: Error messages (red)
- `info`: Information messages (blue)

### Base Colors
- `white`: Pure white (#FFFFFF)
- `black`: Pure black (#000000)

### Gray Scale
- `gray50`: Lightest gray (#FAFAFA)
- `gray100`: Very light gray (#F5F5F5)
- `gray200`: Light gray (#E0E0E0)
- `gray300`: Light-medium gray (#CCCCCC)
- `gray400`: Medium gray (#999999)
- `gray500`: Medium-dark gray (#666666)
- `gray600`: Dark gray (#4D4D4D)
- `gray700`: Darker gray (#333333)
- `gray800`: Very dark gray (#1A1A1A)
- `gray900`: Darkest gray (#0D0D0D)

## Tips for Designers

1. **Test on both light and dark backgrounds**: Make sure text colors have good contrast
2. **Keep accessibility in mind**: Use contrast checkers to ensure readability
3. **Be consistent**: Use the same color for similar elements
4. **Preview changes**: Use the ThemePreview screen to see all colors at once

## Example Color Palettes

### Professional Blue
```javascript
primary: '#0066CC',
primaryLight: '#3385FF',
primaryDark: '#004499',
```

### Warm Orange
```javascript
primary: '#FF6B35',
primaryLight: '#FF8C5C',
primaryDark: '#E54E1B',
```

### Modern Purple
```javascript
primary: '#7C3AED',
primaryLight: '#9F67FF',
primaryDark: '#5B21B6',
```

## Need Help?

- All color values must be valid hex codes (e.g., "#RRGGBB")
- Colors are case-insensitive ("#ff0000" = "#FF0000")
- You can use online color pickers to find hex values
- After saving, completely restart the app to see changes