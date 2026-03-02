import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  plan: {
    type: String,
    enum: ['monthly', 'quarterly', 'halfyearly', 'yearly'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  stripePaymentIntentId: String,
  stripeCustomerId: String,
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'active'
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  cancelledAt: Date,
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// 🔒 Indexes
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ status: 1 });

// 🔒 Check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && new Date(this.endDate) > new Date();
};

// 🔒 Calculate days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// 🔒 Static method to get plan details
subscriptionSchema.statics.getPlanDetails = function(plan) {
  const plans = {
    monthly: { price: 50, duration: 30, name: 'Monthly' },
    quarterly: { price: 100, duration: 90, name: 'Quarterly' },
    halfyearly: { price: 150, duration: 180, name: 'Half Yearly' },
    yearly: { price: 250, duration: 365, name: 'Yearly' }
  };
  return plans[plan] || null;
};

export default mongoose.model('Subscription', subscriptionSchema);