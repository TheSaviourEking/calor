'use client'

import { useState } from 'react'
import { Ruler, ChevronDown, Check, AlertCircle } from 'lucide-react'

interface SizeChart {
  id: string
  name: string
  unit: string
  rows: string
  measurements: string
}

interface SizeGuide {
  id: string
  name: string
  description: string | null
  category: { name: string } | null
  charts: SizeChart[]
}

interface SizeGuideClientProps {
  guides: SizeGuide[]
}

export default function SizeGuideClient({ guides }: SizeGuideClientProps) {
  const [selectedGuide, setSelectedGuide] = useState<string>(guides[0]?.id || '')
  const [activeChart, setActiveChart] = useState<string>(guides[0]?.charts[0]?.id || '')
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches')

  const currentGuide = guides.find(g => g.id === selectedGuide)
  const currentChart = currentGuide?.charts.find(c => c.id === activeChart)

  const convertValue = (value: number) => {
    if (unit === 'cm') {
      return (value * 2.54).toFixed(1)
    }
    return value.toString()
  }

  const parseChartData = (chart: SizeChart | undefined) => {
    if (!chart) return { rows: [], measurements: {} }
    try {
      return {
        rows: JSON.parse(chart.rows),
        measurements: JSON.parse(chart.measurements),
      }
    } catch {
      return { rows: [], measurements: {} }
    }
  }

  const { rows, measurements } = parseChartData(currentChart)

  if (guides.length === 0) {
    return (
      <div className="min-h-screen pt-20 bg-cream">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16 text-center">
          <Ruler className="w-16 h-16 text-sand mx-auto mb-4" />
          <h1 className="font-display text-charcoal text-2xl mb-4" style={{ fontWeight: 400 }}>
            Size guides coming soon
          </h1>
          <p className="font-body text-warm-gray">
            We&apos;re working on comprehensive size guides for all our products.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 bg-cream">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="eyebrow">Fit & Sizing</span>
          <h1 
            className="font-display text-charcoal mt-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300 }}
          >
            Size Guide
          </h1>
          <p className="font-body text-warm-gray text-lg max-w-2xl mx-auto mt-4">
            Find your perfect fit with our detailed size charts and fit recommendations.
          </p>
        </div>

        {/* Unit Toggle */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setUnit('inches')}
            className={`px-6 py-2 font-body text-sm transition-colors ${
              unit === 'inches' 
                ? 'bg-charcoal text-cream' 
                : 'bg-warm-white text-warm-gray hover:bg-sand'
            }`}
          >
            Inches
          </button>
          <button
            onClick={() => setUnit('cm')}
            className={`px-6 py-2 font-body text-sm transition-colors ${
              unit === 'cm' 
                ? 'bg-charcoal text-cream' 
                : 'bg-warm-white text-warm-gray hover:bg-sand'
            }`}
          >
            Centimeters
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Guide Selection */}
          <div className="lg:col-span-1">
            <div className="bg-warm-white p-4 border border-sand sticky top-24">
              <h3 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Categories
              </h3>
              <nav className="space-y-2">
                {guides.map((guide) => (
                  <button
                    key={guide.id}
                    onClick={() => {
                      setSelectedGuide(guide.id)
                      setActiveChart(guide.charts[0]?.id || '')
                    }}
                    className={`w-full text-left px-4 py-2 font-body text-sm transition-colors ${
                      selectedGuide === guide.id 
                        ? 'bg-terracotta/10 text-terracotta' 
                        : 'text-warm-gray hover:bg-sand/50'
                    }`}
                  >
                    {guide.name}
                    {guide.category && (
                      <span className="block text-xs opacity-60">{guide.category.name}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentGuide && (
              <div className="bg-warm-white border border-sand">
                {/* Guide Header */}
                <div className="p-6 border-b border-sand">
                  <h2 className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
                    {currentGuide.name}
                  </h2>
                  {currentGuide.description && (
                    <p className="font-body text-warm-gray text-sm mt-2">
                      {currentGuide.description}
                    </p>
                  )}
                </div>

                {/* Chart Tabs */}
                {currentGuide.charts.length > 1 && (
                  <div className="flex border-b border-sand overflow-x-auto">
                    {currentGuide.charts.map((chart) => (
                      <button
                        key={chart.id}
                        onClick={() => setActiveChart(chart.id)}
                        className={`px-6 py-3 font-body text-sm whitespace-nowrap transition-colors ${
                          activeChart === chart.id
                            ? 'border-b-2 border-terracotta text-terracotta'
                            : 'text-warm-gray hover:text-charcoal'
                        }`}
                      >
                        {chart.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Chart Table */}
                {currentChart && rows.length > 0 && (
                  <div className="p-6 overflow-x-auto">
                    <table className="w-full min-w-[500px]">
                      <thead>
                        <tr className="border-b border-sand">
                          <th className="text-left py-3 px-4 font-body text-charcoal text-xs uppercase tracking-wider">
                            Size
                          </th>
                          {Object.keys(measurements).map((measurement) => (
                            <th key={measurement} className="text-center py-3 px-4 font-body text-charcoal text-xs uppercase tracking-wider capitalize">
                              {measurement} ({unit})
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row: string, index: number) => (
                          <tr key={row} className="border-b border-sand/50 hover:bg-sand/20">
                            <td className="py-3 px-4 font-body text-charcoal text-sm font-medium">
                              {row}
                            </td>
                            {Object.entries(measurements).map(([_, values]: [string, unknown]) => {
                              const vals = values as number[]
                              return (
                                <td key={`${row}-${_}`} className="text-center py-3 px-4 font-body text-warm-gray text-sm">
                                  {convertValue(vals[index])}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Fit Tips */}
                <div className="p-6 bg-sand/20 border-t border-sand">
                  <h3 className="font-body text-charcoal text-sm font-medium mb-3">
                    Fit Tips
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-terracotta mt-0.5" />
                      <span className="font-body text-warm-gray text-sm">
                        Measure yourself wearing light clothing for best accuracy.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-terracotta mt-0.5" />
                      <span className="font-body text-warm-gray text-sm">
                        If you&apos;re between sizes, we recommend sizing up for a more comfortable fit.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-terracotta mt-0.5" />
                      <span className="font-body text-warm-gray text-sm">
                        All measurements are approximate and may vary slightly by style.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* How to Measure */}
            <div className="mt-8 bg-warm-white p-6 border border-sand">
              <h3 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                How to Measure
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-body text-charcoal text-sm font-medium mb-2">Bust</h4>
                  <p className="font-body text-warm-gray text-sm">
                    Measure around the fullest part of your bust, keeping the tape horizontal.
                  </p>
                </div>
                <div>
                  <h4 className="font-body text-charcoal text-sm font-medium mb-2">Waist</h4>
                  <p className="font-body text-warm-gray text-sm">
                    Measure around the narrowest part of your natural waistline.
                  </p>
                </div>
                <div>
                  <h4 className="font-body text-charcoal text-sm font-medium mb-2">Hips</h4>
                  <p className="font-body text-warm-gray text-sm">
                    Measure around the widest part of your hips, about 8&quot; below your waist.
                  </p>
                </div>
                <div>
                  <h4 className="font-body text-charcoal text-sm font-medium mb-2">Inseam</h4>
                  <p className="font-body text-warm-gray text-sm">
                    Measure from the top of your inner thigh to the bottom of your ankle.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
