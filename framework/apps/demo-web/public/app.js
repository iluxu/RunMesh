// App.js - Modern API interaction handler

class APIClient {
  constructor() {
    this.baseURL = '';
    this.currentRequests = new Map();
  }

  async request(endpoint, options = {}) {
    const controller = new AbortController();
    const requestId = `${endpoint}-${Date.now()}`;

    this.currentRequests.set(requestId, controller);

    try {
      const response = await fetch(endpoint, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request was cancelled');
      }
      throw error;
    } finally {
      this.currentRequests.delete(requestId);
    }
  }

  cancelAll() {
    this.currentRequests.forEach(controller => controller.abort());
    this.currentRequests.clear();
  }
}

class UIManager {
  constructor() {
    this.apiClient = new APIClient();
    this.init();
  }

  init() {
    this.setupTabs();
    this.setupEventListeners();
    this.showTab('agent'); // Default tab
  }

  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        this.showTab(tabId);
      });
    });
  }

  showTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === tabId);
    });
  }

  setupEventListeners() {
    // Agent endpoint
    const agentForm = document.getElementById('agent-form');
    if (agentForm) {
      agentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAgentRequest();
      });
    }

    // Mimi8 endpoint
    const mimi8Form = document.getElementById('mimi8-form');
    if (mimi8Form) {
      mimi8Form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleMimi8Request();
      });
    }

    // Fusion endpoint
    const fusionBtn = document.getElementById('fusion-btn');
    if (fusionBtn) {
      fusionBtn.addEventListener('click', () => {
        this.handleFusionRequest();
      });
    }

    // Odds endpoint
    const oddsBtn = document.getElementById('odds-btn');
    if (oddsBtn) {
      oddsBtn.addEventListener('click', () => {
        this.handleOddsRequest();
      });
    }
  }

  showLoading(containerId, button = null) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <span>Processing request...</span>
        </div>
      `;
      container.classList.add('show');
      container.className = 'result show';
    }

    if (button) {
      button.disabled = true;
      button.innerHTML = `
        <div class="spinner"></div>
        <span>Loading...</span>
      `;
    }
  }

  showResult(containerId, data, type = 'success', button = null) {
    const container = document.getElementById(containerId);
    if (container) {
      const title = type === 'error' ? 'Error' : 'Result';
      const icon = type === 'error' ? '✕' : '✓';

      let formattedData;
      if (typeof data === 'string') {
        formattedData = data;
      } else {
        formattedData = JSON.stringify(data, null, 2);
      }

      container.innerHTML = `
        <h4>${icon} ${title}</h4>
        <pre><code>${this.escapeHtml(formattedData)}</code></pre>
      `;
      container.className = `result show ${type}`;
    }

    if (button) {
      this.resetButton(button);
    }
  }

  resetButton(button, originalText = 'Submit') {
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async handleAgentRequest() {
    const messageInput = document.getElementById('agent-message');
    const submitBtn = document.querySelector('#agent-form button[type="submit"]');
    const resultContainer = 'agent-result';

    const message = messageInput.value.trim();
    if (!message) {
      this.showResult(resultContainer, 'Please enter a message', 'error');
      return;
    }

    this.showLoading(resultContainer, submitBtn);

    try {
      const response = await this.apiClient.request('/api/agent', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });

      this.showResult(resultContainer, response, 'success', submitBtn);
    } catch (error) {
      this.showResult(resultContainer, error.message, 'error', submitBtn);
    }
  }

  async handleMimi8Request() {
    const actionSelect = document.getElementById('mimi8-action');
    const paramsInput = document.getElementById('mimi8-params');
    const submitBtn = document.querySelector('#mimi8-form button[type="submit"]');
    const resultContainer = 'mimi8-result';

    const action = actionSelect.value;
    let params = {};

    if (paramsInput.value.trim()) {
      try {
        params = JSON.parse(paramsInput.value);
      } catch (error) {
        this.showResult(resultContainer, 'Invalid JSON in parameters field', 'error');
        return;
      }
    }

    this.showLoading(resultContainer, submitBtn);

    try {
      const response = await this.apiClient.request('/api/mimi8', {
        method: 'POST',
        body: JSON.stringify({ action, params }),
      });

      this.showResult(resultContainer, response, 'success', submitBtn);
    } catch (error) {
      this.showResult(resultContainer, error.message, 'error', submitBtn);
    }
  }

  async handleFusionRequest() {
    const submitBtn = document.getElementById('fusion-btn');
    const resultContainer = 'fusion-result';

    this.showLoading(resultContainer, submitBtn);

    try {
      const response = await this.apiClient.request('/api/fusion', {
        method: 'POST',
      });

      this.showResult(resultContainer, response, 'success', submitBtn);
      this.resetButton(submitBtn, 'Run Fusion Analysis');
    } catch (error) {
      this.showResult(resultContainer, error.message, 'error', submitBtn);
      this.resetButton(submitBtn, 'Run Fusion Analysis');
    }
  }

  async handleOddsRequest() {
    const submitBtn = document.getElementById('odds-btn');
    const resultContainer = 'odds-result';

    this.showLoading(resultContainer, submitBtn);

    try {
      const response = await this.apiClient.request('/api/odds', {
        method: 'GET',
      });

      this.showResult(resultContainer, response, 'success', submitBtn);
      this.resetButton(submitBtn, 'Get Current Odds');
    } catch (error) {
      this.showResult(resultContainer, error.message, 'error', submitBtn);
      this.resetButton(submitBtn, 'Get Current Odds');
    }
  }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new UIManager();
  });
} else {
  window.app = new UIManager();
}

// Error handling for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
