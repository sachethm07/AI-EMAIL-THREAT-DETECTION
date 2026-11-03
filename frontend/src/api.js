/**
 * API client for SentinMail Backend
 */

const API_BASE = '/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('sentinmail_token') || '';
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('sentinmail_token', token);
    } else {
      localStorage.removeItem('sentinmail_token');
    }
  }

  getToken() {
    return this.token;
  }

  async request(endpoint, options = {}) {
    const headers = {
      ...(options.headers || {}),
    };

    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Don't auto-clear token if checking auth
      if (endpoint !== '/auth/login' && endpoint !== '/auth/me') {
        this.setToken('');
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }

    if (!res.ok) {
      let errorMsg = `Request failed: ${res.statusText}`;
      try {
        const data = await res.json();
        errorMsg = data.detail || errorMsg;
      } catch (e) {
        // use default error message
      }
      throw new Error(errorMsg);
    }

    if (res.status === 204) {
      return null;
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    return await res.text();
  }

  // Auth endpoints
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async register(name, email, password, role = 'analyst') {
    return await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  }

  async getMe() {
    return await this.request('/auth/me');
  }

  async getUsers() {
    return await this.request('/auth/users');
  }

  async updateUserRole(email, role) {
    return await this.request(`/auth/users/${encodeURIComponent(email)}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  // Analysis endpoints
  async analyzeText(rawEmail) {
    return await this.request('/analyze', {
      method: 'POST',
      body: JSON.stringify({ raw_email: rawEmail }),
    });
  }

  async analyzeFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return await this.request('/analyze/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getSamples() {
    return await this.request('/samples');
  }

  async getCases(params = {}) {
    const query = new URLSearchParams();
    if (params.level) query.append('level', params.level);
    if (params.q) query.append('q', params.q);
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    return await this.request(`/cases?${query.toString()}`);
  }

  async getCase(id) {
    return await this.request(`/cases/${id}`);
  }

  async deleteCase(id) {
    return await this.request(`/cases/${id}`, {
      method: 'DELETE',
    });
  }

  async getStats() {
    return await this.request('/stats');
  }

  // Reports & Forensics
  async getReport(caseId, format = 'json') {
    return await this.request(`/cases/${caseId}/report?format=${format}`);
  }

  getReportHtmlUrl(caseId) {
    return `${API_BASE}/cases/${caseId}/report?format=html`;
  }

  getRawEmlUrl(caseId) {
    return `${API_BASE}/cases/${caseId}/raw`;
  }

  async verifyEvidence(caseId) {
    return await this.request(`/cases/${caseId}/evidence/verify`);
  }

  // Threat Intel IoCs
  async getIocs(skip = 0, limit = 100) {
    return await this.request(`/iocs?skip=${skip}&limit=${limit}`);
  }

  async addIoc(type, value, severity = 'high', source = 'Manual Analyst Submission') {
    return await this.request('/iocs', {
      method: 'POST',
      body: JSON.stringify({ type, value, severity, source }),
    });
  }

  async deleteIoc(type, value) {
    return await this.request(`/iocs?type=${type}&value=${encodeURIComponent(value)}`, {
      method: 'DELETE',
    });
  }

  // Alerts
  async getAlerts(unread = false, limit = 50) {
    return await this.request(`/alerts?unread=${unread}&limit=${limit}`);
  }

  async markAlertRead(alertId) {
    return await this.request(`/alerts/${alertId}/read`, {
      method: 'POST',
    });
  }

  // System & Integrations
  async getSystemIntegrations() {
    return await this.request('/system/integrations');
  }

  async saveAbuseIpDbKey(apiKey) {
    return await this.request('/system/integrations/abuseipdb', {
      method: 'POST',
      body: JSON.stringify({ api_key: apiKey }),
    });
  }
}

export const api = new ApiService();
