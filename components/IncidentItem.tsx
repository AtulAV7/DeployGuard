import { Colors, StatusColors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Incident } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Badge, severityToVariant } from './ui/Badge';

interface IncidentItemProps {
    incident: Incident;
    onPress?: () => void;
}

export function IncidentItem({ incident, onPress }: IncidentItemProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'dark'];

    const getSeverityColor = () => {
        switch (incident.severity) {
            case 'critical': return StatusColors.danger;
            case 'high': return StatusColors.dangerLight;
            case 'medium': return StatusColors.warning;
            case 'low': return StatusColors.info;
        }
    };

    const getStatusIcon = () => {
        switch (incident.status) {
            case 'open': return 'alert-circle';
            case 'acknowledged': return 'eye';
            case 'investigating': return 'search';
            case 'resolved': return 'checkmark-circle';
        }
    };

    const timeAgo = formatTimeAgo(incident.createdAt);

    return (
        <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
            <View style={[styles.container, { backgroundColor: colors.surface }]}>
                <View style={[styles.severityBar, { backgroundColor: getSeverityColor() }]} />

                <View style={styles.content}>
                    <View style={styles.header}>
                        <Badge
                            label={incident.severity}
                            variant={severityToVariant(incident.severity)}
                            size="sm"
                        />
                        <View style={styles.statusContainer}>
                            <Ionicons
                                name={getStatusIcon() as any}
                                size={14}
                                color="#94A3B8"
                            />
                            <Text style={styles.status}>{incident.status}</Text>
                        </View>
                    </View>

                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                        {incident.title}
                    </Text>

                    <View style={styles.footer}>
                        <View style={styles.serverInfo}>
                            <Ionicons name="server-outline" size={12} color="#64748B" />
                            <Text style={styles.serverName}>{incident.serverName}</Text>
                        </View>
                        <Text style={styles.time}>{timeAgo}</Text>
                    </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </View>
        </TouchableOpacity>
    );
}

function formatTimeAgo(date: string): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.radius.md,
        marginBottom: Layout.spacing.sm,
        overflow: 'hidden',
    },
    severityBar: {
        width: 4,
        alignSelf: 'stretch',
    },
    content: {
        flex: 1,
        padding: Layout.spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.xs,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    status: {
        fontSize: Layout.fontSize.xs,
        color: '#94A3B8',
        marginLeft: 4,
        textTransform: 'capitalize',
    },
    title: {
        fontSize: Layout.fontSize.md,
        fontWeight: Layout.fontWeight.medium,
        marginBottom: Layout.spacing.sm,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    serverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    serverName: {
        fontSize: Layout.fontSize.xs,
        color: '#64748B',
        marginLeft: 4,
    },
    time: {
        fontSize: Layout.fontSize.xs,
        color: '#64748B',
    },
});
