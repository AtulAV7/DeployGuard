import { Colors, Gradients } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'gradient' | 'outlined';
    padding?: keyof typeof Layout.spacing;
    style?: ViewStyle;
}

export function Card({
    children,
    variant = 'default',
    padding = 'md',
    style,
}: CardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'dark'];

    if (variant === 'gradient') {
        return (
            <LinearGradient
                colors={Gradients.card as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.container,
                    { padding: Layout.spacing[padding] },
                    styles.gradient,
                    style,
                ]}
            >
                {children}
            </LinearGradient>
        );
    }

    return (
        <View
            style={[
                styles.container,
                {
                    padding: Layout.spacing[padding],
                    backgroundColor: colors.surface,
                    borderColor: variant === 'outlined' ? colors.border : 'transparent',
                    borderWidth: variant === 'outlined' ? 1 : 0,
                },
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: Layout.radius.lg,
        overflow: 'hidden',
    },
    gradient: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
});
