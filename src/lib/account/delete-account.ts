import type { Prisma } from '@prisma/client'

/*
 * Account deletion. The Customer row is kept but anonymised, so records we
 * must keep (orders for tax, returns, payments, other people's gift cards)
 * stay intact with no name, email or credentials attached. Everything
 * personal with no legal or financial value is deleted.
 *
 * Decision per relation on Customer:
 *
 *   Session                   delete
 *   Address                   delete, unless an order or subscription uses it:
 *                             then lines become 'Deleted' (country kept, for tax)
 *   Order                     keep, linked to the anonymised customer; gift message,
 *                             recipient email, delivery instructions, guest email cleared
 *   LoyaltyAccount            delete (transactions cascade; points are forfeited)
 *   PriceDropAlert            delete
 *   StockAlert                delete
 *   SupportChatSession        delete (messages cascade)
 *   AlertPreferences          delete
 *   Review                    keep text, detach: customerId null, guestName 'Deleted member',
 *                             guestEmail null (other shoppers rely on reviews and ratings)
 *   ReviewVote (no relation)  detach: customerId null, so helpful counts stay true
 *   GiftCard (purchased)      keep, purchaserId null: the card belongs to its recipient
 *   GiftCard (redeemed)       keep (balance history is financial); recipientEmail becomes
 *                             deleted+{id}@invalid, recipientName null, redeemedById null
 *   AbandonedCart             delete
 *   AbandonedCartEmailLog     delete
 *   ReferralCode              delete (referrals made with it cascade)
 *   Referral (as referrer)    delete
 *   Referral (as referred)    keep the referrer's record; referredEmail becomes
 *                             deleted+{id}@invalid, referredCustomerId null
 *   SavedComparison           delete
 *   ConsultationBooking       keep (paid service), linked; notes, summary, recording cleared
 *   ConsultationReview        keep, marked anonymous
 *   Subscription              refuse while active or paused (it would keep billing);
 *                             otherwise keep, linked; preferences cleared
 *   ReturnRequest             keep (refund record), linked; guestEmail, reasonDetails cleared
 *   CouplesLink (both sides)  delete, with its goals, milestones, scores and activities
 *   PackagingPreference       delete
 *   SupportTicket (own)       delete (messages cascade)
 *   SupportTicket (assigned)  assignedToId null
 *   SupportTicketCategory     autoAssignToId null
 *   UserRecommendation        delete
 *   ChatbotConversation       delete (messages cascade)
 *   CustomerVIPProgress       delete
 *   PointsRedemption          delete
 *   CustomerPreferences       delete
 *   StreamHost                refuse if it has any streams ('Contact support to close a
 *                             host account'); otherwise delete it and reviews of it
 *   StreamChatMessage         keep (other viewers' context), detach: guestName 'Deleted member'
 *   StreamViewer              delete
 *   StreamReminder            delete
 *   HostReview (written)      keep (host rating), marked anonymous
 *   CustomerSmartToy          delete
 *   ToySession                delete
 *   ChallengeCompletion       delete
 *   UserStreak                delete
 *   UserAchievement           delete
 *   DailyCheckIn              delete
 *   WellnessEntry             delete
 *   WellnessProfile           delete
 *   LeaderboardEntry          delete
 *   VibrationPattern          private: delete; public: keep, creatorId null
 *   ProductExperience         keep, detach like reviews
 *   ExperienceLike            detach: customerId null (like counts stay true)
 *   ExperienceComment         keep, detach: guestName 'Deleted member'
 *   SavedConfiguration        delete
 *   GiftRegistry              delete (items, guests, purchases, events, notes cascade)
 *   SharedWishlist            delete
 *   SegmentMember             delete
 *   CustomerRFM               delete
 *   AdminUser                 unlink (customerId null); staff accounts are closed separately
 *
 * Plain customerId columns with no relation:
 *   ProductView               delete (browsing history)
 *   CheckoutSession           delete
 *
 * Kept on purpose: RegistryPurchase.purchaserEmail and RegistryGuest.email on
 * other members' registries. Those rows belong to the registry owner (who
 * they invited, who bought what) and are not linked to this account.
 *
 * Stripe: stripeCustomerId is cleared on our side only. Deleting the Stripe
 * customer is a follow-up.
 */

export const IN_PROGRESS_ORDER_STATUSES = ['PENDING', 'PAYMENT_RECEIVED', 'PROCESSING', 'SHIPPED']

export class AccountDeletionBlocked extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AccountDeletionBlocked'
  }
}

