// In-memory data store (in production, use a database)

const servers = [
    {
        id: '1',
        name: 'Production API',
        host: 'api.deployguard.io',
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        metrics: {
            cpu: 42,
            memory: 68,
            disk: 55,
            network: { in: 1250000, out: 890000 },
            uptime: 2592000,
            responseTime: 45,
        },
        tags: ['production', 'api'],
    },
    {
        id: '2',
        name: 'Database Primary',
        host: 'db-primary.deployguard.io',
        status: 'warning',
        lastChecked: new Date().toISOString(),
        metrics: {
            cpu: 78,
            memory: 82,
            disk: 71,
            network: { in: 2500000, out: 1200000 },
            uptime: 1296000,
            responseTime: 12,
        },
        tags: ['production', 'database'],
    },
    {
        id: '3',
        name: 'Worker Node 1',
        host: 'worker-1.deployguard.io',
        status: 'critical',
        lastChecked: new Date().toISOString(),
        metrics: {
            cpu: 95,
            memory: 91,
            disk: 88,
            network: { in: 500000, out: 300000 },
            uptime: 86400,
            responseTime: 230,
        },
        tags: ['production', 'worker'],
    },
    {
        id: '4',
        name: 'Staging Server',
        host: 'staging.deployguard.io',
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        metrics: {
            cpu: 25,
            memory: 45,
            disk: 32,
            network: { in: 100000, out: 80000 },
            uptime: 604800,
            responseTime: 78,
        },
        tags: ['staging'],
    },
    {
        id: '5',
        name: 'Redis Cache',
        host: 'redis.deployguard.io',
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        metrics: {
            cpu: 15,
            memory: 62,
            disk: 20,
            network: { in: 800000, out: 750000 },
            uptime: 5184000,
            responseTime: 2,
        },
        tags: ['production', 'cache'],
    },
];

const incidents = [
    {
        id: '1',
        serverId: '3',
        serverName: 'Worker Node 1',
        title: 'High CPU usage detected - process consuming 95%',
        description: 'The worker process has been consuming excessive CPU for over 15 minutes.',
        severity: 'critical',
        status: 'open',
        createdAt: new Date(Date.now() - 900000).toISOString(),
        updatedAt: new Date(Date.now() - 900000).toISOString(),
    },
    {
        id: '2',
        serverId: '2',
        serverName: 'Database Primary',
        title: 'Memory usage approaching limit',
        description: 'Database server memory usage is at 82% and climbing.',
        severity: 'high',
        status: 'acknowledged',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
        id: '3',
        serverId: '3',
        serverName: 'Worker Node 1',
        title: 'Disk space running low',
        description: 'Only 12% disk space remaining on worker node.',
        severity: 'medium',
        status: 'investigating',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
];

module.exports = {
    servers,
    incidents,

    // Helper functions
    getServer(id) {
        return servers.find(s => s.id === id);
    },

    updateServer(id, updates) {
        const server = servers.find(s => s.id === id);
        if (server) {
            Object.assign(server, updates);
        }
        return server;
    },

    getIncident(id) {
        return incidents.find(i => i.id === id);
    },

    updateIncident(id, updates) {
        const incident = incidents.find(i => i.id === id);
        if (incident) {
            Object.assign(incident, updates, { updatedAt: new Date().toISOString() });
        }
        return incident;
    },

    getDashboardSummary() {
        return {
            totalServers: servers.length,
            healthyServers: servers.filter(s => s.status === 'healthy').length,
            warningServers: servers.filter(s => s.status === 'warning').length,
            criticalServers: servers.filter(s => s.status === 'critical').length,
            offlineServers: servers.filter(s => s.status === 'offline').length,
            activeIncidents: incidents.filter(i => i.status !== 'resolved').length,
            resolvedToday: incidents.filter(i =>
                i.status === 'resolved' &&
                i.resolvedAt &&
                new Date(i.resolvedAt).toDateString() === new Date().toDateString()
            ).length,
            averageUptime: 99.7,
        };
    },
};
