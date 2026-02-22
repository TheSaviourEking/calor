"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { format } from "date-fns";
import {
  Gamepad2,
  Plus,
  Play,
  Pause,
  Settings,
  Trash2,
  Heart,
  Zap,
  Waves,
  Music,
  Timer,
  Users,
  ChevronRight,
  X,
  Loader2,
  Power,
  Volume2,
  VolumeX,
  Share2,
  Edit3,
  Flame,
  Trophy,
  Clock,
  TrendingUp,
  Bluetooth,
} from "lucide-react";

export interface Toy {
  id: string;
  nickname: string;
  deviceId: string | null;
  lastConnected: string | null;
  connectionCount: number;
  totalSessionTime: number;
  defaultIntensity: number;
  shareWithPartner: boolean;
  toyModel: {
    id: string;
    name: string;
    toyType: string;
    imageUrl: string | null;
    maxIntensity: number;
    supportsPatterns: boolean;
    brand: {
      name: string;
      slug: string;
    };
  };
}

export interface Pattern {
  id: string;
  name: string;
  description: string | null;
  patternData: string;
  duration: number;
  category: string;
  intensity: string;
  isPublic: boolean;
  isFeatured: boolean;
  useCount: number;
  likeCount: number;
  creatorId: string | null;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  supportsRemote: boolean;
  supportsPatterns: boolean;
  toyModels: Array<{
    id: string;
    name: string;
    toyType: string;
    supportsPatterns: boolean;
  }>;
}

export interface SessionStats {
  totalSessions: number;
  totalDuration: number;
  avgIntensity: number;
  partnerSessions: number;
}

interface SmartToysClientProps {
  initialToys: Toy[];
  initialBrands: Brand[];
  initialPatterns: Pattern[];
  initialStats: SessionStats | null;
  initialCustomerId: string;
}

