import React from 'react';
import Svg, {
  G,
  Path,
  Rect,
  Circle,
  Ellipse,
  Line,
  Polygon,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { Image as ExpoImage } from 'expo-image';
import { View, StyleSheet } from 'react-native';

interface VectorProps {
  size?: number;
}

/**
 * 1. EVERYDAY WEAR / WASH & FOLD VECTOR
 * Washing Machine with transparent bubbly portal and pop neon accents
 */
export const EverydayWashVector: React.FC<VectorProps> = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Body Shadow */}
    <Rect x="18" y="16" width="68" height="74" rx="14" fill="#000000" />
    {/* Machine Body */}
    <Rect x="14" y="12" width="68" height="74" rx="14" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />

    {/* Top Control Panel */}
    <Rect x="14" y="12" width="68" height="20" rx="14" fill="#0D8DE3" stroke="#000000" strokeWidth="3" />
    <Rect x="20" y="18" width="22" height="8" rx="4" fill="#B0FF49" stroke="#000000" strokeWidth="1.5" />
    <Circle cx="52" cy="22" r="4" fill="#FFFFFF" stroke="#000000" strokeWidth="1.5" />
    <Circle cx="64" cy="22" r="4" fill="#FDE047" stroke="#000000" strokeWidth="1.5" />
    <Circle cx="74" cy="22" r="3" fill="#EF4444" />

    {/* Drum Outer Rim */}
    <Circle cx="48" cy="58" r="22" fill="#E5E7EB" stroke="#000000" strokeWidth="3" />
    {/* Drum Glass */}
    <Circle cx="48" cy="58" r="17" fill="#60A5FA" stroke="#000000" strokeWidth="2" />
    {/* Water wave inside */}
    <Path
      d="M 33 60 C 37 54, 43 64, 48 58 C 53 52, 59 62, 63 56 L 63 74 A 17 17 0 0 1 33 70 Z"
      fill="#0284C7"
    />
    {/* Swirl / Clothes shape inside */}
    <Circle cx="46" cy="62" r="5" fill="#B0FF49" stroke="#000000" strokeWidth="1.5" />
    <Circle cx="54" cy="55" r="3" fill="#FDE047" stroke="#000000" strokeWidth="1" />

    {/* Soap Bubbles */}
    <Circle cx="76" cy="42" r="5" fill="#B0FF49" stroke="#000000" strokeWidth="2" />
    <Circle cx="84" cy="34" r="3.5" fill="#60A5FA" stroke="#000000" strokeWidth="1.5" />
    <Circle cx="82" cy="50" r="2.5" fill="#FFFFFF" stroke="#000000" strokeWidth="1" />
  </Svg>
);

/**
 * 2. WINTER JACKETS & COATS VECTOR
 * Puffer jacket with zipper, fur collar, and vibrant pop styling
 */
export const WinterWearVector: React.FC<VectorProps> = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Hard Shadow */}
    <Path
      d="M 28 22 L 50 14 L 72 22 L 88 44 L 76 56 L 74 86 L 26 86 L 24 56 L 12 44 Z"
      fill="#000000"
    />

    {/* Jacket Body */}
    <Path
      d="M 26 20 L 48 12 L 70 20 L 86 42 L 74 54 L 72 84 L 24 84 L 22 54 L 10 42 Z"
      fill="#F97316"
      stroke="#000000"
      strokeWidth="3"
    />

    {/* Puffer Horizontal Segments */}
    <Path d="M 24 40 L 72 40" stroke="#000000" strokeWidth="2.5" />
    <Path d="M 24 54 L 72 54" stroke="#000000" strokeWidth="2.5" />
    <Path d="M 24 68 L 72 68" stroke="#000000" strokeWidth="2.5" />

    {/* Fluffy Warm Fur Collar */}
    <Path
      d="M 32 18 C 30 10, 42 10, 48 16 C 54 10, 66 10, 64 18 C 68 28, 54 30, 48 24 C 42 30, 28 28, 32 18 Z"
      fill="#FDE047"
      stroke="#000000"
      strokeWidth="2.5"
    />

    {/* Center Zipper Line */}
    <Line x1="48" y1="24" x2="48" y2="84" stroke="#000000" strokeWidth="3" />
    {/* Zipper Pull Tag */}
    <Rect x="45" y="32" width="6" height="8" rx="2" fill="#B0FF49" stroke="#000000" strokeWidth="1.5" />

    {/* Pockets */}
    <Rect x="28" y="60" width="12" height="12" rx="3" fill="#EA580C" stroke="#000000" strokeWidth="2" />
    <Rect x="56" y="60" width="12" height="12" rx="3" fill="#EA580C" stroke="#000000" strokeWidth="2" />

    {/* Snowflake / Warmth badge */}
    <Circle cx="80" cy="24" r="7" fill="#B0FF49" stroke="#000000" strokeWidth="2" />
    <Path d="M 80 20 L 80 28 M 76 24 L 84 24" stroke="#000000" strokeWidth="2" />
  </Svg>
);

