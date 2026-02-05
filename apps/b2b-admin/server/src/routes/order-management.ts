import { Router, Request, Response } from 'express';

const router = Router();

// Order Management interfaces
export interface Order {
  id: string;
  bookingId: string;
  customerId: string;
  status: 'confirmed' | 'processing' | 'fulfilled' | 'cancelled' | 'refunded' | 'completed';
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  deliveryDate?: string;
  customerNotes?: string;
  internalNotes?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productType: 'flight' | 'hotel' | 'activity' | 'package';
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'fulfilled';
  supplierId?: string;
  bookingReference?: string;
  travelDate?: string;
  metadata: Record<string, unknown>;
}

export interface CustomerCommunication {
  id: string;
  orderId: string;
  customerId: string;
  type: 'email' | 'sms' | 'push' | 'call' | 'chat';
  direction: 'inbound' | 'outbound';
  subject?: string;
  message: string;
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  metadata?: Record<string, unknown>;
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  productId: string;
  productType: 'flight' | 'hotel' | 'activity' | 'package';
  rating: number; // 1-5 stars
  title: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  verified: boolean; // Verified purchase
  helpful: number; // Number of helpful votes
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  response?: {
    message: string;
    respondedAt: string;
    respondedBy: string;
  };
}

export interface CustomerSupport {
  id: string;
  orderId?: string;
  customerId: string;
  type: 'general' | 'booking' | 'refund' | 'complaint' | 'technical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  subject: string;
  description: string;
  assignedTo?: string;
  tags: string[];
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  satisfaction?: number; // 1-5 rating
}

export interface SupportMessage {
  id: string;
  authorId: string;
  authorType: 'customer' | 'agent' | 'system';
  message: string;
  attachments?: string[];
  createdAt: string;
  internal: boolean; // Internal notes
}

