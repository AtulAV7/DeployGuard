import { Colors, StatusColors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Server } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MetricChart } from './MetricChart';
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
            case 'offline': return '#64748B';
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
                            <Ionicons name="hardware-chip-outline" size={14} color="#94A3B8" />
                            <Text style={styles.compactValue}>{server.metrics.cpu}%</Text>
                        </View>
                        <View style={styles.compactMetric}>
                            <Ionicons name="server-outline" size={14} color="#94A3B8" />
                            <Text style={styles.compactValue}>{server.metrics.memory}%</Text>
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
                    <StatusBadge status={server.status} />
                </View>

                <Text style={styles.host}>{server.host}</Text>

                <View style={styles.metricsRow}>
                    <MetricChart value={server.metrics.cpu} label="CPU" size={70} />
                    <MetricChart value={server.metrics.memory} label="MEM" size={70} />
                    <MetricChart value={server.metrics.disk} label="DISK" size={70} />
                </View>

                <View style={styles.footer}>
                    <View style={styles.footerItem}>
                        <Ionicons name="time-outline" size={14} color="#94A3B8" />
                        <Text style={styles.footerText}>
                            {formatUptime(server.metrics.uptime)}
                        </Text>
                    </View>
                    <View style={styles.footerItem}>
                        <Ionicons name="pulse-outline" size={14} color="#94A3B8" />
                        <Text style={styles.footerText}>
                            {server.metrics.responseTime}ms
                        </Text>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
}

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
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
