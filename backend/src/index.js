require('dotenv').config();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const groqAI = require('./services/groqAI');
const websiteMonitor = require('./services/websiteMonitor');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize Groq AI
groqAI.initialize(process.env.GROQ_API_KEY);

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for mobile app
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// =====================
// BROADCAST TO CLIENTS
// =====================

function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// =====================
// REST API ROUTES
// =====================

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        name: 'DeployGuard API',
        version: '1.0.0',
        endpoints: ['/api/servers', '/api/incidents', '/api/chat', '/api/dashboard']
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all monitored websites (servers)
app.get('/api/servers', (req, res) => {
    res.json(websiteMonitor.websites);
});

// Get server by ID
app.get('/api/servers/:id', (req, res) => {
    const website = websiteMonitor.websites.find(w => w.id === req.params.id);
    if (!website) return res.status(404).json({ error: 'Website not found' });
    res.json(website);
});

// Add a new website to monitor
app.post('/api/servers', (req, res) => {
    const { url, name, tags } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    try {
        new URL(url);
    } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
    }

    const website = websiteMonitor.addWebsite({ url, name, tags });
    console.log(`➕ Added website: ${website.name} (${url})`);

    // Broadcast update
    setTimeout(() => {
        broadcast({ type: 'server_added', data: website });
        broadcast({ type: 'servers_update', servers: websiteMonitor.websites });
    }, 1000);

    res.status(201).json(website);
});

// Remove a website
app.delete('/api/servers/:id', (req, res) => {
    const removed = websiteMonitor.removeWebsite(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Website not found' });

    console.log(`➖ Removed website: ${req.params.id}`);
    broadcast({ type: 'server_removed', id: req.params.id });
    broadcast({ type: 'servers_update', servers: websiteMonitor.websites });

    res.json({ success: true });
});

// Force check a specific website
app.post('/api/servers/:id/check', async (req, res) => {
    const website = websiteMonitor.websites.find(w => w.id === req.params.id);
    if (!website) return res.status(404).json({ error: 'Website not found' });

    await websiteMonitor.checkWebsite(website);
    broadcast({ type: 'server_updated', data: website });

    res.json(website);
});

// Get all incidents
app.get('/api/incidents', (req, res) => {
    res.json(websiteMonitor.getIncidents());
});

// Get dashboard summary
app.get('/api/dashboard', (req, res) => {
    const summary = websiteMonitor.getSummary();
    summary.activeIncidents = websiteMonitor.getIncidents().length;
    res.json(summary);
});

// AI Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get AI response with real server context
        const response = await groqAI.chat(
            message,
            websiteMonitor.websites,
            websiteMonitor.getIncidents()
        );

        res.json({ response });
    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});

// Quick actions
app.post('/api/actions/:action', async (req, res) => {
    const { action } = req.params;
    const { serverId } = req.body;

    const website = websiteMonitor.websites.find(w => w.id === serverId);
    if (!website) return res.status(404).json({ error: 'Website not found' });

    let result;

    switch (action) {
        case 'check':
            await websiteMonitor.checkWebsite(website);
            result = { success: true, message: `Checked ${website.name}`, data: website };
            break;

        case 'remove':
            websiteMonitor.removeWebsite(serverId);
            result = { success: true, message: `Removed ${website.name}` };
            break;

        default:
            return res.status(400).json({ error: 'Unknown action' });
    }

    broadcast({ type: 'server_updated', data: website });
    res.json(result);
});

// =====================
// WEBSOCKET
// =====================

wss.on('connection', (ws) => {
    console.log('📱 Client connected');

    // Send initial data
    ws.send(JSON.stringify({
        type: 'initial',
        servers: websiteMonitor.websites,
        incidents: websiteMonitor.getIncidents()
    }));

    ws.on('close', () => {
        console.log('📱 Client disconnected');
    });
});

// =====================
// START MONITORING
// =====================

// Add some default websites to monitor
const defaultSites = [
    { url: 'https://www.google.com', name: 'Google', tags: ['search'] },
    { url: 'https://github.com', name: 'GitHub', tags: ['dev'] },
    { url: 'https://api.github.com', name: 'GitHub API', tags: ['api'] },
];

// Add default sites
defaultSites.forEach(site => websiteMonitor.addWebsite(site));

// Start monitoring with callback for broadcasts
websiteMonitor.startMonitoring((websites) => {
    broadcast({ type: 'servers_update', servers: websites });
    broadcast({ type: 'incidents_update', incidents: websiteMonitor.getIncidents() });
});

// =====================
// START SERVER
// =====================

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║          🚀 DeployGuard Backend (LIVE Monitoring)          ║
╠════════════════════════════════════════════════════════════╣
║  REST API:     http://0.0.0.0:${PORT}/api                    ║
║  WebSocket:    ws://0.0.0.0:${PORT}                          ║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                ║
║    GET  /api/servers      - List monitored websites        ║
║    POST /api/servers      - Add website to monitor         ║
║    DELETE /api/servers/:id - Remove website                ║
║    GET  /api/incidents    - List detected issues           ║
║    POST /api/chat         - AI chat (Groq powered)         ║
╠════════════════════════════════════════════════════════════╣
║  AI Status: ${process.env.GROQ_API_KEY ? '✅ Groq API Connected' : '⚠️  No API Key - Using Fallback'}            ║
║  Monitoring: ${defaultSites.length} websites (updates every 30s)           ║
╚════════════════════════════════════════════════════════════╝
  `);
});
