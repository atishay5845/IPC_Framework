// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const connectBtn = document.getElementById('connectBtn');
const channelNameInput = document.getElementById('channelName');
const messageHistory = document.querySelector('.message-history');
const systemMessages = document.querySelector('.system-messages');
const performanceChart = document.getElementById('performanceChart');
const activeConnectionsContainer = document.querySelector('.space-y-3');

// State
let ws = {};  // Change to object to store multiple WebSocket connections
let currentChannel = null;
let messageQueue = [];
let sharedMemory = new Map();
let securityLevel = 'LOW';
let isConnected = new Set();  // Change to Set to track multiple connections
let messageCount = 0;
let startTime = Date.now();
let activeConnections = new Map();
let currentMethod = '';
let totalDataTransferred = 0;

// Performance metrics
let latencyData = [];
let throughputData = [];
const maxDataPoints = 10;

// Add historical data tracking
let yesterdayStats = {
  connections: 0,
  messages: 0,
  dataTransferred: 0,
  avgLatency: 0
};

// Function to save daily stats
function saveDailyStats() {
  const today = new Date().toISOString().split('T')[0];
  const stats = {
    connections: activeConnections.size,
    messages: messageCount,
    dataTransferred: totalDataTransferred,
    avgLatency: latencyData.length > 0 ?
      Math.round(latencyData.reduce((a, b) => a + b, 0) / latencyData.length) : 0
  };
  localStorage.setItem(`stats_${today}`, JSON.stringify(stats));
}

// Function to load yesterday's stats
function loadYesterdayStats() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split('T')[0];
  const stats = localStorage.getItem(`stats_${yesterdayKey}`);
  if (stats) {
    yesterdayStats = JSON.parse(stats);
  }
}

// Calculate percentage change
function calculatePercentageChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Initialize metrics with zero values
function initializeMetrics() {
  // Load yesterday's stats first
  loadYesterdayStats();

  // Reset counters
  messageCount = 0;
  startTime = Date.now();
  latencyData = [];
  throughputData = [];
  totalDataTransferred = 0;

  // Update display
  updateHeaderStats();

  // Reset chart
  chart.data.labels = [];
  chart.data.datasets[0].data = [];
  chart.data.datasets[1].data = [];
  chart.update();
}

// Update header statistics
function updateHeaderStats() {
  // Update active connections in header - Fix selector
  const activeConnectionsElements = document.querySelectorAll('.card .text-2xl');
  activeConnectionsElements.forEach(el => {
    if (el.previousElementSibling?.textContent.includes('Active Connections')) {
      el.textContent = activeConnections.size.toString();
    }
  });

  // Update all other metrics
  document.querySelectorAll('[data-metric="latency"]').forEach(el => {
    el.textContent = '0ms';
  });
  document.querySelectorAll('[data-metric="throughput"]').forEach(el => {
    el.textContent = '0 msg/s';
  });
  document.querySelector('[data-metric="messages"]').textContent = '0';
  document.querySelector('[data-metric="data"]').textContent = '0 B';
}

// Calculate message size in bytes
function calculateMessageSize(message) {
  // Basic calculation: 1 char = 2 bytes in UTF-16
  const messageString = JSON.stringify(message);
  return messageString.length * 2;
}

// Initialize Chart
const ctx = performanceChart.getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Latency (ms)',
        data: [],
        borderColor: 'rgb(99, 102, 241)',
        tension: 0.1
      },
      {
        label: 'Throughput (msg/s)',
        data: [],
        borderColor: 'rgb(16, 185, 129)',
        tension: 0.1
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    },
    animation: {
      duration: 0
    }
  }
});

// Call initialize metrics on page load
initializeMetrics();

// Theme Toggle
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

// Initialize IPC method buttons
document.querySelectorAll('.ipc-method-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ipc-method-btn').forEach(b => {
      b.classList.remove('bg-indigo-500', 'text-white');
      b.classList.add('border', 'border-gray-200', 'dark:border-gray-700');
    });
    btn.classList.add('bg-indigo-500', 'text-white');
    btn.classList.remove('border', 'border-gray-200', 'dark:border-gray-700');
    currentMethod = btn.querySelector('i').nextSibling.textContent.trim().toLowerCase();
  });
});

