// Server types - Updated to match backend response
export interface Server {
    id: string;
    name: string;
    host: string;
    url?: string;  // Added URL field from backend
    status: 'healthy' | 'warning' | 'critical' | 'offline' | 'checking';
    lastChecked: string | null;
    metrics: ServerMetrics;
    tags?: string[];
    history?: ServerHistoryEntry[];
}

export interface ServerHistoryEntry {
    timestamp: string;
    responseTime: number;
    statusCode: number;
    status: string;
}

export interface ServerMetrics {
    responseTime: number;
    statusCode: number;
    uptime: number;
    lastError: string | null;
    successfulChecks: number;
    totalChecks: number;
    ssl: boolean | null;
    contentLength: number;
    // Legacy fields for compatibility
    cpu?: number;
    memory?: number;
    disk?: number;
    network?: {
        in: number;
        out: number;
    };
}

// Incident types
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'acknowledged' | 'investigating' | 'resolved';

export interface Incident {
    id: string;
    serverId: string;
    serverName: string;
    title: string;
    description: string;
    severity: IncidentSeverity;
    status: IncidentStatus;
    createdAt: string;
    updatedAt: string;
    acknowledgedAt?: string;
    resolvedAt?: string;
    acknowledgedBy?: string;
    timeline?: IncidentEvent[];
    suggestedFixes?: SuggestedFix[];
}

export interface IncidentEvent {
    id: string;
    timestamp: string;
    type: 'created' | 'acknowledged' | 'escalated' | 'comment' | 'action' | 'resolved';
    message: string;
    user?: string;
}

export interface SuggestedFix {
    id: string;
    title: string;
    description: string;
    command?: string;
    risk: 'low' | 'medium' | 'high';
    estimatedTime: string;
}

// AI Chat types
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    actions?: ChatAction[];
    isLoading?: boolean;
}

export interface ChatAction {
    id: string;
    label: string;
    type: 'command' | 'navigation' | 'info';
    payload: string;
}

// Alert configuration
export interface AlertRule {
    id: string;
    name: string;
    enabled: boolean;
    metric: 'cpu' | 'memory' | 'disk' | 'responseTime';
    operator: '>' | '<' | '==' | '>=' | '<=';
    threshold: number;
    severity: IncidentSeverity;
    serverId?: string;
}

// Quick actions
export interface QuickAction {
    id: string;
    name: string;
    icon: string;
    description: string;
    command: string;
    requiresConfirmation: boolean;
}

// Dashboard summary - Updated to match backend
export interface DashboardSummary {
    totalServers: number;
    healthyServers: number;
    warningServers: number;
    criticalServers: number;
    offlineServers?: number;
    activeIncidents?: number;
    resolvedToday?: number;
    averageUptime?: number;
    averageResponseTime?: number;  // Added from backend
}
