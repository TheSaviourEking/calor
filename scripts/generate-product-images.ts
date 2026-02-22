import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';
import { db } from '../src/lib/db';

const outputDir = './public/images/products';

// Product-specific prompts for elegant, tasteful product photography
const productPrompts: Record<string, string> = {
  // Intimacy & Toys
  'whisper-quiet-massager': 'Elegant personal massager in soft rose gold and white, minimalist product photography on cream silk background, soft shadows, luxury wellness product, professional studio lighting, high end retail',
  'couples-connect-device': 'Pair of sleek white modern devices for couples, minimalist design, on soft grey linen fabric, subtle warm lighting, luxury intimate wellness product photography, elegant composition',
  'warm-touch-wand': 'Ergonomic massage wand in muted terracotta color, flexible neck design, on natural linen background, soft natural lighting, wellness product photography, minimalist aesthetic',
  
  // Wellness & Body
  'sweet-almond-massage-oil': 'Amber glass bottle with gold dropper, massage oil with subtle floral arrangement, on cream marble surface, natural lighting, luxury spa product photography, elegant still life',
  'organic-water-based-lubricant': 'Minimalist white pump bottle with clean typography, clear water droplets nearby, on white marble surface, soft shadows, clean clinical luxury aesthetic, product photography',
  'self-care-night-set': 'Curated gift box with bath salts, massage oil bottle, and elegant massager, wrapped in tissue paper, luxury gift set photography, warm ambient lighting, premium unboxing experience',
  
  // Lingerie & Apparel
  'pure-silk-robe': 'Flowing champagne colored silk robe on elegant hanger, French lace details visible, soft focus background, luxury fashion photography, editorial style, warm golden light',
  'midnight-lace-bodysuit': 'Deep navy French lace bodysuit flat lay on silk fabric, delicate floral lace pattern, elegant intimate apparel photography, soft moody lighting, luxury brand aesthetic',
  
  // Adult Fiction
  'the-evening-collection': 'Cloth-bound hardback book with elegant embossed cover, warm candlelight nearby, on dark wood surface, literary fiction photography, cozy intimate atmosphere, sophisticated',
  'slow-burn-novel': 'Hardback novel with minimal elegant cover design, slightly open pages, on linen fabric with soft shadows, literary book photography, warm afternoon light, sophisticated aesthetic',
  
  // Education & Media
  'intimacy-guide-couples': 'Paperback relationship guide book with clean modern cover, notebook and pen nearby, on warm wood surface, self-help book photography, inviting and approachable',
  'audio-erotica-membership': 'Elegant smartphone with headphones on silk pillow, soft purple ambient lighting, audio streaming service mockup, intimate and private atmosphere, digital product photography',
  'guided-intimacy-series': 'Tablet showing video course interface, couple holding hands in background out of focus, warm lighting, online course product photography, educational and approachable',
  
  // Couples & Connection
  'date-night-deck': 'Luxury card deck with gold foil details, cards fanned out on velvet surface, elegant game night photography, warm ambient lighting, premium gift aesthetic',
  'desire-journal': 'Linen-bound hardcover journal with ribbon bookmark, gold pen nearby, on silk fabric, luxury stationery photography, intimate and personal aesthetic, soft natural light',
  'honeymoon-kit': 'Luxury gift box open revealing massage oil, elegant device, and card deck, tissue paper and silk ribbon, honeymoon gift set photography, romantic warm lighting, premium unboxing',
  
  // Sexual Health
  'premium-condom-variety': 'Discreet elegant box with minimalist design, subtle placement on bedside table, health and wellness aesthetic, tasteful product photography, soft natural lighting',
};

async function generateImages() {
  const zai = await ZAI.create();
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get all products
  const products = await db.product.findMany({
    include: { images: true },
  });

  console.log(`Found ${products.length} products`);

  for (const product of products) {
    // Check if image file actually exists
    const existingImage = product.images[0];
    let needsGeneration = true;
    
    if (existingImage) {
      const imagePath = path.join('./public', existingImage.url);
      if (fs.existsSync(imagePath)) {
        console.log(`Skipping ${product.slug} - image file exists`);
        needsGeneration = false;
      } else {
        console.log(`Image record exists but file missing for ${product.slug}`);
      }
    }

    if (!needsGeneration) continue;

    const prompt = productPrompts[product.slug];
    const finalPrompt = prompt || `Elegant product photography of ${product.name}, minimalist aesthetic, luxury wellness brand, soft natural lighting, cream and terracotta tones, professional studio shot`;
    
    console.log(`Generating image for: ${product.name}...`);
    
    try {
      const response = await zai.images.generations.create({
        prompt: finalPrompt,
        size: '1024x1024',
      });

      const imageBase64 = response.data[0].base64;
      const buffer = Buffer.from(imageBase64, 'base64');
      
      const filename = `${product.slug}.png`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, buffer);

      // Update or create image record
      if (existingImage) {
        await db.productImage.update({
          where: { id: existingImage.id },
          data: {
            url: `/images/products/${filename}`,
          },
        });
      } else {
        await db.productImage.create({
          data: {
            productId: product.id,
            url: `/images/products/${filename}`,
            altText: product.name,
            sortOrder: 0,
          },
        });
      }

      console.log(`✓ Generated and saved: ${filename}`);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`✗ Failed to generate image for ${product.slug}:`, error);
    }
  }

  console.log('\nImage generation complete!');
}

generateImages().catch(console.error);
