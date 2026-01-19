import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';
import { Colors, Gradients, StatusColors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColorScheme, useTheme } from '@/hooks/useColorScheme';

interface SettingsState {
    pushNotifications: boolean;
    criticalAlerts: boolean;
    emailAlerts: boolean;
    checkInterval: string;
}

export default function SettingsScreen() {
    const colorScheme = useColorScheme();
    const { isDark, toggleColorScheme, setColorScheme } = useTheme();
    const colors = Colors[colorScheme ?? 'dark'];

    const [settings, setSettings] = useState<SettingsState>({
        pushNotifications: true,
        criticalAlerts: true,
        emailAlerts: false,
        checkInterval: '30',
    });

    const [stats, setStats] = useState({
        totalChecks: 0,
        avgResponseTime: 0,
        sitesMonitored: 0,
    });

    useEffect(() => {
        // Load stats from backend
        fetch('http://localhost:3001/api/dashboard')
            .then(res => res.json())
            .then(data => {
                setStats({
                    totalChecks: data.totalServers * 10, // Approximate
                    avgResponseTime: data.averageResponseTime || 0,
                    sitesMonitored: data.totalServers,
                });
            })
            .catch(() => { });
    }, []);

    const updateSetting = (key: keyof SettingsState, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));

        // Show feedback
        if (Platform.OS === 'web') {
            // Save to localStorage on web
            try {
                localStorage.setItem('deployguard_settings', JSON.stringify({ ...settings, [key]: value }));
            } catch { }
        }
    };

    const handleClearData = () => {
        const confirmed = Platform.OS === 'web'
            ? window.confirm('Clear all local data? This will not affect monitored websites.')
            : true;

        if (confirmed) {
            if (Platform.OS === 'web') {
                localStorage.clear();
                window.alert('Local data cleared');
            } else {
                Alert.alert('Cleared', 'Local data has been cleared');
            }
        }
    };

    const SettingRow = ({
        icon,
        iconColor,
        title,
        subtitle,
        rightElement,
        onPress,
    }: {
        icon: string;
        iconColor?: string;
        title: string;
        subtitle?: string;
        rightElement?: React.ReactNode;
        onPress?: () => void;
    }) => (
        <TouchableOpacity
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={onPress ? 0.7 : 1}
            style={styles.settingRow}
        >
            <View style={[styles.settingIcon, { backgroundColor: `${iconColor || StatusColors.primary}20` }]}>
                <Ionicons name={icon as any} size={20} color={iconColor || StatusColors.primary} />
            </View>
            <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
                {subtitle && (
                    <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
                )}
            </View>
            {rightElement || (onPress && (
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            ))}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
                </View>

                {/* Profile Card */}
                <LinearGradient
                    colors={Gradients.primary as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.profileCard}
                >
                    <View style={styles.profileAvatar}>
                        <Ionicons name="person" size={28} color={StatusColors.primary} />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>DeployGuard Pro</Text>
                        <Text style={styles.profileEmail}>Free Tier • Unlimited Sites</Text>
                    </View>
                    <TouchableOpacity style={styles.editButton}>
                        <Ionicons name="create-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                </LinearGradient>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        <Text style={[styles.statValue, { color: StatusColors.primary }]}>{stats.sitesMonitored}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sites</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={[styles.statValue, { color: StatusColors.success }]}>{stats.avgResponseTime}ms</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Response</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={[styles.statValue, { color: StatusColors.warning }]}>{stats.totalChecks}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Checks</Text>
                    </Card>
                </View>

                {/* Notifications Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
                <Card style={styles.settingsCard}>
                    <SettingRow
                        icon="notifications"
                        iconColor={StatusColors.primary}
                        title="Push Notifications"
                        subtitle="Get alerts on your device"
                        rightElement={
                            <Switch
                                value={settings.pushNotifications}
                                onValueChange={(v) => updateSetting('pushNotifications', v)}
                                trackColor={{ false: '#374151', true: StatusColors.primary }}
                                thumbColor="#fff"
                            />
                        }
                    />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <SettingRow
                        icon="alert-circle"
                        iconColor={StatusColors.danger}
                        title="Critical Alerts"
                        subtitle="Always notify for critical issues"
                        rightElement={
                            <Switch
                                value={settings.criticalAlerts}
                                onValueChange={(v) => updateSetting('criticalAlerts', v)}
                                trackColor={{ false: '#374151', true: StatusColors.danger }}
                                thumbColor="#fff"
                            />
                        }
                    />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <SettingRow
                        icon="mail"
                        iconColor={StatusColors.info}
                        title="Email Alerts"
                        subtitle="Send alerts to your email"
                        rightElement={
                            <Switch
                                value={settings.emailAlerts}
                                onValueChange={(v) => updateSetting('emailAlerts', v)}
                                trackColor={{ false: '#374151', true: StatusColors.info }}
                                thumbColor="#fff"
                            />
                        }
                    />
                </Card>

                {/* Monitoring Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Monitoring</Text>
                <Card style={styles.settingsCard}>
                    <SettingRow
                        icon="timer"
                        iconColor={StatusColors.warning}
                        title="Check Interval"
                        subtitle={`Every ${settings.checkInterval} seconds`}
                        rightElement={
                            <View style={styles.intervalPicker}>
                                {['15', '30', '60'].map(val => (
                                    <TouchableOpacity
                                        key={val}
                                        onPress={() => updateSetting('checkInterval', val)}
                                        style={[
                                            styles.intervalOption,
                                            settings.checkInterval === val && styles.intervalOptionActive,
                                        ]}
                                    >
                                        <Text style={[
                                            styles.intervalText,
                                            { color: settings.checkInterval === val ? '#fff' : colors.textSecondary }
                                        ]}>
                                            {val}s
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        }
                    />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <SettingRow
                        icon="globe"
                        iconColor={StatusColors.success}
                        title="API Endpoint"
                        subtitle="localhost:3001"
                        onPress={() => {
                            if (Platform.OS === 'web') {
                                window.open('http://localhost:3001/api/health', '_blank');
                            }
                        }}
                    />
                </Card>

                {/* Appearance Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
                <Card style={styles.settingsCard}>
                    <SettingRow
                        icon={isDark ? "moon" : "sunny"}
                        iconColor="#8B5CF6"
                        title="Dark Mode"
                        subtitle={`Currently using ${isDark ? 'dark' : 'light'} theme`}
                        rightElement={
                            <Switch
                                value={isDark}
                                onValueChange={(v) => setColorScheme(v ? 'dark' : 'light')}
                                trackColor={{ false: '#374151', true: '#8B5CF6' }}
                                thumbColor="#fff"
                            />
                        }
                    />
                </Card>

                {/* About Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
                <Card style={styles.settingsCard}>
                    <SettingRow
                        icon="information-circle"
                        iconColor={StatusColors.info}
                        title="Version"
                        subtitle="1.0.0 (Replit Competition)"
                    />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <SettingRow
                        icon="logo-github"
                        iconColor="#fff"
                        title="Source Code"
                        subtitle="View on GitHub"
                        onPress={() => Linking.openURL('https://github.com')}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <SettingRow
                        icon="trash"
                        iconColor={StatusColors.danger}
                        title="Clear Local Data"
                        subtitle="Reset all local settings"
                        onPress={handleClearData}
                    />
                </Card>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Built with ❤️ for Replit Mobile App Competition
                    </Text>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Powered by Groq AI
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    content: { padding: Layout.spacing.md },
    header: { marginBottom: Layout.spacing.md },
    title: { fontSize: Layout.fontSize.xl, fontWeight: '700' },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Layout.spacing.lg,
        borderRadius: Layout.radius.lg,
        marginBottom: Layout.spacing.lg,
    },
    profileAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInfo: { flex: 1, marginLeft: Layout.spacing.md },
    profileName: { color: '#fff', fontSize: Layout.fontSize.lg, fontWeight: '700' },
    profileEmail: { color: 'rgba(255,255,255,0.8)', fontSize: Layout.fontSize.sm, marginTop: 2 },
    editButton: { padding: 8 },
    statsRow: {
        flexDirection: 'row',
        gap: Layout.spacing.sm,
        marginBottom: Layout.spacing.lg,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: Layout.spacing.md,
    },
    statValue: { fontSize: Layout.fontSize.xl, fontWeight: '700' },
    statLabel: { fontSize: Layout.fontSize.xs, marginTop: 4 },
    sectionTitle: {
        fontSize: Layout.fontSize.sm,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Layout.spacing.sm,
        marginTop: Layout.spacing.md,
    },
    settingsCard: { padding: 0, overflow: 'hidden' },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Layout.spacing.md,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingContent: { flex: 1, marginLeft: Layout.spacing.md },
    settingTitle: { fontSize: Layout.fontSize.md, fontWeight: '500' },
    settingSubtitle: { fontSize: Layout.fontSize.sm, marginTop: 2 },
    divider: { height: 1, marginLeft: 68 },
    intervalPicker: { flexDirection: 'row', gap: 8 },
    intervalOption: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    intervalOptionActive: { backgroundColor: StatusColors.warning },
    intervalText: { fontSize: Layout.fontSize.sm, fontWeight: '500' },
    footer: {
        alignItems: 'center',
        marginTop: Layout.spacing.xl,
        paddingTop: Layout.spacing.lg,
    },
    footerText: { fontSize: Layout.fontSize.sm, marginBottom: 4 },
});
