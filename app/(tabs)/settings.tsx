import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Colors, cardShadow, withAlpha } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { listAgents } from '@/services/adminApi';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://webazi-digital-solutions.onrender.com';
const ADMIN_KEY = process.env.EXPO_PUBLIC_ADMIN_KEY || '';

function maskKey(key: string) {
  if (!key) return 'Not set';
  if (key.length <= 8) return '•'.repeat(key.length);
  return key.slice(0, 4) + '•'.repeat(Math.max(4, key.length - 8)) + key.slice(-4);
}

export default function AdminSettings() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await listAgents();
    setTesting(false);
    setTestResult(
      result.ok
        ? { ok: true, message: `Connected — ${result.agents.length} client${result.agents.length === 1 ? '' : 's'} found.` }
        : { ok: false, message: result.reason }
    );
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100, gap: 16 }}>
      <Text style={[styles.title, { color: c.text }]}>Settings</Text>

      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }, cardShadow(false)]}>
        <Text style={[styles.cardLabel, { color: c.textSecondary }]}>Backend connection</Text>

        <Row colors={c} icon="dns" label="Server URL" value={BASE_URL} />
        <Row colors={c} icon="vpn-key" label="Admin key" value={maskKey(ADMIN_KEY)} />

        {!ADMIN_KEY && (
          <Text style={{ color: c.error, fontSize: 12, marginTop: 8 }}>
            No admin key baked into this build. Set EXPO_PUBLIC_ADMIN_KEY in .env to the same value as your
            server's ADMIN_API_KEY, then rebuild.
          </Text>
        )}

        <Pressable
          onPress={runTest}
          disabled={testing}
          style={[styles.testBtn, { backgroundColor: c.tint, opacity: testing ? 0.7 : 1 }]}>
          {testing ? <ActivityIndicator color={c.onTint} /> : (
            <Text style={{ color: c.onTint, fontWeight: '700', fontSize: 13 }}>Test connection</Text>
          )}
        </Pressable>

        {testResult && (
          <View style={[styles.resultBox, { backgroundColor: withAlpha(testResult.ok ? c.success : c.error, 0.12) }]}>
            <MaterialIcons
              name={testResult.ok ? 'check-circle' : 'error'}
              size={16}
              color={testResult.ok ? c.success : c.error}
            />
            <Text style={{ color: testResult.ok ? c.success : c.error, fontSize: 12, marginLeft: 6, flex: 1 }}>
              {testResult.message}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }, cardShadow(false)]}>
        <Text style={[styles.cardLabel, { color: c.textSecondary }]}>About this app</Text>
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>
          This is the admin-only companion to the Webazi Agent and Free-access apps. It has no login screen by
          design — access is controlled by which build you install, since the admin key above is compiled into
          it. Keep this app's install file private; anyone with it has full read + revoke access to every
          client's subscription.
        </Text>
      </View>
    </ScrollView>
  );
}

function Row({
  colors: c,
  icon,
  label,
  value,
}: {
  colors: (typeof Colors)['light'];
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <MaterialIcons name={icon} size={16} color={c.muted} />
      <Text style={{ color: c.textSecondary, fontSize: 12, marginLeft: 8, flex: 1 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardLabel: { fontSize: 12, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  testBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  resultBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 10, marginTop: 10 },
});
