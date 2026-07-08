import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { LayoutDashboard, BarChart3, Download, Music, Wrench } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#100e0c',
            borderTopWidth: 1,
            borderTopColor: 'rgba(168,162,158,0.1)',
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom, 6),
            height: 58 + Math.max(insets.bottom, 0),
          },
          tabBarActiveTintColor: '#d97706',
          tabBarInactiveTintColor: '#78716c',
          tabBarLabelStyle: {
            fontFamily: 'monospace',
            fontSize: 10,
            marginTop: 2,
          },
          sceneStyle: { backgroundColor: '#0c0a09' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="statistics"
          options={{
            title: 'Statistics',
            tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="download"
          options={{
            title: 'Downloads',
            tabBarIcon: ({ color, size }) => <Download color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="spotify"
          options={{
            title: 'Spotify',
            tabBarIcon: ({ color, size }) => <Music color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="tools"
          options={{
            title: 'Tools',
            tabBarIcon: ({ color, size }) => <Wrench color={color} size={size} />,
          }}
        />
      </Tabs>
    </>
  );
}
