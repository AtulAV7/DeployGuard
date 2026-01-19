/**
 * DeployGuard Color System
 * Dark-first design for DevOps monitoring
 */

const tintColorLight = '#6366F1';
const tintColorDark = '#818CF8';

export const Colors = {
  light: {
    text: '#1E293B',
    textSecondary: '#64748B',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#F1F5F9',
    tint: tintColorLight,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    border: '#E2E8F0',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceElevated: '#334155',
    tint: tintColorDark,
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
    border: '#334155',
  },
};

// Status colors (same for both themes)
export const StatusColors = {
  success: '#10B981',
  successLight: '#34D399',
  successBg: 'rgba(16, 185, 129, 0.15)',
  
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  
  danger: '#EF4444',
  dangerLight: '#F87171',
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  
  info: '#3B82F6',
  infoLight: '#60A5FA',
  infoBg: 'rgba(59, 130, 246, 0.15)',
  
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryBg: 'rgba(99, 102, 241, 0.15)',
};

// Gradient presets
export const Gradients = {
  primary: ['#6366F1', '#8B5CF6'],
  success: ['#10B981', '#34D399'],
  warning: ['#F59E0B', '#FBBF24'],
  danger: ['#EF4444', '#F87171'],
  dark: ['#1E293B', '#0F172A'],
  card: ['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.9)'],
};
