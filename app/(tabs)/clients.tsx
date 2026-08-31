import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Colors, cardShadow, withAlpha } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAgentsStore } from '@/store/useAgentsStore';
import { Agent, AgentStatus, revokeAgent, extendAgent, setFreeAccess, deleteAgent } from '@/services/adminApi';
import { StatusBadge } from './index';

type Filter = 'all' | AgentStatus;

export default function Clients() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  const { agents, loading, refresh } = useAgentsStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      if (filter !== 'all' && a.status !== filter) return false;
      if (query.trim() && !a.notificationNumber.includes(query.trim())) return false;
      return true;
    });
  }, [agents, filter, query]);

  const doAction = async (fn: () => Promise<{ ok: boolean; reason?: string }>, id: string) => {
    setBusyId(id);
    const result = await fn();
    setBusyId(null);
    if (!result.ok) {
      Alert.alert('Action failed', result.reason || 'Unknown error');
    } else {
      refresh();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top + 12 }}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: c.text }]}>Clients</Text>
      </View>

      <View style={[styles.searchBar, { backgroundColor: c.surface, borderColor: c.border }]}>
        <MaterialIcons name="search" size={18} color={c.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by phone number…"
          placeholderTextColor={c.muted}
          keyboardType="phone-pad"
          style={{ flex: 1, color: c.text, paddingVertical: 10, marginLeft: 6 }}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {(['all', 'trial', 'active', 'expired', 'revoked', 'free'] as Filter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.chip,
              { backgroundColor: filter === f ? c.tint : c.surface, borderColor: filter === f ? c.tint : c.border },
            ]}>
            <Text style={{ color: filter === f ? c.onTint : c.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>
              {f}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100, gap: 10 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={c.tint} />}>
        {filtered.length === 0 && (
          <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center', marginTop: 30 }}>
            {loading ? 'Loading…' : 'No clients match.'}
          </Text>
        )}

        {filtered.map((a) => (
          <ClientCard
            key={a.id}
            agent={a}
            colors={c}
            expanded={expandedId === a.id}
            busy={busyId === a.id}
            onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
            onRevoke={() => doAction(() => revokeAgent(a.id, !a.revoked), a.id)}
            onExtend={(days) => doAction(() => extendAgent(a.id, days), a.id)}
            onToggleFree={() => doAction(() => setFreeAccess(a.id, !a.isFreeAccess), a.id)}
            onDelete={() =>
              Alert.alert('Delete client?', `This permanently removes ${a.notificationNumber} from the database.`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => doAction(() => deleteAgent(a.id), a.id) },
              ])
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

function ClientCard({
  agent: a,
  colors: c,
  expanded,
  busy,
  onToggle,
  onRevoke,
  onExtend,
  onToggleFree,
  onDelete,
}: {
  agent: Agent;
  colors: (typeof Colors)['light'];
  expanded: boolean;
  busy: boolean;
  onToggle: () => void;
  onRevoke: () => void;
  onExtend: (days: number) => void;
  onToggleFree: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }, cardShadow(false)]}>
      <Pressable onPress={onToggle} style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: withAlpha(c.tint, 0.15) }]}>
          <MaterialIcons name="person" size={20} color={c.tint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>{a.notificationNumber}</Text>
          <Text style={{ color: c.muted, fontSize: 11 }}>
            {a.buildVariant === 'free' ? 'Free-access build' : 'Agent build'} · joined{' '}
            {new Date(a.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <StatusBadge status={a.status} colors={c} />
      </Pressable>

      {expanded && (
        <View style={[styles.detail, { borderTopColor: c.border }]}>
          <DetailLine
            colors={c}
            label="Trial ends"
            value={a.trialEndsAt ? new Date(a.trialEndsAt).toLocaleString() : '—'}
          />
          <DetailLine
            colors={c}
            label="Subscription ends"
            value={a.subscriptionEndsAt ? new Date(a.subscriptionEndsAt).toLocaleString() : '—'}
          />
          <DetailLine
            colors={c}
            label="Last payment"
            value={a.lastPaidAt ? `${a.lastPaidMonths} mo · ${new Date(a.lastPaidAt).toLocaleDateString()}` : '—'}
          />

          <View style={styles.actionRow}>
            <ActionBtn colors={c} label={a.revoked ? 'Unrevoke' : 'Revoke'} icon="block" tint={c.error} onPress={onRevoke} disabled={busy} />
            <ActionBtn colors={c} label="+7 days" icon="add" tint={c.tint} onPress={() => onExtend(7)} disabled={busy} />
            <ActionBtn colors={c} label="+30 days" icon="add" tint={c.tint} onPress={() => onExtend(30)} disabled={busy} />
          </View>
          <View style={styles.actionRow}>
            <ActionBtn
              colors={c}
              label={a.isFreeAccess ? 'Remove free access' : 'Grant free access'}
              icon="star"
              tint={c.accent}
              onPress={onToggleFree}
              disabled={busy}
            />
            <ActionBtn colors={c} label="Delete" icon="delete" tint={c.error} onPress={onDelete} disabled={busy} />
          </View>
        </View>
      )}
    </View>
  );
}

function DetailLine({ colors: c, label, value }: { colors: (typeof Colors)['light']; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
      <Text style={{ color: c.textSecondary, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

function ActionBtn({
  colors: c,
  label,
  icon,
  tint,
  onPress,
  disabled,
}: {
  colors: (typeof Colors)['light'];
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  tint: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.actionBtn, { backgroundColor: withAlpha(tint, 0.12), opacity: disabled ? 0.5 : 1 }]}>
      <MaterialIcons name={icon} size={14} color={tint} />
      <Text style={{ color: tint, fontSize: 11, fontWeight: '700', marginLeft: 4 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { paddingHorizontal: 16, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  chipsRow: { marginTop: 10, flexGrow: 0 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  detail: { borderTopWidth: 1, padding: 12 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
});