// Initialize security level buttons
document.querySelectorAll('.security-level-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.security-level-btn').forEach(b => {
      b.classList.remove('bg-indigo-500', 'text-white');
      b.classList.add('border', 'border-gray-200', 'dark:border-gray-700');
    });
    btn.classList.add('bg-indigo-500', 'text-white');
    btn.classList.remove('border', 'border-gray-200', 'dark:border-gray-700');
    securityLevel = btn.querySelector('i').nextSibling.textContent.trim().toUpperCase();
  });
});

// Update metrics display with historical comparisons
function updateMetrics(latency, throughput) {
  latencyData.push(latency);
  throughputData.push(throughput);

  if (latencyData.length > maxDataPoints) {
    latencyData.shift();
    throughputData.shift();
  }

  const now = new Date().toLocaleTimeString();
  chart.data.labels = Array(latencyData.length).fill('').map(() => now);
  chart.data.datasets[0].data = latencyData;
  chart.data.datasets[1].data = throughputData;
  chart.update();

  // Calculate current metrics
  const avgLatency = Math.round(latencyData.reduce((a, b) => a + b, 0) / latencyData.length) || 0;
  const currentThroughput = throughput || 0;

  // Calculate percentage changes
  const connectionChange = calculatePercentageChange(activeConnections.size, yesterdayStats.connections);
  const messageChange = calculatePercentageChange(messageCount, yesterdayStats.messages);
  const dataChange = calculatePercentageChange(totalDataTransferred, yesterdayStats.dataTransferred);
  const latencyImprovement = calculatePercentageChange(yesterdayStats.avgLatency, avgLatency); // Note: reversed for improvement

  // Update main stats with percentages
  document.querySelectorAll('[data-metric="latency"]').forEach(el => {
    el.textContent = `${avgLatency}ms`;
  });
  document.querySelectorAll('[data-metric="throughput"]').forEach(el => {
    el.textContent = `${currentThroughput} msg/s`;
  });
  document.querySelector('[data-metric="messages"]').textContent = messageCount.toString();

  // Update data transferred with proper units (bytes, KB)
  let dataTransferredText;
  if (totalDataTransferred < 1024) {
    dataTransferredText = `${totalDataTransferred} B`;
  } else {
    const dataTransferredKB = (totalDataTransferred / 1024).toFixed(2);
    dataTransferredText = `${dataTransferredKB} KB`;
  }
  document.querySelector('[data-metric="data"]').textContent = dataTransferredText;

  // Update percentage changes in the UI
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    const title = card.querySelector('.text-sm.font-medium')?.textContent;
    const changeSpan = card.querySelector('.mt-4 span');
    if (!changeSpan) return;

    let change = 0;
    let prefix = '';
    let color = '';

    if (title?.includes('Active Connections')) {
      change = connectionChange;
      prefix = '';
    } else if (title?.includes('Messages Today')) {
      change = messageChange;
      prefix = '';
    } else if (title?.includes('Data Transferred')) {
      change = dataChange;
      prefix = '';
    } else if (title?.includes('Avg. Latency')) {
      change = latencyImprovement;
      prefix = '';
    }

    // Determine color and icon based on change
    if (change > 0) {
      color = 'text-green-600 dark:text-green-400';
      prefix = '+';
    } else if (change < 0) {
      color = 'text-red-600 dark:text-red-400';
    } else {
      color = 'text-gray-600 dark:text-gray-400';
    }

    // Update the span text and color
    changeSpan.textContent = `${prefix}${change}% from yesterday`;
    changeSpan.className = `text-sm ${color}`;

    // Update the icon
    const icon = changeSpan.previousElementSibling;
    if (icon) {
      icon.className = `fas ${change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} mr-1`;
    }
  });

  // Update active connections display
  updateActiveConnections();

  // Save current stats for tomorrow's comparison
  saveDailyStats();
}

// Helper function to process message and update metrics
function processMessage(message, type = 'send') {
  messageCount++;
  const messageSize = calculateMessageSize(message);
  totalDataTransferred += messageSize;

  const latency = Math.round(Math.random() * 50 + 10);
  const throughput = Math.round(messageCount / ((Date.now() - startTime) / 1000));
  updateMetrics(latency, throughput);

  // Add to message history
  addMessage(`${type === 'send' ? 'Sent' : 'Received'}: ${message.content}`);
}

