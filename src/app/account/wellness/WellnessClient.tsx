'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import AccountLayout from '@/components/account/AccountLayout'
import { format } from 'date-fns'
import {
  Flame, Trophy, Target, Heart, Zap, Calendar, Gift, Star, Clock,
  Check, ChevronRight, Play, Pause, Settings, Users, Award, TrendingUp,
  Sun, Moon, Activity, Bell, Plus, X, Loader2, RefreshCw, Send
} from 'lucide-react'

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface Streak {
  currentStreak: number
  longestStreak: number
  lastCheckIn: string | null
  streakBroken: boolean
}

export interface Achievement {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  category: string
  tier: string
  requirementType: string
  requirementValue: number
  pointsAwarded: number
  earnedAt?: string
  progress?: number
  isEarned: boolean
}

export interface Challenge {
  id: string
  title: string
  description: string
  icon: string
  type: string
  category: string
  points: number
  requirementValue: number
  progress: number
  isCompleted: boolean
  completedAt?: string
}

export interface DailyReward {
  day: number
  rewardType: string
  rewardValue: number
  isClaimed: boolean
}

export interface CheckIn {
  id: string
  checkedAt: string
  dayInStreak: number
  rewardClaimed: boolean
  rewardType?: string
  rewardValue?: number
}

export interface WellnessProfile {
  preferredTime: string
  preferredIntensity: string
  goals: string[]
  avgSessionDuration: number
}

export interface CoupleGoal {
  id: string
  title: string
  description?: string
  icon?: string
  category: string
  progress: number
  completed: boolean
  targetDate?: string
}

interface WellnessData {
  profile: UserProfile | null
  streak: Streak | null
  achievements: Achievement[]
  challenges: Challenge[]
  dailyRewards: DailyReward[]
  todayCheckIn: CheckIn | null
  wellnessProfile: WellnessProfile | null
  coupleGoals: CoupleGoal[]
}

