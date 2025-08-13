// Comprehensive font library with Google Fonts and custom fonts
export interface Font {
  family: string;
  display: string;
  category: 'serif' | 'sans-serif' | 'monospace' | 'display' | 'handwriting' | 'custom';
  weights: number[];
  variants?: string[];
  googleFont?: boolean;
  customUrl?: string;
  fallback: string;
}

// Google Fonts selection - most popular and professional fonts
export const GOOGLE_FONTS: Font[] = [
  // Sans-serif fonts
  {
    family: 'Inter',
    display: 'Inter (Modern)',
    category: 'sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    googleFont: true,
    fallback: 'sans-serif'
  },
  {
    family: 'Roboto',
    display: 'Roboto (Clean)',
    category: 'sans-serif',
    weights: [100, 300, 400, 500, 700, 900],
    googleFont: true,
    fallback: 'sans-serif'
  },
  {
    family: 'Open Sans',
    display: 'Open Sans (Friendly)',
    category: 'sans-serif',
    weights: [300, 400, 500, 600, 700, 800],
    googleFont: true,
    fallback: 'sans-serif'
  },
  {
    family: 'Lato',
    display: 'Lato (Elegant)',
    category: 'sans-serif',
    weights: [100, 300, 400, 700, 900],
    googleFont: true,
    fallback: 'sans-serif'
  },
  {
    family: 'Montserrat',
    display: 'Montserrat (Modern)',
    category: 'sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    googleFont: true,
    fallback: 'sans-serif'
  },
  {
    family: 'Source Sans Pro',
    display: 'Source Sans Pro (Professional)',
    category: 'sans-serif',
    weights: [200, 300, 400, 600, 700, 900],
    googleFont: true,
    fallback: 'sans-serif'
  },
  {
    family: 'Nunito',
    display: 'Nunito (Friendly)',
    category: 'sans-serif',
    weights: [200, 300, 400, 500, 600, 700, 800, 900],
    googleFont: true,
    fallback: 'sans-serif'
  },
  {
    family: 'Poppins',
    display: 'Poppins (Geometric)',
    category: 'sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    googleFont: true,
    fallback: 'sans-serif'
  },

  // Serif fonts
  {
    family: 'Playfair Display',
    display: 'Playfair Display (Editorial)',
    category: 'serif',
    weights: [400, 500, 600, 700, 800, 900],
    googleFont: true,
    fallback: 'serif'
  },
  {
    family: 'Merriweather',
    display: 'Merriweather (Readable)',
    category: 'serif',
    weights: [300, 400, 700, 900],
    googleFont: true,
    fallback: 'serif'
  },
  {
    family: 'Lora',
    display: 'Lora (Elegant Serif)',
    category: 'serif',
    weights: [400, 500, 600, 700],
    googleFont: true,
    fallback: 'serif'
  },
  {
    family: 'PT Serif',
    display: 'PT Serif (Classic)',
    category: 'serif',
    weights: [400, 700],
    googleFont: true,
    fallback: 'serif'
  },
  {
    family: 'Crimson Text',
    display: 'Crimson Text (Academic)',
    category: 'serif',
    weights: [400, 600, 700],
    googleFont: true,
    fallback: 'serif'
  },
  {
    family: 'Libre Baskerville',
    display: 'Libre Baskerville (Traditional)',
    category: 'serif',
    weights: [400, 700],
    googleFont: true,
    fallback: 'serif'
  },

  // Display fonts
  {
    family: 'Oswald',
    display: 'Oswald (Bold Display)',
    category: 'display',
    weights: [200, 300, 400, 500, 600, 700],
    googleFont: true,
    fallback: 'sans-serif'
  },
  {
    family: 'Bebas Neue',
    display: 'Bebas Neue (Strong)',
    category: 'display',
    weights: [400],
    googleFont: true,
    fallback: 'sans-serif'
  },
  {
    family: 'Anton',
    display: 'Anton (Impact)',
    category: 'display',
    weights: [400],
    googleFont: true,
    fallback: 'sans-serif'
  },
  {
    family: 'Archivo Black',
    display: 'Archivo Black (Heavy)',
    category: 'display',
    weights: [400],
    googleFont: true,
    fallback: 'sans-serif'
  },

  // Monospace fonts
  {
    family: 'Roboto Mono',
    display: 'Roboto Mono (Code)',
    category: 'monospace',
    weights: [100, 200, 300, 400, 500, 600, 700],
    googleFont: true,
    fallback: 'monospace'
  },
  {
    family: 'Source Code Pro',
    display: 'Source Code Pro (Developer)',
    category: 'monospace',
    weights: [200, 300, 400, 500, 600, 700, 800, 900],
    googleFont: true,
    fallback: 'monospace'
  },
  {
    family: 'JetBrains Mono',
    display: 'JetBrains Mono (Modern Code)',
    category: 'monospace',
    weights: [100, 200, 300, 400, 500, 600, 700, 800],
    googleFont: true,
    fallback: 'monospace'
  },

  // Handwriting fonts
  {
    family: 'Dancing Script',
    display: 'Dancing Script (Casual)',
    category: 'handwriting',
    weights: [400, 500, 600, 700],
    googleFont: true,
    fallback: 'cursive'
  },
  {
    family: 'Pacifico',
    display: 'Pacifico (Playful)',
    category: 'handwriting',
    weights: [400],
    googleFont: true,
    fallback: 'cursive'
  }
];

// System fonts that don't require loading
export const SYSTEM_FONTS: Font[] = [
  {
    family: 'Arial',
    display: 'Arial (System)',
    category: 'sans-serif',
    weights: [400, 700],
    fallback: 'sans-serif'
  },
  {
    family: 'Helvetica',
    display: 'Helvetica (Classic)',
    category: 'sans-serif',
    weights: [400, 700],
    fallback: 'sans-serif'
  },
  {
    family: 'Times New Roman',
    display: 'Times New Roman (Traditional)',
    category: 'serif',
    weights: [400, 700],
    fallback: 'serif'
  },
  {
    family: 'Georgia',
    display: 'Georgia (Web Serif)',
    category: 'serif',
    weights: [400, 700],
    fallback: 'serif'
  },
  {
    family: 'Courier New',
    display: 'Courier New (Typewriter)',
    category: 'monospace',
    weights: [400, 700],
    fallback: 'monospace'
  },
  {
    family: 'Verdana',
    display: 'Verdana (Clear)',
    category: 'sans-serif',
    weights: [400, 700],
    fallback: 'sans-serif'
  }
];

// Combine all fonts
export const ALL_FONTS = [...GOOGLE_FONTS, ...SYSTEM_FONTS];

// Font categories for filtering
export const FONT_CATEGORIES = {
  'all': 'All Fonts',
  'sans-serif': 'Sans Serif',
  'serif': 'Serif',
  'monospace': 'Monospace',
  'display': 'Display',
  'handwriting': 'Handwriting',
  'custom': 'Custom Fonts'
} as const;

// Helper function to get font family CSS string
export function getFontFamilyCSS(font: Font): string {
  if (font.category === 'custom' && font.customUrl) {
    return font.family;
  }
  return `"${font.family}", ${font.fallback}`;
}

// Helper function to generate Google Fonts URL
export function generateGoogleFontsURL(fonts: Font[]): string {
  const googleFonts = fonts.filter(font => font.googleFont);
  if (googleFonts.length === 0) return '';
  
  const families = googleFonts.map(font => {
    const weights = font.weights.join(',');
    return `${font.family.replace(/ /g, '+')}:wght@${weights}`;
  }).join('&family=');
  
  return `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
}