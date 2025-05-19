import { ServerToClientEvents } from '@/types/socket';
import { v4 as uuidv4 } from 'uuid';

// Client ID for polling connection
let clientId = '';

// Last event ID received
let lastEventId = 0;

// Event handlers
const eventHandlers: Record<string, Function[]> = {};

// Polling interval in milliseconds
const POLLING_INTERVAL = 1000;

// Polling timer
let pollingTimer: NodeJS.Timeout | null = null;

// Initialize polling connection
export const initializePolling = (): string => {
  if (!clientId) {
    clientId = localStorage.getItem('clientId') || uuidv4();
    localStorage.setItem('clientId', clientId);
  }

  if (!pollingTimer) {
    // Start polling for events
    startPolling();
  }

  return clientId;
};

// Start polling for events
const startPolling = () => {
  // Clear any existing timer
  if (pollingTimer) {
    clearInterval(pollingTimer);
  }

  // Poll immediately
  pollEvents();

  // Set up polling interval
  pollingTimer = setInterval(pollEvents, POLLING_INTERVAL);
};

// Poll for events
const pollEvents = async () => {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/events?clientId=${clientId}&lastEventId=${lastEventId}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error('Error polling events:', response.statusText);
      return;
    }
    
    const data = await response.json();
    
    // Process events
    if (data.events && Array.isArray(data.events)) {
      for (const event of data.events) {
        // Update last event ID
        if (event.id > lastEventId) {
          lastEventId = event.id;
        }
        
        // Process event
        processEvent(event.type, event.payload);
      }
    }
  } catch (error) {
    console.error('Error polling events:', error);
  }
};

// Process event
const processEvent = (type: string, payload: any) => {
  console.log(`Processing event: ${type}`, payload);
  
  if (eventHandlers[type]) {
    console.log(`Found ${eventHandlers[type].length} handlers for event type: ${type}`);
    eventHandlers[type].forEach(handler => {
      console.log(`Calling handler for ${type}`);
      handler(payload);
    });
  } else {
    console.warn(`No handlers registered for event type: ${type}`);
  }
};

// Register event handler
export const on = <K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K]
): void => {
  if (!eventHandlers[event as string]) {
    eventHandlers[event as string] = [];
  }

  eventHandlers[event as string].push(handler as Function);
};

// Remove event handler
export const off = <K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K]
): void => {
  if (!eventHandlers[event as string]) {
    return;
  }

  const index = eventHandlers[event as string].indexOf(handler as Function);
  if (index !== -1) {
    eventHandlers[event as string].splice(index, 1);
  }
};

// Stop polling
export const stopPolling = (): void => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
};

// Get client ID
export const getClientId = (): string => {
  if (!clientId) {
    return initializePolling();
  }
  return clientId;
};

// API request helper
export const apiRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'POST',
  data?: any
): Promise<T> => {
  const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }

  return response.json();
};

// Export all functions from the original socket module for backward compatibility
export { initializePolling as initializeSSE, stopPolling as closeSSE };
