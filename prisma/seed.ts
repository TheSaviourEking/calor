import { db } from '../src/lib/db'

async function main() {
  // Create categories with upsert
  const categorySlugs = [
    { slug: 'intimacy-toys', name: 'Intimacy & Toys', description: 'Personal massagers, vibrators, couples devices, and massage wands.', iconName: 'sparkles', sortOrder: 1 },
    { slug: 'wellness-body', name: 'Wellness & Body', description: 'Lubricants, massage oils, bath salts, and intimate hygiene products.', iconName: 'droplet', sortOrder: 2 },
    { slug: 'lingerie-apparel', name: 'Lingerie & Apparel', description: 'Lingerie sets, bodysuits, silk robes, and intimate apparel.', iconName: 'shirt', sortOrder: 3 },
    { slug: 'adult-fiction', name: 'Adult Fiction & Novels', description: 'Erotic novels, short story collections, and literary erotica.', iconName: 'book-open', sortOrder: 4 },
    { slug: 'education-media', name: 'Education & Media', description: 'Books on sexual health, intimacy guides, and instructional content.', iconName: 'play-circle', sortOrder: 5 },
    { slug: 'couples', name: 'Couples & Connection', description: 'Intimacy card games, couples challenge sets, and date night kits.', iconName: 'link-2', sortOrder: 6 },
    { slug: 'sexual-health', name: 'Sexual Health', description: 'Condoms, dental dams, STI test kits, and hygiene products.', iconName: 'shield', sortOrder: 7 },
    { slug: 'kink-fetish', name: 'Kink & Fetish', description: 'Restraints, blindfolds, bondage tape, and BDSM starter kits.', iconName: 'lock', sortOrder: 8 },
  ]

  const categories = await Promise.all(
    categorySlugs.map((cat) =>
      db.category.upsert({
        where: { slug: cat.slug },
        update: cat,
        create: cat,
      })
    )
  )

  console.log(`Created ${categories.length} categories`)

  // Create sample products with safety and usage information
  const products = [
    // Intimacy & Toys
    {
      slug: 'whisper-quiet-massager',
      name: 'Whisper Quiet Massager',
      shortDescription: 'A personal massager designed for quiet, unhurried moments. The motor is near-silent.',
      fullDescription: 'A personal massager designed for quiet, unhurried moments. The motor is near-silent. Ten intensity levels, each distinct from the last. Made from body-safe silicone that warms to skin temperature quickly.',
      categoryId: categories[0].id,
      published: true,
      badge: 'bestseller',
      inventoryCount: 50,
      materialInfo: 'Body-safe medical-grade silicone, ABS plastic handle',
      safetyInfo: JSON.stringify({
        certifications: ['CE', 'FCC', 'RoHS'],
        bodySafe: true,
        phthalateFree: true,
        latexFree: true,
        waterproof: true,
        voltage: '3.7V',
        batteryType: 'Rechargeable Li-ion',
        chargeTime: '2 hours',
        runTime: '90 minutes',
        warnings: ['Do not use with silicone-based lubricants', 'Stop use if discomfort occurs', 'Keep away from water when charging']
      }),
      cleaningGuide: 'Clean with warm water and mild soap or toy cleaner. Air dry or pat with lint-free cloth. Store in provided pouch away from other silicone products.',
      usageGuide: 'Apply water-based lubricant for comfort. Start on lowest setting and increase intensity as desired. Not for internal use. Do not use for more than 30 minutes continuously.',
      estimatedDeliveryDays: 5,
    },
    {
      slug: 'couples-connect-device',
      name: 'Couples Connect Device',
      shortDescription: 'A dual-device set for couples who want to feel close from anywhere.',
      fullDescription: 'A dual-device set for couples who want to feel close from anywhere. App-connected, with secure private channels. Each device responds to the other. Distance becomes less relevant.',
      categoryId: categories[0].id,
      published: true,
      badge: 'new',
      inventoryCount: 30,
      materialInfo: 'Body-safe silicone, ABS plastic',
      safetyInfo: JSON.stringify({
        certifications: ['CE', 'FCC', 'RoHS'],
        bodySafe: true,
        phthalateFree: true,
        connectivity: 'Bluetooth 5.0',
        encryption: 'End-to-end encrypted',
        batteryType: 'Rechargeable USB-C',
        warnings: ['Use only with official app', 'Do not use while charging', 'Discontinue if connection issues occur']
      }),
      cleaningGuide: 'Clean each device with warm water and toy cleaner after use. Ensure devices are fully dry before charging. Store in provided case.',
      usageGuide: 'Both partners download the CALŌR Connect app. Create a private room and share the code with your partner. Devices sync automatically. Works over any distance with internet connection.',
      estimatedDeliveryDays: 5,
    },
    {
      slug: 'warm-touch-wand',
      name: 'Warm Touch Wand',
      shortDescription: 'A massage wand that heats to body temperature. The warmth is the point.',
      fullDescription: 'A massage wand that heats to body temperature. The warmth is the point. Flexible neck, eight patterns, and a battery that lasts longer than expected. Charges via USB-C.',
      categoryId: categories[0].id,
      published: true,
      inventoryCount: 45,
      materialInfo: 'Soft-touch silicone head, flexible internal neck, ABS handle',
      safetyInfo: JSON.stringify({
        certifications: ['CE', 'UL Listed'],
        bodySafe: true,
        maxTemperature: '42°C (107°F)',
        autoShutoff: 'After 15 minutes',
        batteryType: 'Rechargeable USB-C',
        warnings: ['Do not use on broken skin', 'Not for internal use', 'Allow to cool before storing']
      }),
      cleaningGuide: 'Wipe with damp cloth and toy cleaner. Do not submerge. Ensure charging port cover is secure before cleaning.',
      usageGuide: 'Press and hold power button for 3 seconds to activate warming feature. Allow 2 minutes to reach temperature. Use with water-based lubricant. External use only.',
      estimatedDeliveryDays: 5,
    },
    
    // Wellness & Body
    {
      slug: 'sweet-almond-massage-oil',
      name: 'Sweet Almond Massage Oil',
      shortDescription: 'Sweet almond oil and ylang-ylang in a ratio that stays warm on skin for longer than most.',
      fullDescription: 'Sweet almond oil and ylang-ylang in a ratio that stays warm on skin for longer than most. It absorbs without leaving a film. The scent is present but not insistent. A bottle lasts through many evenings.',
      categoryId: categories[1].id,
      published: true,
      badge: 'bestseller',
      inventoryCount: 100,
      materialInfo: 'Prunus Amygdalus Dulcis (Sweet Almond) Oil, Cananga Odorata (Ylang-Ylang) Flower Oil, Tocopherol (Vitamin E)',
      safetyInfo: JSON.stringify({
        organic: true,
        vegan: true,
        crueltyFree: true,
        shelfLife: '24 months',
        patchTest: 'Recommended before first use',
        warnings: ['For external use only', 'Avoid contact with eyes', 'Not compatible with latex condoms', 'Discontinue if irritation occurs']
      }),
      cleaningGuide: 'N/A - Apply directly to skin. Wipe excess with towel. Washes out of most fabrics with warm water.',
      usageGuide: 'Warm a small amount in hands before applying. Start with less than you think you need. Reapply as desired. Not for use as a personal lubricant.',
      estimatedDeliveryDays: 3,
    },
    {
      slug: 'organic-water-based-lubricant',
      name: 'Organic Water-Based Lubricant',
      shortDescription: 'A water-based lubricant made from organic aloe. No glycerin, no parabens.',
      fullDescription: 'A water-based lubricant made from organic aloe. No glycerin, no parabens. pH-balanced, compatible with all materials. The texture is right. Not too thick, not too thin.',
      categoryId: categories[1].id,
      published: true,
      inventoryCount: 80,
      materialInfo: 'Organic Aloe Barbadensis Leaf Juice, Xanthan Gum, Citric Acid, Potassium Sorbate',
      safetyInfo: JSON.stringify({
        organic: true,
        vegan: true,
        pHBalance: '4.5-5.5',
        glycerinFree: true,
        parabenFree: true,
        compatible: ['Latex condoms', 'Polyisoprene condoms', 'All toy materials'],
        shelfLife: '18 months',
        warnings: ['For external and internal use', 'Store at room temperature', 'Discontinue if irritation occurs']
      }),
      cleaningGuide: 'Rinses clean with water. No staining. Washes out of fabrics easily.',
      usageGuide: 'Apply desired amount to area. Reapply as needed. Safe for daily use. Compatible with all condoms and toys.',
      estimatedDeliveryDays: 3,
    },
    
    // Lingerie & Apparel
    {
      slug: 'pure-silk-robe',
      name: 'Pure Silk Robe',
      shortDescription: 'Pure mulberry silk, floor-length, with a lace trim at the cuff narrow enough to feel considered.',
      fullDescription: 'Pure mulberry silk, floor-length, with a lace trim at the cuff narrow enough to feel considered. The weight of it is the point. Heavier than expected. It settles around the body rather than hanging from it.',
      categoryId: categories[2].id,
      published: true,
      badge: 'editors-pick',
      inventoryCount: 25,
      materialInfo: '100% Mulberry Silk (19 momme), French Lace Trim (Nylon/Spandex blend)',
      safetyInfo: JSON.stringify({
        certifications: ['OEKO-TEX Standard 100'],
        hypoallergenic: true,
        breathable: true,
        warnings: ['Dry clean or hand wash only', 'Do not wring', 'Store away from direct sunlight']
      }),
      cleaningGuide: 'Dry clean recommended, or hand wash in cool water with silk detergent. Lay flat to dry. Iron on low heat inside out while slightly damp.',
      usageGuide: 'Available in XS to 4XL. True to size, relaxed fit. The sash can be worn inside or outside. Machine washable bag included for delicate cycle.',
      estimatedDeliveryDays: 7,
    },
    {
      slug: 'midnight-lace-bodysuit',
      name: 'Midnight Lace Bodysuit',
      shortDescription: 'French lace in a deep navy that reads black in low light. Adjustable straps, no closures at the back.',
      fullDescription: 'French lace in a deep navy that reads black in low light. Adjustable straps, no closures at the back. The fit is meant to be close but not tight. Available in XS to 4XL.',
      categoryId: categories[2].id,
      published: true,
      inventoryCount: 40,
      materialInfo: 'French Leavers Lace (Nylon/Spandex), Cotton gusset',
      safetyInfo: JSON.stringify({
        certifications: ['OEKO-TEX Standard 100'],
        breathable: true,
        warnings: ['Hand wash only', 'Do not tumble dry', 'Avoid sharp objects']
      }),
      cleaningGuide: 'Hand wash in cool water with gentle detergent. Lay flat to dry. Do not wring or twist. Store folded, not hung.',
      usageGuide: 'Step-in design with snap closures at gusset. Adjustable straps for custom fit. Can be worn as inner or outer layer. True to size.',
      estimatedDeliveryDays: 7,
    },
    
    // Adult Fiction
    {
      slug: 'the-evening-collection',
      name: 'The Evening Collection',
      shortDescription: 'Twelve short stories, each meant to be read in one sitting. Literary erotica with attention to character.',
      fullDescription: 'Twelve short stories, each meant to be read in one sitting. Literary erotica with attention to character and atmosphere. Hardback, 240 pages. Also available as an ebook.',
      categoryId: categories[3].id,
      published: true,
      badge: 'new',
      inventoryCount: 60,
      materialInfo: 'Hardback: Cloth-bound cover, acid-free paper. Ebook: EPUB, MOBI, PDF formats included.',
      safetyInfo: JSON.stringify({
        ageRestriction: '18+',
        contentWarning: 'Contains explicit sexual content and mature themes',
        format: ['Hardback', 'Paperback', 'Ebook'],
        warnings: ['For adult readers only', 'Content may not be suitable for all readers']
      }),
      cleaningGuide: 'Store upright on shelf. Keep away from moisture and direct sunlight.',
      usageGuide: 'Each story is 15-30 pages. Designed for single-sitting reading. Discussion questions included for book clubs.',
      estimatedDeliveryDays: 4,
    },
    {
      slug: 'slow-burn-novel',
      name: 'Slow Burn: A Novel',
      shortDescription: 'A novel about two people who take their time. The tension builds across 300 pages.',
      fullDescription: 'A novel about two people who take their time. The tension builds across 300 pages. Literary fiction that trusts the reader to stay with the characters. Available in hardback, paperback, and digital.',
      categoryId: categories[3].id,
      published: true,
      inventoryCount: 75,
      materialInfo: 'Print: FSC-certified paper. Digital: All major formats supported.',
      safetyInfo: JSON.stringify({
        ageRestriction: '18+',
        contentWarning: 'Contains sexual content and mature themes',
        format: ['Hardback', 'Paperback', 'Ebook'],
        warnings: ['For adult readers only']
      }),
      cleaningGuide: 'Store upright on shelf. Keep away from moisture.',
      usageGuide: '300 pages. Ideal for extended reading sessions. Chapter breaks are placed intentionally for pacing.',
      estimatedDeliveryDays: 4,
    },
    
    // Education & Media
    {
      slug: 'intimacy-guide-couples',
      name: 'The Intimacy Guide for Couples',
      shortDescription: 'A practical guide for couples who want to communicate better about desire.',
      fullDescription: 'A practical guide for couples who want to communicate better about desire. Written by a relationship therapist. Exercises, conversation starters, and no judgment anywhere.',
      categoryId: categories[4].id,
      published: true,
      inventoryCount: 50,
      materialInfo: 'Paperback, 180 pages. Workbook-style format with space for notes.',
      safetyInfo: JSON.stringify({
        authorCredentials: 'Licensed Marriage and Family Therapist (LMFT)',
        ageRestriction: '18+',
        warnings: ['Not a substitute for professional therapy', 'Some exercises may bring up difficult emotions']
      }),
      cleaningGuide: 'Standard book care. Keep dry.',
      usageGuide: '12 chapters designed to be completed over 12 weeks. Each chapter includes reading, exercises, and conversation prompts. Best done together, but can be done individually first.',
      estimatedDeliveryDays: 4,
    },
    
    // Couples & Connection
    {
      slug: 'date-night-deck',
      name: 'The Date Night Deck',
      shortDescription: '52 cards, each with a prompt for couples. Some are conversation, some are action.',
      fullDescription: '52 cards, each with a prompt for couples. Some are conversation, some are action. Draw one, or let the evening unfold. No rules beyond what you decide together.',
      categoryId: categories[5].id,
      published: true,
      badge: 'bestseller',
      inventoryCount: 70,
      materialInfo: 'Premium card stock with linen finish. Gold foil details. Sturdy keepsake box.',
      safetyInfo: JSON.stringify({
        ageRestriction: '18+',
        contentTypes: ['Conversation', 'Activities', 'Intimate prompts'],
        warnings: ['Some cards contain adult content', 'Consent required for all activities']
      }),
      cleaningGuide: 'Wipe cards with dry cloth. Store in box when not in use.',
      usageGuide: 'Shuffle deck and draw one card, or spread cards and choose what calls to you. Color-coded by intensity level: Blue (conversation), Amber (connection), Rose (intimate).',
      estimatedDeliveryDays: 3,
    },
    {
      slug: 'desire-journal',
      name: 'The Desire Journal',
      shortDescription: 'A guided journal for one person to explore what they want, alone or with a partner.',
      fullDescription: 'A guided journal for one person to explore what they want, alone or with a partner. Prompts that start gentle and go deeper. Bound in linen, with space for reflection.',
      categoryId: categories[5].id,
      published: true,
      inventoryCount: 55,
      materialInfo: 'Linen-bound hardcover, 120gsm cream paper, lay-flat binding. Ribbon bookmark.',
      safetyInfo: JSON.stringify({
        ageRestriction: '18+',
        warnings: ['Private journal - store securely', 'Some prompts may bring up unexpected feelings']
      }),
      cleaningGuide: 'Wipe cover with dry cloth. Store in provided slipcase.',
      usageGuide: '60 prompts progressing from light to deep. Space for free-writing at the end of each section. Can be completed alone or with a partner. Recommended pace: 1-2 prompts per week.',
      estimatedDeliveryDays: 3,
    },
    
    // Sexual Health
    {
      slug: 'premium-condom-variety',
      name: 'Premium Condom Variety Pack',
      shortDescription: 'Twelve condoms in four styles. Ultra-thin, ribbed, warming, and standard.',
      fullDescription: 'Twelve condoms in four styles. Ultra-thin, ribbed, warming, and standard. All latex-free options available. Packaged in a discreet box with no external markings.',
      categoryId: categories[6].id,
      published: true,
      inventoryCount: 200,
      materialInfo: 'Natural rubber latex (latex-free option available). Silicone-based lubricant.',
      safetyInfo: JSON.stringify({
        certifications: ['FDA Cleared', 'CE Marked'],
        testedElectronically: true,
        expiryInfo: 'Check individual package',
        effectiveness: '98% when used correctly',
        warnings: ['Do not use if allergic to latex', 'Check expiration date', 'Use only once', 'Store away from heat and light']
      }),
      cleaningGuide: 'Single use - dispose in trash (do not flush).',
      usageGuide: 'Check expiration. Carefully open package. Pinch tip and roll on. Use additional lubricant if needed. Remove and dispose after use. 12 condoms per box.',
      estimatedDeliveryDays: 2,
    },
    
    // Gift Sets
    {
      slug: 'honeymoon-kit',
      name: 'The Honeymoon Kit',
      shortDescription: 'For couples beginning something new. Includes massage oil, a couples device, and a card game.',
      fullDescription: 'For couples beginning something new. Includes our Sweet Almond Massage Oil, the Couples Connect Device, and The Date Night Deck. A complete evening in one box.',
      categoryId: categories[5].id,
      published: true,
      badge: 'bestseller',
      inventoryCount: 20,
      materialInfo: 'See individual products for details.',
      safetyInfo: JSON.stringify({
        includes: ['Sweet Almond Massage Oil', 'Couples Connect Device', 'Date Night Deck'],
        warnings: ['See individual product safety information']
      }),
      cleaningGuide: 'See individual products for care instructions.',
      usageGuide: 'Begin with the Date Night Deck to set the mood. Massage oil for connection. Couples device for intimacy. Each product can be used independently or together.',
      estimatedDeliveryDays: 5,
    },
    {
      slug: 'self-care-night-set',
      name: 'Self-Care Night Set',
      shortDescription: 'For the evening after a long week. Bath salts, massage oil, and a personal massager.',
      fullDescription: 'For the evening after a long week. Bath salts in lavender, Sweet Almond Massage Oil, and the Whisper Quiet Massager. Everything needed for an unhurried night.',
      categoryId: categories[1].id,
      published: true,
      inventoryCount: 25,
      materialInfo: 'See individual products for details.',
      safetyInfo: JSON.stringify({
        includes: ['Lavender Bath Salts', 'Sweet Almond Massage Oil', 'Whisper Quiet Massager'],
        warnings: ['See individual product safety information']
      }),
      cleaningGuide: 'See individual products for care instructions.',
      usageGuide: 'Begin with a warm bath with salts. Massage oil for self-massage. Massager for relaxation. Take your time. No rush.',
      estimatedDeliveryDays: 5,
    },
    
    // Digital Products
    {
      slug: 'audio-erotica-membership',
      name: 'Audio Erotica Membership',
      shortDescription: 'Professionally produced audio fiction. New releases weekly. A month for the price of a paperback.',
      fullDescription: 'Professionally produced audio fiction, read by voice artists who understand the difference between performing a story and telling one. New releases weekly. Unlimited streaming. Cancel anytime.',
      categoryId: categories[4].id,
      published: true,
      isDigital: true,
      inventoryCount: 999,
      materialInfo: 'Digital subscription. Access via web app or iOS/Android apps.',
      safetyInfo: JSON.stringify({
        ageRestriction: '18+',
        contentWarning: 'Audio content of an explicit sexual nature',
        privacy: ['Private listening history', 'Discreet billing', 'Incognito mode available'],
        warnings: ['Adult content', 'Headphones recommended']
      }),
      cleaningGuide: 'N/A - Digital product.',
      usageGuide: 'Access via calorco.com/audio or download our app. Browse by category, duration, or narrator. Create playlists. Download for offline listening. Cancel subscription anytime in account settings.',
      estimatedDeliveryDays: 0,
    },
    {
      slug: 'guided-intimacy-series',
      name: 'Guided Intimacy Series',
      shortDescription: 'A video series for couples. Six sessions, each building on the last.',
      fullDescription: 'A video series for couples. Six sessions, each building on the last. Led by a relationship therapist, with exercises to do together. Stream or download. Licensed for personal use.',
      categoryId: categories[4].id,
      published: true,
      isDigital: true,
      inventoryCount: 999,
      materialInfo: 'Digital video course. 6 sessions, 45-60 minutes each. Stream or download.',
      safetyInfo: JSON.stringify({
        instructorCredentials: 'Licensed Clinical Psychologist, PhD',
        ageRestriction: '18+',
        contentWarning: 'Contains nudity and explicit educational content',
        privacy: ['Private viewing history', 'Discreet billing'],
        warnings: ['For couples only', 'Some exercises may bring up difficult emotions', 'Not a substitute for therapy']
      }),
      cleaningGuide: 'N/A - Digital product.',
      usageGuide: 'Watch together, ideally on a larger screen. Pause for exercises and discussions. Complete in order - each session builds on the previous. Recommended pace: One session per week with practice between.',
      estimatedDeliveryDays: 0,
    },
  ]

  for (const product of products) {
    const existingProduct = await db.product.findUnique({
      where: { slug: product.slug },
    })
    
    if (!existingProduct) {
      const created = await db.product.create({
        data: {
          ...product,
          tags: JSON.stringify([]),
        },
      })
      
      // Create a variant for each product
      await db.variant.create({
        data: {
          productId: created.id,
          name: 'Standard',
          price: Math.floor(Math.random() * 10000) + 1000, // $10-$110
          sku: `SKU-${created.slug}`,
          stock: created.inventoryCount,
        },
      })
      
      // Create a placeholder image
      await db.productImage.create({
        data: {
          productId: created.id,
          url: `/images/products/${created.slug}.jpg`,
          altText: created.name,
          sortOrder: 0,
        },
      })
    } else {
      // Update existing product with new fields
      await db.product.update({
        where: { slug: product.slug },
        data: {
          materialInfo: product.materialInfo,
          safetyInfo: product.safetyInfo,
          cleaningGuide: product.cleaningGuide,
          usageGuide: product.usageGuide,
          estimatedDeliveryDays: product.estimatedDeliveryDays,
        },
      })
    }
  }

  console.log(`Created ${products.length} products`)

  // Create Gift Wrapping Options
  const giftWrappingOptions = [
    {
      name: 'Signature Black Box',
      description: 'Our signature matte black box with embossed logo. Tissue wrap included. No product names visible.',
      priceCents: 500,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Luxury Silk Wrap',
      description: 'Hand-wrapped in silk fabric with a wax seal. The fabric becomes part of the gift.',
      priceCents: 1500,
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Eco Conscious',
      description: 'Recycled kraft paper with dried flower accent. Planet-friendly and beautiful.',
      priceCents: 300,
      isActive: true,
      sortOrder: 3,
    },
    {
      name: 'No Gift Wrap',
      description: 'Standard discreet packaging. No additional wrapping.',
      priceCents: 0,
      isActive: true,
      sortOrder: 0,
    },
  ]

  for (const option of giftWrappingOptions) {
    await db.giftWrappingOption.upsert({
      where: { name: option.name },
      update: option,
      create: option,
    })
  }

  console.log(`Created ${giftWrappingOptions.length} gift wrapping options`)

  // Create Packaging Photos (for discreet packaging preview)
  const packagingPhotos = [
    {
      name: 'Standard Shipping Box',
      description: 'Plain brown box with no markings. Your privacy is complete.',
      imageUrl: '/images/packaging/standard-box.jpg',
      isDefault: true,
    },
    {
      name: 'Padded Mailer',
      description: 'For smaller orders. Looks like any other online purchase.',
      imageUrl: '/images/packaging/padded-mailer.jpg',
      isDefault: false,
    },
    {
      name: 'Gift Box',
      description: 'When gift wrap is selected. Elegant but still discreet.',
      imageUrl: '/images/packaging/gift-box.jpg',
      isDefault: false,
    },
  ]

  for (const photo of packagingPhotos) {
    await db.packagingPhoto.upsert({
      where: { name: photo.name },
      update: photo,
      create: photo,
    })
  }

  console.log(`Created ${packagingPhotos.length} packaging photos`)

  // Create default Alert Preferences for existing customers
  const customers = await db.customer.findMany()
  for (const customer of customers) {
    await db.alertPreferences.upsert({
      where: { customerId: customer.id },
      update: {},
      create: { customerId: customer.id },
    })
  }

  console.log('Seed completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
