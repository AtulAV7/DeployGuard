import { StatusColors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface MetricChartProps {
    value: number;       // 0-100
    label: string;
    size?: number;
    strokeWidth?: number;
    variant?: 'success' | 'warning' | 'danger' | 'auto';
}

export function MetricChart({
    value,
    label,
    size = 80,
    strokeWidth = 8,
    variant = 'auto',
}: MetricChartProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(Math.max(value, 0), 100);
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const getColor = () => {
        if (variant !== 'auto') {
            return variant === 'success' ? StatusColors.success
                : variant === 'warning' ? StatusColors.warning
                    : StatusColors.danger;
        }
        if (value < 60) return StatusColors.success;
        if (value < 80) return StatusColors.warning;
        return StatusColors.danger;
    };

    const color = getColor();

    return (
        <View style={styles.container}>
            <Svg width={size} height={size}>
                <Defs>
                    <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor={color} stopOpacity="1" />
                        <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
                    </LinearGradient>
                </Defs>

                {/* Background circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />

                {/* Progress circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#gradient)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>

            {/* Center text */}
            <View style={[styles.centerText, { width: size, height: size }]}>
                <Text style={[styles.value, { color }]}>{Math.round(value)}%</Text>
                <Text style={styles.label}>{label}</Text>
            </View>
        </View>
    );
}

// Simple bar chart for metrics like network
interface BarChartProps {
    data: number[];
    height?: number;
    barWidth?: number;
    color?: string;
}

export function MiniBarChart({
    data,
    height = 40,
    barWidth = 4,
    color = StatusColors.primary,
}: BarChartProps) {
    const maxValue = Math.max(...data, 1);
    const gap = 2;

    return (
        <View style={[styles.barContainer, { height }]}>
            {data.map((value, index) => {
                const barHeight = (value / maxValue) * height;
                return (
                    <View
                        key={index}
                        style={[
                            styles.bar,
                            {
                                height: Math.max(barHeight, 2),
                                width: barWidth,
                                backgroundColor: color,
                                opacity: 0.3 + (value / maxValue) * 0.7,
                                marginLeft: index > 0 ? gap : 0,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerText: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    value: {
        fontSize: Layout.fontSize.lg,
        fontWeight: Layout.fontWeight.bold,
    },
    label: {
        fontSize: Layout.fontSize.xs,
        color: '#94A3B8',
        marginTop: 2,
    },
    barContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    bar: {
        borderRadius: 2,
    },
});
