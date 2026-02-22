'use client'

import { useState, useEffect } from 'react'
import { 
  TouchpadOff, Waves, Volume2, Thermometer, Scale, 
  Loader2, Info, Sparkles, Hand
} from 'lucide-react'

interface SensoryProfile {
  productId: string
  textureType: string | null
  textureIntensity: number | null
  surfaceFeel: string | null
  firmness: string | null
  flexibility: string | null
  vibrationLevels: number | null
  vibrationPatterns: number | null
  motorType: string | null
  maxIntensity: number | null
  noiseLevel: string | null
  temperatureResponsive: boolean
  warmingSupported: boolean
  coolingSupported: boolean
  weight: number | null
  weightFeel: string | null
  gripFeel: string | null
  warmingSensation: boolean
  coolingSensation: boolean
}

interface SensoryPreviewProps {
  productId: string
  productName: string
}

const textureDescriptions: Record<string, { icon: string; description: string }> = {
  smooth: { icon: '○', description: 'Silky smooth surface with minimal texture' },
  textured: { icon: '◎', description: 'Pleasant texture for enhanced sensation' },
  ribbed: { icon: '≡', description: 'Ribbed design for intensified stimulation' },
  realistic: { icon: '◉', description: 'Lifelike texture mimicking real feel' },
}

const motorDescriptions: Record<string, { color: string; description: string }> = {
  rumbly: { color: 'bg-purple-100 text-purple-700', description: 'Deep, penetrating vibrations' },
  buzzy: { color: 'bg-pink-100 text-pink-700', description: 'Light, surface-level vibrations' },
  thumpy: { color: 'bg-orange-100 text-orange-700', description: 'Pulsating, rhythmic sensation' },
}

const surfaceIcons: Record<string, string> = {
  silky: '✨',
  velvety: '🎭',
  matte: '⬛',
  glossy: '💎',
}