/**
 * 3. PREMIUM DRYCLEANING VECTOR
 * Luxurious golden hanger + clean sparkling dress / suit silhouette + sparkle stars
 */
export const DryCleanVector: React.FC<VectorProps> = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Shadow */}
    <Path
      d="M 50 16 C 58 16 58 26 50 26 L 82 48 L 74 88 L 26 88 L 18 48 L 46 26 Z"
      fill="#000000"
    />

    {/* Garment Bag / Clean Suit */}
    <Path
      d="M 48 24 L 80 46 L 72 86 L 24 86 L 16 46 Z"
      fill="#8B5CF6"
      stroke="#000000"
      strokeWidth="3"
    />

    {/* Garment Trim / Center Crease */}
    <Line x1="48" y1="24" x2="48" y2="86" stroke="#000000" strokeWidth="2.5" />

    {/* Gold Luxury Hanger Hook */}
    <Path
      d="M 48 10 C 56 10 56 22 48 24 L 48 28"
      stroke="#000000"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <Path
      d="M 48 10 C 56 10 56 22 48 24"
      stroke="#FDE047"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Gold Hanger Bar */}
    <Path d="M 22 44 L 48 26 L 74 44 Z" fill="#FDE047" stroke="#000000" strokeWidth="2.5" />

    {/* Big 4-point Sparkle Stars */}
    <Path
      d="M 80 20 Q 80 26 86 26 Q 80 26 80 32 Q 80 26 74 26 Q 80 26 80 20 Z"
      fill="#B0FF49"
      stroke="#000000"
      strokeWidth="1.5"
    />
    <Path
      d="M 18 30 Q 18 34 22 34 Q 18 34 18 38 Q 18 34 14 34 Q 18 34 18 30 Z"
      fill="#FDE047"
      stroke="#000000"
      strokeWidth="1.5"
    />
    <Path
      d="M 76 68 Q 76 72 80 72 Q 76 72 76 76 Q 76 72 72 72 Q 76 72 76 68 Z"
      fill="#B0FF49"
      stroke="#000000"
      strokeWidth="1.5"
    />
  </Svg>
);

/**
 * 4. BEDSHEETS, BEDDING & CURTAINS VECTOR
 * Stacked plush pillows, folded bedsheet duvet, and fresh ironed lines
 */
export const BeddingVector: React.FC<VectorProps> = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Base Shadow */}
    <Rect x="16" y="24" width="68" height="66" rx="12" fill="#000000" />

    {/* Bottom Folded Duvet / Sheet */}
    <Rect x="12" y="52" width="68" height="34" rx="8" fill="#10B981" stroke="#000000" strokeWidth="3" />
    <Line x1="12" y1="68" x2="80" y2="68" stroke="#000000" strokeWidth="2.5" />

    {/* Quilted pattern lines on sheet */}
    <Line x1="28" y1="52" x2="28" y2="86" stroke="#059669" strokeWidth="2" strokeDasharray="3 3" />
    <Line x1="46" y1="52" x2="46" y2="86" stroke="#059669" strokeWidth="2" strokeDasharray="3 3" />
    <Line x1="64" y1="52" x2="64" y2="86" stroke="#059669" strokeWidth="2" strokeDasharray="3 3" />

    {/* Top Left Pillow */}
    <Rect x="16" y="22" width="34" height="26" rx="8" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
    <Path d="M 22 28 C 30 32, 36 32, 44 28" stroke="#E5E7EB" strokeWidth="2" />

    {/* Top Right Pillow */}
    <Rect x="44" y="18" width="34" height="28" rx="8" fill="#B0FF49" stroke="#000000" strokeWidth="3" />
    <Path d="M 50 26 C 58 30, 64 30, 72 26" stroke="#000000" strokeWidth="2" />

    {/* Feather / Comfort badge */}
    <Circle cx="82" cy="40" r="6" fill="#FDE047" stroke="#000000" strokeWidth="2" />
    <Path d="M 80 37 Q 84 40 82 43" stroke="#000000" strokeWidth="1.5" />
  </Svg>
);

