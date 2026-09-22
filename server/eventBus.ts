import { Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
  role?: string;
}

class EventBus {
  private clients: SSEClient[] = [];

  public addClient(id: string, res: Response, role?: string) {
    this.clients.push({ id, res, role });

    // Send initial connected ping
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

    // Clean up on client disconnect
    res.on('close', () => {
      this.removeClient(id);
    });
  }

  public removeClient(id: string) {
    this.clients = this.clients.filter((c) => c.id !== id);
  }

  public broadcast(type: string, payload: any) {
    const message = `data: ${JSON.stringify({ type, payload, timestamp: new Date().toISOString() })}\n\n`;
    for (const client of this.clients) {
      try {
        client.res.write(message);
      } catch (err) {
        console.error(`[SSE] Failed writing to client ${client.id}:`, err);
      }
    }
  }

  public getConnectedClientsCount(): number {
    return this.clients.length;
  }
}

export const eventBus = new EventBus();