export default function SensoryPreview({ productId, productName }: SensoryPreviewProps) {
  const [profile, setProfile] = useState<SensoryProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDefault, setIsDefault] = useState(false)
  const [activeInfo, setActiveInfo] = useState<string | null>(null)
  const [vibrationDemo, setVibrationDemo] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/experience/sensory?productId=${productId}`)
        if (res.ok) {
          const data = await res.json()
          setProfile(data.sensory)
          setIsDefault(data.isDefault)
        }
      } catch (error) {
        console.error('Error fetching sensory profile:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProfile()
  }, [productId])

  // Vibration demo animation
  useEffect(() => {
    if (vibrationDemo) {
      const timeout = setTimeout(() => setVibrationDemo(false), 3000)
      return () => clearTimeout(timeout)
    }
  }, [vibrationDemo])

  if (isLoading) {
    return (
      <div className="bg-warm-white border border-sand p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-terracotta animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  const hasVibration = profile.vibrationLevels && profile.vibrationLevels > 0

  return (
    <div className="bg-warm-white border border-sand">
      {/* Header */}
      <div className="p-4 border-b border-sand">
        <div className="flex items-center gap-2">
          <Hand className="w-5 h-5 text-terracotta" />
          <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>
            Sensory Preview
          </h3>
        </div>
        <p className="font-body text-warm-gray text-xs mt-1">
          Experience how {productName} feels before you buy
        </p>
        {isDefault && (
          <span className="font-body text-xs text-terracotta mt-2 inline-block">
            * Based on category averages
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Texture Section */}
        <div className="p-4 bg-sand/20 border border-sand">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TouchpadOff className="w-4 h-4 text-terracotta" />
              <span className="font-body text-charcoal text-sm font-medium">Texture & Feel</span>
            </div>
            <button
              onClick={() => setActiveInfo(activeInfo === 'texture' ? null : 'texture')}
              className="text-warm-gray hover:text-terracotta"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {activeInfo === 'texture' && (
            <p className="font-body text-warm-gray text-xs mb-3 bg-cream p-2">
              Texture affects how the product feels against your skin. Smoother surfaces glide easily, while textured surfaces provide more stimulation.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {profile.textureType && (
              <div>
                <span className="font-body text-xs text-warm-gray block">Type</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg">{textureDescriptions[profile.textureType]?.icon || '○'}</span>
                  <span className="font-body text-charcoal text-sm capitalize">{profile.textureType}</span>
                </div>
              </div>
            )}
            
            {profile.surfaceFeel && (
              <div>
                <span className="font-body text-xs text-warm-gray block">Surface</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg">{surfaceIcons[profile.surfaceFeel] || '✨'}</span>
                  <span className="font-body text-charcoal text-sm capitalize">{profile.surfaceFeel}</span>
                </div>
              </div>
            )}
            
            {profile.firmness && (
              <div>
                <span className="font-body text-xs text-warm-gray block">Firmness</span>
                <div className="flex gap-1 mt-1">
                  {['soft', 'medium', 'firm'].map((f) => (
                    <div
                      key={f}
                      className={`h-2 w-8 ${
                        profile.firmness === f 
                          ? 'bg-terracotta' 
                          : f === 'soft' && profile.firmness === 'medium' ? 'bg-terracotta/50' 
                          : 'bg-sand'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-body text-xs text-charcoal capitalize mt-1 block">{profile.firmness}</span>
              </div>
            )}
            
            {profile.flexibility && (
              <div>
                <span className="font-body text-xs text-warm-gray block">Flexibility</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`h-2 w-16 rounded-full ${
                    profile.flexibility === 'rigid' ? 'bg-charcoal' :
                    profile.flexibility === 'semi-flexible' ? 'bg-charcoal/50' :
                    'bg-terracotta/50'
                  }`} />
                  <span className="font-body text-charcoal text-xs capitalize">{profile.flexibility}</span>
                </div>
              </div>
            )}
          </div>
          
          {profile.textureIntensity && (
            <div className="mt-3 pt-3 border-t border-sand">
              <span className="font-body text-xs text-warm-gray block mb-2">Texture Intensity</span>
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-6 flex-1 ${i < profile.textureIntensity! ? 'bg-terracotta' : 'bg-sand'}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vibration Section */}
        {hasVibration && (
          <div className="p-4 bg-sand/20 border border-sand">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-terracotta" />
                <span className="font-body text-charcoal text-sm font-medium">Vibration Profile</span>
              </div>
              <button
                onClick={() => setVibrationDemo(true)}
                className="px-3 py-1 bg-terracotta text-cream font-body text-xs hover:bg-terracotta/90 transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Demo
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {profile.vibrationLevels && (
                <div>
                  <span className="font-body text-xs text-warm-gray block">Intensity Levels</span>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: Math.min(profile.vibrationLevels, 10) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-4 bg-terracotta"
                        style={{ height: `${8 + i * 3}px` }}
                      />
                    ))}
                  </div>
                  <span className="font-body text-xs text-charcoal">{profile.vibrationLevels} levels</span>
                </div>
              )}
              
              {profile.vibrationPatterns && (
                <div>
                  <span className="font-body text-xs text-warm-gray block">Patterns</span>
                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: Math.min(profile.vibrationPatterns, 8) }).map((_, i) => (
                      <div key={i} className="w-3 h-3 bg-terracotta/50" />
                    ))}
                  </div>
                  <span className="font-body text-xs text-charcoal">{profile.vibrationPatterns} patterns</span>
                </div>
              )}
              
              {profile.motorType && (
                <div className="col-span-2">
                  <span className="font-body text-xs text-warm-gray block">Motor Type</span>
                  <span className={`inline-block mt-1 px-2 py-1 text-xs font-body ${motorDescriptions[profile.motorType]?.color || 'bg-sand text-charcoal'}`}>
                    {profile.motorType} - {motorDescriptions[profile.motorType]?.description}
                  </span>
                </div>
              )}
              
              {profile.noiseLevel && (
                <div>
                  <span className="font-body text-xs text-warm-gray block">Noise Level</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Volume2 className="w-4 h-4 text-warm-gray" />
                    <div className="flex gap-0.5">
                      {['silent', 'quiet', 'moderate', 'loud'].map((level, i) => (
                        <div
                          key={level}
                          className={`w-2 h-3 ${
                            level === profile.noiseLevel ? 'bg-terracotta' : 'bg-sand'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="font-body text-xs text-charcoal capitalize">{profile.noiseLevel}</span>
                </div>
              )}
            </div>

            {/* Vibration Demo Animation */}
            {vibrationDemo && (
              <div className="mt-3 pt-3 border-t border-sand">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-pulse flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-4 h-8 bg-terracotta rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                  <span className="font-body text-xs text-warm-gray ml-2">Vibration simulation...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Temperature Section */}
        {(profile.temperatureResponsive || profile.warmingSupported || profile.coolingSupported) && (
          <div className="p-4 bg-sand/20 border border-sand">
            <div className="flex items-center gap-2 mb-3">
              <Thermometer className="w-4 h-4 text-terracotta" />
              <span className="font-body text-charcoal text-sm font-medium">Temperature Features</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.warmingSupported && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 font-body text-xs">
                  🔥 Warming Mode
                </span>
              )}
              {profile.coolingSupported && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 font-body text-xs">
                  ❄️ Cooling Mode
                </span>
              )}
              {profile.temperatureResponsive && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 font-body text-xs">
                  🌡️ Temperature Responsive
                </span>
              )}
            </div>
          </div>
        )}

        {/* Weight Section */}
        {(profile.weight || profile.weightFeel || profile.gripFeel) && (
          <div className="p-4 bg-sand/20 border border-sand">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-terracotta" />
              <span className="font-body text-charcoal text-sm font-medium">Weight & Grip</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {profile.weight && (
                <div>
                  <span className="font-body text-xs text-warm-gray block">Weight</span>
                  <span className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                    {profile.weight}g
                  </span>
                </div>
              )}
              {profile.weightFeel && (
                <div>
                  <span className="font-body text-xs text-warm-gray block">Feel</span>
                  <span className="font-body text-charcoal text-sm capitalize">{profile.weightFeel}</span>
                </div>
              )}
              {profile.gripFeel && (
                <div>
                  <span className="font-body text-xs text-warm-gray block">Grip</span>
                  <span className="font-body text-charcoal text-sm capitalize">{profile.gripFeel}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-terracotta/5 border-t border-sand">
        <p className="font-body text-xs text-warm-gray text-center">
          Sensory profiles help you understand how products feel before purchasing
        </p>
      </div>
    </div>
  )
}
