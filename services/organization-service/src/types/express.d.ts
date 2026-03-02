// Express type augmentation for organization-service
declare global {
  namespace Express {
    interface User {
      id: string;
      role: string;
      companyId: string;
      email?: string;
      name?: string;
    }
    interface Request {
      user: User;
    }
  }
}

export {};