export interface CustomerProfile {
  id: string;
  customerId: string;
  preferences: {
    communication: {
      email: boolean;
      sms: boolean;
      push: boolean;
      marketing: boolean;
    };
    travel: {
      seatPreference?: string;
      mealPreference?: string;
      hotelFloor?: string;
      specialRequests?: string;
    };
    notifications: {
      bookingUpdates: boolean;
      promotionalOffers: boolean;
      travelReminders: boolean;
      priceAlerts: boolean;
    };
  };
  loyalty: {
    points: number;
    tier: string;
    memberSince: string;
  };
  history: {
    totalBookings: number;
    totalSpent: number;
    averageRating: number;
    lastBooking: string;
    favoriteDestinations: string[];
    bookingFrequency: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Mock data
const orders: Order[] = [
  {
    id: 'order-001',
    bookingId: 'BK-2026-001247',
    customerId: 'user123',
    status: 'confirmed',
    items: [
      {
        id: 'item-001',
        productId: 'FL001',
        productType: 'flight',
        name: 'Emirates Flight EK201',
        description: 'JFK to DXB, Economy Class',
        quantity: 2,
        unitPrice: 450,
        totalPrice: 900,
        status: 'confirmed',
        supplierId: 'emirates',
        bookingReference: 'EK201-ABC123',
        travelDate: '2026-02-15',
        metadata: { airline: 'Emirates', class: 'Economy', duration: '12h 30m' }
      },
      {
        id: 'item-002',
        productId: 'HT001',
        productType: 'hotel',
        name: 'Grand Palace Hotel - Deluxe Room',
        description: 'Dubai Marina, 7 nights',
        quantity: 1,
        unitPrice: 180,
        totalPrice: 180,
        status: 'confirmed',
        supplierId: 'grand-palace',
        bookingReference: 'HP2026-456',
        travelDate: '2026-02-15',
        metadata: { hotel: 'Grand Palace', roomType: 'Deluxe', nights: 7 }
      }
    ],
    totalAmount: 1080,
    currency: 'USD',
    createdAt: '2026-01-21T14:30:00Z',
    updatedAt: '2026-01-21T14:30:00Z',
    trackingNumber: 'TRK2026001247',
    deliveryDate: '2026-02-15',
    customerNotes: 'Please provide airport transfer',
    internalNotes: 'VIP customer - ensure premium service'
  }
];

const customerCommunications: CustomerCommunication[] = [
  {
    id: 'comm-001',
    orderId: 'order-001',
    customerId: 'user123',
    type: 'email',
    direction: 'outbound',
    subject: 'Your Booking Confirmation - Emirates Flight + Grand Palace Hotel',
    message: 'Dear John Smith,\n\nThank you for booking with TravelAI. Your booking has been confirmed...\n\nBest regards,\nTravelAI Team',
    status: 'delivered',
    sentAt: '2026-01-21T14:35:00Z',
    deliveredAt: '2026-01-21T14:36:00Z',
    readAt: '2026-01-21T15:00:00Z'
  }
];

const reviews: Review[] = [
  {
    id: 'review-001',
    orderId: 'order-001',
    customerId: 'user123',
    productId: 'FL001',
    productType: 'flight',
    rating: 5,
    title: 'Excellent Emirates Experience',
    comment: 'Outstanding service from booking to arrival. The flight was comfortable and on time.',
    pros: ['Punctual', 'Comfortable seats', 'Great service'],
    cons: [],
    verified: true,
    helpful: 12,
    status: 'approved',
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
    response: {
      message: 'Thank you for your kind words! We\'re delighted you enjoyed your flight.',
      respondedAt: '2026-02-21T09:00:00Z',
      respondedBy: 'Emirates Support Team'
    }
  }
];

const supportTickets: CustomerSupport[] = [
  {
    id: 'ticket-001',
    orderId: 'order-001',
    customerId: 'user123',
    type: 'booking',
    priority: 'medium',
    status: 'resolved',
    subject: 'Request for seat upgrade',
    description: 'Customer requested upgrade from economy to business class for their Emirates flight.',
    assignedTo: 'agent001',
    tags: ['upgrade', 'flight', 'emirates'],
    messages: [
      {
        id: 'msg-001',
        authorId: 'user123',
        authorType: 'customer',
        message: 'Hi, I would like to upgrade my seat from economy to business class. What are the options?',
        createdAt: '2026-01-22T10:00:00Z',
        internal: false
      },
      {
        id: 'msg-002',
        authorId: 'agent001',
        authorType: 'agent',
        message: 'Hello! I can help you with a seat upgrade. Business class upgrade would cost $850 additional. Would you like to proceed?',
        createdAt: '2026-01-22T10:30:00Z',
        internal: false
      },
      {
        id: 'msg-003',
        authorId: 'user123',
        authorType: 'customer',
        message: 'Yes, please proceed with the upgrade.',
        createdAt: '2026-01-22T11:00:00Z',
        internal: false
      }
    ],
    createdAt: '2026-01-22T10:00:00Z',
    updatedAt: '2026-01-22T14:00:00Z',
    resolvedAt: '2026-01-22T14:00:00Z',
    satisfaction: 5
  }
];

const customerProfiles: CustomerProfile[] = [
  {
    id: 'profile-001',
    customerId: 'user123',
    preferences: {
      communication: {
        email: true,
        sms: true,
        push: false,
        marketing: true
      },
      travel: {
        seatPreference: 'window',
        mealPreference: 'vegetarian',
        hotelFloor: 'high',
        specialRequests: 'Quiet room, away from elevator'
      },
      notifications: {
        bookingUpdates: true,
        promotionalOffers: true,
        travelReminders: true,
        priceAlerts: false
      }
    },
    loyalty: {
      points: 2500,
      tier: 'Gold',
      memberSince: '2024-03-15'
    },
    history: {
      totalBookings: 15,
      totalSpent: 25000,
      averageRating: 4.8,
      lastBooking: '2026-01-21',
      favoriteDestinations: ['Dubai', 'Paris', 'London'],
      bookingFrequency: 'monthly'
    },
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2026-01-21T14:30:00Z'
  }
];

// Order Management Routes
router.get('/orders', (req: Request, res: Response) => {
  const { customerId, status, limit = 20, offset = 0 } = req.query;
  let filteredOrders = orders;

  if (customerId) {
    filteredOrders = filteredOrders.filter(o => o.customerId === customerId);
  }

  if (status) {
    filteredOrders = filteredOrders.filter(o => o.status === status);
  }

  const limitNum = typeof limit === 'string' ? parseInt(limit) : 20;
  const offsetNum = typeof offset === 'string' ? parseInt(offset) : 0;
  const paginatedOrders = filteredOrders.slice(offsetNum, offsetNum + limitNum);

  res.json({
    data: paginatedOrders,
    pagination: {
      total: filteredOrders.length,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < filteredOrders.length
    }
  });
});

router.get('/orders/:id', (req: Request, res: Response) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json({ data: order });
});

router.put('/orders/:id', (req: Request, res: Response) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const { status, customerNotes, internalNotes, deliveryDate } = req.body;

  if (status) order.status = status;
  if (customerNotes) order.customerNotes = customerNotes;
  if (internalNotes) order.internalNotes = internalNotes;
  if (deliveryDate) order.deliveryDate = deliveryDate;

  order.updatedAt = new Date().toISOString();

  res.json({ data: order });
});

