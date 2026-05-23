import { ReactNode } from 'react';
import { View } from 'react-native';

export function AppNavigator({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}
