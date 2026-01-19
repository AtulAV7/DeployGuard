import type { DashboardSummary, Incident, Server } from '@/types';
import { Platform } from 'react-native';

// Replit backend URL (Production Deployment)
const REPLIT_BACKEND_URL = 'https://deploy-guard--atulalexander20.replit.app';

// Detect environment and return appropriate URL
const getBaseUrl = () => {
    // For mobile apps, always use the Replit backend
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
        return REPLIT_BACKEND_URL;
    }

    // For web, check if running on Replit or localhost
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // If on Replit, use the same origin
        if (window.location.hostname.includes('replit') || window.location.hostname.includes('.repl.co')) {
            return window.location.origin;
        }
        // For local web development, use localhost
        if (window.location.hostname === 'localhost') {
            return 'http://localhost:3001';
        }
    }

    // Default to Replit backend
    return REPLIT_BACKEND_URL;
};

const BASE_URL = getBaseUrl();
const API_BASE = `${BASE_URL}/api`;
const WS_URL = BASE_URL.replace('https', 'wss').replace('http', 'ws');

// =====================
// REST API Client
// =====================

export async function fetchServers(): Promise<Server[]> {
    try {
        const response = await fetch(`${API_BASE}/servers`);
        if (!response.ok) throw new Error('Failed to fetch servers');
        return response.json();
    } catch (error) {
        console.error('API Error:', error);
        return [];
    }
}

export async function fetchIncidents(): Promise<Incident[]> {
    try {
        const response = await fetch(`${API_BASE}/incidents`);
        if (!response.ok) throw new Error('Failed to fetch incidents');
        return response.json();
    } catch (error) {
        console.error('API Error:', error);
        return [];
    }
}

export async function fetchDashboard(): Promise<DashboardSummary | null> {
    try {
        const response = await fetch(`${API_BASE}/dashboard`);
        if (!response.ok) throw new Error('Failed to fetch dashboard');
        return response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

export async function updateIncident(id: string, data: Partial<Incident>): Promise<Incident | null> {
    try {
        const response = await fetch(`${API_BASE}/incidents/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update incident');
        return response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

export async function sendChatMessage(message: string): Promise<string> {
    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });
        if (!response.ok) throw new Error('Failed to send message');
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('API Error:', error);
        return 'Sorry, I encountered an error. Please try again.';
    }
}

export async function executeAction(action: string, serverId: string): Promise<{ success: boolean; message: string }> {
    try {
        const response = await fetch(`${API_BASE}/actions/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serverId }),
        });
        if (!response.ok) throw new Error('Failed to execute action');
        return response.json();
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: 'Action failed' };
    }
}

// =====================
// WebSocket Client
// =====================

type WebSocketCallback = (data: any) => void;

class WebSocketClient {
    private ws: WebSocket | null = null;
    private callbacks: Map<string, Set<WebSocketCallback>> = new Map();
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    connect() {
        if (this.ws?.readyState === WebSocket.OPEN) return;

        try {
            this.ws = new WebSocket(WS_URL);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const callbacks = this.callbacks.get(data.type);
                    if (callbacks) {
                        callbacks.forEach(cb => cb(data));
                    }
                } catch (e) {
                    console.error('WebSocket parse error:', e);
                }
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected, reconnecting...');
                this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (e) {
            console.error('WebSocket connection error:', e);
        }
    }

    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        this.ws?.close();
        this.ws = null;
    }

    subscribe(event: string, callback: WebSocketCallback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, new Set());
        }
        this.callbacks.get(event)!.add(callback);

        return () => {
            this.callbacks.get(event)?.delete(callback);
        };
    }
}

export const wsClient = new WebSocketClient();
