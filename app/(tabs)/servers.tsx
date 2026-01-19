import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Gradients, StatusColors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { fetchServers, wsClient } from '@/services/api';
import type { Server } from '@/types';

export default function ServersScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'dark'];
    const [refreshing, setRefreshing] = useState(false);
    const [servers, setServers] = useState<Server[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUrl, setNewUrl] = useState('');
    const [newName, setNewName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const loadServers = useCallback(async () => {
        const data = await fetchServers();
        if (data.length > 0) setServers(data);
    }, []);

    useEffect(() => {
        loadServers();
        wsClient.connect();

        const unsub = wsClient.subscribe('servers_update', (data) => {
            setServers(data.servers);
        });

        const unsubAdd = wsClient.subscribe('server_added', (data) => {
            setServers(prev => [...prev, data.data]);
        });

        return () => {
            unsub();
            unsubAdd();
        };
    }, [loadServers]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadServers();
        setRefreshing(false);
    }, [loadServers]);

    const handleAddWebsite = async () => {
        if (!newUrl.trim()) {
            Alert.alert('Error', 'Please enter a URL');
            return;
        }

        // Add https if missing
        let url = newUrl.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        setIsAdding(true);
        try {
            const response = await fetch('http://localhost:3001/api/servers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, name: newName.trim() || undefined }),
            });

            if (response.ok) {
                setNewUrl('');
                setNewName('');
                setShowAddModal(false);
                loadServers();
            } else {
                const error = await response.json();
                Alert.alert('Error', error.error || 'Failed to add website');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to connect to backend');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveWebsite = async (id: string, name: string) => {
        // Use confirm on web, Alert on native
        const shouldRemove = Platform.OS === 'web'
            ? window.confirm(`Stop monitoring ${name}?`)
            : await new Promise(resolve => {
                Alert.alert(
                    'Remove Website',
                    `Stop monitoring ${name}?`,
                    [
                        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                        { text: 'Remove', style: 'destructive', onPress: () => resolve(true) },
                    ]
                );
            });

        if (shouldRemove) {
            try {
                const response = await fetch(`http://localhost:3001/api/servers/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    setServers(prev => prev.filter(s => s.id !== id));
                } else {
                    Platform.OS === 'web'
                        ? window.alert('Failed to remove website')
                        : Alert.alert('Error', 'Failed to remove website');
                }
            } catch (error) {
                Platform.OS === 'web'
                    ? window.alert('Failed to remove website')
                    : Alert.alert('Error', 'Failed to remove website');
            }
        }
    };

    const filteredServers = servers.filter(server => {
        if (filter === 'all') return true;
        return server.status === filter;
    });

    const statusCounts = {
        all: servers.length,
        healthy: servers.filter(s => s.status === 'healthy').length,
        warning: servers.filter(s => s.status === 'warning').length,
        critical: servers.filter(s => s.status === 'critical').length,
    };

    const FilterChip = ({ value, label }: { value: string; label: string }) => (
        <TouchableOpacity
            onPress={() => setFilter(value)}
            activeOpacity={0.7}
            style={[
                styles.filterChip,
                filter === value && styles.filterChipActive,
                { borderColor: filter === value ? StatusColors.primary : colors.border },
            ]}
        >
            <View
                style={[
                    styles.filterDot,
                    {
                        backgroundColor:
                            value === 'healthy' ? StatusColors.success :
                                value === 'warning' ? StatusColors.warning :
                                    value === 'critical' ? StatusColors.danger :
                                        colors.textSecondary,
                    },
                ]}
            />
            <Text style={[styles.filterLabel, { color: filter === value ? StatusColors.primary : colors.text }]}>
                {label}
            </Text>
            <Text style={[styles.filterCount, { color: colors.textSecondary }]}>
                {statusCounts[value as keyof typeof statusCounts]}
            </Text>
        </TouchableOpacity>
    );

    const WebsiteCard = ({ website }: { website: any }) => {
        const statusColor =
            website.status === 'healthy' ? StatusColors.success :
                website.status === 'warning' ? StatusColors.warning :
                    StatusColors.danger;

        return (
            <Card style={styles.serverCard}>
                <View style={styles.serverHeader}>
                    <View style={styles.serverInfo}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <View style={styles.serverDetails}>
                            <Text style={[styles.serverName, { color: colors.text }]}>{website.name}</Text>
                            <Text style={[styles.serverHost, { color: colors.textSecondary }]} numberOfLines={1}>
                                {website.host || website.url}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.serverActions}>
                        <Badge
                            label={website.status?.toUpperCase() || 'CHECKING'}
                            variant={
                                website.status === 'healthy' ? 'success' :
                                    website.status === 'warning' ? 'warning' : 'danger'
                            }
                            size="sm"
                        />
                        <TouchableOpacity
                            onPress={() => handleRemoveWebsite(website.id, website.name)}
                            style={styles.removeButton}
                        >
                            <Ionicons name="trash-outline" size={18} color={StatusColors.danger} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.metricsRow}>
                    <View style={styles.metric}>
                        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.metricValue, { color: colors.text }]}>
                            {website.metrics?.responseTime || 0}ms
                        </Text>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Response</Text>
                    </View>

                    <View style={styles.metric}>
                        <Ionicons name="pulse-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.metricValue, { color: colors.text }]}>
                            {website.metrics?.statusCode || '---'}
                        </Text>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Status</Text>
                    </View>

                    <View style={styles.metric}>
                        <Ionicons name="trending-up-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.metricValue, { color: colors.text }]}>
                            {website.metrics?.uptime || 100}%
                        </Text>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Uptime</Text>
                    </View>

                    <View style={styles.metric}>
                        <Ionicons
                            name={website.metrics?.ssl ? 'lock-closed' : 'lock-open'}
                            size={16}
                            color={website.metrics?.ssl ? StatusColors.success : StatusColors.warning}
                        />
                        <Text style={[styles.metricValue, { color: colors.text }]}>
                            {website.metrics?.ssl ? 'Yes' : 'No'}
                        </Text>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>SSL</Text>
                    </View>
                </View>

                {website.metrics?.lastError && (
                    <View style={[styles.errorBanner, { backgroundColor: StatusColors.dangerBg }]}>
                        <Ionicons name="alert-circle" size={16} color={StatusColors.danger} />
                        <Text style={[styles.errorText, { color: StatusColors.danger }]} numberOfLines={2}>
                            {website.metrics.lastError}
                        </Text>
                    </View>
                )}

                {website.lastChecked && (
                    <Text style={[styles.lastChecked, { color: colors.textSecondary }]}>
                        Last checked: {new Date(website.lastChecked).toLocaleTimeString()}
                    </Text>
                )}
            </Card>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: colors.text }]}>Websites</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Monitoring {servers.length} sites
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => setShowAddModal(true)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={Gradients.primary as [string, string]}
                        style={styles.addButton}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filters}
            >
                <FilterChip value="all" label="All" />
                <FilterChip value="healthy" label="Healthy" />
                <FilterChip value="warning" label="Warning" />
                <FilterChip value="critical" label="Critical" />
            </ScrollView>

            {/* Server List */}
            <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
                }
                showsVerticalScrollIndicator={false}
            >
                {filteredServers.length > 0 ? (
                    filteredServers.map(server => (
                        <WebsiteCard key={server.id} website={server} />
                    ))
                ) : (
                    <Card style={styles.emptyCard}>
                        <Ionicons name="globe-outline" size={48} color={colors.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No websites found</Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Add a website to start monitoring
                        </Text>
                    </Card>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add Website Modal */}
            <Modal visible={showAddModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Website</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Website URL *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="https://example.com"
                            placeholderTextColor={colors.textSecondary}
                            value={newUrl}
                            onChangeText={setNewUrl}
                            keyboardType="url"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Display Name (optional)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="My Website"
                            placeholderTextColor={colors.textSecondary}
                            value={newName}
                            onChangeText={setNewName}
                        />

                        <Button
                            title={isAdding ? 'Adding...' : 'Add Website'}
                            onPress={handleAddWebsite}
                            loading={isAdding}
                            style={{ marginTop: Layout.spacing.md }}
                        />
                    </View>
                </View>
            </Modal>
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
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filters: {
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.sm,
        gap: Layout.spacing.sm,
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
    filterDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    filterLabel: { fontSize: Layout.fontSize.sm, fontWeight: '500' },
    filterCount: { fontSize: Layout.fontSize.sm, marginLeft: 4 },
    list: { flex: 1 },
    listContent: { padding: Layout.spacing.md, gap: Layout.spacing.md },
    serverCard: { padding: Layout.spacing.md },
    serverHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    serverInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
    serverDetails: { flex: 1 },
    serverName: { fontSize: Layout.fontSize.md, fontWeight: '600' },
    serverHost: { fontSize: Layout.fontSize.sm, marginTop: 2 },
    serverActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    removeButton: { padding: 8 },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: Layout.spacing.md,
        paddingTop: Layout.spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    metric: { alignItems: 'center', gap: 4 },
    metricValue: { fontSize: Layout.fontSize.md, fontWeight: '600' },
    metricLabel: { fontSize: Layout.fontSize.xs },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Layout.spacing.sm,
        borderRadius: Layout.radius.md,
        marginTop: Layout.spacing.md,
        gap: 8,
    },
    errorText: { flex: 1, fontSize: Layout.fontSize.sm },
    lastChecked: { fontSize: Layout.fontSize.xs, marginTop: Layout.spacing.sm, textAlign: 'right' },
    emptyCard: { alignItems: 'center', padding: Layout.spacing.xl },
    emptyTitle: { fontSize: Layout.fontSize.lg, fontWeight: '600', marginTop: Layout.spacing.md },
    emptyText: { fontSize: Layout.fontSize.md, marginTop: Layout.spacing.xs },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: Layout.spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 40 : Layout.spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.lg,
    },
    modalTitle: { fontSize: Layout.fontSize.xl, fontWeight: '700' },
    inputLabel: { fontSize: Layout.fontSize.sm, marginBottom: 8, marginTop: Layout.spacing.md },
    input: {
        borderWidth: 1,
        borderRadius: Layout.radius.md,
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: 14,
        fontSize: Layout.fontSize.md,
    },
});
