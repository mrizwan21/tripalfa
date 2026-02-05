import mongoose from 'mongoose';

// Booking Schema
const bookingSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  segment: {
    type: String,
    enum: ['FLIGHT', 'HOTEL', 'PACKAGE', 'TRANSFER', 'VISA', 'INSURANCE'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED', 'TICKETED', 'IMPORTED'],
    default: 'PENDING',
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  customer: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String
    },
    type: {
      type: String,
      enum: ['individual', 'corporate'],
      default: 'individual'
    },
    companyId: String,
    branchId: String
  },
  serviceDetails: {
    type: {
      type: String,
      enum: ['flight', 'hotel', 'package', 'transfer', 'visa', 'insurance'],
      required: true
    },
    segments: [{
      id: String,
      type: String,
      departure: String,
      arrival: String,
      date: Date,
      details: mongoose.Schema.Types.Mixed
    }],
    supplier: {
      id: String,
      name: String,
      pnr: String,
      supplierRef: String
    }
  },
  financials: {
    customerPrice: {
      type: Number,
      required: true
    },
    supplierPrice: {
      type: Number,
      required: true
    },
    markup: {
      type: Number,
      default: 0
    },
    taxes: {
      type: Number,
      default: 0
    },
    fees: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    paymentMethod: {
      type: String,
      enum: ['wallet', 'credit_card', 'supplier_credit'],
      default: 'wallet'
    },
    profit: {
      type: Number,
      default: 0
    }
  },
  timeline: {
    bookedAt: {
      type: Date,
      default: Date.now
    },
    travelDate: Date,
    returnDate: Date,
    holdUntil: Date,
    lastModified: {
      type: Date,
      default: Date.now
    }
  },
  adminFeatures: {
    assignedAgent: String,
    branch: String,
    queueStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    tags: [String],
    notes: [{
      id: String,
      content: String,
      author: String,
      createdAt: Date
    }],
    auditTrail: [{
      id: String,
      action: String,
      actor: String,
      timestamp: Date,
      details: mongoose.Schema.Types.Mixed
    }]
  },
  documents: [{
    id: String,
    type: String,
    url: String,
    createdAt: Date,
    createdBy: String
  }],
  communications: [{
    id: String,
    type: String,
    content: String,
    timestamp: Date,
    sender: String,
    recipient: String
  }],
  specialFeatures: {
    specialRequests: [String],
    amendments: [{
      id: String,
      type: String,
      reason: String,
      status: String,
      createdAt: Date
    }],
    refunds: [{
      id: String,
      amount: Number,
      reason: String,
      status: String,
      createdAt: Date
    }],
    notifications: [{
      id: String,
      type: String,
      message: String,
      createdAt: Date,
      read: Boolean
    }]
  },
  metadata: {
    source: {
      type: String,
      enum: ['b2b', 'b2c', 'api', 'import'],
      default: 'b2b'
    },
    agentId: String,
    branchId: String,
    companyId: String,
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
bookingSchema.index({ 'customer.id': 1, 'timeline.bookedAt': -1 });
bookingSchema.index({ status: 1, 'timeline.bookedAt': -1 });
bookingSchema.index({ 'adminFeatures.assignedAgent': 1, status: 1 });
bookingSchema.index({ 'timeline.travelDate': 1, status: 1 });
bookingSchema.index({ 'financials.currency': 1, 'timeline.bookedAt': -1 });

// Virtual for total amount
bookingSchema.virtual('totalAmount').get(function() {
  return (this.financials?.customerPrice || 0) + (this.financials?.taxes || 0) + (this.financials?.fees || 0);
});

// Virtual for booking age
bookingSchema.virtual('age').get(function() {
  return this.timeline?.bookedAt ? Date.now() - this.timeline.bookedAt.getTime() : 0;
});

// Static methods
bookingSchema.statics.findByCustomer = function(customerId) {
  return this.find({ 'customer.id': customerId }).sort({ 'timeline.bookedAt': -1 });
};

bookingSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ 'timeline.bookedAt': -1 });
};

bookingSchema.statics.findByAgent = function(agentId) {
  return this.find({ 'adminFeatures.assignedAgent': agentId }).sort({ 'timeline.bookedAt': -1 });
};

bookingSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    'timeline.bookedAt': {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ 'timeline.bookedAt': -1 });
};

// Instance methods
bookingSchema.methods.updateStatus = function(newStatus: string, actor: string) {
  this.status = newStatus;
  if (this.timeline) {
    this.timeline.lastModified = new Date();
  }
  
  this.adminFeatures.auditTrail.push({
    id: Math.random().toString(36).substr(2, 9),
    action: 'status_change',
    actor: actor,
    timestamp: new Date(),
    details: { previousStatus: this.status, newStatus }
  });
  
  return this.save();
};

bookingSchema.methods.addNote = function(content: string, author: string) {
  this.adminFeatures.notes.push({
    id: Math.random().toString(36).substr(2, 9),
    content,
    author,
    createdAt: new Date()
  });
  return this.save();
};

bookingSchema.methods.addDocument = function(docType: string, url: string, createdBy: string) {
  this.documents.push({
    id: Math.random().toString(36).substr(2, 9),
    type: docType,
    url,
    createdAt: new Date(),
    createdBy
  });
  return this.save();
};

// Pre-save middleware
bookingSchema.pre('save', function(next) {
  // Update lastModified timestamp
  if (this.timeline) {
    this.timeline.lastModified = new Date();
  }
  
  // Calculate profit if not set
  if (this.financials?.customerPrice && this.financials?.supplierPrice) {
    this.financials.profit = this.financials.customerPrice - this.financials.supplierPrice;
  }
  
  next();
});

// Pre-find middleware for soft delete simulation
bookingSchema.pre(['find', 'findOne', 'countDocuments'], function() {
  // Add filter to exclude cancelled bookings in certain contexts
  if (!this.getOptions().includeCancelled) {
    this.where({ status: { $ne: 'CANCELLED' } });
  }
});

export const Booking = mongoose.model('Booking', bookingSchema);