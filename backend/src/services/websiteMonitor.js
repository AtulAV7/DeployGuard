/**
 * Website Health Check Service
 * Pings real URLs and measures response times, status codes, etc.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

class WebsiteMonitor {
    constructor() {
        this.websites = [];
        this.checkInterval = null;
        this.checkIntervalMs = 30000; // Check every 30 seconds
    }

    /**
     * Add a website to monitor
     */
    addWebsite(website) {
        const id = Date.now().toString();
        const newSite = {
            id,
            name: website.name || this.extractDomain(website.url),
            url: website.url,
            host: this.extractDomain(website.url),
            status: 'checking',
            lastChecked: null,
            metrics: {
                responseTime: 0,
                statusCode: 0,
                uptime: 100,
                lastError: null,
                successfulChecks: 0,
                totalChecks: 0,
                ssl: null,
                contentLength: 0,
            },
            history: [], // Last 20 checks
            tags: website.tags || [],
        };

        this.websites.push(newSite);
        this.checkWebsite(newSite); // Check immediately
        return newSite;
    }

    /**
     * Remove a website from monitoring
     */
    removeWebsite(id) {
        const index = this.websites.findIndex(w => w.id === id);
        if (index !== -1) {
            this.websites.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Extract domain from URL
     */
    extractDomain(urlString) {
        try {
            const url = new URL(urlString);
            return url.hostname;
        } catch {
            return urlString;
        }
    }

    /**
     * Check a single website's health
     */
    async checkWebsite(website) {
        const startTime = Date.now();

        try {
            const result = await this.pingUrl(website.url);
            const responseTime = Date.now() - startTime;

            website.metrics.totalChecks++;
            website.metrics.successfulChecks++;
            website.metrics.responseTime = responseTime;
            website.metrics.statusCode = result.statusCode;
            website.metrics.ssl = result.ssl;
            website.metrics.contentLength = result.contentLength;
            website.metrics.lastError = null;

            // Calculate uptime
            website.metrics.uptime = Math.round(
                (website.metrics.successfulChecks / website.metrics.totalChecks) * 100 * 10
            ) / 10;

            // Determine status based on response
            if (result.statusCode >= 200 && result.statusCode < 300) {
                website.status = responseTime < 500 ? 'healthy' : 'warning';
            } else if (result.statusCode >= 300 && result.statusCode < 400) {
                website.status = 'healthy'; // Redirects are OK
            } else if (result.statusCode >= 400 && result.statusCode < 500) {
                website.status = 'warning'; // Client errors
            } else {
                website.status = 'critical'; // Server errors
            }

            // Slow response warning
            if (responseTime > 2000) {
                website.status = 'warning';
            }

            website.lastChecked = new Date().toISOString();

            // Add to history
            website.history.unshift({
                timestamp: website.lastChecked,
                responseTime,
                statusCode: result.statusCode,
                status: website.status,
            });

            // Keep only last 20 checks
            if (website.history.length > 20) {
                website.history = website.history.slice(0, 20);
            }

        } catch (error) {
            const responseTime = Date.now() - startTime;

            website.metrics.totalChecks++;
            website.metrics.responseTime = responseTime;
            website.metrics.statusCode = 0;
            website.metrics.lastError = error.message;

            // Calculate uptime
            website.metrics.uptime = Math.round(
                (website.metrics.successfulChecks / website.metrics.totalChecks) * 100 * 10
            ) / 10;

            website.status = 'critical';
            website.lastChecked = new Date().toISOString();

            // Add to history
            website.history.unshift({
                timestamp: website.lastChecked,
                responseTime,
                statusCode: 0,
                status: 'critical',
                error: error.message,
            });

            if (website.history.length > 20) {
                website.history = website.history.slice(0, 20);
            }
        }

        return website;
    }

    /**
     * Ping a URL and return status
     */
    pingUrl(urlString) {
        return new Promise((resolve, reject) => {
            try {
                const url = new URL(urlString);
                const protocol = url.protocol === 'https:' ? https : http;

                const options = {
                    hostname: url.hostname,
                    port: url.port || (url.protocol === 'https:' ? 443 : 80),
                    path: url.pathname + url.search,
                    method: 'GET',
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'DeployGuard-Monitor/1.0',
                        'Accept': '*/*',
                    },
                };

                const req = protocol.request(options, (res) => {
                    let data = '';
                    res.on('data', chunk => { data += chunk; });
                    res.on('end', () => {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            contentLength: data.length,
                            ssl: url.protocol === 'https:',
                        });
                    });
                });

                req.on('error', (error) => {
                    reject(error);
                });

                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Request timeout'));
                });

                req.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Check all websites
     */
    async checkAllWebsites() {
        console.log(`🔍 Checking ${this.websites.length} websites...`);

        const promises = this.websites.map(website => this.checkWebsite(website));
        await Promise.all(promises);

        const healthy = this.websites.filter(w => w.status === 'healthy').length;
        const warning = this.websites.filter(w => w.status === 'warning').length;
        const critical = this.websites.filter(w => w.status === 'critical').length;

        console.log(`✅ Health check complete: ${healthy} healthy, ${warning} warning, ${critical} critical`);

        return this.websites;
    }

    /**
     * Start automatic monitoring
     */
    startMonitoring(callback) {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        // Initial check
        this.checkAllWebsites().then(() => {
            if (callback) callback(this.websites);
        });

        // Set up interval
        this.checkInterval = setInterval(async () => {
            await this.checkAllWebsites();
            if (callback) callback(this.websites);
        }, this.checkIntervalMs);

        console.log(`📡 Started monitoring ${this.websites.length} websites every ${this.checkIntervalMs / 1000}s`);
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Get dashboard summary
     */
    getSummary() {
        return {
            totalServers: this.websites.length,
            healthyServers: this.websites.filter(w => w.status === 'healthy').length,
            warningServers: this.websites.filter(w => w.status === 'warning').length,
            criticalServers: this.websites.filter(w => w.status === 'critical').length,
            offlineServers: this.websites.filter(w => w.status === 'offline' || w.metrics.statusCode === 0).length,
            averageUptime: this.websites.length > 0
                ? Math.round(this.websites.reduce((sum, w) => sum + w.metrics.uptime, 0) / this.websites.length * 10) / 10
                : 100,
            averageResponseTime: this.websites.length > 0
                ? Math.round(this.websites.reduce((sum, w) => sum + w.metrics.responseTime, 0) / this.websites.length)
                : 0,
        };
    }

    /**
     * Generate incidents from current state
     */
    getIncidents() {
        const incidents = [];

        this.websites.forEach(website => {
            // Critical - site is down
            if (website.status === 'critical') {
                incidents.push({
                    id: `incident-${website.id}-critical`,
                    serverId: website.id,
                    serverName: website.name,
                    title: website.metrics.lastError
                        ? `Site down: ${website.metrics.lastError}`
                        : `HTTP ${website.metrics.statusCode} error`,
                    description: `${website.url} is not responding correctly.`,
                    severity: 'critical',
                    status: 'open',
                    createdAt: website.lastChecked,
                    updatedAt: website.lastChecked,
                });
            }

            // Warning - slow response
            if (website.status === 'warning' && website.metrics.responseTime > 1000) {
                incidents.push({
                    id: `incident-${website.id}-slow`,
                    serverId: website.id,
                    serverName: website.name,
                    title: `Slow response time: ${website.metrics.responseTime}ms`,
                    description: `${website.url} is responding slowly.`,
                    severity: 'medium',
                    status: 'open',
                    createdAt: website.lastChecked,
                    updatedAt: website.lastChecked,
                });
            }

            // SSL check
            if (website.url.startsWith('http://') && !website.url.includes('localhost')) {
                incidents.push({
                    id: `incident-${website.id}-ssl`,
                    serverId: website.id,
                    serverName: website.name,
                    title: 'No SSL/HTTPS encryption',
                    description: `${website.url} is not using HTTPS.`,
                    severity: 'low',
                    status: 'open',
                    createdAt: website.lastChecked,
                    updatedAt: website.lastChecked,
                });
            }
        });

        return incidents;
    }
}

module.exports = new WebsiteMonitor();
