import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';

import { Colors, Gradients, cardShadow, withAlpha } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAgentsStore } from '@/store/useAgentsStore';
import { Agent, AgentStatus } from '@/services/adminApi';

const PRICE: Record<number, number> = { 1: 300, 2: 600 };

export default function AdminHome() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const gradient = Gradients[scheme].tint;
  const insets = useSafeAreaInsets();

  const { agents, loading, error, refresh } = useAgentsStore();

  useEffect(() => {
    refresh();
  }, []);

  const counts = agents.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    },
    {} as Record<AgentStatus, number>
  );

  const mrr = agents
    .filter((a) => a.lastPaidAt && new Date(a.lastPaidAt).getMonth() === new Date().getMonth())
    .reduce((sum, a) => sum + (a.lastPaidMonths ? PRICE[a.lastPaidMonths] ?? 0 : 0), 0);

  const recent = [...agents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={c.tint} />}>
      <LinearGradient colors={gradient} style={[styles.header, { paddingTop: insets.top + 18 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialIcons name="admin-panel-settings" size={22} color="#fff" />
          <Text style={styles.headerTitle}>Webazi Admin</Text>
        </View>
        <Text style={styles.headerSubtitle}>Client subscriptions overview</Text>
      </LinearGradient>

      <View style={{ paddingHorizontal: 16, marginTop: -28 }}>
        <View style={[styles.heroCard, { backgroundColor: c.surface, borderColor: c.border }, cardShadow()]}>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>Estimated revenue this month</Text>
          <Text style={{ color: c.text, fontSize: 30, fontWeight: '800', marginTop: 2 }}>
            KES {mrr.toLocaleString()}
          </Text>
          <Text style={{ color: c.muted, fontSize: 11, marginTop: 4 }}>
            {agents.length} total client{agents.length === 1 ? '' : 's'} registered
          </Text>
        </View>

        {error && (
          <Text style={{ color: c.error, fontSize: 12, marginTop: 10 }}>
            Couldn't reach the server: {error}
          </Text>
        )}

        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Status breakdown</Text>
        <View style={styles.statRow}>
          <StatChip colors={c} icon="hourglass-top" label="Trial" value={counts.trial ?? 0} tint="#D99A1F" />
          <StatChip colors={c} icon="check-circle" label="Active" value={counts.active ?? 0} tint="#16A34A" />
          <StatChip colors={c} icon="cancel" label="Expired" value={counts.expired ?? 0} tint="#DC2626" />
          <StatChip colors={c} icon="block" label="Revoked" value={counts.revoked ?? 0} tint="#7C3AED" />
          <StatChip colors={c} icon="star" label="Free" value={counts.free ?? 0} tint="#0EA5E9" />
        </View>

        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Quick actions</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <QuickAction colors={c} icon="people-alt" label="View clients" onPress={() => router.push('/clients')} />
          <QuickAction colors={c} icon="refresh" label="Refresh data" onPress={refresh} />
        </View>

        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Recently updated</Text>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          {recent.length === 0 && (
            <Text style={{ color: c.muted, fontSize: 13, padding: 14 }}>
              {loading ? 'Loading…' : 'No clients registered yet.'}
            </Text>
          )}
          {recent.map((a, i) => (
            <ActivityRow key={a.id} agent={a} colors={c} isLast={i === recent.length - 1} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function StatChip({
  colors: c,
  icon,
  label,
  value,
  tint,
}: {
  colors: (typeof Colors)['light'];
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: number;
  tint: string;
}) {
  return (
    <View style={[styles.statChip, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.statIconWrap, { backgroundColor: withAlpha(tint, 0.15) }]}>
        <MaterialIcons name={icon} size={16} color={tint} />
      </View>
      <Text style={{ color: c.text, fontWeight: '800', fontSize: 16, marginTop: 4 }}>{value}</Text>
      <Text style={{ color: c.textSecondary, fontSize: 10 }}>{label}</Text>
    </View>
  );
}

function QuickAction({
  colors: c,
  icon,
  label,
  onPress,
}: {
  colors: (typeof Colors)['light'];
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.quickAction, { backgroundColor: c.surface, borderColor: c.border }]}>
      <MaterialIcons name={icon} size={18} color={c.tint} />
      <Text style={{ color: c.text, fontSize: 12, fontWeight: '600', marginTop: 6 }}>{label}</Text>
    </Pressable>
  );
}

function ActivityRow({ agent, colors: c, isLast }: { agent: Agent; colors: (typeof Colors)['light']; isLast: boolean }) {
  return (
    <View style={[styles.activityRow, !isLast && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontWeight: '600', fontSize: 13 }}>{agent.notificationNumber}</Text>
        <Text style={{ color: c.muted, fontSize: 11 }}>
          Updated {new Date(agent.updatedAt).toLocaleString()}
        </Text>
      </View>
      <StatusBadge status={agent.status} colors={c} />
    </View>
  );
}

export function StatusBadge({ status, colors: c }: { status: AgentStatus; colors: (typeof Colors)['light'] }) {
  const map: Record<AgentStatus, { label: string; tint: string }> = {
    trial: { label: 'Trial', tint: '#D99A1F' },
    active: { label: 'Active', tint: '#16A34A' },
    expired: { label: 'Expired', tint: '#DC2626' },
    revoked: { label: 'Revoked', tint: '#7C3AED' },
    free: { label: 'Free', tint: '#0EA5E9' },
  };
  const m = map[status];
  return (
    <View style={[styles.badge, { backgroundColor: withAlpha(m.tint, 0.15) }]}>
      <Text style={{ color: m.tint, fontSize: 11, fontWeight: '700' }}>{m.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 44, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  heroCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  statRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statChip: { flexBasis: '18%', flexGrow: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'flex-start' },
  statIconWrap: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  quickAction: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, alignItems: 'center' },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  activityRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
});
