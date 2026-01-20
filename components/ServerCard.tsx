import { Colors, StatusColors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Server } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBadge } from './ui/Badge';
import { Card } from './ui/Card';

interface ServerCardProps {
    server: Server;
    onPress?: () => void;
    compact?: boolean;
}

export function ServerCard({ server, onPress, compact = false }: ServerCardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'dark'];

    const getStatusColor = () => {
        switch (server.status) {
            case 'healthy': return StatusColors.success;
            case 'warning': return StatusColors.warning;
            case 'critical': return StatusColors.danger;
            case 'checking': return StatusColors.info;
            case 'offline':
            default: return '#64748B';
        }
    };

    if (compact) {
        return (
            <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
                <Card style={styles.compactCard}>
                    <View style={styles.compactHeader}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                        <Text style={[styles.serverName, { color: colors.text }]} numberOfLines={1}>
                            {server.name}
                        </Text>
                    </View>
                    <View style={styles.compactMetrics}>
                        <View style={styles.compactMetric}>
                            <Ionicons name="flash-outline" size={14} color="#94A3B8" />
                            <Text style={styles.compactValue}>{server.metrics?.responseTime || 0}ms</Text>
                        </View>
                        <View style={styles.compactMetric}>
                            <Ionicons name="checkmark-circle-outline" size={14} color="#94A3B8" />
                            <Text style={styles.compactValue}>{server.metrics?.uptime || 0}%</Text>
                        </View>
                    </View>
                </Card>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
            <Card variant="gradient" style={styles.card}>
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                        <Text style={[styles.serverName, { color: colors.text }]} numberOfLines={1}>
                            {server.name}
                        </Text>
                    </View>
                    <StatusBadge status={server.status as 'healthy' | 'warning' | 'critical' | 'offline'} />
                </View>

                <Text style={styles.host}>{server.host}</Text>

                <View style={styles.metricsRow}>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricValue}>{server.metrics?.responseTime || 0}ms</Text>
                        <Text style={styles.metricLabel}>Response</Text>
                    </View>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricValue}>{server.metrics?.statusCode || '---'}</Text>
                        <Text style={styles.metricLabel}>Status</Text>
                    </View>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricValue}>{server.metrics?.uptime || 0}%</Text>
                        <Text style={styles.metricLabel}>Uptime</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View style={styles.footerItem}>
                        <Ionicons name="checkmark-done-outline" size={14} color="#94A3B8" />
                        <Text style={styles.footerText}>
                            {server.metrics?.successfulChecks || 0}/{server.metrics?.totalChecks || 0} checks
                        </Text>
                    </View>
                    <View style={styles.footerItem}>
                        <Ionicons name={server.metrics?.ssl ? "lock-closed" : "lock-open"} size={14} color={server.metrics?.ssl ? StatusColors.success : '#94A3B8'} />
                        <Text style={styles.footerText}>
                            {server.metrics?.ssl ? 'SSL' : 'No SSL'}
                        </Text>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: Layout.spacing.md,
    },
    compactCard: {
        padding: Layout.spacing.sm,
        marginRight: Layout.spacing.sm,
        minWidth: 140,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.xs,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: Layout.spacing.sm,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: Layout.spacing.sm,
    },
    serverName: {
        fontSize: Layout.fontSize.lg,
        fontWeight: Layout.fontWeight.semibold,
        flex: 1,
    },
    host: {
        fontSize: Layout.fontSize.sm,
        color: '#94A3B8',
        marginBottom: Layout.spacing.md,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: Layout.spacing.md,
    },
    metricItem: {
        alignItems: 'center',
    },
    metricValue: {
        fontSize: Layout.fontSize.xl,
        fontWeight: '700',
        color: '#F8FAFC',
    },
    metricLabel: {
        fontSize: Layout.fontSize.xs,
        color: '#94A3B8',
        marginTop: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        paddingTop: Layout.spacing.sm,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        fontSize: Layout.fontSize.sm,
        color: '#94A3B8',
        marginLeft: 6,
    },
    compactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Layout.spacing.xs,
    },
    compactMetrics: {
        flexDirection: 'row',
        gap: Layout.spacing.sm,
    },
    compactMetric: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    compactValue: {
        fontSize: Layout.fontSize.sm,
        color: '#94A3B8',
    },
});