/**
 * 5. FORMAL SUITS & INTERVIEW WEAR VECTOR
 * Sharp formal jacket with tie, lapels, and crisp pocket square
 */
export const SuitsVector: React.FC<VectorProps> = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Shadow */}
    <Path d="M 20 24 L 50 14 L 80 24 L 78 86 L 22 86 Z" fill="#000000" />

    {/* Blazer Outer */}
    <Path
      d="M 18 22 L 48 12 L 78 22 L 76 84 L 20 84 Z"
      fill="#1E293B"
      stroke="#000000"
      strokeWidth="3"
    />

    {/* White Shirt V-Neck */}
    <Polygon points="48,12 36,44 60,44" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />

    {/* Red / Gold Silk Tie */}
    <Polygon points="48,22 52,26 50,56 48,60 46,56 44,26" fill="#EF4444" stroke="#000000" strokeWidth="1.5" />

    {/* Lapels */}
    <Polygon points="18,22 36,48 48,72 40,72 20,44" fill="#0F172A" stroke="#000000" strokeWidth="2.5" />
    <Polygon points="78,22 60,48 48,72 56,72 76,44" fill="#0F172A" stroke="#000000" strokeWidth="2.5" />

    {/* Pocket Square (Neon Lime) */}
    <Rect x="26" y="46" width="10" height="3" fill="#B0FF49" stroke="#000000" strokeWidth="1.5" />
    <Polygon points="28,46 31,40 34,46" fill="#B0FF49" stroke="#000000" strokeWidth="1" />

    {/* Buttons */}
    <Circle cx="48" cy="68" r="2.5" fill="#FDE047" stroke="#000000" strokeWidth="1" />
    <Circle cx="48" cy="76" r="2.5" fill="#FDE047" stroke="#000000" strokeWidth="1" />
  </Svg>
);

/**
 * 6. CURTAINS & DRAPES VECTOR
 * Elegant pleated curtain hanging on rings
 */
export const CurtainsVector: React.FC<VectorProps> = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Shadow */}
    <Rect x="14" y="24" width="76" height="66" rx="4" fill="#000000" />

    {/* Rod & Finials */}
    <Rect x="8" y="16" width="84" height="6" rx="3" fill="#FDE047" stroke="#000000" strokeWidth="2.5" />
    <Circle cx="8" cy="19" r="5" fill="#FDE047" stroke="#000000" strokeWidth="2" />
    <Circle cx="92" cy="19" r="5" fill="#FDE047" stroke="#000000" strokeWidth="2" />

    {/* Hanging Rings */}
    <Circle cx="22" cy="19" r="3" stroke="#000000" strokeWidth="1.5" />
    <Circle cx="36" cy="19" r="3" stroke="#000000" strokeWidth="1.5" />
    <Circle cx="64" cy="19" r="3" stroke="#000000" strokeWidth="1.5" />
    <Circle cx="78" cy="19" r="3" stroke="#000000" strokeWidth="1.5" />

    {/* Left Drape */}
    <Path
      d="M 14 22 L 40 22 C 34 50, 38 60, 26 86 L 14 86 Z"
      fill="#0D8DE3"
      stroke="#000000"
      strokeWidth="3"
    />
    <Path d="M 24 22 C 28 50, 26 64, 20 86" stroke="#0284C7" strokeWidth="2" />

    {/* Right Drape */}
    <Path
      d="M 86 22 L 60 22 C 66 50, 62 60, 74 86 L 86 86 Z"
      fill="#0D8DE3"
      stroke="#000000"
      strokeWidth="3"
    />
    <Path d="M 76 22 C 72 50, 74 64, 80 86" stroke="#0284C7" strokeWidth="2" />

    {/* Tieback Sashes (Neon Lime) */}
    <Path d="M 14 54 C 20 54, 24 58, 22 62" stroke="#B0FF49" strokeWidth="3" />
    <Path d="M 86 54 C 80 54, 76 58, 78 62" stroke="#B0FF49" strokeWidth="3" />
  </Svg>
);

