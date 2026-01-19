import type { DashboardSummary, Incident, Server } from '@/types';

// Mock server data
export const mockServers: Server[] = [
    {
        id: '1',
        name: 'Production API',
        host: 'api.deployguard.io',
        status: 'healthy',
        lastChecked: new Date(),
        metrics: {
            cpu: 42,
            memory: 68,
            disk: 55,
            network: { in: 1250000, out: 890000 },
            uptime: 2592000, // 30 days
            responseTime: 45,
        },
        tags: ['production', 'api'],
    },
    {
        id: '2',
        name: 'Database Primary',
        host: 'db-primary.deployguard.io',
        status: 'warning',
        lastChecked: new Date(),
        metrics: {
            cpu: 78,
            memory: 82,
            disk: 71,
            network: { in: 2500000, out: 1200000 },
            uptime: 1296000, // 15 days
            responseTime: 12,
        },
        tags: ['production', 'database'],
    },
    {
        id: '3',
        name: 'Worker Node 1',
        host: 'worker-1.deployguard.io',
        status: 'critical',
        lastChecked: new Date(),
        metrics: {
            cpu: 95,
            memory: 91,
            disk: 88,
            network: { in: 500000, out: 300000 },
            uptime: 86400, // 1 day
            responseTime: 230,
        },
        tags: ['production', 'worker'],
    },
    {
        id: '4',
        name: 'Staging Server',
        host: 'staging.deployguard.io',
        status: 'healthy',
        lastChecked: new Date(),
        metrics: {
            cpu: 25,
            memory: 45,
            disk: 32,
            network: { in: 100000, out: 80000 },
            uptime: 604800, // 7 days
            responseTime: 78,
        },
        tags: ['staging'],
    },
    {
        id: '5',
        name: 'Redis Cache',
        host: 'redis.deployguard.io',
        status: 'healthy',
        lastChecked: new Date(),
        metrics: {
            cpu: 15,
            memory: 62,
            disk: 20,
            network: { in: 800000, out: 750000 },
            uptime: 5184000, // 60 days
            responseTime: 2,
        },
        tags: ['production', 'cache'],
    },
];

// Mock incidents
export const mockIncidents: Incident[] = [
    {
        id: '1',
        serverId: '3',
        serverName: 'Worker Node 1',
        title: 'High CPU usage detected - process consuming 95%',
        description: 'The worker process has been consuming excessive CPU for over 15 minutes.',
        severity: 'critical',
        status: 'open',
        createdAt: new Date(Date.now() - 900000), // 15 mins ago
        updatedAt: new Date(Date.now() - 900000),
        suggestedFixes: [
            {
                id: 'f1',
                title: 'Restart worker process',
                description: 'Gracefully restart the worker process to clear any stuck jobs.',
                command: 'systemctl restart worker',
                risk: 'low',
                estimatedTime: '30 seconds',
            },
            {
                id: 'f2',
                title: 'Scale up worker nodes',
                description: 'Add additional worker nodes to distribute the load.',
                risk: 'medium',
                estimatedTime: '5 minutes',
            },
        ],
    },
    {
        id: '2',
        serverId: '2',
        serverName: 'Database Primary',
        title: 'Memory usage approaching limit',
        description: 'Database server memory usage is at 82% and climbing.',
        severity: 'high',
        status: 'acknowledged',
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        updatedAt: new Date(Date.now() - 1800000),
        acknowledgedAt: new Date(Date.now() - 1800000),
        acknowledgedBy: 'Auto-acknowledged',
    },
    {
        id: '3',
        serverId: '3',
        serverName: 'Worker Node 1',
        title: 'Disk space running low',
        description: 'Only 12% disk space remaining on worker node.',
        severity: 'medium',
        status: 'investigating',
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        updatedAt: new Date(Date.now() - 3600000),
    },
    {
        id: '4',
        serverId: '1',
        serverName: 'Production API',
        title: 'Elevated response times',
        description: 'API response times increased by 20% in the last hour.',
        severity: 'low',
        status: 'resolved',
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        updatedAt: new Date(Date.now() - 82800000),
        resolvedAt: new Date(Date.now() - 82800000),
    },
];

// Dashboard summary
export function getDashboardSummary(): DashboardSummary {
    const healthy = mockServers.filter(s => s.status === 'healthy').length;
    const warning = mockServers.filter(s => s.status === 'warning').length;
    const critical = mockServers.filter(s => s.status === 'critical').length;
    const offline = mockServers.filter(s => s.status === 'offline').length;
    const activeIncidents = mockIncidents.filter(i => i.status !== 'resolved').length;
    const resolvedToday = mockIncidents.filter(i =>
        i.status === 'resolved' &&
        new Date(i.resolvedAt!).toDateString() === new Date().toDateString()
    ).length;

    return {
        totalServers: mockServers.length,
        healthyServers: healthy,
        warningServers: warning,
        criticalServers: critical,
        offlineServers: offline,
        activeIncidents,
        resolvedToday,
        averageUptime: 99.7,
    };
}

// AI Chat responses
export const aiResponses: Record<string, string> = {
    default: `I'm analyzing your infrastructure. Here's what I found:

**Current Status:**
- 5 servers monitored
- 3 active incidents
- 1 critical alert on Worker Node 1

Would you like me to investigate any specific issue?`,

    'why is cpu high': `**Analysis: High CPU on Worker Node 1**

I detected a runaway process consuming 95% CPU. Here's my diagnosis:

🔍 **Root Cause:** 
The background job processor appears to be stuck in an infinite loop processing a malformed job.

📊 **Evidence:**
- CPU spike started 18 minutes ago
- Process ID: 28734 (worker-processor)
- Memory stable, so not a memory leak

⚡ **Recommended Actions:**
1. Kill the stuck process (low risk)
2. Restart the worker service
3. Check job queue for malformed entries

Shall I execute any of these fixes?`,

    'restart worker': `**Executing: Restart Worker Service**

\`\`\`
$ systemctl restart worker
\`\`\`

✅ Service restarted successfully!

**Post-restart status:**
- CPU: 95% → 12% ✅
- Memory: 91% → 45% ✅
- Active jobs: 0 (queue cleared)

The worker is now healthy. I'll continue monitoring for the next 30 minutes.`,

    'memory issue': `**Analysis: High Memory on Database Primary**

Memory usage is at 82%, which is above the 75% warning threshold.

🔍 **Findings:**
- Query cache: 2.1GB (normal)
- Connection pool: 890 connections (high!)
- Buffer pool: 4GB (configured)

📈 **Trend:** Memory has increased 15% over the past 6 hours.

⚠️ **Likely Cause:** 
Too many idle connections from the API servers. Consider implementing connection pooling or reducing max connections.

**Suggested fix:** Run connection cleanup script`,
};

export function getAIResponse(message: string): string {
    const lower = message.toLowerCase();

    if (lower.includes('cpu') || lower.includes('slow') || lower.includes('worker')) {
        return aiResponses['why is cpu high'];
    }
    if (lower.includes('restart')) {
        return aiResponses['restart worker'];
    }
    if (lower.includes('memory') || lower.includes('database') || lower.includes('db')) {
        return aiResponses['memory issue'];
    }

    return aiResponses['default'];
}