// Connect handler
connectBtn.addEventListener('click', () => {
  const channelName = channelNameInput.value.trim();

  if (!currentMethod || !channelName) {
    addMessage('Please select an IPC method and enter a channel name', 'system');
    return;
  }

  if (activeConnections.has(channelName)) {
    addMessage(`Channel ${channelName} is already connected`, 'system');
    return;
  }

  switch (currentMethod) {
    case 'pipe':
      connectWebSocket(channelName);
      break;
    case 'queue':
      connectQueue(channelName);
      break;
    case 'shm':
      connectSharedMemory(channelName);
      break;
    default:
      addMessage(`Invalid IPC method selected: ${currentMethod}`, 'system');
      break;
  }
});

// Send message handler
sendBtn.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (!message) return;

  if (isConnected.size === 0) {
    addMessage('Not connected to any channel', 'system');
    return;
  }

  try {
    const messageData = {
      type: 'message',
      content: message,
      securityLevel: securityLevel,
      timestamp: new Date().toISOString()
    };

    // Send to all active connections
    activeConnections.forEach((details, channel) => {
      switch (details.method.toLowerCase()) {
        case 'pipe':
          if (ws[channel] && ws[channel].readyState === WebSocket.OPEN) {
            ws[channel].send(JSON.stringify(messageData));
            processMessage(messageData, 'send');
          }
          break;
        case 'queue':
          const queue = JSON.parse(localStorage.getItem(`queue_${channel}`)) || [];
          queue.push(messageData);
          localStorage.setItem(`queue_${channel}`, JSON.stringify(queue));
          processMessage(messageData, 'send');
          break;
        case 'shm':
          const shm = JSON.parse(localStorage.getItem(`shm_${channel}`)) || {};
          const key = Date.now().toString();
          shm[key] = { ...messageData, processed: false };
          localStorage.setItem(`shm_${channel}`, JSON.stringify(shm));
          processMessage(messageData, 'send');
          break;
      }
    });

    messageInput.value = '';
  } catch (error) {
    addMessage(`Error sending message: ${error.message}`, 'system');
    console.error('Error sending message:', error);
  }
});

// Clear button handler
clearBtn.addEventListener('click', () => {
  messageHistory.innerHTML = '';
  systemMessages.innerHTML = '';
});

// Disconnect handler
disconnectBtn.addEventListener('click', () => {
  if (isConnected.size === 0) return;

  try {
    // Disconnect all active connections
    activeConnections.forEach((details, channel) => {
      switch (details.method.toLowerCase()) {
        case 'pipe':
          if (ws[channel]) {
            ws[channel].close();
          }
          break;
        case 'queue':
        case 'shm':
          isConnected.delete(channel);
          activeConnections.delete(channel);
          addMessage(`Disconnected from channel: ${channel}`, 'system');
          break;
      }
    });

    // Update UI
    updateActiveConnections();

    // Reset buttons if no connections remain
    if (isConnected.size === 0) {
      sendBtn.disabled = true;
      disconnectBtn.disabled = true;
      connectBtn.disabled = false;
    }
  } catch (error) {
    addMessage(`Error disconnecting: ${error.message}`, 'system');
    console.error('Error disconnecting:', error);
  }
});

