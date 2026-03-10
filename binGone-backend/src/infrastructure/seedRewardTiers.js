import RewardTier from '../domain/rewardTier.model.js';

export async function seedRewardTiers() {
  try {
    // Check if tiers already exist
    const existingTiers = await RewardTier.countDocuments();
    if (existingTiers > 0) {
      console.log('Reward tiers already seeded');
      return;
    }

    const tiers = [
      {
        name: 'Free',
        displayName: 'Community Member',
        pointThreshold: 0,
        monthlyPrice: 0,
        pointUpgradeCost: null,
        benefits: [
          {
            title: 'Unlimited Donation Posts',
            description: 'Post as many donation items as you want',
            type: 'feature'
          },
          {
            title: 'Points for Each Donated Item (+5 pts/item)',
            description: 'Earn points for every item you donate',
            type: 'feature'
          },
          {
            title: 'Points for Successful Referrals (+10 pts/referral)',
            description: 'Earn points when your referrals make their first donation',
            type: 'feature'
          },
          {
            title: 'Recognition in Community Highlights',
            description: 'Your donations may be featured in community highlights',
            type: 'feature'
          },
          {
            title: 'Basic Donor Badge',
            description: 'Display your donor status with a basic badge',
            type: 'badge'
          },
          {
            title: 'Access to Standard Listing Placement',
            description: 'Standard visibility for your listings',
            type: 'feature'
          },
          {
            title: 'Eligibility for Future Donor Rewards',
            description: 'Access to new rewards as they become available',
            type: 'feature'
          }
        ],
        sortOrder: 1
      },
      {
        name: 'Premium',
        displayName: 'Premium',
        pointThreshold: 200,
        monthlyPrice: 499, // $4.99 in cents
        pointUpgradeCost: 200,
        benefits: [
          {
            title: 'Priority Listing Placement',
            description: 'Your listings appear higher in search results',
            type: 'feature'
          },
          {
            title: 'Super Donor Profile Badge',
            description: 'Premium badge displayed on your profile',
            type: 'badge'
          },
          {
            title: 'Option to Redeem Points for Listing Boosts',
            description: 'Use points to boost individual listings for extra visibility',
            type: 'boost'
          },
          {
            title: 'Featured Spot in Community Highlights',
            description: 'Higher chance of being featured in community highlights',
            type: 'feature'
          },
          {
            title: 'Early Access to New Campaigns',
            description: 'Be the first to know about new community campaigns',
            type: 'access'
          },
          {
            title: 'Priority Support Access',
            description: 'Get faster response times for support requests',
            type: 'feature'
          },
          {
            title: 'Increased Visibility in Search & Filters',
            description: 'Better ranking in search results and category filters',
            type: 'feature'
          }
        ],
        sortOrder: 2
      }
    ];

    await RewardTier.insertMany(tiers);
    console.log('Reward tiers seeded successfully');
  } catch (error) {
    console.error('Error seeding reward tiers:', error);
    throw error;
  }
}