// Order Modification Routes
router.post('/orders/:id/modify', (req: Request, res: Response) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const { modificationType, details } = req.body;

  // Create modification request
  const modification = {
    id: `mod-${Date.now()}`,
    orderId: order.id,
    type: modificationType, // 'date_change', 'cancellation', 'upgrade', etc.
    details,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    estimatedCost: calculateModificationCost(modificationType, details),
    approvalRequired: modificationType === 'cancellation' || modificationType === 'upgrade'
  };

  res.json({
    success: true,
    modification,
    message: modification.approvalRequired ? 'Modification request submitted for approval' : 'Modification processed successfully'
  });
});

// Customer Communication Routes
router.get('/communications', (req: Request, res: Response) => {
  const { orderId, customerId, type } = req.query;
  let communications = customerCommunications;

  if (orderId) {
    communications = communications.filter(c => c.orderId === orderId);
  }

  if (customerId) {
    communications = communications.filter(c => c.customerId === customerId);
  }

  if (type) {
    communications = communications.filter(c => c.type === type);
  }

  res.json(communications);
});

router.post('/communications', (req: Request, res: Response) => {
  const { orderId, customerId, type, subject, message } = req.body;

  if (!customerId || !type || !message) {
    return res.status(400).json({ error: 'customerId, type, and message are required' });
  }

  const communication: CustomerCommunication = {
    id: `comm-${Date.now()}`,
    orderId,
    customerId,
    type,
    direction: 'outbound',
    subject,
    message,
    status: 'sent',
    sentAt: new Date().toISOString()
  };

  customerCommunications.push(communication);

  res.status(201).json(communication);
});

