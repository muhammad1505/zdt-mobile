import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { Server, DownloadCloud, FileAudio, Settings, Terminal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.background} />
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: Colors.primary,
            shadowColor: Colors.primary,
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 10,
          },
          headerTintColor: Colors.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
          },
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopWidth: 1,
            borderTopColor: Colors.primary,
            paddingTop: 5,
            paddingBottom: Math.max(insets.bottom, 5),
            height: 60 + Math.max(insets.bottom, 0),
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          sceneStyle: { backgroundColor: Colors.background },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <Server color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="download"
          options={{
            title: 'Download',
            tabBarIcon: ({ color, size }) => <DownloadCloud color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Files',
            tabBarIcon: ({ color, size }) => <FileAudio color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="console"
          options={{
            title: 'Console',
            tabBarIcon: ({ color, size }) => <Terminal color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="tools"
          options={{
            title: 'Tools',
            tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Server',
            tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
          }}
        />
      </Tabs>
    </>
  );
}