/**
 * 7. SHOES & SNEAKERS VECTOR
 * Retro pop sneaker with clean white sole and lime/blue accents
 */
export const ShoesVector: React.FC<VectorProps> = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Shadow */}
    <Path d="M 16 54 L 38 32 L 60 36 L 86 58 L 88 80 L 16 80 Z" fill="#000000" />

    {/* Shoe Body */}
    <Path
      d="M 14 52 L 36 30 L 58 34 L 84 56 L 86 78 L 14 78 Z"
      fill="#0D8DE3"
      stroke="#000000"
      strokeWidth="3"
    />

    {/* Thick White Rubber Sole */}
    <Rect x="14" y="66" width="72" height="14" rx="4" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
    <Line x1="14" y1="73" x2="86" y2="73" stroke="#000000" strokeWidth="1.5" />

    {/* Toe Cap */}
    <Path d="M 70 56 Q 86 56 84 66 L 70 66 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />

    {/* Neon Swoosh / Stripe */}
    <Path d="M 28 54 Q 48 44 68 56" stroke="#B0FF49" strokeWidth="4" strokeLinecap="round" />

    {/* Laces */}
    <Line x1="44" y1="36" x2="52" y2="40" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    <Line x1="48" y1="42" x2="56" y2="46" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    <Line x1="52" y1="48" x2="60" y2="52" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

/**
 * 8. DEFAULT / GENERAL LAUNDRY BASKET VECTOR
 * Neo-brutalist laundry hamper with clothes and bubbles
 */
export const DefaultWashVector: React.FC<VectorProps> = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Shadow */}
    <Polygon points="24,36 76,36 68,88 32,88" fill="#000000" />

    {/* Clothes Overflowing Top */}
    <Circle cx="38" cy="30" r="14" fill="#0D8DE3" stroke="#000000" strokeWidth="2.5" />
    <Circle cx="60" cy="28" r="14" fill="#B0FF49" stroke="#000000" strokeWidth="2.5" />
    <Circle cx="50" cy="22" r="12" fill="#FDE047" stroke="#000000" strokeWidth="2.5" />

    {/* Basket Body */}
    <Polygon points="20,34 80,34 70,86 30,86" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />

    {/* Basket Weave / Slits */}
    <Line x1="36" y1="44" x2="33" y2="76" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="50" y1="44" x2="50" y2="76" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="64" y1="44" x2="67" y2="76" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />

    {/* Sparkle */}
    <Path
      d="M 80 18 Q 80 24 86 24 Q 80 24 80 30 Q 80 24 74 24 Q 80 24 80 18 Z"
      fill="#B0FF49"
      stroke="#000000"
      strokeWidth="1.5"
    />
  </Svg>
);

/**
 * Universal Vector Dispatcher:
 * Resolves any category or item name to its corresponding high-res SVG vector.
 * If a custom remote URL is provided (http... / data...), renders ExpoImage.
 */
interface CategoryVectorIllustrationProps {
  categoryName?: string;
  itemName?: string;
  customImage?: string;
  size?: number;
}

import { getCategoryIllustrationUrl, getItemIllustrationUrl } from '../utils/categoryAssets';

export const CategoryVectorIllustration: React.FC<CategoryVectorIllustrationProps> = ({
  categoryName,
  itemName,
  customImage,
  size = 80,
}) => {
  const imageUrl = (
    itemName
      ? getItemIllustrationUrl(itemName, categoryName, customImage)
      : getCategoryIllustrationUrl(categoryName, customImage)
  ) || 'https://res.cloudinary.com/ddzre9tcd/image/upload/v1787836197/wow_laundry_vectors/vector_normal.png';

  return (
    <ExpoImage
      source={{ uri: imageUrl }}
      style={{ width: size, height: size }}
      contentFit="contain"
      priority="high"
      cachePolicy="memory-disk"
      transition={150}
    />
  );
};
