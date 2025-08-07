import {BACKEND_URL} from '@env';

const backendUrl = BACKEND_URL || 'http://localhost:3001';

export const chatService = {
  async sendMessage(message: string): Promise<string> {
    try {
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({message}),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Chat service error:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  },
};