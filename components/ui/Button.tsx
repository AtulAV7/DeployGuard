import { Gradients, StatusColors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    style?: ViewStyle;
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    fullWidth = false,
    style,
}: ButtonProps) {
    const isDisabled = disabled || loading;

    const getGradientColors = (): [string, string] => {
        if (isDisabled) return ['#475569', '#334155'];
        switch (variant) {
            case 'primary': return Gradients.primary as [string, string];
            case 'danger': return Gradients.danger as [string, string];
            case 'success': return Gradients.success as [string, string];
            default: return ['transparent', 'transparent'];
        }
    };

    const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
        switch (size) {
            case 'sm':
                return {
                    container: { paddingVertical: 8, paddingHorizontal: 16 },
                    text: { fontSize: Layout.fontSize.sm },
                };
            case 'lg':
                return {
                    container: { paddingVertical: 16, paddingHorizontal: 28 },
                    text: { fontSize: Layout.fontSize.lg },
                };
            default:
                return {
                    container: { paddingVertical: 12, paddingHorizontal: 20 },
                    text: { fontSize: Layout.fontSize.md },
                };
        }
    };

    const sizeStyles = getSizeStyles();
    const isGradient = variant === 'primary' || variant === 'danger' || variant === 'success';

    const content = (
        <>
            {loading ? (
                <ActivityIndicator color="#fff" size="small" />
            ) : (
                <>
                    {icon && <>{icon}</>}
                    <Text
                        style={[
                            styles.text,
                            sizeStyles.text,
                            variant === 'ghost' && styles.ghostText,
                            variant === 'secondary' && styles.secondaryText,
                            icon && styles.textWithIcon,
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </>
    );

    if (isGradient && !isDisabled) {
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onPress}
                disabled={isDisabled}
                style={[fullWidth && styles.fullWidth, style]}
            >
                <LinearGradient
                    colors={getGradientColors()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.container, sizeStyles.container]}
                >
                    {content}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            disabled={isDisabled}
            style={[
                styles.container,
                sizeStyles.container,
                variant === 'secondary' && styles.secondary,
                variant === 'ghost' && styles.ghost,
                isDisabled && styles.disabled,
                fullWidth && styles.fullWidth,
                style,
            ]}
        >
            {content}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Layout.radius.md,
        minHeight: Layout.touchTarget.min,
    },
    text: {
        color: '#FFFFFF',
        fontWeight: Layout.fontWeight.semibold,
        textAlign: 'center',
    },
    textWithIcon: {
        marginLeft: 8,
    },
    secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: StatusColors.primary,
    },
    secondaryText: {
        color: StatusColors.primaryLight,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    ghostText: {
        color: StatusColors.primaryLight,
    },
    disabled: {
        backgroundColor: '#334155',
    },
    fullWidth: {
        width: '100%',
    },
});