// Review Management Routes
router.get('/reviews', (req: Request, res: Response) => {
  const { productId, status, rating, limit = 20 } = req.query;
  let filteredReviews = reviews;

  if (productId) {
    filteredReviews = filteredReviews.filter(r => r.productId === productId);
  }

  if (status) {
    filteredReviews = filteredReviews.filter(r => r.status === status);
  }

  if (rating) {
    const ratingNum = typeof rating === 'string' ? parseInt(rating) : Array.isArray(rating) ? parseInt(rating[0] as string) : 0;
    filteredReviews = filteredReviews.filter(r => r.rating >= ratingNum);
  }

  // Sort by helpful votes and date
  filteredReviews.sort((a, b) => b.helpful - a.helpful || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const limitNum = typeof limit === 'string' ? parseInt(limit) : 20;
  const paginatedReviews = filteredReviews.slice(0, limitNum);

  res.json({
    data: paginatedReviews,
    summary: {
      total: filteredReviews.length,
      averageRating: filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length,
      ratingDistribution: {
        5: filteredReviews.filter(r => r.rating === 5).length,
        4: filteredReviews.filter(r => r.rating === 4).length,
        3: filteredReviews.filter(r => r.rating === 3).length,
        2: filteredReviews.filter(r => r.rating === 2).length,
        1: filteredReviews.filter(r => r.rating === 1).length
      }
    }
  });
});

router.post('/reviews', (req: Request, res: Response) => {
  const { orderId, customerId, productId, productType, rating, title, comment, pros, cons } = req.body;

  if (!customerId || !productId || !rating || !title || !comment) {
    return res.status(400).json({ error: 'Required fields: customerId, productId, rating, title, comment' });
  }

  // Verify customer has purchased this product
  const hasPurchased = orders.some(order =>
    order.customerId === customerId &&
    order.items.some(item => item.productId === productId)
  );

  const review: Review = {
    id: `review-${Date.now()}`,
    orderId,
    customerId,
    productId,
    productType,
    rating,
    title,
    comment,
    pros: pros || [],
    cons: cons || [],
    verified: hasPurchased,
    helpful: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  reviews.push(review);
  res.status(201).json(review);
});

router.put('/reviews/:id', (req: Request, res: Response) => {
  const review = reviews.find(r => r.id === req.params.id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  const { status, response } = req.body;

  if (status) review.status = status;
  if (response) review.response = response;

  review.updatedAt = new Date().toISOString();

  res.json(review);
});

// Customer Support Routes
router.get('/support', (req: Request, res: Response) => {
  const { customerId, status, priority, limit = 20 } = req.query;
  let tickets = supportTickets;

  if (customerId && typeof customerId === 'string') {
    tickets = tickets.filter(t => t.customerId === customerId);
  }

  if (status) {
    tickets = tickets.filter(t => t.status === status);
  }

  if (priority) {
    tickets = tickets.filter(t => t.priority === priority);
  }

  const limitNum = typeof limit === 'string' ? parseInt(limit) : 20;
  const paginatedTickets = tickets.slice(0, limitNum);

  res.json({
    data: paginatedTickets,
    summary: {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length
    }
  });
});

router.post('/support', (req: Request, res: Response) => {
  const { customerId, orderId, type, priority, subject, description, tags } = req.body;

  if (!customerId || !type || !subject || !description) {
    return res.status(400).json({ error: 'customerId, type, subject, and description are required' });
  }

  const ticket: CustomerSupport = {
    id: `ticket-${Date.now()}`,
    orderId,
    customerId,
    type,
    priority: priority || 'medium',
    status: 'open',
    subject,
    description,
    tags: tags || [],
    messages: [{
      id: `msg-${Date.now()}`,
      authorId: customerId,
      authorType: 'customer',
      message: description,
      createdAt: new Date().toISOString(),
      internal: false
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  supportTickets.push(ticket);
  res.status(201).json(ticket);
});

router.post('/support/:id/messages', (req: Request, res: Response) => {
  const ticket = supportTickets.find(t => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Support ticket not found' });
  }

  const { authorId, authorType, message, internal } = req.body;

  if (!authorId || !authorType || !message) {
    return res.status(400).json({ error: 'authorId, authorType, and message are required' });
  }

  const newMessage: SupportMessage = {
    id: `msg-${Date.now()}`,
    authorId,
    authorType,
    message,
    createdAt: new Date().toISOString(),
    internal: internal || false
  };

  ticket.messages.push(newMessage);
  ticket.updatedAt = new Date().toISOString();

  res.json(newMessage);
});

router.put('/support/:id', (req: Request, res: Response) => {
  const ticket = supportTickets.find(t => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Support ticket not found' });
  }

  const { status, assignedTo, priority, satisfaction } = req.body;

  if (status) ticket.status = status;
  if (assignedTo) ticket.assignedTo = assignedTo;
  if (priority) ticket.priority = priority;
  if (satisfaction) ticket.satisfaction = satisfaction;

  if (['resolved', 'closed'].includes(status) && !ticket.resolvedAt) {
    ticket.resolvedAt = new Date().toISOString();
  }

  ticket.updatedAt = new Date().toISOString();

  res.json(ticket);
});

// Customer Profile Routes
router.get('/profiles/:customerId', (req: Request, res: Response) => {
  const profile = customerProfiles.find(p => p.customerId === req.params.customerId);
  if (!profile) {
    return res.status(404).json({ error: 'Customer profile not found' });
  }

  res.json({ data: profile });
});

router.put('/profiles/:customerId', (req: Request, res: Response) => {
  let profile = customerProfiles.find(p => p.customerId === req.params.customerId);

  if (!profile) {
    profile = {
      id: `profile-${Date.now()}`,
      customerId: req.params.customerId as string,
      preferences: req.body.preferences || {},
      loyalty: req.body.loyalty || { points: 0, tier: 'Bronze', memberSince: new Date().toISOString() },
      history: req.body.history || {
        totalBookings: 0,
        totalSpent: 0,
        averageRating: 0,
        favoriteDestinations: [],
        bookingFrequency: 'first_time'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    customerProfiles.push(profile);
  } else {
    Object.assign(profile, req.body);
    profile.updatedAt = new Date().toISOString();
  }

  res.json({ data: profile });
});

// Analytics Routes
router.get('/analytics', (req: Request, res: Response) => {
  const analytics = {
    orders: {
      total: orders.length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      revenue: orders.reduce((sum, o) => sum + o.totalAmount, 0)
    },
    reviews: {
      total: reviews.length,
      approved: reviews.filter(r => r.status === 'approved').length,
      averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
      verified: reviews.filter(r => r.verified).length
    },
    support: {
      totalTickets: supportTickets.length,
      open: supportTickets.filter(t => t.status === 'open').length,
      resolved: supportTickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
      averageResolutionTime: 2.3, // hours
      satisfactionScore: supportTickets.reduce((sum, t) => sum + (t.satisfaction || 0), 0) / supportTickets.filter(t => t.satisfaction).length
    },
    communications: {
      total: customerCommunications.length,
      delivered: customerCommunications.filter(c => c.status === 'delivered').length,
      read: customerCommunications.filter(c => c.status === 'read').length
    }
  };

  res.json({ data: analytics });
});

// Helper functions
function calculateModificationCost(modificationType: string, details: Record<string, unknown>): number {
  // Mock cost calculation
  switch (modificationType) {
    case 'date_change': {
      return 50;
    }
    case 'cancellation': {
      const totalAmount = typeof details.totalAmount === 'number' ? details.totalAmount : 0;
      return Math.max(25, totalAmount * 0.1);
    }
    case 'upgrade': {
      const upgradeCost = typeof details.upgradeCost === 'number' ? details.upgradeCost : 100;
      return upgradeCost;
    }
    default: {
      return 0;
    }
  }
}

export default router;