// Helper function to add messages to the UI
function addMessage(content, type = 'message') {
  const div = document.createElement('div');
  div.className = 'message-bubble p-3 rounded-lg ' +
    (type === 'system' ? 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300' :
      'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300');

  const icon = document.createElement('i');
  icon.className = 'fas ' + (type === 'system' ? 'fa-info-circle' : 'fa-comment') + ' mr-2';
  div.appendChild(icon);

  const text = document.createTextNode(content);
  div.appendChild(text);

  const container = type === 'system' ? systemMessages : messageHistory;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// Helper function to update active connections display
function updateActiveConnections() {
  // Update connection count in all places
  const count = activeConnections.size;

  // Update badge
  const connectionCountBadge = document.querySelector('.text-xs.bg-indigo-100');
  if (connectionCountBadge) {
    connectionCountBadge.textContent = `${count} Connected`;
  }

  // Update main counter
  const activeConnectionsElements = document.querySelectorAll('.card .text-2xl');
  activeConnectionsElements.forEach(el => {
    if (el.previousElementSibling?.textContent.includes('Active Connections')) {
      el.textContent = count.toString();
    }
  });

  // Clear and update connection list
  if (activeConnectionsContainer) {
    activeConnectionsContainer.innerHTML = '';

    // Add current connections
    activeConnections.forEach((details, channel) => {
      const connectionDiv = document.createElement('div');
      connectionDiv.className = 'flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-md';
      connectionDiv.innerHTML = `
        <div class="flex items-center space-x-3">
          <div class="connection-dot bg-green-500 rounded-full"></div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">${channel}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">${details.method} • ${details.security.toLowerCase()} security</p>
          </div>
        </div>
        <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <i class="fas fa-ellipsis-v"></i>
        </button>
      `;
      activeConnectionsContainer.appendChild(connectionDiv);
    });
  }
}

// WebSocket connection
function connectWebSocket(channelName) {
  try {
    ws[channelName] = new WebSocket(`ws://localhost:8080/${channelName}`);

    ws[channelName].onopen = () => {
      isConnected.add(channelName);

      // Add to active connections
      activeConnections.set(channelName, {
        method: 'Pipe',
        security: securityLevel,
        ws: ws[channelName]
      });

      // Update UI
      updateActiveConnections();
      addMessage(`Connected to channel: ${channelName}`, 'system');
      sendBtn.disabled = false;
      disconnectBtn.disabled = false;
      connectBtn.disabled = false;  // Allow more connections
    };

    ws[channelName].onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'system') {
          addMessage(data.content, 'system');
        } else {
          processMessage(data, 'receive');
        }
      } catch (error) {
        console.error('Error processing message:', error);
        addMessage(`Error processing message: ${error.message}`, 'system');
      }
    };

    ws[channelName].onclose = () => {
      isConnected.delete(channelName);
      activeConnections.delete(channelName);
      delete ws[channelName];
      updateActiveConnections();
      addMessage(`Disconnected from channel: ${channelName}`, 'system');

      // Only disable buttons if no connections remain
      if (isConnected.size === 0) {
        sendBtn.disabled = true;
        disconnectBtn.disabled = true;
      }
    };

    ws[channelName].onerror = (error) => {
      addMessage(`WebSocket error on channel ${channelName}: ${error.message}`, 'system');
      console.error('WebSocket error:', error);
    };
  } catch (error) {
    addMessage(`Connection error: ${error.message}`, 'system');
    console.error('Connection error:', error);
  }
}

// Queue connection
function connectQueue(channelName) {
  try {
    if (!localStorage.getItem(`queue_${channelName}`)) {
      localStorage.setItem(`queue_${channelName}`, JSON.stringify([]));
    }

    isConnected.add(channelName);
    currentChannel = channelName;

    // Add to active connections
    activeConnections.set(channelName, {
      method: 'Queue',
      security: securityLevel
    });

    // Update UI
    updateActiveConnections();
    addMessage(`Connected to queue: ${channelName}`, 'system');
    sendBtn.disabled = false;
    disconnectBtn.disabled = false;
    connectBtn.disabled = true;
    initializeMetrics();
  } catch (error) {
    addMessage(`Queue connection error: ${error.message}`, 'system');
    console.error('Queue connection error:', error);
  }
}

// Shared Memory connection
function connectSharedMemory(channelName) {
  try {
    if (!localStorage.getItem(`shm_${channelName}`)) {
      localStorage.setItem(`shm_${channelName}`, JSON.stringify({}));
    }

    isConnected.add(channelName);
    currentChannel = channelName;

    // Add to active connections
    activeConnections.set(channelName, {
      method: 'SHM',
      security: securityLevel
    });

    // Update UI
    updateActiveConnections();
    addMessage(`Connected to shared memory: ${channelName}`, 'system');
    sendBtn.disabled = false;
    disconnectBtn.disabled = false;
    connectBtn.disabled = true;
    initializeMetrics();
  } catch (error) {
    addMessage(`Shared memory connection error: ${error.message}`, 'system');
    console.error('Shared memory connection error:', error);
  }
}