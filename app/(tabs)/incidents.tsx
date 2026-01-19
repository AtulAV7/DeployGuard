import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Colors, Gradients, StatusColors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { fetchIncidents, wsClient } from '@/services/api';
import type { Incident } from '@/types';

export default function IncidentsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'dark'];
    const [refreshing, setRefreshing] = useState(false);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [filter, setFilter] = useState<string>('all');

    const loadIncidents = useCallback(async () => {
        const data = await fetchIncidents();
        setIncidents(data);
    }, []);

    useEffect(() => {
        loadIncidents();
        wsClient.connect();

        const unsub = wsClient.subscribe('incidents_update', (data) => {
            setIncidents(data.incidents);
        });

        return () => unsub();
    }, [loadIncidents]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadIncidents();
        setRefreshing(false);
    }, [loadIncidents]);

    const filteredIncidents = incidents.filter(incident => {
        if (filter === 'all') return true;
        if (filter === 'active') return incident.status !== 'resolved';
        return incident.severity === filter;
    });

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return StatusColors.danger;
            case 'high': return '#F97316';
            case 'medium': return StatusColors.warning;
            case 'low': return StatusColors.info;
            default: return colors.textSecondary;
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return 'alert-circle';
            case 'high': return 'warning';
            case 'medium': return 'information-circle';
            case 'low': return 'checkmark-circle';
            default: return 'help-circle';
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    const FilterChip = ({ value, label, count }: { value: string; label: string; count?: number }) => (
        <TouchableOpacity
            onPress={() => setFilter(value)}
            activeOpacity={0.7}
            style={[
                styles.filterChip,
                filter === value && styles.filterChipActive,
                { borderColor: filter === value ? StatusColors.primary : colors.border },
            ]}
        >
            <Text style={[
                styles.filterLabel,
                { color: filter === value ? StatusColors.primary : colors.text }
            ]}>
                {label}
            </Text>
            {count !== undefined && count > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: StatusColors.danger }]}>
                    <Text style={styles.filterBadgeText}>{count}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const IncidentCard = ({ incident }: { incident: Incident }) => {
        const severityColor = getSeverityColor(incident.severity);

        return (
            <Card style={styles.incidentCard}>
                {/* Severity indicator bar */}
                <View style={[styles.severityBar, { backgroundColor: severityColor }]} />

                <View style={styles.incidentContent}>
                    {/* Header */}
                    <View style={styles.incidentHeader}>
                        <View style={styles.incidentMeta}>
                            <View style={[styles.severityBadge, { backgroundColor: `${severityColor}20` }]}>
                                <Ionicons name={getSeverityIcon(incident.severity) as any} size={14} color={severityColor} />
                                <Text style={[styles.severityText, { color: severityColor }]}>
                                    {incident.severity.toUpperCase()}
                                </Text>
                            </View>
                            <Badge
                                label={incident.status}
                                variant={incident.status === 'resolved' ? 'success' : 'default'}
                                size="sm"
                            />
                        </View>
                        <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                            {formatTime(incident.createdAt)}
                        </Text>
                    </View>

                    {/* Title */}
                    <Text style={[styles.incidentTitle, { color: colors.text }]} numberOfLines={2}>
                        {incident.title}
                    </Text>

                    {/* Server info */}
                    <View style={styles.serverInfo}>
                        <Ionicons name="server-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.serverName, { color: colors.textSecondary }]}>
                            {incident.serverName}
                        </Text>
                    </View>

                    {/* Description if available */}
                    {incident.description && (
                        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                            {incident.description}
                        </Text>
                    )}
                </View>
            </Card>
        );
    };

    const activeCount = incidents.filter(i => i.status !== 'resolved').length;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: colors.text }]}>Incidents</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {activeCount} active issue{activeCount !== 1 ? 's' : ''}
                    </Text>
                </View>
                <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
                    <LinearGradient
                        colors={Gradients.primary as [string, string]}
                        style={styles.refreshButton}
                    >
                        <Ionicons name="refresh" size={20} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Filter chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filters}
            >
                <FilterChip value="all" label="All" count={incidents.length} />
                <FilterChip value="active" label="Active" count={activeCount} />
                <FilterChip value="critical" label="Critical" />
                <FilterChip value="high" label="High" />
                <FilterChip value="medium" label="Medium" />
                <FilterChip value="low" label="Low" />
            </ScrollView>

            {/* Incidents list */}
            <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
                }
                showsVerticalScrollIndicator={false}
            >
                {filteredIncidents.length > 0 ? (
                    filteredIncidents.map(incident => (
                        <IncidentCard key={incident.id} incident={incident} />
                    ))
                ) : (
                    <Card style={styles.emptyCard}>
                        <LinearGradient
                            colors={Gradients.success as [string, string]}
                            style={styles.emptyIcon}
                        >
                            <Ionicons name="checkmark-circle" size={32} color="#fff" />
                        </LinearGradient>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            {filter === 'all' ? 'No incidents detected' : `No ${filter} incidents`}
                        </Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            All systems are running smoothly
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.sm,
    },
    title: { fontSize: Layout.fontSize.xl, fontWeight: '700' },
    subtitle: { fontSize: Layout.fontSize.sm, marginTop: 2 },
    refreshButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filters: {
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    filterChipActive: { backgroundColor: 'rgba(99, 102, 241, 0.1)' },
    filterLabel: { fontSize: Layout.fontSize.sm, fontWeight: '500' },
    filterBadge: {
        marginLeft: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    filterBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    list: { flex: 1 },
    listContent: { padding: Layout.spacing.md, gap: Layout.spacing.md },
    incidentCard: {
        padding: 0,
        overflow: 'hidden',
        borderRadius: Layout.radius.lg,
    },
    severityBar: {
        height: 4,
        width: '100%',
    },
    incidentContent: {
        padding: Layout.spacing.md,
    },
    incidentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.sm,
    },
    incidentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    severityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    severityText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    timeText: {
        fontSize: Layout.fontSize.xs,
    },
    incidentTitle: {
        fontSize: Layout.fontSize.md,
        fontWeight: '600',
        lineHeight: 22,
        marginBottom: Layout.spacing.xs,
    },
    serverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: Layout.spacing.xs,
    },
    serverName: {
        fontSize: Layout.fontSize.sm,
    },
    description: {
        fontSize: Layout.fontSize.sm,
        lineHeight: 20,
        marginTop: Layout.spacing.xs,
    },
    emptyCard: {
        alignItems: 'center',
        padding: Layout.spacing.xl,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Layout.spacing.md,
    },
    emptyTitle: {
        fontSize: Layout.fontSize.lg,
        fontWeight: '600',
    },
    emptyText: {
        fontSize: Layout.fontSize.md,
        marginTop: Layout.spacing.xs,
        textAlign: 'center',
    },
});