export default function WellnessClient({ initialData }: { initialData: WellnessData }) {
  const { toast } = useToast()
  const [checkingIn, setCheckingIn] = useState(false)
  const [profile] = useState<UserProfile | null>(initialData.profile)
  const [streak, setStreak] = useState<Streak | null>(initialData.streak)
  const [achievements] = useState<Achievement[]>(initialData.achievements)
  const [challenges] = useState<Challenge[]>(initialData.challenges)
  const [dailyRewards] = useState<DailyReward[]>(initialData.dailyRewards)
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(initialData.todayCheckIn)
  const [wellnessProfile] = useState<WellnessProfile | null>(initialData.wellnessProfile)
  const [coupleGoals] = useState<CoupleGoal[]>(initialData.coupleGoals)
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'challenges' | 'couple'>('overview')

  // Daily check-in
  const handleCheckIn = async () => {
    if (!profile || checkingIn) return

    setCheckingIn(true)
    try {
      const res = await fetch('/api/wellness/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: profile.id }),
      })

      const data = await res.json()

      if (res.ok) {
        setTodayCheckIn(data.checkIn)
        setStreak(data.streak)
        toast({
          title: 'Daily Check-in Complete!',
          description: `You're on a ${data.streak?.currentStreak || 1} day streak!`,
        })
      } else {
        toast({
          title: data.error || 'Already checked in today',
          variant: 'default',
        })
      }
    } catch (error) {
      toast({
        title: 'Check-in failed',
        description: 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setCheckingIn(false)
    }
  }

  // Get tier color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-amber-700 bg-amber-100'
      case 'silver': return 'text-gray-600 bg-gray-100'
      case 'gold': return 'text-yellow-600 bg-yellow-100'
      case 'platinum': return 'text-purple-600 bg-purple-100'
      default: return 'text-warm-gray bg-sand'
    }
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'wellness': return <Heart className="w-4 h-4" />
      case 'milestone': return <Trophy className="w-4 h-4" />
      case 'exploration': return <Activity className="w-4 h-4" />
      case 'communication': return <Users className="w-4 h-4" />
      default: return <Star className="w-4 h-4" />
    }
  }

  const earnedCount = achievements.filter(a => a.isEarned).length
  const activeChallenges = challenges.filter(c => !c.isCompleted)
  const completedChallenges = challenges.filter(c => c.isCompleted)

  return (
    <>
      <div className="mb-8">
        <h1
          className="font-display text-charcoal mb-2"
          style={{
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: 300,
          }}
        >
          Wellness Dashboard
        </h1>
        <p className="font-body text-warm-gray">
          Track your journey, earn rewards, and connect with your wellness goals
        </p>
      </div>
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-warm-white p-4 border border-sand">
          <div className="flex items-center gap-2 text-terracotta mb-2">
            <Flame className="w-5 h-5" />
            <span className="font-body text-xs uppercase tracking-wider">Streak</span>
          </div>
          <p className="font-display text-charcoal text-3xl" style={{ fontWeight: 400 }}>
            {streak?.currentStreak || 0}
          </p>
          <p className="font-body text-warm-gray text-xs">days</p>
        </div>

        <div className="bg-warm-white p-4 border border-sand">
          <div className="flex items-center gap-2 text-terracotta mb-2">
            <Trophy className="w-5 h-5" />
            <span className="font-body text-xs uppercase tracking-wider">Achievements</span>
          </div>
          <p className="font-display text-charcoal text-3xl" style={{ fontWeight: 400 }}>
            {earnedCount}
          </p>
          <p className="font-body text-warm-gray text-xs">of {achievements.length}</p>
        </div>

        <div className="bg-warm-white p-4 border border-sand">
          <div className="flex items-center gap-2 text-terracotta mb-2">
            <Target className="w-5 h-5" />
            <span className="font-body text-xs uppercase tracking-wider">Challenges</span>
          </div>
          <p className="font-display text-charcoal text-3xl" style={{ fontWeight: 400 }}>
            {activeChallenges.length}
          </p>
          <p className="font-body text-warm-gray text-xs">active</p>
        </div>

        <div className="bg-warm-white p-4 border border-sand">
          <div className="flex items-center gap-2 text-terracotta mb-2">
            <Star className="w-5 h-5" />
            <span className="font-body text-xs uppercase tracking-wider">Best Streak</span>
          </div>
          <p className="font-display text-charcoal text-3xl" style={{ fontWeight: 400 }}>
            {streak?.longestStreak || 0}
          </p>
          <p className="font-body text-warm-gray text-xs">days</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-sand pb-4">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'achievements', label: 'Achievements', icon: Trophy },
          { id: 'challenges', label: 'Challenges', icon: Target },
          { id: 'couple', label: 'Couple', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 font-body text-sm uppercase tracking-wider transition-colors ${activeTab === tab.id
              ? 'text-terracotta border-b-2 border-terracotta'
              : 'text-warm-gray hover:text-charcoal'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Daily Check-in Card */}
          <div className="bg-warm-white border border-sand p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-display text-charcoal text-lg mb-1" style={{ fontWeight: 400 }}>
                  Daily Check-in
                </h2>
                <p className="font-body text-warm-gray text-sm">
                  {todayCheckIn
                    ? `Checked in today (Day ${todayCheckIn.dayInStreak})`
                    : "Check in today to continue your streak!"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {todayCheckIn ? (
                  <span className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 font-body text-sm">
                    <Check className="w-4 h-4" />
                    Done
                  </span>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    className="flex items-center gap-2 px-4 py-2 bg-terracotta text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta/90 disabled:opacity-50"
                  >
                    {checkingIn ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sun className="w-4 h-4" />
                    )}
                    Check In
                  </button>
                )}
              </div>
            </div>

            {/* Daily Streak Rewards */}
            <div className="grid grid-cols-7 gap-2">
              {dailyRewards.map((reward, index) => (
                <div
                  key={index}
                  className={`text-center p-3 border ${reward.isClaimed
                    ? 'border-green-300 bg-green-50'
                    : index + 1 <= (streak?.currentStreak || 0)
                      ? 'border-terracotta bg-terracotta/10'
                      : 'border-sand'
                    }`}
                >
                  <div className="font-body text-xs text-warm-gray mb-1">Day {reward.day}</div>
                  <div className="text-lg mb-1">
                    {reward.rewardType === 'points' ? '⭐' :
                      reward.rewardType === 'badge' ? '🏆' : '🎁'}
                  </div>
                  <div className="font-body text-xs text-charcoal">
                    +{reward.rewardValue}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Challenges Preview */}
          <div className="bg-warm-white border border-sand p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                Active Challenges
              </h2>
              <button
                onClick={() => setActiveTab('challenges')}
                className="flex items-center gap-1 text-terracotta font-body text-sm hover:underline"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {activeChallenges.length === 0 ? (
              <p className="font-body text-warm-gray text-center py-4">
                No active challenges. Check back tomorrow!
              </p>
            ) : (
              <div className="space-y-3">
                {activeChallenges.slice(0, 3).map((challenge) => (
                  <div key={challenge.id} className="flex items-center gap-4 p-3 border border-sand">
                    <div className="w-10 h-10 flex items-center justify-center bg-terracotta/10 text-xl">
                      {challenge.icon || '🎯'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-charcoal text-sm" style={{ fontWeight: 400 }}>
                        {challenge.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-sand">
                          <div
                            className="h-full bg-terracotta transition-all"
                            style={{ width: `${Math.min(100, (challenge.progress / challenge.requirementValue) * 100)}%` }}
                          />
                        </div>
                        <span className="font-body text-xs text-warm-gray">
                          {challenge.progress}/{challenge.requirementValue}
                        </span>
                      </div>
                    </div>
                    <span className="font-body text-sm text-terracotta">+{challenge.points}pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Achievements */}
          <div className="bg-warm-white border border-sand p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                Recent Achievements
              </h2>
              <button
                onClick={() => setActiveTab('achievements')}
                className="flex items-center gap-1 text-terracotta font-body text-sm hover:underline"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {earnedCount === 0 ? (
              <p className="font-body text-warm-gray text-center py-4">
                Start your journey to earn achievements!
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {achievements.filter(a => a.isEarned).slice(0, 6).map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-3 border border-sand text-center ${getTierColor(achievement.tier)}`}
                    title={achievement.name}
                  >
                    <div className="text-2xl mb-1">{achievement.icon}</div>
                    <div className="font-body text-xs">{achievement.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-6">
          {/* Achievement Categories */}
          {['milestone', 'wellness', 'exploration'].map((category) => {
            const categoryAchievements = achievements.filter(a => a.category === category)
            if (categoryAchievements.length === 0) return null

            return (
              <div key={category} className="bg-warm-white border border-sand p-6">
                <div className="flex items-center gap-2 mb-4">
                  {getCategoryIcon(category)}
                  <h2 className="font-display text-charcoal text-lg capitalize" style={{ fontWeight: 400 }}>
                    {category} Achievements
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-4 border ${achievement.isEarned ? 'border-green-300 bg-green-50' : 'border-sand'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 flex items-center justify-center text-2xl ${achievement.isEarned ? '' : 'opacity-40 grayscale'
                          }`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display text-charcoal text-sm" style={{ fontWeight: 400 }}>
                            {achievement.name}
                          </h3>
                          <p className="font-body text-warm-gray text-xs mb-2">
                            {achievement.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-body ${getTierColor(achievement.tier)}`}>
                              {achievement.tier}
                            </span>
                            <span className="font-body text-xs text-terracotta">
                              +{achievement.pointsAwarded}pts
                            </span>
                          </div>
                          {achievement.progress !== undefined && !achievement.isEarned && (
                            <div className="mt-2 h-1.5 bg-sand">
                              <div
                                className="h-full bg-terracotta"
                                style={{ width: `${Math.min(100, achievement.progress)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {achievements.length === 0 && (
            <div className="bg-warm-white border border-sand p-8 text-center">
              <Trophy className="w-12 h-12 text-warm-gray mx-auto mb-4" />
              <p className="font-body text-warm-gray">
                No achievements available yet. Start your wellness journey!
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'challenges' && (
        <div className="space-y-6">
          {/* Active Challenges */}
          <div className="bg-warm-white border border-sand p-6">
            <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
              Active Challenges
            </h2>

            {activeChallenges.length === 0 ? (
              <p className="font-body text-warm-gray text-center py-4">
                No active challenges right now. Check back tomorrow!
              </p>
            ) : (
              <div className="space-y-4">
                {activeChallenges.map((challenge) => (
                  <div key={challenge.id} className="p-4 border border-sand">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 flex items-center justify-center bg-terracotta/10 text-2xl">
                        {challenge.icon || '🎯'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>
                              {challenge.title}
                            </h3>
                            <p className="font-body text-warm-gray text-sm">{challenge.description}</p>
                          </div>
                          <span className="px-3 py-1 bg-terracotta/10 text-terracotta font-body text-sm">
                            +{challenge.points} pts
                          </span>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-body text-xs text-warm-gray">Progress</span>
                            <span className="font-body text-xs text-charcoal">
                              {challenge.progress}/{challenge.requirementValue}
                            </span>
                          </div>
                          <div className="h-2 bg-sand">
                            <div
                              className="h-full bg-terracotta transition-all"
                              style={{ width: `${Math.min(100, (challenge.progress / challenge.requirementValue) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-sand font-body text-xs text-warm-gray capitalize">
                            {challenge.type}
                          </span>
                          <span className="px-2 py-0.5 bg-sand font-body text-xs text-warm-gray capitalize">
                            {challenge.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Challenges */}
          {completedChallenges.length > 0 && (
            <div className="bg-warm-white border border-sand p-6">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Completed Challenges
              </h2>
              <div className="space-y-3">
                {completedChallenges.map((challenge) => (
                  <div key={challenge.id} className="flex items-center gap-4 p-3 border border-sand bg-green-50">
                    <div className="w-10 h-10 flex items-center justify-center text-2xl">
                      {challenge.icon || '🎯'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-charcoal text-sm" style={{ fontWeight: 400 }}>
                        {challenge.title}
                      </h3>
                      <p className="font-body text-warm-gray text-xs">
                        Completed {challenge.completedAt ? format(new Date(challenge.completedAt), 'MMM d, yyyy') : ''}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-green-600 font-body text-sm">
                      <Check className="w-4 h-4" />
                      +{challenge.points}pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'couple' && (
        <div className="space-y-6">
          {/* Couple Link Status */}
          <div className="bg-warm-white border border-sand p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-terracotta" />
              <h2 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                Couples Wellness
              </h2>
            </div>

            {coupleGoals.length === 0 ? (
              <div className="text-center py-6">
                <Heart className="w-12 h-12 text-warm-gray mx-auto mb-4" />
                <p className="font-body text-warm-gray mb-4">
                  Link with your partner to unlock shared wellness goals and activities
                </p>
                <a
                  href="/account/couple"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta/90"
                >
                  <Users className="w-4 h-4" />
                  Link Partner
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {coupleGoals.map((goal) => (
                  <div key={goal.id} className="p-4 border border-sand">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-terracotta/10 text-xl">
                        {goal.icon || '💕'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>
                          {goal.title}
                        </h3>
                        {goal.description && (
                          <p className="font-body text-warm-gray text-sm">{goal.description}</p>
                        )}
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-body text-xs text-warm-gray">Progress</span>
                            <span className="font-body text-xs text-charcoal">{goal.progress}%</span>
                          </div>
                          <div className="h-2 bg-sand">
                            <div
                              className={`h-full transition-all ${goal.completed ? 'bg-green-500' : 'bg-terracotta'
                                }`}
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-sand font-body text-xs text-warm-gray capitalize">
                            {goal.category}
                          </span>
                          {goal.completed && (
                            <span className="flex items-center gap-1 text-green-600 font-body text-xs">
                              <Check className="w-3 h-3" />
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Connection Score */}
          <div className="bg-warm-white border border-sand p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-terracotta" />
              <h2 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                Connection Score
              </h2>
            </div>
            <div className="text-center py-8">
              <div className="font-display text-5xl text-terracotta mb-2" style={{ fontWeight: 300 }}>
                --
              </div>
              <p className="font-body text-warm-gray text-sm">
                Complete activities together to build your connection score
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
