import { db } from '@/lib/db'
import CheckoutClient from './CheckoutClient'

async function getGiftWrappingOptions() {
  return db.giftWrappingOption.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      imageUrl: true,
    },
  })
}

export default async function CheckoutPage() {
  const giftWrappingOptions = await getGiftWrappingOptions()
  
  return <CheckoutClient giftWrappingOptions={giftWrappingOptions} />
}
