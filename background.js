// Background service worker for better system-level detection
let lastActiveTime = Date.now();
let inactivityCheckInterval;

// Update last active time
function updateLastActive() {
  lastActiveTime = Date.now();
  chrome.storage.local.set({ 'kanban-last-active': lastActiveTime });
}

// Check for inactivity and handle task pausing
async function checkInactivity() {
  try {
    const now = Date.now();
    const gap = now - lastActiveTime;
    
    // Get settings to determine threshold
    const settingsResult = await chrome.storage.local.get('settings');
    const settings = settingsResult.settings || { autoPauseAfterMinutes: 30 };
    const autoPauseThreshold = settings.autoPauseAfterMinutes * 60 * 1000;
    
    if (gap > autoPauseThreshold) {
      // Get current tasks
      const tasksResult = await chrome.storage.local.get('kanban-tasks');
      const tasks = tasksResult['kanban-tasks'] || [];
      
      const activeTask = tasks.find(t => t.status === 'WORKING');
      if (activeTask) {
        // Calculate session time up to lastActive
        const startedAt = activeTask.startedAt ? new Date(activeTask.startedAt).getTime() : null;
        let sessionTime = 0;
        
        if (startedAt && lastActiveTime > startedAt) {
          sessionTime = lastActiveTime - startedAt;
        }
        
        const totalWorkingTime = (activeTask.totalWorkingTime || 0) + sessionTime;
        
        // Update history: close WORKING, add IN_PROGRESS
        const newHistory = [...activeTask.history];
        
        // Close the current WORKING entry if it exists
        if (newHistory.length > 0 && newHistory[newHistory.length - 1].status === 'WORKING' && !newHistory[newHistory.length - 1].exitedAt) {
          newHistory[newHistory.length - 1].exitedAt = new Date(lastActiveTime).toISOString();
        }
        
        // Add IN_PROGRESS entry if none exists
        const existingInProgressEntry = newHistory.find(entry => entry.status === 'IN_PROGRESS' && !entry.exitedAt);
        if (!existingInProgressEntry) {
          newHistory.push({ status: 'IN_PROGRESS', enteredAt: new Date(lastActiveTime).toISOString() });
        }
        
        // Update the task
        const updatedTasks = tasks.map(t =>
          t.id === activeTask.id
            ? {
                ...t,
                status: 'IN_PROGRESS',
                startedAt: undefined,
                totalWorkingTime,
                history: newHistory,
                updatedAt: new Date().toISOString()
              }
            : t
        );
        
        // Save updated tasks
        await chrome.storage.local.set({ 'kanban-tasks': updatedTasks });
        
        console.log(`Background: Task "${activeTask.title}" auto-paused due to ${Math.round(gap / 60000)} minutes of inactivity`);
        
        // Show notification
        if (gap > 300000) { // 5+ minutes
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Task Auto-Paused',
            message: `Your task "${activeTask.title}" was automatically paused due to ${Math.round(gap / 60000)} minutes of inactivity.`
          });
        }
      }
    }
  } catch (error) {
    console.error('Background: Error checking inactivity:', error);
  }
}

// Initialize background script
chrome.runtime.onStartup.addListener(() => {
  console.log('Background: Extension started');
  updateLastActive();
  
  // Set up periodic inactivity checks
  inactivityCheckInterval = setInterval(checkInactivity, 30000); // Check every 30 seconds
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Background: Extension installed');
  updateLastActive();
  
  // Set up periodic inactivity checks
  inactivityCheckInterval = setInterval(checkInactivity, 30000); // Check every 30 seconds
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_LAST_ACTIVE') {
    updateLastActive();
    sendResponse({ success: true });
  } else if (message.type === 'GET_LAST_ACTIVE') {
    sendResponse({ lastActive: lastActiveTime });
  }
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes['kanban-last-active']) {
    lastActiveTime = changes['kanban-last-active'].newValue;
  }
});

// Handle alarms for periodic checks
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'inactivity-check') {
    checkInactivity();
  }
});

// Set up alarm for periodic inactivity checks
chrome.alarms.create('inactivity-check', { periodInMinutes: 1 });

// Clean up on unload
chrome.runtime.onSuspend.addListener(() => {
  if (inactivityCheckInterval) {
    clearInterval(inactivityCheckInterval);
  }
}); 