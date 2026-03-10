import express from 'express';
import Stripe from 'stripe';
import User from '../../../domain/user.model.js';
import Payment from '../../../domain/payment.model.js';
import RewardTier from '../../../domain/rewardTier.model.js';
import { authMiddleware } from '../middleware/auth.js';

export function paymentsRouter(env) {
  const router = express.Router();
  
  // Initialize Stripe
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  // Create payment intent for upgrade
  router.post('/create-payment-intent', authMiddleware(env), async (req, res, next) => {
    try {
      const { targetTier, paymentMethodType = 'card' } = req.body;

      const user = await User.findById(req.user.id);
      const targetTierData = await RewardTier.findOne({ 
        name: targetTier, 
        isActive: true 
      });

      if (!targetTierData) {
        return res.status(404).json({ message: 'Target tier not found' });
      }

      if (!targetTierData.monthlyPrice) {
        return res.status(400).json({ message: 'This tier cannot be purchased with payment' });
      }

      // Create or retrieve Stripe customer
      let customer;
      if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: user._id.toString()
          }
        });
        user.stripeCustomerId = customer.id;
        await user.save();
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: targetTierData.monthlyPrice, // Amount in cents
        currency: 'usd',
        customer: customer.id,
        payment_method_types: [paymentMethodType],
        metadata: {
          userId: user._id.toString(),
          targetTier: targetTier,
          upgradeType: 'premium_subscription'
        },
        description: `Upgrade to ${targetTierData.displayName} tier`
      });

      // Create payment record
      const payment = new Payment({
        userId: user._id,
        amount: targetTierData.monthlyPrice,
        currency: 'usd',
        status: 'pending',
        paymentMethod: paymentMethodType,
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: customer.id,
        upgradeType: 'premium_subscription',
        targetTier: targetTier,
        description: `Upgrade to ${targetTierData.displayName} tier`
      });

      await payment.save();

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentId: payment._id,
        amount: targetTierData.monthlyPrice,
        currency: 'usd'
      });
    } catch (e) {
      next(e);
    }
  });

  // Confirm payment and upgrade user (New Stripe React Native SDK Flow)
  router.post('/confirm-payment', authMiddleware(env), async (req, res, next) => {
    try {
      const { paymentId, paymentIntentId, paymentMethodId } = req.body;
      
      console.log('Received payment confirmation request:', {
        paymentId,
        paymentIntentId,
        paymentMethodId
      });

      const payment = await Payment.findOne({
        _id: paymentId,
        userId: req.user.id,
        stripePaymentIntentId: paymentIntentId
      });

      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Check if payment is already completed
      if (payment.status === 'completed') {
        return res.json({
          message: 'Payment already confirmed',
          user: {
            tier: payment.targetTier,
            isPremium: true
          },
          payment: {
            id: payment._id,
            amount: payment.amount,
            status: payment.status
          }
        });
      }

      try {
        // Step 1: Retrieve the payment intent to verify it was successful
        console.log('Retrieving payment intent from Stripe...');
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        console.log('Payment intent status:', paymentIntent.status);

        if (paymentIntent.status !== 'succeeded') {
          // Update payment status to failed
          payment.status = 'failed';
          payment.failedAt = new Date();
          await payment.save();

          return res.status(400).json({ 
            message: 'Payment not completed',
            status: paymentIntent.status,
            details: `Payment status: ${paymentIntent.status}. Please try again or contact support.`
          });
        }

        // Step 2: Update payment record with success
        payment.status = 'completed';
        payment.paidAt = new Date();
        payment.stripeChargeId = paymentIntent.latest_charge;
        // Store the payment method ID for future reference
        if (paymentMethodId) {
          payment.paymentMethodId = paymentMethodId;
        }

        // Step 3: Update user tier and subscription
        const user = await User.findById(req.user.id);
        const targetTierData = await RewardTier.findOne({ name: payment.targetTier });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        user.tier = payment.targetTier;
        user.isPremium = true;
        user.subscriptionStartDate = new Date();
        user.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        
        // Add badge if not already present
        if (!user.badges.includes('Super Donor Badge')) {
          user.badges.push('Super Donor Badge');
        }

        await Promise.all([payment.save(), user.save()]);

        console.log('Payment confirmed and user upgraded successfully');

        // Step 4: Return success response
        res.json({
          message: 'Payment confirmed and upgrade successful',
          user: {
            tier: user.tier,
            isPremium: user.isPremium,
            badges: user.badges,
            subscriptionEndDate: user.subscriptionEndDate
          },
          payment: {
            id: payment._id,
            amount: paymentIntent.amount,
            status: paymentIntent.status
          }
        });

      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        
        // Update payment status to failed
        payment.status = 'failed';
        payment.failedAt = new Date();
        await payment.save();
        
        // Handle specific Stripe error types
        if (stripeError.type === 'card_error') {
          return res.status(400).json({
            message: stripeError.message || 'Card declined. Please try a different card.',
            error: 'card_declined',
            code: stripeError.code
          });
        }
        
        if (stripeError.type === 'invalid_request_error') {
          return res.status(400).json({
            message: 'Invalid payment request. Please check your payment details and try again.',
            error: 'invalid_request'
          });
        }
        
        if (stripeError.type === 'authentication_error') {
          return res.status(400).json({
            message: 'Payment authentication failed. Please try again.',
            error: 'authentication_failed'
          });
        }

        return res.status(400).json({
          message: stripeError.message || 'Payment confirmation failed',
          error: stripeError.type || 'stripe_error',
          code: stripeError.code
        });
      }
    } catch (e) {
      console.error('Payment confirmation error:', e);
      next(e);
    }
  });

  // Test mode: Simulate successful payment (for development/testing only)
  router.post('/test-confirm', authMiddleware(env), async (req, res, next) => {
    try {
      const { paymentId, targetTier = 'Premium' } = req.body;

      // Find or create a test payment record
      let payment = await Payment.findOne({
        _id: paymentId,
        userId: req.user.id
      });

      if (!payment) {
        // Create a test payment record
        const targetTierData = await RewardTier.findOne({ 
          name: targetTier, 
          isActive: true 
        });

        if (!targetTierData) {
          return res.status(404).json({ message: 'Target tier not found' });
        }

        payment = new Payment({
          userId: req.user.id,
          amount: targetTierData.monthlyPrice,
          currency: 'usd',
          status: 'completed',
          paymentMethod: 'test',
          upgradeType: 'premium_subscription',
          targetTier: targetTier,
          description: `Test upgrade to ${targetTierData.displayName} tier`,
          paidAt: new Date()
        });

        await payment.save();
      } else {
        // Update existing payment
        payment.status = 'completed';
        payment.paidAt = new Date();
        await payment.save();
      }

      // Update user tier and subscription
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.tier = targetTier;
      user.isPremium = true;
      user.subscriptionStartDate = new Date();
      user.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      if (!user.badges.includes('Super Donor Badge')) {
        user.badges.push('Super Donor Badge');
      }

      await user.save();

      res.json({
        message: 'Test payment confirmed and upgrade successful',
        user: {
          tier: user.tier,
          isPremium: user.isPremium,
          badges: user.badges,
          subscriptionEndDate: user.subscriptionEndDate
        },
        payment: {
          id: payment._id,
          amount: payment.amount,
          status: payment.status
        }
      });
    } catch (e) {
      next(e);
    }
  });

  // Get payment history
  router.get('/history', authMiddleware(env), async (req, res, next) => {
    try {
      const payments = await Payment.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(50);

      res.json({
        payments: payments.map(payment => ({
          id: payment._id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          upgradeType: payment.upgradeType,
          targetTier: payment.targetTier,
          description: payment.description,
          createdAt: payment.createdAt,
          paidAt: payment.paidAt
        }))
      });
    } catch (e) {
      next(e);
    }
  });

  // Webhook endpoint for Stripe events
  router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
    try {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = env.STRIPE_WEBHOOK_SECRET;

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          await handlePaymentSuccess(paymentIntent);
          break;
        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          await handlePaymentFailure(failedPayment);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (e) {
      next(e);
    }
  });

  // Helper functions
  async function handlePaymentSuccess(paymentIntent) {
    try {
      const payment = await Payment.findOne({
        stripePaymentIntentId: paymentIntent.id
      });

      if (!payment) {
        console.error('Payment record not found for payment intent:', paymentIntent.id);
        return;
      }

      if (payment.status === 'completed') {
        console.log('Payment already processed:', payment._id);
        return;
      }

      // Update payment status
      payment.status = 'completed';
      payment.paidAt = new Date();
      payment.stripeChargeId = paymentIntent.latest_charge;

      // Update user tier
      const user = await User.findById(payment.userId);
      if (user) {
        user.tier = payment.targetTier;
        user.isPremium = true;
        user.subscriptionStartDate = new Date();
        user.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        user.badges.push('Super Donor Badge');

        await Promise.all([payment.save(), user.save()]);
        console.log('Payment processed successfully:', payment._id);
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  async function handlePaymentFailure(paymentIntent) {
    try {
      const payment = await Payment.findOne({
        stripePaymentIntentId: paymentIntent.id
      });

      if (payment) {
        payment.status = 'failed';
        payment.failedAt = new Date();
        await payment.save();
        console.log('Payment marked as failed:', payment._id);
      }
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  return router;
}
