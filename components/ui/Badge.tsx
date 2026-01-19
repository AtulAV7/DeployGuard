import { StatusColors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import type { IncidentSeverity } from '@/types';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    size?: 'sm' | 'md';
    style?: ViewStyle;
}

export function Badge({
    label,
    variant = 'default',
    size = 'md',
    style,
}: BadgeProps) {
    const getColors = () => {
        switch (variant) {
            case 'success':
                return { bg: StatusColors.successBg, text: StatusColors.success };
            case 'warning':
                return { bg: StatusColors.warningBg, text: StatusColors.warning };
            case 'danger':
                return { bg: StatusColors.dangerBg, text: StatusColors.danger };
            case 'info':
                return { bg: StatusColors.infoBg, text: StatusColors.info };
            default:
                return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94A3B8' };
        }
    };

    const colors = getColors();
    const isSmall = size === 'sm';

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.bg,
                    paddingVertical: isSmall ? 2 : 4,
                    paddingHorizontal: isSmall ? 6 : 10,
                },
                style,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    {
                        color: colors.text,
                        fontSize: isSmall ? Layout.fontSize.xs : Layout.fontSize.sm,
                    },
                ]}
            >
                {label}
            </Text>
        </View>
    );
}

// Helper to map incident severity to badge variant
export function severityToVariant(severity: IncidentSeverity): BadgeVariant {
    switch (severity) {
        case 'critical': return 'danger';
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'info';
    }
}

// Status badge helper
export function StatusBadge({ status }: { status: 'healthy' | 'warning' | 'critical' | 'offline' }) {
    const variantMap: Record<string, BadgeVariant> = {
        healthy: 'success',
        warning: 'warning',
        critical: 'danger',
        offline: 'default',
    };

    return <Badge label={status.toUpperCase()} variant={variantMap[status]} size="sm" />;
}

const styles = StyleSheet.create({
    container: {
        borderRadius: Layout.radius.sm,
        alignSelf: 'flex-start',
    },
    text: {
        fontWeight: Layout.fontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
