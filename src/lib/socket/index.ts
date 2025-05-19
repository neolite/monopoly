import { ServerToClientEvents } from '@/types/socket';
import { v4 as uuidv4 } from 'uuid';

// Client ID for SSE connection
let clientId = '';

// Event handlers
const eventHandlers: Record<string, Function[]> = {};

// SSE connection
let eventSource: EventSource | null = null;

// Initialize SSE connection
export const initializeSSE = (): string => {
  if (!clientId) {
    clientId = localStorage.getItem('clientId') || uuidv4();
    localStorage.setItem('clientId', clientId);
  }

  if (!eventSource) {
    const sseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/events?clientId=${clientId}`;
    eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      console.log('Connected to SSE server');
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };

    eventSource.onmessage = (event) => {
      console.log('SSE message received:', event.data);
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;
        console.log(`Parsed SSE event: type=${type}`, payload);

        if (eventHandlers[type]) {
          console.log(`Found ${eventHandlers[type].length} handlers for event type: ${type}`);
          eventHandlers[type].forEach(handler => {
            console.log(`Calling handler for ${type}`);
            handler(payload);
          });
        } else {
          console.warn(`No handlers registered for event type: ${type}`);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };
  }

  return clientId;
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

// Close SSE connection
export const closeSSE = (): void => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
};

// Get client ID
export const getClientId = (): string => {
  if (!clientId) {
    return initializeSSE();
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