export default function SmartToysClient({
  initialToys,
  initialBrands,
  initialPatterns,
  initialStats,
  initialCustomerId,
}: SmartToysClientProps) {
  const { toast } = useToast();
  const [customerId] = useState<string>(initialCustomerId);
  const [toys, setToys] = useState<Toy[]>(initialToys);
  const [brands] = useState<Brand[]>(initialBrands);
  const [patterns, setPatterns] = useState<Pattern[]>(initialPatterns);
  const [stats] = useState<SessionStats | null>(initialStats);
  const [activeTab, setActiveTab] = useState<
    "toys" | "patterns" | "control" | "history"
  >("toys");

  // Control panel state
  const [selectedToy, setSelectedToy] = useState<Toy | null>(null);
  const [currentIntensity, setCurrentIntensity] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePattern, setActivePattern] = useState<Pattern | null>(null);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Pattern creator state
  const [showPatternCreator, setShowPatternCreator] = useState(false);
  const [newPatternName, setNewPatternName] = useState("");
  const [newPatternCategory, setNewPatternCategory] = useState("custom");
  const [patternPoints, setPatternPoints] = useState<
    Array<{ intensity: number; duration: number }>
  >([{ intensity: 5, duration: 500 }]);

  // Add toy modal
  const [showAddToy, setShowAddToy] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [toyNickname, setToyNickname] = useState("");

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && currentSessionId) {
      interval = setInterval(() => {
        setSessionTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentSessionId]);

  // Add toy
  const handleAddToy = async () => {
    if (!customerId || !selectedModelId) return;

    try {
      const res = await fetch("/api/wellness/toys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          toyModelId: selectedModelId,
          nickname: toyNickname || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToys([...toys, data.toy]);
        setShowAddToy(false);
        setSelectedModelId("");
        setToyNickname("");
        toast({
          title: "Toy Connected!",
          description: `${data.toy.nickname} has been added to your collection`,
        });
      } else {
        toast({
          title: data.error || "Failed to add toy",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Failed to add toy", variant: "destructive" });
    }
  };

  // Remove toy
  const handleRemoveToy = async (toyId: string) => {
    try {
      const res = await fetch(`/api/wellness/toys?toyId=${toyId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setToys(toys.filter((t) => t.id !== toyId));
        toast({ title: "Toy disconnected" });
      }
    } catch {
      toast({ title: "Failed to disconnect toy", variant: "destructive" });
    }
  };

  // Start session
  const startSession = async () => {
    if (!customerId || !selectedToy) return;

    try {
      const res = await fetch("/api/wellness/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          smartToyId: selectedToy.id,
          patternId: activePattern?.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCurrentSessionId(data.session.id);
        setIsPlaying(true);
        setSessionTimer(0);
        toast({ title: "Session started!" });
      }
    } catch {
      toast({ title: "Failed to start session", variant: "destructive" });
    }
  };

  // End session
  const endSession = async () => {
    if (!currentSessionId) return;

    try {
      const res = await fetch("/api/wellness/sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId,
          duration: sessionTimer,
          avgIntensity: currentIntensity,
        }),
      });

      if (res.ok) {
        setIsPlaying(false);
        setCurrentSessionId(null);
        toast({
          title: "Session Complete!",
          description: `Duration: ${Math.floor(sessionTimer / 60)}m ${sessionTimer % 60}s`,
        });
        setSessionTimer(0);
      }
    } catch {
      toast({ title: "Failed to end session", variant: "destructive" });
    }
  };

  // Create pattern
  const handleCreatePattern = async () => {
    if (!customerId || !newPatternName || patternPoints.length === 0) return;

    try {
      const totalDuration = patternPoints.reduce(
        (sum, p) => sum + p.duration,
        0,
      );

      const res = await fetch("/api/wellness/patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: customerId,
          name: newPatternName,
          patternData: patternPoints,
          duration: totalDuration,
          category: newPatternCategory,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPatterns([...patterns, data.pattern]);
        setShowPatternCreator(false);
        setNewPatternName("");
        setPatternPoints([{ intensity: 5, duration: 500 }]);
        toast({ title: "Pattern created!" });
      }
    } catch {
      toast({ title: "Failed to create pattern", variant: "destructive" });
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!customerId) {
    return (
      <div className="h-full flex items-center justify-center py-20 text-center">
        <div>
          <p className="font-body text-warm-gray mb-4">
            Please log in to manage your smart toys
          </p>
          <Link
            href="/account"
            className="px-6 py-3 bg-terracotta text-cream font-body text-sm uppercase tracking-wider"
          >
            Go to Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="font-display text-charcoal mb-2"
          style={{
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: 300,
          }}
        >
          Smart Toys
        </h1>
        <p className="font-body text-warm-gray">
          Connect, control, and create personalized experiences
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-warm-white p-4 border border-sand">
          <div className="flex items-center gap-2 text-terracotta mb-2">
            <Gamepad2 className="w-5 h-5" />
            <span className="font-body text-xs uppercase tracking-wider">
              Connected
            </span>
          </div>
          <p
            className="font-display text-charcoal text-3xl"
            style={{ fontWeight: 400 }}
          >
            {toys.length}
          </p>
          <p className="font-body text-warm-gray text-xs">toys</p>
        </div>

        <div className="bg-warm-white p-4 border border-sand">
          <div className="flex items-center gap-2 text-terracotta mb-2">
            <Timer className="w-5 h-5" />
            <span className="font-body text-xs uppercase tracking-wider">
              Total Time
            </span>
          </div>
          <p
            className="font-display text-charcoal text-3xl"
            style={{ fontWeight: 400 }}
          >
            {Math.floor((stats?.totalDuration || 0) / 60)}
          </p>
          <p className="font-body text-warm-gray text-xs">minutes</p>
        </div>

        <div className="bg-warm-white p-4 border border-sand">
          <div className="flex items-center gap-2 text-terracotta mb-2">
            <Waves className="w-5 h-5" />
            <span className="font-body text-xs uppercase tracking-wider">
              Patterns
            </span>
          </div>
          <p
            className="font-display text-charcoal text-3xl"
            style={{ fontWeight: 400 }}
          >
            {patterns.length}
          </p>
          <p className="font-body text-warm-gray text-xs">created</p>
        </div>

        <div className="bg-warm-white p-4 border border-sand">
          <div className="flex items-center gap-2 text-terracotta mb-2">
            <Users className="w-5 h-5" />
            <span className="font-body text-xs uppercase tracking-wider">
              Partner Play
            </span>
          </div>
          <p
            className="font-display text-charcoal text-3xl"
            style={{ fontWeight: 400 }}
          >
            {stats?.partnerSessions || 0}
          </p>
          <p className="font-body text-warm-gray text-xs">sessions</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-sand pb-4">
        {[
          { id: "toys", label: "My Toys", icon: Gamepad2 },
          { id: "patterns", label: "Patterns", icon: Waves },
          { id: "control", label: "Control Panel", icon: Zap },
          { id: "history", label: "History", icon: Clock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 font-body text-sm uppercase tracking-wider transition-colors ${activeTab === tab.id
              ? "text-terracotta border-b-2 border-terracotta"
              : "text-warm-gray hover:text-charcoal"
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "toys" && (
        <div className="space-y-6">
          {/* Add Toy Button */}
          <button
            onClick={() => setShowAddToy(true)}
            className="w-full p-4 border-2 border-dashed border-sand hover:border-terracotta flex items-center justify-center gap-2 text-warm-gray hover:text-terracotta transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="font-body text-sm uppercase tracking-wider">
              Add New Toy
            </span>
          </button>

          {/* Toys List */}
          {toys.length === 0 ? (
            <div className="bg-warm-white border border-sand p-8 text-center">
              <Bluetooth className="w-12 h-12 text-warm-gray mx-auto mb-4" />
              <p className="font-body text-warm-gray mb-2">
                No toys connected yet
              </p>
              <p className="font-body text-warm-gray text-sm">
                Add your first smart toy to start creating personalized
                experiences
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {toys.map((toy) => (
                <div
                  key={toy.id}
                  className={`p-4 border ${selectedToy?.id === toy.id
                    ? "border-terracotta bg-terracotta/5"
                    : "border-sand bg-warm-white"
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-terracotta/10 flex items-center justify-center">
                      <Gamepad2 className="w-8 h-8 text-terracotta" />
                    </div>
                    <div className="flex-1">
                      <h3
                        className="font-display text-charcoal"
                        style={{ fontWeight: 400 }}
                      >
                        {toy.nickname}
                      </h3>
                      <p className="font-body text-warm-gray text-sm">
                        {toy.toyModel.brand.name} {toy.toyModel.name}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="font-body text-xs text-warm-gray">
                          {toy.connectionCount} sessions
                        </span>
                        <span className="font-body text-xs text-warm-gray">
                          {Math.floor(toy.totalSessionTime)} min total
                        </span>
                      </div>
                      {toy.shareWithPartner && (
                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-terracotta/10 text-terracotta font-body text-xs">
                          <Users className="w-3 h-3" />
                          Shared with partner
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedToy(toy);
                          setCurrentIntensity(toy.defaultIntensity);
                          setActiveTab("control");
                        }}
                        className="p-2 text-warm-gray hover:text-terracotta"
                        title="Control"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveToy(toy.id)}
                        className="p-2 text-warm-gray hover:text-red-500"
                        title="Disconnect"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "patterns" && (
        <div className="space-y-6">
          {/* Create Pattern Button */}
          <button
            onClick={() => setShowPatternCreator(true)}
            className="w-full p-4 border-2 border-dashed border-sand hover:border-terracotta flex items-center justify-center gap-2 text-warm-gray hover:text-terracotta transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="font-body text-sm uppercase tracking-wider">
              Create New Pattern
            </span>
          </button>

          {/* Patterns Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patterns.map((pattern) => (
              <div
                key={pattern.id}
                className={`p-4 border ${activePattern?.id === pattern.id
                  ? "border-terracotta bg-terracotta/5"
                  : "border-sand bg-warm-white"
                  }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3
                    className="font-display text-charcoal text-sm"
                    style={{ fontWeight: 400 }}
                  >
                    {pattern.name}
                  </h3>
                  {pattern.isFeatured && <span className="text-xs">⭐</span>}
                </div>

                {/* Pattern Visualization */}
                <div className="h-12 bg-sand/50 flex items-end gap-0.5 p-1 mb-3">
                  {JSON.parse(pattern.patternData)
                    .slice(0, 20)
                    .map((point: { intensity: number }, i: number) => (
                      <div
                        key={i}
                        className="flex-1 bg-terracotta transition-all"
                        style={{
                          height: `${(point.intensity / 10) * 100}%`,
                        }}
                      />
                    ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-xs text-warm-gray">
                      {Math.floor(pattern.duration / 1000)}s
                    </span>
                    <span className="font-body text-xs text-warm-gray capitalize">
                      {pattern.category}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setActivePattern(pattern);
                      if (selectedToy) setActiveTab("control");
                    }}
                    className="px-3 py-1 bg-terracotta text-cream font-body text-xs uppercase tracking-wider hover:bg-terracotta/90"
                  >
                    Use
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "control" && (
        <div className="space-y-6">
          {!selectedToy ? (
            <div className="bg-warm-white border border-sand p-8 text-center">
              <Gamepad2 className="w-12 h-12 text-warm-gray mx-auto mb-4" />
              <p className="font-body text-warm-gray mb-4">
                Select a toy from "My Toys" to access the control panel
              </p>
              <button
                onClick={() => setActiveTab("toys")}
                className="px-4 py-2 bg-terracotta text-cream font-body text-sm uppercase tracking-wider"
              >
                Go to My Toys
              </button>
            </div>
          ) : (
            <>
              {/* Control Panel */}
              <div className="bg-warm-white border border-sand p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2
                      className="font-display text-charcoal text-lg"
                      style={{ fontWeight: 400 }}
                    >
                      {selectedToy.nickname}
                    </h2>
                    <p className="font-body text-warm-gray text-sm">
                      {selectedToy.toyModel.brand.name}{" "}
                      {selectedToy.toyModel.name}
                    </p>
                  </div>
                  <div
                    className="font-display text-3xl text-terracotta"
                    style={{ fontWeight: 300 }}
                  >
                    {formatTime(sessionTimer)}
                  </div>
                </div>

                {/* Intensity Control */}
                <div className="mb-6">
                  <label className="font-body text-sm text-warm-gray block mb-2">
                    Intensity Level: {currentIntensity}/10
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() =>
                        setCurrentIntensity(Math.max(1, currentIntensity - 1))
                      }
                      className="p-2 border border-sand hover:border-terracotta"
                    >
                      -
                    </button>
                    <div className="flex-1 h-4 bg-sand flex">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 ${i < currentIntensity ? "bg-terracotta" : "bg-transparent"}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() =>
                        setCurrentIntensity(Math.min(10, currentIntensity + 1))
                      }
                      className="p-2 border border-sand hover:border-terracotta"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {[
                    { label: "Gentle", intensity: 3, icon: Heart },
                    { label: "Medium", intensity: 5, icon: Waves },
                    { label: "Strong", intensity: 8, icon: Zap },
                    { label: "Max", intensity: 10, icon: Flame },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setCurrentIntensity(preset.intensity)}
                      className={`p-3 border ${currentIntensity === preset.intensity
                        ? "border-terracotta bg-terracotta text-cream"
                        : "border-sand hover:border-terracotta"
                        }`}
                    >
                      <preset.icon className="w-4 h-4 mx-auto mb-1" />
                      <span className="font-body text-xs">{preset.label}</span>
                    </button>
                  ))}
                </div>

                {/* Active Pattern */}
                {activePattern && (
                  <div className="mb-6 p-3 border border-sand">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-body text-sm text-warm-gray">
                        Active Pattern:
                      </span>
                      <button
                        onClick={() => setActivePattern(null)}
                        className="text-warm-gray hover:text-terracotta"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-display text-charcoal">
                      {activePattern.name}
                    </span>
                  </div>
                )}

                {/* Play/Pause & End Session */}
                <div className="flex gap-4">
                  {!isPlaying ? (
                    <button
                      onClick={startSession}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-terracotta text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta/90"
                    >
                      <Play className="w-5 h-5" />
                      Start Session
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border border-terracotta text-terracotta font-body text-sm uppercase tracking-wider hover:bg-terracotta/10"
                      >
                        <Pause className="w-5 h-5" />
                        Pause
                      </button>
                      <button
                        onClick={endSession}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-charcoal text-cream font-body text-sm uppercase tracking-wider hover:bg-charcoal/90"
                      >
                        <Power className="w-5 h-5" />
                        End Session
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Partner Play */}
              <div className="bg-warm-white border border-sand p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-terracotta" />
                    <div>
                      <h3
                        className="font-display text-charcoal text-sm"
                        style={{ fontWeight: 400 }}
                      >
                        Partner Play
                      </h3>
                      <p className="font-body text-warm-gray text-xs">
                        Allow your partner to control this toy remotely
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 ${selectedToy.shareWithPartner
                      ? "bg-green-100 text-green-700"
                      : "bg-sand text-warm-gray"
                      } font-body text-xs`}
                  >
                    {selectedToy.shareWithPartner ? "Enabled" : "Disabled"}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-warm-white border border-sand p-6">
          <h2
            className="font-display text-charcoal text-lg mb-4"
            style={{ fontWeight: 400 }}
          >
            Session History
          </h2>

          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 border border-sand text-center">
                <p
                  className="font-display text-2xl text-charcoal"
                  style={{ fontWeight: 400 }}
                >
                  {stats.totalSessions}
                </p>
                <p className="font-body text-xs text-warm-gray">
                  Total Sessions
                </p>
              </div>
              <div className="p-3 border border-sand text-center">
                <p
                  className="font-display text-2xl text-charcoal"
                  style={{ fontWeight: 400 }}
                >
                  {Math.floor(stats.totalDuration / 60)}
                </p>
                <p className="font-body text-xs text-warm-gray">
                  Total Minutes
                </p>
              </div>
              <div className="p-3 border border-sand text-center">
                <p
                  className="font-display text-2xl text-charcoal"
                  style={{ fontWeight: 400 }}
                >
                  {stats.avgIntensity.toFixed(1)}
                </p>
                <p className="font-body text-xs text-warm-gray">
                  Avg Intensity
                </p>
              </div>
            </div>
          )}

          <p className="font-body text-warm-gray text-sm text-center py-4">
            View your complete session history in the Wellness Dashboard
          </p>
        </div>
      )}

      {/* Add Toy Modal */}
      {showAddToy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-cream border border-sand max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-sand flex items-center justify-between">
              <h2
                className="font-display text-charcoal"
                style={{ fontWeight: 400 }}
              >
                Add New Toy
              </h2>
              <button
                onClick={() => setShowAddToy(false)}
                className="text-warm-gray hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Brand Selection */}
              <div>
                <label className="font-body text-sm text-warm-gray block mb-2">
                  Brand
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {brands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => {
                        setSelectedBrand(brand);
                        setSelectedModelId("");
                      }}
                      className={`p-3 border ${selectedBrand?.id === brand.id
                        ? "border-terracotta bg-terracotta/10"
                        : "border-sand"
                        }`}
                    >
                      <span className="font-body text-sm">{brand.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Selection */}
              {selectedBrand && (
                <div>
                  <label className="font-body text-sm text-warm-gray block mb-2">
                    Model
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedBrand.toyModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModelId(model.id)}
                        className={`p-3 border ${selectedModelId === model.id
                          ? "border-terracotta bg-terracotta/10"
                          : "border-sand"
                          }`}
                      >
                        <span className="font-body text-sm">{model.name}</span>
                        <span className="font-body text-xs text-warm-gray block capitalize">
                          {model.toyType}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nickname */}
              {selectedModelId && (
                <div>
                  <label className="font-body text-sm text-warm-gray block mb-2">
                    Nickname (optional)
                  </label>
                  <input
                    type="text"
                    value={toyNickname}
                    onChange={(e) => setToyNickname(e.target.value)}
                    placeholder="My Favorite Toy"
                    className="w-full px-3 py-2 border border-sand bg-transparent font-body text-charcoal focus:border-terracotta outline-none"
                  />
                </div>
              )}

              <button
                onClick={handleAddToy}
                disabled={!selectedModelId}
                className="w-full px-4 py-3 bg-terracotta text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta/90 disabled:opacity-50"
              >
                Connect Toy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pattern Creator Modal */}
      {showPatternCreator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-cream border border-sand max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-sand flex items-center justify-between">
              <h2
                className="font-display text-charcoal"
                style={{ fontWeight: 400 }}
              >
                Create Pattern
              </h2>
              <button
                onClick={() => setShowPatternCreator(false)}
                className="text-warm-gray hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="font-body text-sm text-warm-gray block mb-2">
                  Pattern Name
                </label>
                <input
                  type="text"
                  value={newPatternName}
                  onChange={(e) => setNewPatternName(e.target.value)}
                  placeholder="My Custom Pattern"
                  className="w-full px-3 py-2 border border-sand bg-transparent font-body text-charcoal focus:border-terracotta outline-none"
                />
              </div>

              <div>
                <label className="font-body text-sm text-warm-gray block mb-2">
                  Category
                </label>
                <select
                  value={newPatternCategory}
                  onChange={(e) => setNewPatternCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-charcoal focus:border-terracotta outline-none"
                >
                  <option value="wave">Wave</option>
                  <option value="pulse">Pulse</option>
                  <option value="random">Random</option>
                  <option value="rhythm">Rhythm</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Pattern Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-body text-sm text-warm-gray">
                    Pattern Points
                  </label>
                  <button
                    onClick={() =>
                      setPatternPoints([
                        ...patternPoints,
                        { intensity: 5, duration: 500 },
                      ])
                    }
                    className="text-xs text-terracotta font-body"
                  >
                    + Add Point
                  </button>
                </div>

                {/* Visualization */}
                <div className="h-20 bg-sand/50 flex items-end gap-1 p-2 mb-3">
                  {patternPoints.map((point, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-terracotta cursor-pointer transition-all hover:bg-terracotta/80"
                      style={{ height: `${(point.intensity / 10) * 100}%` }}
                      title={`Point ${i + 1}: Intensity ${point.intensity}, ${point.duration}ms`}
                    />
                  ))}
                </div>

                {/* Points List */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {patternPoints.map((point, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 border border-sand"
                    >
                      <span className="font-body text-xs text-warm-gray w-6">
                        {i + 1}
                      </span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={point.intensity}
                        onChange={(e) => {
                          const newPoints = [...patternPoints];
                          newPoints[i].intensity = parseInt(e.target.value);
                          setPatternPoints(newPoints);
                        }}
                        className="flex-1"
                      />
                      <span className="font-body text-xs text-charcoal w-8">
                        {point.intensity}
                      </span>
                      <input
                        type="number"
                        value={point.duration}
                        onChange={(e) => {
                          const newPoints = [...patternPoints];
                          newPoints[i].duration =
                            parseInt(e.target.value) || 100;
                          setPatternPoints(newPoints);
                        }}
                        className="w-16 px-2 py-1 border border-sand bg-transparent font-body text-xs"
                        placeholder="ms"
                      />
                      <button
                        onClick={() =>
                          setPatternPoints(
                            patternPoints.filter((_, idx) => idx !== i),
                          )
                        }
                        className="text-warm-gray hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowPatternCreator(false)}
                  className="flex-1 px-4 py-3 border border-sand font-body text-sm uppercase tracking-wider hover:border-terracotta"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePattern}
                  disabled={!newPatternName || patternPoints.length === 0}
                  className="flex-1 px-4 py-3 bg-terracotta text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta/90 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
