import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const knowledgeEntries = [
    // ==========================================
    // SHIPPING
    // ==========================================
    {
        question: 'What are your shipping options?',
        answer: 'We offer several shipping options:\n\n📦 **Standard Shipping** (5–7 business days) — Free on orders over $50\n⚡ **Express Shipping** (2–3 business days) — $9.99\n🚀 **Overnight Shipping** (next business day) — $19.99\n\nAll orders are shipped within 24 hours on business days and include tracking.',
        category: 'shipping',
        keywords: 'shipping,delivery,ship,how long,delivery time,cost,free shipping,standard,express,overnight',
        intent: 'shipping_info',
    },
    {
        question: 'Do you ship internationally?',
        answer: 'Yes! We ship to select international destinations. International shipping rates and delivery times vary by location. Customs duties and taxes may apply and are the responsibility of the buyer. Currently we ship to the US, Canada, UK, and select EU countries.',
        category: 'shipping',
        keywords: 'international,worldwide,global,overseas,outside US,canada,uk,europe',
        intent: 'shipping_info',
    },
    {
        question: 'Is your packaging discreet?',
        answer: '100% discreet, always. 🔒\n\n• **Plain, unmarked box** — no logos, product names, or branding\n• **No product descriptions** on the exterior or customs forms\n• **Return address** shows "CALOR LLC" only\n• **Billing statement** shows "CALOR LLC"\n\nYour privacy is our highest priority.',
        category: 'shipping',
        keywords: 'discreet,packaging,plain box,unmarked,privacy,private,confidential,discrete',
        intent: 'privacy_security',
    },
    {
        question: 'How do I track my order?',
        answer: 'You can track your order in several ways:\n\n1. Visit our **Track Order** page and enter your order reference\n2. Check the **tracking link** in your shipping confirmation email\n3. Log in and view your order in **My Orders**\n\nTracking numbers are usually available within 24 hours of shipping.',
        category: 'shipping',
        keywords: 'track,tracking,where,package,order status,tracking number',
        intent: 'order_status',
    },

    // ==========================================
    // RETURNS & EXCHANGES
    // ==========================================
    {
        question: 'What is your return policy?',
        answer: 'We want you to be completely satisfied! Our return policy:\n\n✅ **30-day return window** from delivery date\n✅ **Free returns** on orders over $50\n📦 Items must be **unused** and in **original sealed packaging**\n⚡ Refunds processed within **3–5 business days**\n\nFor hygiene reasons, opened intimate items cannot be returned but may be eligible for exchange if defective.',
        category: 'returns',
        keywords: 'return,refund,exchange,send back,money back,return policy,30 day',
        intent: 'returns',
    },
    {
        question: 'How do I start a return?',
        answer: 'Starting a return is easy:\n\n1. Visit our **Returns Portal** at calor.com/returns\n2. Enter your order number and email address\n3. Select the item(s) you want to return\n4. Print the prepaid return label\n5. Drop off at any carrier pickup location\n\nYou can also contact us and we\'ll walk you through it.',
        category: 'returns',
        keywords: 'start return,how to return,return process,return label,send back',
        intent: 'returns',
    },
    {
        question: 'My item arrived damaged or defective',
        answer: 'We\'re so sorry about that! We take quality seriously and will make it right immediately.\n\nPlease contact our support team with:\n• Your order number\n• Photo of the damage/defect\n\nWe\'ll send a **free replacement** or issue a **full refund** — your choice. No need to return the damaged item.',
        category: 'returns',
        keywords: 'damaged,broken,defective,wrong item,not working,quality issue,malfunction',
        intent: 'returns',
    },

    // ==========================================
    // PAYMENT
    // ==========================================
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept several secure payment methods:\n\n💳 **Credit/Debit Cards** — Visa, Mastercard, American Express\n🅿️ **PayPal** — Pay with your balance or linked accounts\n₿ **Cryptocurrency** — Bitcoin, Ethereum via Coinbase Commerce\n🎁 **Gift Cards** — CALŌR gift cards accepted at checkout\n🏷️ **Promo Codes** — Enter at checkout in the discount field\n\nAll transactions are encrypted with 256-bit SSL.',
        category: 'payment',
        keywords: 'payment,pay,credit card,debit,paypal,crypto,bitcoin,gift card,promo code,coupon,discount',
        intent: 'payment_help',
    },
    {
        question: 'What shows on my billing statement?',
        answer: 'Your billing statement will show **"CALOR LLC"** — nothing that reveals the nature of your purchase. We take billing discretion very seriously.\n\nFor PayPal transactions, the charge shows as "CALOR LLC" as well. Crypto transactions will show the exchange service used.',
        category: 'payment',
        keywords: 'billing,statement,credit card statement,charge,shows,description,discreet billing',
        intent: 'privacy_security',
    },
    {
        question: 'Do you have any discounts or promotions?',
        answer: 'We regularly offer promotions! Here\'s how to save:\n\n🎉 **Sign up for our newsletter** — Get 15% off your first order\n🏷️ **Seasonal sales** — Follow us for announcements\n👥 **Referral program** — Share your code and both you and your friend get rewards\n💎 **VIP membership** — Earn points on every purchase for exclusive discounts\n\nCheck our homepage for current promotions!',
        category: 'payment',
        keywords: 'discount,promo,promotion,sale,coupon,save,deal,offer,code',
        intent: 'payment_help',
    },

    // ==========================================
    // PRIVACY & SECURITY
    // ==========================================
    {
        question: 'Is my personal data safe?',
        answer: 'Absolutely. Your privacy and security are our top priorities:\n\n🔒 **256-bit SSL encryption** on all transactions\n🚫 **We never sell or share** your personal data with third parties\n🗑️ **Account deletion** — Full data removal available on request\n🔐 **Secure storage** — All sensitive data is encrypted at rest\n📧 **No spam** — We only send emails you opt into\n\nSee our full Privacy Policy for details.',
        category: 'privacy',
        keywords: 'privacy,data,secure,safe,security,information,personal data,hack,breach',
        intent: 'privacy_security',
    },
    {
        question: 'Can I browse and shop anonymously?',
        answer: 'Yes! You can browse our entire catalog without creating an account. Guest checkout is available for all orders.\n\nCreating an account gives you benefits like order tracking, wishlist, and VIP rewards — but it\'s completely optional.',
        category: 'privacy',
        keywords: 'anonymous,guest,without account,no account,browse privately',
        intent: 'privacy_security',
    },

    // ==========================================
    // PRODUCT CARE & WARRANTY
    // ==========================================
    {
        question: 'How do I clean and care for my products?',
        answer: 'Proper care extends the life of your products:\n\n🧼 **Before & after each use** — Wash with warm water and mild soap or toy cleaner\n💧 **Silicone products** — Use only water-based lubricant (silicone-based can damage silicone toys)\n📦 **Storage** — Keep in the included pouch or bag, away from direct sunlight\n🔋 **Battery care** — Charge fully before first use; don\'t leave plugged in indefinitely\n\nEach product includes specific care instructions in the box.',
        category: 'product_care',
        keywords: 'clean,cleaning,care,wash,maintain,storage,store,hygiene,sanitize',
        intent: 'warranty_care',
    },
    {
        question: 'Do your products have a warranty?',
        answer: 'Yes! All CALŌR products include:\n\n🛡️ **1-year manufacturer warranty** on all electronic products\n✨ **Quality guarantee** — Defective items replaced free of charge\n🔧 **Free troubleshooting** — Our support team can help with any issues\n\nTo make a warranty claim, contact us with your order number and a description of the issue.',
        category: 'product_care',
        keywords: 'warranty,guarantee,defective,broken,not working,replaced,repair',
        intent: 'warranty_care',
    },
    {
        question: 'What materials are your products made from?',
        answer: 'We only use premium, body-safe materials:\n\n✅ **Medical-grade silicone** — Hypoallergenic, non-porous, easy to clean\n✅ **Phthalate-free** — No harmful chemicals\n✅ **Latex-free options** available for sensitive users\n✅ **Stainless steel & ABS plastic** — Used in handles and motors\n\nEvery product page lists the specific materials used. Look for the "Material" section.',
        category: 'product_care',
        keywords: 'material,silicone,body safe,phthalate,latex,hypoallergenic,chemicals,safe',
        intent: 'product_inquiry',
    },
    {
        question: 'What lubricant should I use?',
        answer: 'The right lubricant depends on your product material:\n\n💧 **Water-based lubricant** — Safe with ALL materials (recommended)\n🧴 **Silicone-based lubricant** — Great for non-silicone toys only (can damage silicone products)\n🌿 **Oil-based lubricant** — Not recommended with latex items\n\n**Our recommendation:** Water-based is the safest choice. We carry a selection in our shop!',
        category: 'product_care',
        keywords: 'lubricant,lube,water based,silicone based,compatible,use with',
        intent: 'product_inquiry',
    },

    // ==========================================
    // ACCOUNT
    // ==========================================
    {
        question: 'How do I create an account?',
        answer: 'Creating an account is quick and easy:\n\n1. Click the **account icon** in the top navigation\n2. Select **Sign Up**\n3. Enter your email and create a password\n4. Verify your email address\n\nBenefits of an account: order tracking, wishlist, VIP rewards, faster checkout, and exclusive offers!',
        category: 'account',
        keywords: 'create account,sign up,register,new account,join',
        intent: 'account_help',
    },
    {
        question: 'I forgot my password',
        answer: 'No worries! Resetting your password is easy:\n\n1. Go to the **login page**\n2. Click **"Forgot Password?"**\n3. Enter your email address\n4. Check your inbox for the reset link (check spam too!)\n5. Create a new password\n\nThe reset link expires after 24 hours for security. Need more help? Contact our support team.',
        category: 'account',
        keywords: 'forgot password,reset password,can\'t login,locked out,password recovery',
        intent: 'account_help',
    },
    {
        question: 'How do I delete my account?',
        answer: 'We\'re sorry to see you go! To request account deletion:\n\n1. Contact our support team at **support@calor.com**\n2. Or visit **Account Settings → Delete Account**\n\nWe\'ll remove all your personal data within 30 days, in compliance with privacy regulations. Order history may be retained for legal/financial requirements.',
        category: 'account',
        keywords: 'delete account,remove account,close account,erase data,gdpr',
        intent: 'account_help',
    },

    // ==========================================
    // GENERAL / ABOUT
    // ==========================================
    {
        question: 'What is CALŌR?',
        answer: 'CALŌR is a premium intimate wellness destination. We curate the finest products for intimacy, pleasure, and self-care — from personal massagers and luxury accessories to wellness supplements and educational content.\n\nOur mission: elevate intimate wellness with premium quality, absolute privacy, and expert guidance. Every product is body-safe, ethically sourced, and delivered in 100% discreet packaging.',
        category: 'general',
        keywords: 'what is calor,about calor,who are you,what do you sell,about us,company',
        intent: 'general',
    },
    {
        question: 'How can I contact customer support?',
        answer: 'We\'re here to help! Reach us through:\n\n💬 **Live Chat** — You\'re using it right now!\n📧 **Email** — support@calor.com (response within 24 hours)\n🎫 **Support Ticket** — Visit our Support Center at calor.com/support\n\nOur support team is available Monday–Friday, 9 AM – 6 PM EST.',
        category: 'general',
        keywords: 'contact,support,help,customer service,email,phone,hours,reach',
        intent: 'general',
    },
    {
        question: 'Do you offer gift wrapping or gift cards?',
        answer: 'Yes to both! 🎁\n\n**Gift Cards** — Available in $25, $50, $100, and custom amounts. Delivered digitally via email — perfect for discreet gifting.\n\n**Gift Sets** — We offer curated gift bundles with premium packaging.\n\nVisit our Gifts section to explore options!',
        category: 'general',
        keywords: 'gift,gift card,gift wrapping,present,gift set,bundle',
        intent: 'general',
    },
    {
        question: 'Are your products age-restricted?',
        answer: 'Yes, you must be 18 or older to purchase from CALŌR. We verify age during account creation and checkout.\n\nRestricted products are gated behind an age verification prompt for added compliance.',
        category: 'general',
        keywords: 'age,18,restricted,adult,age verification,minor',
        intent: 'general',
    },

    // ==========================================
    // PRODUCT-SPECIFIC
    // ==========================================
    {
        question: 'What vibration patterns do your products have?',
        answer: 'Our electronic products offer a range of vibration experiences:\n\n• **Multiple intensity levels** — Most products offer 5–10 levels from gentle to powerful\n• **Pattern modes** — Pulse, wave, escalating, and custom patterns\n• **Quiet motors** — Our "whisper-quiet" products operate below 40dB\n\nCheck each product page for its specific vibration specs in the "Tactile & Haptic" section.',
        category: 'products',
        keywords: 'vibration,pattern,intensity,levels,modes,motor,strong,powerful,gentle,quiet',
        intent: 'product_inquiry',
    },
    {
        question: 'Are your products waterproof?',
        answer: 'Many of our products are waterproof! Look for the **IPX rating** on each product page:\n\n• **IPX7** — Fully submersible up to 1 meter (perfect for bath/shower)\n• **IPX6** — Water jet resistant\n• **IPX4** — Splash-proof\n\nWaterproof products can be easily cleaned under running water. Check the product specs for its exact rating.',
        category: 'products',
        keywords: 'waterproof,water,bath,shower,submersible,ipx,pool,wet',
        intent: 'product_inquiry',
    },
    {
        question: 'How long does the battery last?',
        answer: 'Battery life varies by product. Most rechargeable products offer:\n\n🔋 **60–120 minutes** of use per charge\n⚡ **90–120 minutes** average charge time\n🔌 **USB-C or magnetic** charging (cable included)\n\nEach product page lists exact charge time and usage time in the "Battery & Charging" section. We recommend charging fully before first use.',
        category: 'products',
        keywords: 'battery,charge,how long,usage time,battery life,charging,usb,rechargeable',
        intent: 'product_inquiry',
    },
    {
        question: 'What sizes are available?',
        answer: 'Product dimensions are listed on every product page in the "Dimensions" section with exact measurements:\n\n📏 **Length, width, diameter** — In both inches and centimeters\n📐 **Insertable length** — Where applicable\n✋ **Size comparison** — Visual comparisons to common objects\n\nNot sure about sizing? Take our **Recommendation Quiz** for personalized suggestions!',
        category: 'products',
        keywords: 'size,dimension,length,width,how big,inches,centimeters,fit,small,large,measurement',
        intent: 'product_inquiry',
    },
    {
        question: 'Do you have products for beginners?',
        answer: 'Absolutely! We believe everyone deserves a great experience. For beginners, we recommend:\n\n🌸 **Smaller sizes** — Compact and non-intimidating\n🔇 **Quiet motors** — Discreet for shared living spaces\n💧 **Waterproof** — Easy to clean for first-time owners\n🎚️ **Multiple settings** — Start gentle and explore at your pace\n\nTake our **Recommendation Quiz** — it factors in experience level to give personalized picks!',
        category: 'products',
        keywords: 'beginner,first time,new to,starter,entry level,never used,recommendation',
        intent: 'product_recommendation',
    },
    {
        question: 'Do you have products for couples?',
        answer: 'Yes! We have a wonderful selection designed for shared experiences:\n\n💑 **Couples massagers** — Designed to be worn during intimacy\n🎁 **Couples gift sets** — Curated bundles for shared exploration\n📱 **App-controlled** — Some products can be controlled by a partner via smartphone\n\nBrowse our Couples category or take the quiz with "Couples" selected for tailored suggestions!',
        category: 'products',
        keywords: 'couples,partner,together,shared,two people,relationship,couple',
        intent: 'product_recommendation',
    },

    // ==========================================
    // VIP & LOYALTY
    // ==========================================
    {
        question: 'What is the VIP program?',
        answer: 'The CALŌR VIP program rewards you for shopping with us:\n\n🥉 **Bronze** — Join free, earn 1x points per dollar\n🥈 **Silver** — 1.25x points, birthday bonus\n🥇 **Gold** — 1.5x points, early access, free shipping\n💎 **Platinum** — 2x points, exclusive products, priority support\n\nPoints can be redeemed for discounts on future purchases. You earn points automatically on every order!',
        category: 'general',
        keywords: 'vip,loyalty,rewards,points,membership,tier,bronze,silver,gold,platinum',
        intent: 'general',
    },
    {
        question: 'How do I earn and redeem points?',
        answer: 'Earning and using points is easy:\n\n**Earn points by:**\n• Making purchases (1 point per $1 spent, multiplied by tier)\n• Writing reviews\n• Referring friends\n• Birthday bonuses\n\n**Redeem points:**\n• Apply at checkout for instant discounts\n• 100 points = $1 off\n• Visit Account → VIP Rewards to see your balance',
        category: 'general',
        keywords: 'redeem points,earn points,how many points,points balance,use points',
        intent: 'general',
    },

    // ==========================================
    // SUBSCRIPTIONS
    // ==========================================
    {
        question: 'Do you offer subscriptions?',
        answer: 'Yes! Our subscription boxes deliver curated intimate wellness products to your door:\n\n📦 **Monthly boxes** — Discover new products every month\n🎁 **Surprise selections** — Curated based on your preferences\n💰 **Subscriber savings** — Up to 30% off retail prices\n🚚 **Free shipping** on all subscription orders\n\nVisit our Subscriptions page to choose your plan!',
        category: 'general',
        keywords: 'subscription,subscribe,monthly,box,recurring,plan',
        intent: 'general',
    },

    // ==========================================
    // EDUCATION & WELLNESS
    // ==========================================
    {
        question: 'Do you have educational content?',
        answer: 'Yes! We believe education enhances every experience:\n\n📚 **Blog & Magazine** — Articles on wellness, relationships, and product guides\n🎓 **Education Hub** — In-depth guides for beginners to advanced\n👩‍⚕️ **Expert Consultations** — Book a private session with our wellness team\n🧠 **Wellness Tracking** — Track your wellness journey in your account\n\nExplore our Education section for free resources!',
        category: 'general',
        keywords: 'education,learn,guide,article,blog,wellness,health,information,advice',
        intent: 'general',
    },
]

async function main() {
    console.log('🌱 Seeding chatbot knowledge base...\n')

    // Clear existing entries
    const deleted = await prisma.chatbotKnowledge.deleteMany()
    console.log(`  Cleared ${deleted.count} existing entries`)

    // Insert new entries
    let created = 0
    for (const entry of knowledgeEntries) {
        await prisma.chatbotKnowledge.create({ data: entry })
        created++
        process.stdout.write(`  Creating entries... ${created}/${knowledgeEntries.length}\r`)
    }

    console.log(`\n✅ Successfully seeded ${created} knowledge entries!\n`)

    // Show summary by category
    const categories = await prisma.chatbotKnowledge.groupBy({
        by: ['category'],
        _count: true,
    })
    console.log('  📊 Entries by category:')
    for (const cat of categories) {
        console.log(`     ${cat.category}: ${cat._count} entries`)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Seed failed:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
