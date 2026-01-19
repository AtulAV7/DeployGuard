// Server types
export interface Server {
    id: string;
    name: string;
    host: string;
    status: 'healthy' | 'warning' | 'critical' | 'offline';
    lastChecked: Date;
    metrics: ServerMetrics;
    tags?: string[];
}

export interface ServerMetrics {
    cpu: number;        // 0-100
    memory: number;     // 0-100
    disk: number;       // 0-100
    network: {
        in: number;       // bytes/sec
        out: number;      // bytes/sec
    };
    uptime: number;     // seconds
    responseTime: number; // ms
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
    createdAt: Date;
    updatedAt: Date;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
    acknowledgedBy?: string;
    timeline?: IncidentEvent[];
    suggestedFixes?: SuggestedFix[];
}

export interface IncidentEvent {
    id: string;
    timestamp: Date;
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
    serverId?: string; // null = all servers
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

// Dashboard summary
export interface DashboardSummary {
    totalServers: number;
    healthyServers: number;
    warningServers: number;
    criticalServers: number;
    offlineServers: number;
    activeIncidents: number;
    resolvedToday: number;
    averageUptime: number;
}