const DELETED_MEMBER = 'Deleted member'

export async function deleteAccount(customerId: string, tx: Prisma.TransactionClient): Promise<void> {
  const mine = { customerId }
  const placeholderEmail = `deleted+${customerId}@invalid`

  // Blockers first, inside the transaction, so nothing changes when refused.
  // These are plain counts under READ COMMITTED and take no lock: an order
  // placed while this runs is not blocked, and would attach to the
  // anonymised customer row like any other kept order.
  const ordersInProgress = await tx.order.count({
    where: { customerId, status: { in: IN_PROGRESS_ORDER_STATUSES } },
  })
  if (ordersInProgress > 0) {
    throw new AccountDeletionBlocked(
      'You have an order in progress. You can delete your account once it has been delivered.'
    )
  }

  const host = await tx.streamHost.findUnique({
    where: { customerId },
    select: { id: true, _count: { select: { streams: true } } },
  })
  if (host && host._count.streams > 0) {
    throw new AccountDeletionBlocked('Contact support to close a host account')
  }

  const activeSubscriptions = await tx.subscription.count({
    where: { customerId, status: { in: ['active', 'paused'] } },
  })
  if (activeSubscriptions > 0) {
    throw new AccountDeletionBlocked(
      'You have an active subscription. Cancel it before deleting your account.'
    )
  }

  // Sign-in and alerts
  await tx.session.deleteMany({ where: mine })
  await tx.priceDropAlert.deleteMany({ where: mine })
  await tx.stockAlert.deleteMany({ where: mine })
  await tx.alertPreferences.deleteMany({ where: mine })

  // Addresses: keep the ones orders or subscriptions point at, without the person
  const usedAddresses = await tx.address.findMany({
    where: { customerId, OR: [{ orders: { some: {} } }, { subscriptions: { some: {} } }] },
    select: { id: true },
  })
  const usedIds = usedAddresses.map((a) => a.id)
  await tx.address.deleteMany({ where: { customerId, id: { notIn: usedIds } } })
  if (usedIds.length > 0) {
    await tx.address.updateMany({
      where: { id: { in: usedIds } },
      data: { line1: 'Deleted', line2: null, city: 'Deleted', state: null, postcode: 'Deleted', isDefault: false },
    })
  }

  // Orders, returns and money: kept, personal text removed
  await tx.order.updateMany({
    where: mine,
    data: { guestEmail: null, giftMessage: null, recipientEmail: null, deliveryInstructions: null },
  })
  await tx.returnRequest.updateMany({ where: mine, data: { guestEmail: null, reasonDetails: null } })
  await tx.giftCard.updateMany({ where: { purchaserId: customerId }, data: { purchaserId: null } })
  await tx.giftCard.updateMany({
    where: { redeemedById: customerId },
    data: { recipientEmail: placeholderEmail, recipientName: null, redeemedById: null },
  })
  await tx.consultationBooking.updateMany({
    where: mine,
    data: { notes: null, summary: null, recordingUrl: null },
  })
  await tx.consultationReview.updateMany({ where: mine, data: { isAnonymous: true } })
  await tx.subscription.updateMany({ where: mine, data: { preferences: null } })

  // Loyalty and referrals
  await tx.loyaltyAccount.deleteMany({ where: mine })
  await tx.customerVIPProgress.deleteMany({ where: mine })
  await tx.pointsRedemption.deleteMany({ where: mine })
  await tx.referral.deleteMany({ where: { referrerId: customerId } })
  await tx.referralCode.deleteMany({ where: mine })
  await tx.referral.updateMany({
    where: { referredCustomerId: customerId },
    data: { referredEmail: placeholderEmail, referredCustomerId: null },
  })

  // Shopping traces
  await tx.abandonedCart.deleteMany({ where: mine })
  await tx.abandonedCartEmailLog.deleteMany({ where: mine })
  await tx.savedComparison.deleteMany({ where: mine })
  await tx.savedConfiguration.deleteMany({ where: mine })
  await tx.userRecommendation.deleteMany({ where: mine })
  await tx.customerPreferences.deleteMany({ where: mine })
  await tx.packagingPreference.deleteMany({ where: mine })
  await tx.segmentMember.deleteMany({ where: mine })
  await tx.customerRFM.deleteMany({ where: mine })
  await tx.sharedWishlist.deleteMany({ where: mine })
  await tx.giftRegistry.deleteMany({ where: mine })
  await tx.productView.deleteMany({ where: mine })
  await tx.checkoutSession.deleteMany({ where: mine })

  // Support
  await tx.supportChatSession.deleteMany({ where: mine })
  await tx.chatbotConversation.deleteMany({ where: mine })
  await tx.supportTicket.deleteMany({ where: mine })
  await tx.supportTicket.updateMany({ where: { assignedToId: customerId }, data: { assignedToId: null } })
  await tx.supportTicketCategory.updateMany({
    where: { autoAssignToId: customerId },
    data: { autoAssignToId: null },
  })

  // Public contributions: kept for other shoppers, author removed
  await tx.review.updateMany({
    where: mine,
    data: { customerId: null, guestName: DELETED_MEMBER, guestEmail: null },
  })
  await tx.reviewVote.updateMany({ where: mine, data: { customerId: null } })
  await tx.productExperience.updateMany({
    where: mine,
    data: { customerId: null, guestName: DELETED_MEMBER, guestEmail: null },
  })
  await tx.experienceLike.updateMany({ where: mine, data: { customerId: null } })
  await tx.experienceComment.updateMany({
    where: mine,
    data: { customerId: null, guestName: DELETED_MEMBER },
  })
  await tx.streamChatMessage.updateMany({
    where: mine,
    data: { customerId: null, guestName: DELETED_MEMBER },
  })
  await tx.hostReview.updateMany({ where: mine, data: { isAnonymous: true } })

  // Live shopping
  await tx.streamViewer.deleteMany({ where: mine })
  await tx.streamReminder.deleteMany({ where: mine })
  if (host) {
    await tx.hostReview.deleteMany({ where: { hostId: host.id } })
    await tx.streamHost.delete({ where: { id: host.id } })
  }

  // Couples: the link and everything hanging off it
  const links = await tx.couplesLink.findMany({
    where: { OR: [{ customer1Id: customerId }, { customer2Id: customerId }] },
    select: { id: true },
  })
  const linkIds = links.map((l) => l.id)
  if (linkIds.length > 0) {
    const inLinks = { couplesLinkId: { in: linkIds } }
    await tx.coupleMilestone.deleteMany({ where: { goal: inLinks } })
    await tx.coupleGoal.deleteMany({ where: inLinks })
    await tx.connectionScore.deleteMany({ where: inLinks })
    await tx.partnerActivity.deleteMany({ where: inLinks })
  }
  await tx.couplesLink.deleteMany({ where: { OR: [{ customer1Id: customerId }, { customer2Id: customerId }] } })

  // Wellness and smart toys
  await tx.toySession.deleteMany({ where: mine })
  // A partner's session may point at this member's toy
  await tx.toySession.updateMany({ where: { smartToy: { customerId } }, data: { smartToyId: null } })
  await tx.customerSmartToy.deleteMany({ where: mine })
  const privatePatterns = await tx.vibrationPattern.findMany({
    where: { creatorId: customerId, isPublic: false },
    select: { id: true },
  })
  const privatePatternIds = privatePatterns.map((p) => p.id)
  if (privatePatternIds.length > 0) {
    await tx.toySession.updateMany({ where: { patternId: { in: privatePatternIds } }, data: { patternId: null } })
    await tx.vibrationPattern.deleteMany({ where: { id: { in: privatePatternIds } } })
  }
  await tx.vibrationPattern.updateMany({ where: { creatorId: customerId }, data: { creatorId: null } })
  await tx.challengeCompletion.deleteMany({ where: mine })
  await tx.userStreak.deleteMany({ where: mine })
  await tx.userAchievement.deleteMany({ where: mine })
  await tx.dailyCheckIn.deleteMany({ where: mine })
  await tx.wellnessEntry.deleteMany({ where: mine })
  await tx.wellnessProfile.deleteMany({ where: mine })
  await tx.leaderboardEntry.deleteMany({ where: mine })

  // Staff link
  await tx.adminUser.updateMany({ where: mine, data: { customerId: null } })

  // Finally the person
  await tx.customer.update({
    where: { id: customerId },
    data: {
      email: placeholderEmail,
      firstName: 'Deleted',
      lastName: '',
      nickname: null,
      passwordHash: null,
      googleId: null,
      appleId: null,
      googleEmail: null,
      appleEmail: null,
      emailVerified: false,
      emailVerifiedAt: null,
      emailVerifyToken: null,
      emailVerifyExpires: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      stripeCustomerId: null,
      ageVerifiedAt: null,
      authProvider: 'deleted',
      isAdmin: false,
      isHost: false,
      isModerator: false,
    },
  })
}
