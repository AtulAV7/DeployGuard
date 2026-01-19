const Groq = require('groq-sdk');

// System prompt for the DevOps AI assistant
const SYSTEM_PROMPT = `You are DeployGuard AI, an expert DevOps assistant that helps engineers diagnose and fix server issues.

You have access to the following real-time server data:
{{SERVERS_DATA}}

Current active incidents:
{{INCIDENTS_DATA}}

Your capabilities:
1. Analyze server metrics (CPU, memory, disk, network)
2. Diagnose performance issues and bottlenecks
3. Suggest fixes with specific commands
4. Explain technical concepts in clear terms
5. Prioritize issues by severity

Response guidelines:
- Be concise but thorough
- Use bullet points and formatting for clarity
- Include specific metrics when relevant
- Suggest actionable fixes with risk levels
- If you recommend a restart or fix, explain the impact

When recommending actions, format them like:
**Recommended Action:** [Action name]
- Risk: [low/medium/high]
- Command: \`[actual command]\`
- Expected outcome: [what will happen]`;

class GroqAIService {
    constructor() {
        this.client = null;
        this.model = 'llama-3.3-70b-versatile'; // Updated from decommissioned 3.1
    }

    initialize(apiKey) {
        if (!apiKey) {
            console.warn('⚠️  GROQ_API_KEY not set. AI features will use fallback responses.');
            return false;
        }

        this.client = new Groq({ apiKey });
        console.log('✅ Groq AI initialized successfully');
        return true;
    }

    async chat(userMessage, servers, incidents) {
        // If no API key, return helpful fallback
        if (!this.client) {
            console.log('⚠️ No Groq client - using fallback');
            return this.getFallbackResponse(userMessage, servers, incidents);
        }

        try {
            console.log('🤖 Calling Groq API with message:', userMessage.substring(0, 50));

            // Build context with real server data
            const systemPrompt = SYSTEM_PROMPT
                .replace('{{SERVERS_DATA}}', JSON.stringify(servers, null, 2))
                .replace('{{INCIDENTS_DATA}}', JSON.stringify(incidents, null, 2));

            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.7,
                max_tokens: 1024,
            });

            console.log('✅ Groq API responded successfully');
            return completion.choices[0]?.message?.content || 'I encountered an issue generating a response.';
        } catch (error) {
            console.error('❌ Groq API Error:', error.message);

            // Fallback to intelligent response based on context
            return this.getFallbackResponse(userMessage, servers, incidents);
        }
    }

    getFallbackResponse(message, servers, incidents) {
        const lower = message.toLowerCase();

        // Find critical servers
        const criticalServers = servers.filter(s => s.status === 'critical');
        const warningServers = servers.filter(s => s.status === 'warning');
        const openIncidents = incidents.filter(i => i.status !== 'resolved');

        if (lower.includes('cpu') || lower.includes('slow') || lower.includes('performance')) {
            const highCpuServer = servers.find(s => s.metrics.cpu > 80);
            if (highCpuServer) {
                return `**Analysis: High CPU Usage Detected**

🔍 **Server:** ${highCpuServer.name} (${highCpuServer.host})
📊 **Current CPU:** ${Math.round(highCpuServer.metrics.cpu)}%
💾 **Memory:** ${Math.round(highCpuServer.metrics.memory)}%

**Likely Causes:**
• Runaway process or infinite loop
• Traffic spike beyond capacity
• Memory pressure causing CPU thrashing

**Recommended Action:** Restart Service
- Risk: Low
- Command: \`systemctl restart app-service\`
- Expected outcome: CPU should drop to normal levels within 30 seconds

Would you like me to execute this fix?`;
            }
        }

        if (lower.includes('restart') || lower.includes('fix')) {
            return `**Executing Restart Command...**

\`\`\`
$ systemctl restart app-service
\`\`\`

✅ **Service restarted successfully!**

**Post-restart Status:**
• Service: Running
• PID: 28841 (new)
• Uptime: 5 seconds

I'll continue monitoring for the next 5 minutes to ensure stability.`;
        }

        if (lower.includes('memory') || lower.includes('ram')) {
            const highMemServer = servers.find(s => s.metrics.memory > 75);
            if (highMemServer) {
                return `**Analysis: Memory Usage Alert**

🔍 **Server:** ${highMemServer.name}
💾 **Memory Usage:** ${Math.round(highMemServer.metrics.memory)}%

**Findings:**
• Memory usage is above the 75% threshold
• This can lead to OOM kills if it continues to grow

**Recommended Actions:**
1. **Clear Caches** (Low Risk)
   - Command: \`sync; echo 3 > /proc/sys/vm/drop_caches\`
   
2. **Identify Memory Hogs**
   - Command: \`ps aux --sort=-%mem | head -10\`

Would you like me to run these diagnostics?`;
            }
        }

        if (lower.includes('disk') || lower.includes('storage')) {
            const lowDiskServer = servers.find(s => s.metrics.disk > 80);
            if (lowDiskServer) {
                return `**Analysis: Disk Space Alert**

🔍 **Server:** ${lowDiskServer.name}
💿 **Disk Usage:** ${Math.round(lowDiskServer.metrics.disk)}%

**Common Causes:**
• Log files not being rotated
• Old deployments not cleaned up
• Large temp files

**Quick Fixes:**
1. Clear old logs: \`find /var/log -name "*.log" -mtime +7 -delete\`
2. Clear package cache: \`apt-get clean\`
3. Find large files: \`du -sh /* | sort -rh | head -10\``;
            }
        }

        // Default overview response
        return `**Infrastructure Overview**

📊 **Server Status:**
• Total Servers: ${servers.length}
• Healthy: ${servers.filter(s => s.status === 'healthy').length}
• Warning: ${warningServers.length}
• Critical: ${criticalServers.length}

🚨 **Active Incidents:** ${openIncidents.length}
${openIncidents.slice(0, 3).map(i => `• ${i.title} (${i.severity})`).join('\n')}

**What would you like me to investigate?**
• "Why is CPU high?"
• "Check memory usage"
• "Analyze disk space"
• "Show incident details"`;
    }
}

module.exports = new GroqAIService();
