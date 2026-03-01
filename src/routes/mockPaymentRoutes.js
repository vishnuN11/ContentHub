import express from 'express';
import {protect} from '../middleware/authMiddleware.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';

const router = express.Router();

// 📋 Subscription Plans
const PLANS = {
  monthly: { 
    id: 'monthly',
    name: 'Monthly', 
    price: 50, 
    duration: 30, 
    durationText: '1 Month',
    description: 'Basic plan for monthly users',
    features: ['Download up to 50 PDFs/month', 'Email support']
  },
  quarterly: { 
    id: 'quarterly',
    name: 'Quarterly', 
    price: 100, 
    duration: 90, 
    durationText: '3 Months',
    description: 'Save ₹50 with quarterly plan',
    features: ['Unlimited downloads', 'Priority email support', 'Save ₹50'],
    save: '₹50'
  },
  halfyearly: { 
    id: 'halfyearly',
    name: 'Half Yearly', 
    price: 150, 
    duration: 180, 
    durationText: '6 Months',
    description: 'Save ₹150 with half yearly plan',
    features: ['Unlimited downloads', 'Priority support', 'Early access', 'Save ₹150'],
    save: '₹150'
  },
  yearly: { 
    id: 'yearly',
    name: 'Yearly', 
    price: 250, 
    duration: 365, 
    durationText: '1 Year',
    description: 'Save ₹350 with yearly plan',
    features: ['Unlimited downloads', 'Priority support', 'Early access', 'Save ₹350'],
    save: '₹350',
    popular: true
  }
};

/**
 * @desc    Get all subscription plans
 * @route   GET /api/mock-payment/plans
 * @access  Public
 */
router.get('/plans', (req, res) => {
  try {
    res.json({ 
      success: true, 
      count: Object.keys(PLANS).length,
      plans: PLANS 
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching plans' 
    });
  }
});

/**
 * @desc    Get single plan details
 * @route   GET /api/mock-payment/plans/:planId
 * @access  Public
 */
router.get('/plans/:planId', (req, res) => {
  try {
    const { planId } = req.params;
    const plan = PLANS[planId];
    
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plan not found' 
      });
    }

    res.json({ 
      success: true, 
      plan 
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching plan' 
    });
  }
});

/**
 * @desc    Create mock payment intent
 * @route   POST /api/mock-payment/create-payment-intent
 * @access  Private
 */
router.post('/create-payment-intent', protect, async (req, res) => {
  try {
    const { planId } = req.body;
    
    // Validate plan
    const planDetails = PLANS[planId];
    if (!planDetails) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid plan selected' 
      });
    }

    // Generate mock payment intent
    const mockPaymentIntent = {
      id: 'pi_mock_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      amount: planDetails.price * 100, // in paise
      currency: 'inr',
      status: 'requires_confirmation',
      client_secret: 'mock_secret_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      created: Date.now(),
      plan: planDetails
    };

    // Log for debugging
    console.log(`✅ Mock payment intent created for user ${req.user.id}:`, mockPaymentIntent.id);

    res.json({
      success: true,
      clientSecret: mockPaymentIntent.client_secret,
      paymentIntentId: mockPaymentIntent.id,
      amount: planDetails.price,
      message: 'Mock payment intent created (TEST MODE)'
    });

  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating payment intent' 
    });
  }
});

/**
 * @desc    Confirm payment and activate subscription
 * @route   POST /api/mock-payment/confirm-payment
 * @access  Private
 */
router.post('/confirm-payment', protect, async (req, res) => {
  try {
    const { planId, paymentIntentId } = req.body;

    // Validate plan
    const planDetails = PLANS[planId];
    if (!planDetails) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid plan' 
      });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + planDetails.duration);

    // Deactivate any existing active subscriptions
    await Subscription.updateMany(
      { 
        user: req.user.id, 
        status: 'active' 
      },
      { 
        status: 'expired',
        updatedAt: new Date()
      }
    );

    // Create new subscription
    const subscription = await Subscription.create({
      user: req.user.id,
      plan: planId,
      amount: planDetails.price,
      paymentId: paymentIntentId || ('MOCK_' + Date.now() + '_' + Math.random().toString(36).substring(7)),
      startDate,
      endDate,
      status: 'active',
      autoRenew: false
    });

    // Update user
    await User.findByIdAndUpdate(req.user.id, {
      isSubscribed: true,
      'subscription.plan': planId,
      'subscription.startDate': startDate,
      'subscription.endDate': endDate,
      'subscription.paymentId': subscription.paymentId
    });

    console.log(`✅ Subscription activated for user ${req.user.id}:`, subscription._id);

    res.json({
      success: true,
      message: 'Payment successful! Subscription activated.',
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        planName: planDetails.name,
        amount: subscription.amount,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        daysRemaining: planDetails.duration
      }
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error confirming payment'
    });
  }
});

/**
 * @desc    Get subscription status
 * @route   GET /api/mock-payment/status
 * @access  Private
 */
router.get('/status', protect, async (req, res) => {
  try {
    // Find active subscription
    const subscription = await Subscription.findOne({
      user: req.user.id,
      status: 'active',
      endDate: { $gt: new Date() }
    }).sort({ endDate: -1 });

    // Get user subscription data
    const user = await User.findById(req.user.id).select('isSubscribed subscription');

    // Calculate days remaining if subscription exists
    let daysRemaining = 0;
    if (subscription) {
      const now = new Date();
      const end = new Date(subscription.endDate);
      daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    }

    res.json({
      success: true,
      isSubscribed: user?.isSubscribed || false,
      hasActiveSubscription: !!subscription,
      subscription: subscription ? {
        id: subscription._id,
        plan: subscription.plan,
        planName: PLANS[subscription.plan]?.name || subscription.plan,
        amount: subscription.amount,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        daysRemaining: daysRemaining,
        status: subscription.status
      } : (user?.subscription || null)
    });

  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching subscription status' 
    });
  }
});

/**
 * @desc    Cancel subscription
 * @route   POST /api/mock-payment/cancel
 * @access  Private
 */
router.post('/cancel', protect, async (req, res) => {
  try {
    // Find active subscription
    const subscription = await Subscription.findOne({
      user: req.user.id,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active subscription found' 
      });
    }

    // Cancel subscription
    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();

    // Update user
    await User.findByIdAndUpdate(req.user.id, {
      'subscription.autoRenew': false
    });

    console.log(`✅ Subscription cancelled for user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: {
        id: subscription._id,
        status: subscription.status,
        endDate: subscription.endDate
      }
    });

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error cancelling subscription' 
    });
  }
});

/**
 * @desc    Mock webhook (for testing)
 * @route   POST /api/mock-payment/webhook
 * @access  Public (for testing)
 */
router.post('/webhook', (req, res) => {
  try {
    console.log('📡 Mock webhook received:', req.body);
    
    // Simulate webhook processing
    setTimeout(() => {
      console.log('✅ Webhook processed successfully');
    }, 1000);

    res.json({ 
      success: true, 
      message: 'Webhook received',
      received: req.body
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing webhook' 
    });
  }
});

/**
 * @desc    Check if user can download PDF
 * @route   GET /api/mock-payment/can-download
 * @access  Private
 */
router.get('/can-download', protect, async (req, res) => {
  try {
    // Find active subscription
    const subscription = await Subscription.findOne({
      user: req.user.id,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    const canDownload = !!subscription;

    res.json({
      success: true,
      canDownload,
      message: canDownload ? 'User can download' : 'Subscription required for download'
    });

  } catch (error) {
    console.error('Check download error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error checking download permission' 
    });
  }
});

export default router;