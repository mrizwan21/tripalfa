import axios from "axios";
import { getEnv } from "./env.js";
import { getErrorMessage } from "./utils.js";

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  messages: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: "user" | "agent";
  message: string;
  attachments?: string[];
  createdAt: string;
}

class SupportService {
  /**
   * Get base URL for support service - uses lazy evaluation to support runtime config changes
   */
  private static get baseURL(): string {
    return getEnv("VITE_SUPPORT_SERVICE_URL", "http://localhost:3008");
  }

  /**
   * Get all support tickets
   */
  static async getTickets(params?: {
    status?: string;
    priority?: string;
  }): Promise<SupportTicket[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append("status", params.status);
      if (params?.priority) queryParams.append("priority", params.priority);

      const response = await axios.get<SupportTicket[]>(
        `${this.baseURL}/api/support/tickets?${queryParams.toString()}`,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to get support tickets: ${message}`, { cause: error });
    }
  }

  /**
   * Create a new support ticket
   */
  static async createTicket(ticket: {
    userId: string;
    subject: string;
    description: string;
    priority: SupportTicket["priority"];
    category: string;
  }): Promise<SupportTicket> {
    try {
      const response = await axios.post<SupportTicket>(
        `${this.baseURL}/api/support/tickets`,
        ticket,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to create support ticket: ${message}`, { cause: error });
    }
  }

  /**
   * Add message to ticket
   */
  static async addMessage(
    ticketId: string,
    message: {
      senderId: string;
      senderType: "user" | "agent";
      message: string;
      attachments?: string[];
    },
  ): Promise<SupportMessage> {
    try {
      const response = await axios.post<SupportMessage>(
        `${this.baseURL}/api/support/tickets/${ticketId}/messages`,
        message,
      );

      return response.data;
    } catch (error) {
      const messageStr = getErrorMessage(error);
      throw new Error(`Failed to add message to ticket: ${messageStr}`, { cause: error });
    }
  }
}

export default SupportService;
