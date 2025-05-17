// Client-side SSE implementation
import { ServerToClientEvents } from '@/types/socket';

// SSE client instance
let eventSource: EventSource | null = null;
let eventHandlers: Map<string, Function[]> = new Map();

// Initialize SSE client
export const initializeSSE = (): EventSource => {
  if (!eventSource) {
    const sseUrl = process.env.NEXT_PUBLIC_SSE_URL || 'http://localhost:3001/events';
    eventSource = new EventSource(sseUrl);
    
    // Setup default event handlers
    eventSource.onopen = () => {
      console.log('Connected to SSE server');
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };
    
    // Setup event listeners for all ServerToClientEvents
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;
        
        if (eventHandlers.has(type)) {
          const handlers = eventHandlers.get(type) || [];
          handlers.forEach(handler => handler(payload));
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };
  }
  
  return eventSource;
};

// Add event listener
export const on = <K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K]
): void => {
  if (!eventHandlers.has(event as string)) {
    eventHandlers.set(event as string, []);
  }
  
  const handlers = eventHandlers.get(event as string) || [];
  handlers.push(handler as Function);
  eventHandlers.set(event as string, handlers);
};

// Remove event listener
export const off = <K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K]
): void => {
  if (!eventHandlers.has(event as string)) {
    return;
  }
  
  const handlers = eventHandlers.get(event as string) || [];
  const index = handlers.indexOf(handler as Function);
  
  if (index !== -1) {
    handlers.splice(index, 1);
    eventHandlers.set(event as string, handlers);
  }
};

// Close SSE connection
export const closeSSE = (): void => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
    eventHandlers.clear();
  }
};

// HTTP client for sending requests to the server
export const sendRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  data?: any
): Promise<T> => {
  const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${endpoint}`;
  
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
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  
  return response.json();
};
