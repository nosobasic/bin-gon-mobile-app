import express from 'express';
import User, { generateReferralCode } from '../../../domain/user.model.js';
import RewardTier from '../../../domain/rewardTier.model.js';
import Referral from '../../../domain/referral.model.js';
import { authMiddleware } from '../middleware/auth.js';

export function rewardsRouter(env) {
  const router = express.Router();

  // Get user's current reward status
  router.get('/status', authMiddleware(env), async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select('-passwordHash');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate referral code if user doesn't have one (for existing users)
      if (!user.referralCode) {
        user.referralCode = generateReferralCode();
        await user.save();
      }

      // Get all reward tiers for context
      const tiers = await RewardTier.find({ isActive: true }).sort({ sortOrder: 1 });
      
      // Calculate progress to next tier
      const currentTierIndex = tiers.findIndex(tier => tier.name === user.tier);
      const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;
      
      const progressToNext = nextTier ? {
        targetTier: nextTier.name,
        targetPoints: nextTier.pointThreshold,
        currentPoints: user.points,
        progress: Math.min((user.points / nextTier.pointThreshold) * 100, 100)
      } : null;

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          points: user.points,
          tier: user.tier,
          referralCode: user.referralCode,
          badges: user.badges,
          isPremium: user.isPremium
        },
        currentTier: tiers.find(tier => tier.name === user.tier),
        progressToNext,
        availableTiers: tiers
      });
    } catch (e) {
      next(e);
    }
  });

  // Get all reward tiers and their benefits
  router.get('/tiers', async (req, res, next) => {
    try {
      const tiers = await RewardTier.find({ isActive: true }).sort({ sortOrder: 1 });
      res.json(tiers);
    } catch (e) {
      next(e);
    }
  });

  // Get benefits for a specific tier
  router.get('/tiers/:tierName/benefits', async (req, res, next) => {
    try {
      const tier = await RewardTier.findOne({ 
        name: req.params.tierName, 
        isActive: true 
      });
      
      if (!tier) {
        return res.status(404).json({ message: 'Tier not found' });
      }

      res.json({
        tier: {
          name: tier.name,
          displayName: tier.displayName,
          benefits: tier.benefits
        }
      });
    } catch (e) {
      next(e);
    }
  });

  // Upgrade with points
  router.post('/upgrade/points', authMiddleware(env), async (req, res, next) => {
    try {
      const { targetTier } = req.body;
      
      const user = await User.findById(req.user.id);
      const targetTierData = await RewardTier.findOne({ 
        name: targetTier, 
        isActive: true 
      });

      if (!targetTierData) {
        return res.status(404).json({ message: 'Target tier not found' });
      }

      if (!targetTierData.pointUpgradeCost) {
        return res.status(400).json({ message: 'This tier cannot be upgraded with points' });
      }

      if (user.points < targetTierData.pointUpgradeCost) {
        return res.status(400).json({ 
          message: 'Insufficient points', 
          required: targetTierData.pointUpgradeCost,
          current: user.points 
        });
      }

      // Update user tier and deduct points
      user.points -= targetTierData.pointUpgradeCost;
      user.tier = targetTier;
      user.badges.push('Basic Donor Badge');
      
      await user.save();

      res.json({
        message: 'Upgrade successful',
        user: {
          points: user.points,
          tier: user.tier,
          badges: user.badges
        }
      });
    } catch (e) {
      next(e);
    }
  });

  // Redeem points for listing boost
  router.post('/redeem/boost', authMiddleware(env), async (req, res, next) => {
    try {
      const { pointsToRedeem, listingId } = req.body;
      const pointsCost = 50; // Fixed cost for listing boost

      if (pointsToRedeem !== pointsCost) {
        return res.status(400).json({ 
          message: `Listing boost costs ${pointsCost} points` 
        });
      }

      const user = await User.findById(req.user.id);
      
      if (user.points < pointsCost) {
        return res.status(400).json({ 
          message: 'Insufficient points for listing boost',
          required: pointsCost,
          current: user.points
        });
      }

      if (!user.isPremium) {
        return res.status(403).json({ 
          message: 'Listing boost is only available for premium users' 
        });
      }

      // Deduct points (the actual boost logic would be implemented in listings)
      user.points -= pointsCost;
      await user.save();

      res.json({
        message: 'Points redeemed successfully for listing boost',
        remainingPoints: user.points,
        listingId: listingId
      });
    } catch (e) {
      next(e);
    }
  });

  // Get referral information
  router.get('/referral', authMiddleware(env), async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      
      // Generate referral code if user doesn't have one (for existing users)
      if (!user.referralCode) {
        user.referralCode = generateReferralCode();
        await user.save();
      }
      
      const referrals = await Referral.find({ referrerId: req.user.id });
      
      res.json({
        referralCode: user.referralCode,
        totalReferrals: referrals.length,
        successfulReferrals: referrals.filter(r => r.status === 'completed').length,
        pointsEarned: referrals.reduce((sum, r) => sum + r.pointsAwarded, 0)
      });
    } catch (e) {
      next(e);
    }
  });

  // Process referral signup
  router.post('/referral/signup', async (req, res, next) => {
    try {
      const { referralCode, userId } = req.body;

      if (!referralCode || !userId) {
        return res.status(400).json({ message: 'Referral code and user ID are required' });
      }

      const referrer = await User.findOne({ referralCode });
      if (!referrer) {
        return res.status(404).json({ message: 'Invalid referral code' });
      }

      const referee = await User.findById(userId);
      if (!referee) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user was already referred
      const existingReferral = await Referral.findOne({ refereeId: userId });
      if (existingReferral) {
        return res.status(400).json({ message: 'User already has a referral' });
      }

      // Award points to referrer immediately
      const pointsPerReferral = 10;
      referrer.points += pointsPerReferral;

      // Create referral record with rewarded status
      const referral = new Referral({
        referrerId: referrer._id,
        refereeId: userId,
        referralCode,
        status: 'rewarded', // Changed from 'pending' to 'rewarded'
        pointsAwarded: pointsPerReferral,
        signupDate: new Date()
      });

      // Update referee's referredBy field
      referee.referredBy = referrer._id;
      
      // Save all changes
      await Promise.all([referral.save(), referee.save(), referrer.save()]);

      res.json({
        message: 'Referral recorded successfully and points awarded',
        referralId: referral._id,
        pointsAwarded: pointsPerReferral,
        referrerPoints: referrer.points
      });
    } catch (e) {
      next(e);
    }
  });

  // Award points for donation
  router.post('/points/donation', authMiddleware(env), async (req, res, next) => {
    try {
      const { donationId } = req.body;
      const pointsPerDonation = 5;

      const user = await User.findById(req.user.id);
      user.points += pointsPerDonation;
      await user.save();

      res.json({
        message: 'Points awarded for donation',
        pointsAwarded: pointsPerDonation,
        totalPoints: user.points
      });
    } catch (e) {
      next(e);
    }
  });

  // Award points for successful referral
  router.post('/points/referral', authMiddleware(env), async (req, res, next) => {
    try {
      const { referralId } = req.body;
      const pointsPerReferral = 10;

      const referral = await Referral.findById(referralId);
      if (!referral) {
        return res.status(404).json({ message: 'Referral not found' });
      }

      if (referral.status !== 'pending') {
        return res.status(400).json({ message: 'Referral already processed' });
      }

      // Award points to referrer
      const referrer = await User.findById(referral.referrerId);
      referrer.points += pointsPerReferral;
      
      // Update referral status
      referral.status = 'rewarded';
      referral.pointsAwarded = pointsPerReferral;
      
      await Promise.all([referrer.save(), referral.save()]);

      res.json({
        message: 'Points awarded for successful referral',
        pointsAwarded: pointsPerReferral,
        totalPoints: referrer.points
      });
    } catch (e) {
      next(e);
    }
  });

  return router;
}
