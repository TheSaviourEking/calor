import { db } from '../src/lib/db'

async function main() {
  console.log('Seeding wellness data...')
  
  // Seed daily rewards
  const rewards = [
    { day: 1, rewardType: 'points', rewardValue: 10 },
    { day: 2, rewardType: 'points', rewardValue: 15 },
    { day: 3, rewardType: 'points', rewardValue: 20 },
    { day: 4, rewardType: 'points', rewardValue: 25 },
    { day: 5, rewardType: 'points', rewardValue: 30 },
    { day: 6, rewardType: 'points', rewardValue: 40 },
    { day: 7, rewardType: 'points', rewardValue: 100 },
  ]
  
  for (const reward of rewards) {
    await db.dailyReward.upsert({
      where: { day: reward.day },
      create: reward,
      update: reward
    })
  }
  console.log('✅ Seeded', rewards.length, 'daily rewards')
  
  // Seed achievements
  const achievements = [
    { name: 'First Steps', slug: 'first-steps', description: 'Complete your first activity', icon: '🌱', category: 'milestone', tier: 'bronze', requirementType: 'streak', requirementValue: 1, pointsAwarded: 50 },
    { name: 'Week Warrior', slug: 'week-warrior', description: 'Maintain a 7-day streak', icon: '🔥', category: 'wellness', tier: 'silver', requirementType: 'streak', requirementValue: 7, pointsAwarded: 200 },
    { name: 'Monthly Master', slug: 'monthly-master', description: 'Maintain a 30-day streak', icon: '👑', category: 'milestone', tier: 'gold', requirementType: 'streak', requirementValue: 30, pointsAwarded: 1000 },
  ]
  
  for (const achievement of achievements) {
    await db.achievement.upsert({
      where: { slug: achievement.slug },
      create: achievement,
      update: achievement
    })
  }
  console.log('✅ Seeded', achievements.length, 'achievements')
  
  // Seed challenges
  const challenges = [
    { title: 'Daily Check-in', description: 'Check in every day', icon: '📅', type: 'daily', category: 'wellness', requirementType: 'login', requirementValue: 1, points: 10, rewardType: 'points' },
    { title: 'Wellness Week', description: 'Complete 7 wellness activities', icon: '🎯', type: 'weekly', category: 'wellness', requirementType: 'mood_entry', requirementValue: 7, points: 100, rewardType: 'points' },
  ]
  
  for (const challenge of challenges) {
    const existing = await db.challenge.findFirst({ where: { title: challenge.title } })
    if (!existing) {
      await db.challenge.create({ data: challenge })
    }
  }
  console.log('✅ Seeded challenges')
  
  // Seed toy brands
  const brands = [
    { name: 'Lovense', slug: 'lovense', supportsRemote: true, supportsPatterns: true },
    { name: 'We-Vibe', slug: 'we-vibe', supportsRemote: true, supportsPatterns: true },
    { name: 'Lelo', slug: 'lelo', supportsRemote: true, supportsPatterns: false },
  ]
  
  for (const brand of brands) {
    await db.smartToyBrand.upsert({
      where: { slug: brand.slug },
      create: brand,
      update: brand
    })
  }
  console.log('✅ Seeded', brands.length, 'toy brands')
  
  // Verify data
  console.log('\n📊 Verification:')
  console.log('  Daily Rewards:', await db.dailyReward.count())
  console.log('  Achievements:', await db.achievement.count())
  console.log('  Challenges:', await db.challenge.count())
  console.log('  Toy Brands:', await db.smartToyBrand.count())
  
  console.log('\n🎉 Wellness data seeded successfully!')
}

main().catch(console.error).finally(() => db.$disconnect())
