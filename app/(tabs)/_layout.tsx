import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Colors, Gradients, cardShadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const TAB_ICON: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  index: 'home',
  clients: 'people-alt',
  settings: 'settings',
};

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const c = Colors[colorScheme];
  const gradient = Gradients[colorScheme].tint;
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: c.onTint,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [
          styles.tabbar,
          { bottom: insets.bottom + 14, backgroundColor: c.surface, borderColor: c.border },
          cardShadow(),
        ],
        tabBarItemStyle: styles.tabbarItem,
        tabBarIcon: ({ focused, color }) => (
          <TabPill focused={focused} gradient={gradient}>
            <MaterialIcons size={20} name={TAB_ICON[route.name] ?? 'home'} color={color} />
          </TabPill>
        ),
      })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="clients" options={{ title: 'Clients' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

function TabPill({
  focused,
  gradient,
  children,
}: {
  focused: boolean;
  gradient: readonly [string, string];
  children: React.ReactNode;
}) {
  if (!focused) return <View style={styles.tabIconWrap}>{children}</View>;
  return (
    <LinearGradient colors={gradient} style={styles.tabIconWrap}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 64,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    elevation: 8,
  },
  tabbarItem: { height: 64, paddingTop: 0 },
  tabIconWrap: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
