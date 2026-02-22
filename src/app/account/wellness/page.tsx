import { redirect } from "next/navigation";
import WellnessClient from "./WellnessClient";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { serialise } from "@/lib/serialise";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wellness Dashboard | CALŌR",
  description:
    "Track your wellness journey, earn rewards, and connect with your goals",
};

export default async function WellnessPage() {
  const session = await getSession();

  if (!session?.customerId) {
    redirect("/account?redirect=/account/wellness");
  }

  const customerId = session.customerId;

  // 0. Fetch Customer Profile
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  // 1. Fetch User Streak
  const streak = await db.userStreak.findUnique({
    where: { customerId },
  });

  // 2. Fetch Achievements
  const achievementsQuery = await db.achievement.findMany({
    orderBy: [{ tier: "asc" }, { sortOrder: "asc" }],
    include: {
      userAchievements: {
        where: { customerId },
      },
    },
  });

  const achievements = achievementsQuery.map((a) => ({
    ...a,
    isEarned: a.userAchievements && a.userAchievements.length > 0,
    earnedAt: a.userAchievements?.[0]?.earnedAt || null,
  }));

  // 3. Fetch Challenges
  const challengesQuery = await db.challenge.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      completions: {
        where: { customerId },
        select: {
          id: true,
          progress: true,
          completed: true,
          completedAt: true,
        },
      },
    },
  });

  const challenges = challengesQuery.map((c) => ({
    ...c,
    progress: c.completions?.[0]?.progress || 0,
    isCompleted: c.completions?.[0]?.completed || false,
    completedAt: c.completions?.[0]?.completedAt || null,
  }));

  // 4. Fetch Today CheckIn
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayCheckIn = await db.dailyCheckIn.findFirst({
    where: {
      customerId,
      checkedAt: { gte: startOfDay },
    },
  });

  // 5. Fetch Wellness Profile
  const wellnessProfile = await db.wellnessProfile.findUnique({
    where: { customerId },
  });

  // 6. Fetch Daily Rewards
  const dailyRewards = await db.dailyReward.findMany({
    where: { isActive: true },
    orderBy: { day: "asc" },
  });

  // 7. Fetch Couple Goals
  const couplesLink = await db.couplesLink.findFirst({
    where: {
      OR: [{ customer1Id: customerId }, { customer2Id: customerId }],
      status: "active",
    },
  });

  let coupleGoals: any[] = [];
  if (couplesLink) {
    coupleGoals = await db.coupleGoal.findMany({
      where: { couplesLinkId: couplesLink.id },
      orderBy: { createdAt: "desc" },
    });
  }

  const initialData = {
    profile: customer,
    streak,
    achievements,
    challenges,
    dailyRewards,
    todayCheckIn,
    wellnessProfile,
    coupleGoals,
  };

  return <WellnessClient initialData={serialise(initialData as any)} />;
}
