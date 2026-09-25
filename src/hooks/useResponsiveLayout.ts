import { useWindowDimensions } from 'react-native';
export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 1120);
  const columns = contentWidth >= 900 ? 3 : contentWidth >= 600 ? 2 : 1;
  return { columns, cardWidth: (contentWidth - 40 - (columns - 1) * 16) / columns };
}
