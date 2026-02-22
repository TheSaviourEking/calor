import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Phase 5 data...')

  // Create VIP Tiers
  const bronzeTier = await prisma.vIPTier.upsert({
    where: { slug: 'bronze' },
    update: {},
    create: {
      name: 'Bronze',
      slug: 'bronze',
      level: 0,
      minPoints: 0,
      minSpent: 0,
      pointsMultiplier: 1,
      birthdayBonus: 100,
      iconName: 'Star',
      colorHex: '#8B7355',
      description: 'Welcome to our rewards program',
    },
  })

  const silverTier = await prisma.vIPTier.upsert({
    where: { slug: 'silver' },
    update: {},
    create: {
      name: 'Silver',
      slug: 'silver',
      level: 1,
      minPoints: 500,
      minSpent: 50000,
      pointsMultiplier: 1.25,
      birthdayBonus: 250,
      freeShippingThreshold: 7500,
      iconName: 'Sparkles',
      colorHex: '#C0C0C0',
      description: 'Enjoy enhanced rewards and free shipping on orders over $75',
    },
  })

  const goldTier = await prisma.vIPTier.upsert({
    where: { slug: 'gold' },
    update: {},
    create: {
      name: 'Gold',
      slug: 'gold',
      level: 2,
      minPoints: 1500,
      minSpent: 150000,
      pointsMultiplier: 1.5,
      birthdayBonus: 500,
      freeShippingThreshold: 5000,
      earlyAccess: true,
      prioritySupport: true,
      iconName: 'Crown',
      colorHex: '#FFD700',
      description: 'Premium benefits including early access and priority support',
    },
  })

  const platinumTier = await prisma.vIPTier.upsert({
    where: { slug: 'platinum' },
    update: {},
    create: {
      name: 'Platinum',
      slug: 'platinum',
      level: 3,
      minPoints: 5000,
      minSpent: 500000,
      pointsMultiplier: 2,
      birthdayBonus: 1000,
      freeShippingThreshold: 0,
      earlyAccess: true,
      exclusiveProducts: true,
      prioritySupport: true,
      freeReturns: true,
      iconName: 'Crown',
      colorHex: '#1A1A1A',
      description: 'Our highest tier with all premium benefits',
    },
  })

  console.log('Created VIP tiers:', bronzeTier.name, silverTier.name, goldTier.name, platinumTier.name)

  // Create tier benefits one by one
  const benefits = [
    { tierId: silverTier.id, name: '1.25x Points', description: 'Earn 25% more points on every purchase', iconName: 'Star', sortOrder: 0 },
    { tierId: silverTier.id, name: 'Free Shipping $75+', description: 'Free standard shipping on orders over $75', iconName: 'Truck', sortOrder: 1 },
    { tierId: silverTier.id, name: 'Birthday Bonus 250pts', description: '250 bonus points on your birthday', iconName: 'Gift', sortOrder: 2 },
    
    { tierId: goldTier.id, name: '1.5x Points', description: 'Earn 50% more points on every purchase', iconName: 'Star', sortOrder: 0 },
    { tierId: goldTier.id, name: 'Free Shipping $50+', description: 'Free standard shipping on orders over $50', iconName: 'Truck', sortOrder: 1 },
    { tierId: goldTier.id, name: 'Early Access', description: 'Shop new products and sales before everyone else', iconName: 'Clock', sortOrder: 2 },
    { tierId: goldTier.id, name: 'Priority Support', description: 'Skip the queue with priority customer support', iconName: 'Headphones', sortOrder: 3 },
    { tierId: goldTier.id, name: 'Birthday Bonus 500pts', description: '500 bonus points on your birthday', iconName: 'Gift', sortOrder: 4 },
    
    { tierId: platinumTier.id, name: '2x Points', description: 'Earn double points on every purchase', iconName: 'Star', sortOrder: 0 },
    { tierId: platinumTier.id, name: 'Free Shipping Always', description: 'Free standard shipping on all orders', iconName: 'Truck', sortOrder: 1 },
    { tierId: platinumTier.id, name: 'Exclusive Products', description: 'Access to platinum-only products', iconName: 'Lock', sortOrder: 2 },
    { tierId: platinumTier.id, name: 'Free Returns', description: 'Free return shipping on all orders', iconName: 'RefreshCw', sortOrder: 3 },
    { tierId: platinumTier.id, name: 'Birthday Bonus 1000pts', description: '1000 bonus points on your birthday', iconName: 'Gift', sortOrder: 4 },
  ]

  for (const benefit of benefits) {
    const existing = await prisma.vIPBenefit.findFirst({
      where: { tierId: benefit.tierId, name: benefit.name }
    })
    if (!existing) {
      await prisma.vIPBenefit.create({ data: benefit })
    }
  }

  console.log('Created tier benefits')

  // Create Points Rewards
  const rewards = [
    {
      name: '$10 Off Your Order',
      description: 'Get $10 off your next purchase',
      type: 'discount',
      pointsCost: 500,
      discountCents: 1000,
      iconName: 'Percent',
      featured: true,
      sortOrder: 0,
    },
    {
      name: '$25 Off Your Order',
      description: 'Get $25 off your next purchase',
      type: 'discount',
      pointsCost: 1000,
      discountCents: 2500,
      iconName: 'Percent',
      featured: true,
      sortOrder: 1,
    },
    {
      name: '$50 Gift Card',
      description: 'Receive a $50 gift card to spend anytime',
      type: 'gift_card',
      pointsCost: 2000,
      giftCardValue: 5000,
      iconName: 'Gift',
      featured: true,
      sortOrder: 2,
    },
    {
      name: 'Free Shipping',
      description: 'Free standard shipping on your next order',
      type: 'shipping',
      pointsCost: 200,
      iconName: 'Truck',
      featured: false,
      sortOrder: 0,
    },
    {
      name: '15% Off Your Order',
      description: 'Get 15% off your entire order (Silver+)',
      type: 'discount',
      pointsCost: 750,
      discountPercent: 15,
      iconName: 'Percent',
      featured: false,
      minTierId: silverTier.id,
      sortOrder: 3,
    },
    {
      name: '$100 Gift Card',
      description: 'Receive a $100 gift card to spend anytime (Gold+)',
      type: 'gift_card',
      pointsCost: 3500,
      giftCardValue: 10000,
      iconName: 'Gift',
      featured: false,
      minTierId: goldTier.id,
      sortOrder: 4,
    },
    {
      name: '25% Off Your Order',
      description: 'Get 25% off your entire order (Gold+)',
      type: 'discount',
      pointsCost: 1500,
      discountPercent: 25,
      iconName: 'Percent',
      featured: false,
      minTierId: goldTier.id,
      sortOrder: 5,
    },
  ]

  for (const reward of rewards) {
    const existing = await prisma.pointsReward.findFirst({
      where: { name: reward.name }
    })
    if (!existing) {
      await prisma.pointsReward.create({ data: reward as any })
    }
  }

  console.log('Created points rewards')

  // Create Chatbot Knowledge Base entries
  const knowledge = [
    {
      question: 'What is your return policy?',
      answer: 'We accept returns within 30 days of delivery for unused items in original packaging. Simply visit our Returns Portal, enter your order number, and follow the instructions. You\'ll receive a prepaid shipping label and a full refund once we receive the item.',
      category: 'returns',
      intent: 'return_policy',
      keywords: 'return,refund,policy,send back',
    },
    {
      question: 'How long does shipping take?',
      answer: 'Standard shipping takes 5-7 business days. Express shipping (2-3 days) is available for $9.99, and overnight shipping is available for $19.99. All orders ship in discreet, unmarked packaging for your privacy.',
      category: 'shipping',
      intent: 'shipping_info',
      keywords: 'shipping,deliver,time,how long',
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Currently, we only ship within the United States. We\'re working on expanding to international shipping soon. Sign up for our newsletter to be notified when we start shipping internationally!',
      category: 'shipping',
      intent: 'international_shipping',
      keywords: 'international,worldwide,overseas,country',
    },
    {
      question: 'How do I track my order?',
      answer: 'Once your order ships, you\'ll receive an email with a tracking number. You can also view your order status by logging into your account and visiting the Orders section. If you checked out as a guest, use the tracking link in your confirmation email.',
      category: 'orders',
      intent: 'track_order',
      keywords: 'track,order,status,where',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept Visa, Mastercard, American Express, Discover, PayPal, and cryptocurrency (Bitcoin, Ethereum). We also accept CALŌR gift cards. All transactions are secure and encrypted.',
      category: 'payment',
      intent: 'payment_methods',
      keywords: 'payment,pay,card,credit,methods',
    },
    {
      question: 'Is my information private?',
      answer: 'Absolutely. Your privacy is our top priority. We use discreet packaging with no external branding, and we never share your personal information with third parties. All transactions appear as "CAL" on your statement.',
      category: 'privacy',
      intent: 'privacy',
      keywords: 'private,discreet,information,privacy',
    },
    {
      question: 'How does the loyalty program work?',
      answer: 'Earn 1 point for every $1 spent. Points can be redeemed for discounts, free shipping, and gift cards. As you earn more points, you\'ll unlock higher VIP tiers with exclusive benefits like 2x points, early access to sales, and free shipping on all orders.',
      category: 'loyalty',
      intent: 'loyalty_program',
      keywords: 'points,loyalty,rewards,vip,earn',
    },
  ]

  for (const entry of knowledge) {
    const existing = await prisma.chatbotKnowledge.findFirst({
      where: { question: entry.question }
    })
    if (!existing) {
      await prisma.chatbotKnowledge.create({ data: entry })
    }
  }

  console.log('Created chatbot knowledge base')

  console.log('Phase 5 seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
