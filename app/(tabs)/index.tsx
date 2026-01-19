import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Colors, Gradients, StatusColors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { fetchDashboard, fetchIncidents, fetchServers, wsClient } from '@/services/api';
import type { DashboardSummary, Incident, Server } from '@/types';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const loadData = useCallback(async () => {
    const [summaryData, serversData, incidentsData] = await Promise.all([
      fetchDashboard(),
      fetchServers(),
      fetchIncidents(),
    ]);
    setSummary(summaryData);
    setServers(serversData);
    setIncidents(incidentsData);
  }, []);

  useEffect(() => {
    loadData();
    wsClient.connect();

    const unsub1 = wsClient.subscribe('servers_update', (data) => {
      setServers(data.servers);
    });
    const unsub2 = wsClient.subscribe('incidents_update', (data) => {
      setIncidents(data.incidents);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return StatusColors.danger;
      case 'high': return '#F97316';
      case 'medium': return StatusColors.warning;
      default: return StatusColors.info;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const activeIncidents = incidents.filter(i => i.status !== 'resolved');
  const criticalServers = servers.filter(s => s.status === 'critical');
  const warningServers = servers.filter(s => s.status === 'warning');

  const StatCard = ({
    title,
    value,
    icon,
    color,
    gradient
  }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    gradient?: readonly [string, string];
  }) => (
    <Card style={styles.statCard}>
      {gradient ? (
        <LinearGradient
          colors={gradient as [string, string]}
          style={styles.statIcon}
        >
          <Ionicons name={icon as any} size={20} color="#fff" />
        </LinearGradient>
      ) : (
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
      )}
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/chat')}
          >
            <LinearGradient
              colors={Gradients.primary as [string, string]}
              style={styles.aiButton}
            >
              <Ionicons name="sparkles" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Sites"
            value={summary?.totalServers || servers.length}
            icon="globe-outline"
            color={StatusColors.primary}
            gradient={Gradients.primary}
          />
          <StatCard
            title="Healthy"
            value={summary?.healthyServers || servers.filter(s => s.status === 'healthy').length}
            icon="checkmark-circle"
            color={StatusColors.success}
          />
          <StatCard
            title="Issues"
            value={activeIncidents.length}
            icon="alert-circle"
            color={StatusColors.danger}
          />
          <StatCard
            title="Avg Response"
            value={`${summary?.averageResponseTime || 0}ms`}
            icon="speedometer"
            color={StatusColors.warning}
          />
        </View>

        {/* Critical Alerts Banner */}
        {criticalServers.length > 0 && (
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/servers')}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.alertBanner}
            >
              <Ionicons name="warning" size={24} color="#fff" />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>
                  {criticalServers.length} Critical Alert{criticalServers.length > 1 ? 's' : ''}
                </Text>
                <Text style={styles.alertSubtitle}>
                  {criticalServers.map(s => s.name).join(', ')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Sites Overview */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sites Overview</Text>
          <TouchableOpacity onPress={() => router.push('/servers')}>
            <Text style={[styles.seeAll, { color: StatusColors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>

        {servers.slice(0, 4).map(server => {
          const statusColor =
            server.status === 'healthy' ? StatusColors.success :
              server.status === 'warning' ? StatusColors.warning :
                StatusColors.danger;

          return (
            <Card key={server.id} style={styles.serverCard}>
              <View style={styles.serverRow}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <View style={styles.serverInfo}>
                  <Text style={[styles.serverName, { color: colors.text }]}>{server.name}</Text>
                  <Text style={[styles.serverUrl, { color: colors.textSecondary }]} numberOfLines={1}>
                    {server.host || server.url}
                  </Text>
                </View>
                <View style={styles.serverMetrics}>
                  <Text style={[styles.responseTime, { color: colors.text }]}>
                    {server.metrics?.responseTime || 0}ms
                  </Text>
                  <Badge
                    label={server.metrics?.statusCode?.toString() || '---'}
                    variant={server.metrics?.statusCode === 200 ? 'success' : 'warning'}
                    size="sm"
                  />
                </View>
              </View>
            </Card>
          );
        })}

        {servers.length === 0 && (
          <Card style={styles.emptyCard}>
            <Ionicons name="globe-outline" size={40} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No sites monitored yet
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/servers')}
            >
              <Text style={styles.addButtonText}>Add Website</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Recent Incidents */}
        {activeIncidents.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Incidents</Text>
              <TouchableOpacity onPress={() => router.push('/incidents')}>
                <Text style={[styles.seeAll, { color: StatusColors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>

            {activeIncidents.slice(0, 3).map(incident => (
              <Card key={incident.id} style={styles.incidentCard}>
                <View style={styles.incidentRow}>
                  <View style={[
                    styles.incidentDot,
                    { backgroundColor: getSeverityColor(incident.severity) }
                  ]} />
                  <View style={styles.incidentInfo}>
                    <Text style={[styles.incidentTitle, { color: colors.text }]} numberOfLines={1}>
                      {incident.title}
                    </Text>
                    <Text style={[styles.incidentMeta, { color: colors.textSecondary }]}>
                      {incident.serverName} • {formatTime(incident.createdAt)}
                    </Text>
                  </View>
                  <Badge
                    label={incident.severity}
                    variant={incident.severity === 'critical' ? 'danger' : 'warning'}
                    size="sm"
                  />
                </View>
              </Card>
            ))}
          </>
        )}

        {/* All Good Message */}
        {activeIncidents.length === 0 && servers.length > 0 && (
          <Card style={styles.allGoodCard}>
            <LinearGradient
              colors={Gradients.success as [string, string]}
              style={styles.allGoodIcon}
            >
              <Ionicons name="checkmark-circle" size={28} color="#fff" />
            </LinearGradient>
            <Text style={[styles.allGoodTitle, { color: colors.text }]}>All Systems Operational</Text>
            <Text style={[styles.allGoodText, { color: colors.textSecondary }]}>
              No active incidents detected
            </Text>
          </Card>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: Layout.spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  greeting: { fontSize: Layout.fontSize.sm },
  title: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  aiButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Layout.spacing.md,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.sm,
  },
  statValue: { fontSize: Layout.fontSize.xl, fontWeight: '700' },
  statTitle: { fontSize: Layout.fontSize.xs, marginTop: 4 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    marginBottom: Layout.spacing.lg,
  },
  alertContent: { flex: 1, marginLeft: Layout.spacing.md },
  alertTitle: { color: '#fff', fontSize: Layout.fontSize.md, fontWeight: '600' },
  alertSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: Layout.fontSize.sm, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
  },
  sectionTitle: { fontSize: Layout.fontSize.lg, fontWeight: '600' },
  seeAll: { fontSize: Layout.fontSize.sm, fontWeight: '500' },
  serverCard: { padding: Layout.spacing.md, marginBottom: Layout.spacing.sm },
  serverRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  serverInfo: { flex: 1, marginLeft: Layout.spacing.md },
  serverName: { fontSize: Layout.fontSize.md, fontWeight: '500' },
  serverUrl: { fontSize: Layout.fontSize.sm, marginTop: 2 },
  serverMetrics: { alignItems: 'flex-end', gap: 4 },
  responseTime: { fontSize: Layout.fontSize.sm, fontWeight: '600' },
  emptyCard: { alignItems: 'center', padding: Layout.spacing.xl },
  emptyText: { fontSize: Layout.fontSize.md, marginTop: Layout.spacing.md },
  addButton: {
    marginTop: Layout.spacing.md,
    backgroundColor: StatusColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  incidentCard: { padding: Layout.spacing.md, marginBottom: Layout.spacing.sm },
  incidentRow: { flexDirection: 'row', alignItems: 'center' },
  incidentDot: { width: 8, height: 8, borderRadius: 4 },
  incidentInfo: { flex: 1, marginLeft: Layout.spacing.md },
  incidentTitle: { fontSize: Layout.fontSize.md, fontWeight: '500' },
  incidentMeta: { fontSize: Layout.fontSize.sm, marginTop: 2 },
  allGoodCard: { alignItems: 'center', padding: Layout.spacing.xl, marginTop: Layout.spacing.md },
  allGoodIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allGoodTitle: { fontSize: Layout.fontSize.lg, fontWeight: '600', marginTop: Layout.spacing.md },
  allGoodText: { fontSize: Layout.fontSize.md, marginTop: 4 },
});
