import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'

// Brand colors
const TERRACOTTA = [196, 120, 90] as const
const CHARCOAL = [44, 36, 32] as const
const CREAM = [250, 248, 245] as const
const WARM_GRAY = [139, 128, 120] as const

interface SlideContent {
  type: string
  content: Record<string, unknown>
}

const slides: SlideContent[] = [
  {
    type: 'title',
    content: {
      headline: 'CALOR',
      tagline: 'The Future of Intimate Commerce',
      subtitle: 'Investor Pitch Deck 2025',
    }
  },
  {
    type: 'problem',
    content: {
      title: 'The Problem',
      points: [
        { stat: '$58.6B', label: 'Sexual Wellness Market by 2032', growth: '7% CAGR' },
        { stat: '73%', label: 'Consumers prefer discreet online shopping' },
        { stat: '0', label: 'Platforms offering complete wellness journey' },
      ],
      statement: 'The adult wellness industry lacks a unified platform that combines commerce, education, community, and personalization.',
    }
  },
  {
    type: 'solution',
    content: {
      title: 'Our Solution: CALOR',
      subtitle: 'A comprehensive platform that transforms how people discover, purchase, and enjoy intimate products.',
      features: [
        { title: 'Premium E-commerce', desc: 'Curated products with detailed guides' },
        { title: 'AI-Powered Discovery', desc: 'Personalized recommendations via quiz' },
        { title: 'Live Shopping', desc: 'Interactive streams with real-time offers' },
        { title: 'Wellness Journey', desc: 'Complete intimate wellness platform' },
      ]
    }
  },
  {
    type: 'features',
    content: {
      title: 'Platform Capabilities',
      subtitle: '119 API Endpoints | 117 Data Models | Full-Stack Solution',
      categories: [
        {
          name: 'Core Commerce',
          items: ['Product Catalog', 'Multi-variant SKUs', 'Cart & Checkout', 'Multi-payment', 'Guest Checkout', 'Order Tracking']
        },
        {
          name: 'AI & Personalization',
          items: ['Product Quiz', 'AI Chatbot', 'Recommendations', 'Smart Search', 'Behavior Tracking']
        },
        {
          name: 'Customer Experience',
          items: ['Reviews & Ratings', 'Size Guides', 'Video Tutorials', 'Consultations', 'Support Tickets']
        },
        {
          name: 'Retention & Loyalty',
          items: ['Points System', 'VIP Tiers', 'Referrals', 'Subscriptions', 'Gift Cards', 'Flash Sales']
        },
      ]
    }
  },
  {
    type: 'live-shopping',
    content: {
      title: 'Live Shopping Platform',
      subtitle: 'The fastest-growing e-commerce channel: $1 Trillion by 2026',
      stats: [
        { value: '3x', label: 'Higher conversion vs traditional e-commerce' },
        { value: '10x', label: 'Longer session duration' },
        { value: '40%', label: 'Lower return rates' },
      ]
    }
  },
  {
    type: 'tech',
    content: {
      title: 'Technology Stack',
      subtitle: 'Built for scale, designed for experience',
      stack: [
        { layer: 'Frontend', tech: 'Next.js 16, React 19, TypeScript, Tailwind CSS' },
        { layer: 'Backend', tech: 'API Routes, Prisma ORM, WebSocket (Socket.io)' },
        { layer: 'Database', tech: 'SQLite (dev) / PostgreSQL (production ready)' },
        { layer: 'AI/ML', tech: 'LLM Integration, Recommendation Engine' },
        { layer: 'Payments', tech: 'Stripe, Coinbase Commerce, Bank Transfer' },
        { layer: 'Auth', tech: 'Email, Google OAuth, Apple Sign-In' },
      ]
    }
  },
  {
    type: 'market',
    content: {
      title: 'Market Opportunity',
      tam: { value: '$58.6B', label: 'Total Addressable Market by 2032' },
      sam: { value: '$12B', label: 'Serviceable Market (North America)' },
      growth: '7% CAGR',
      trends: [
        'Destigmatization of sexual wellness',
        'E-commerce shift accelerated by pandemic',
        'Gen Z & Millennials driving growth',
        'Personalization demand increasing',
        'Live shopping becoming mainstream',
      ]
    }
  },
  {
    type: 'competitive',
    content: {
      title: 'Competitive Moat',
      vs: [
        { competitor: 'Lovehoney', ours: 'AI personalization + Live shopping + Wellness journey' },
        { competitor: 'Adam & Eve', ours: 'Modern UX + Real-time features + Subscription' },
        { competitor: 'Amazon', ours: 'Specialized expertise + Privacy focus + Community' },
        { competitor: 'Dame', ours: 'Broader audience + Live shopping + Full platform' },
      ],
      differentiators: [
        'Only platform with integrated live shopping',
        'AI-powered product discovery',
        'Complete wellness journey tracking',
        'Couples & relationship features',
        'Virtual consultation marketplace',
      ]
    }
  },
  {
    type: 'business',
    content: {
      title: 'Business Model',
      streams: [
        { name: 'Product Sales', margin: '40-60%', desc: 'Direct retail with premium margins' },
        { name: 'Subscription Box', margin: 'Recurring', desc: 'Monthly curated packages' },
        { name: 'Live Shopping', margin: '8-12%', desc: 'Commission on stream sales' },
        { name: 'Consultations', margin: '20%', desc: 'Expert session marketplace' },
        { name: 'Premium Membership', margin: 'Recurring', desc: 'VIP benefits & exclusive access' },
      ]
    }
  },
  {
    type: 'traction',
    content: {
      title: 'Platform Status',
      metrics: [
        { value: '119', label: 'API Endpoints Built' },
        { value: '117', label: 'Data Models' },
        { value: '74', label: 'Pages' },
        { value: '46', label: 'Client Components' },
      ],
      completed: [
        'Core E-commerce Platform',
        'AI Product Quiz & Recommendations',
        'Subscription Box System',
        'VIP Loyalty Program',
        'Live Shopping Platform',
        'Admin Analytics Dashboard',
        'Multi-payment Integration',
        'OAuth Authentication',
        'Gift Registry System',
        'Smart Toy Integration',
        'Gamification Engine',
      ]
    }
  },
  {
    type: 'roadmap',
    content: {
      title: 'Product Roadmap',
      phases: [
        { phase: 'Q1 2024', status: 'Complete', items: ['Core Platform', 'AI Quiz', 'Subscriptions'] },
        { phase: 'Q2 2024', status: 'Complete', items: ['Returns', 'Couples', 'Analytics'] },
        { phase: 'Q3 2024', status: 'Complete', items: ['AI Chatbot', 'VIP Program', 'Live Shopping'] },
        { phase: 'Q4 2024', status: 'Complete', items: ['Gift Registry', 'Smart Toys', 'Gamification'] },
        { phase: 'Q1 2025', status: 'In Progress', items: ['Mobile App', 'AR Preview', 'International'] },
        { phase: '2025+', status: 'Vision', items: ['Marketplace', 'Wellness App', 'Smart Home'] },
      ]
    }
  },
  {
    type: 'ask',
    content: {
      title: 'Investment Opportunity',
      raise: '$2M Seed Round',
      use: [
        { category: 'Engineering', percent: 40, desc: 'Mobile app, AR features, AI enhancement' },
        { category: 'Marketing', percent: 30, desc: 'Customer acquisition, brand building' },
        { category: 'Operations', percent: 20, desc: 'Fulfillment, customer support' },
        { category: 'Working Capital', percent: 10, desc: 'Inventory, runway extension' },
      ],
      milestones: [
        'Launch mobile app',
        '50,000 active users',
        '$5M ARR',
        'Smart toy integration',
      ]
    }
  },
  {
    type: 'closing',
    content: {
      headline: 'CALOR',
      tagline: 'Redefining Intimate Commerce',
      cta: "Let's Build the Future Together",
      contact: 'investors@calor.com',
    }
  },
]

function setTextColor(doc: jsPDF, color: readonly number[]) {
  doc.setTextColor(color[0], color[1], color[2])
}

function addSlide(doc: jsPDF, slide: SlideContent, pageNum: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Background
  setTextColor(doc, CHARCOAL)
  doc.setFillColor(...CHARCOAL)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Header
  doc.setFontSize(10)
  setTextColor(doc, WARM_GRAY)
  doc.text('CALOR', margin, 15)
  doc.text(`| Investor Pitch Deck`, margin + 25, 15)
  doc.text(`${pageNum} / ${totalPages}`, pageWidth - margin, 15, { align: 'right' })

  // Progress bar
  doc.setFillColor(...WARM_GRAY)
  doc.rect(margin, 20, pageWidth - margin * 2, 0.5, 'F')
  doc.setFillColor(...TERRACOTTA)
  doc.rect(margin, 20, (pageWidth - margin * 2) * (pageNum / totalPages), 0.5, 'F')

  const startY = 40

  switch (slide.type) {
    case 'title':
      setTextColor(doc, TERRACOTTA)
      doc.setFontSize(48)
      doc.text(slide.content.headline as string, pageWidth / 2, pageHeight / 2 - 30, { align: 'center' })
      setTextColor(doc, CREAM)
      doc.setFontSize(24)
      doc.text(slide.content.tagline as string, pageWidth / 2, pageHeight / 2 + 10, { align: 'center' })
      setTextColor(doc, WARM_GRAY)
      doc.setFontSize(12)
      doc.text(slide.content.subtitle as string, pageWidth / 2, pageHeight / 2 + 30, { align: 'center' })
      break

    case 'problem': {
      setTextColor(doc, TERRACOTTA)
      doc.setFontSize(28)
      doc.text(slide.content.title as string, margin, startY)

      const points = slide.content.points as Array<{ stat: string; label: string; growth?: string }>
      const boxWidth = (pageWidth - margin * 2 - 40) / 3
      points.forEach((point, i) => {
        const x = margin + i * (boxWidth + 20)
        doc.setFillColor(60, 52, 48)
        doc.rect(x, startY + 30, boxWidth, 50, 'F')
        setTextColor(doc, TERRACOTTA)
        doc.setFontSize(24)
        doc.text(point.stat, x + boxWidth / 2, startY + 50, { align: 'center' })
        setTextColor(doc, CREAM)
        doc.setFontSize(10)
        doc.text(point.label, x + boxWidth / 2, startY + 65, { align: 'center' })
        if (point.growth) {
          setTextColor(doc, WARM_GRAY)
          doc.text(point.growth, x + boxWidth / 2, startY + 75, { align: 'center' })
        }
      })

      setTextColor(doc, WARM_GRAY)
      doc.setFontSize(12)
      const statement = slide.content.statement as string
      const lines = doc.splitTextToSize(statement, pageWidth - margin * 2)
      doc.text(lines, pageWidth / 2, startY + 110, { align: 'center' })
      break
    }

    case 'solution': {
      setTextColor(doc, TERRACOTTA)
      doc.setFontSize(28)
      doc.text(slide.content.title as string, margin, startY)
      setTextColor(doc, WARM_GRAY)
      doc.setFontSize(11)
      doc.text(slide.content.subtitle as string, margin, startY + 15)

      const features = slide.content.features as Array<{ title: string; desc: string }>
      const featureWidth = (pageWidth - margin * 2 - 30) / 4
      features.forEach((feature, i) => {
        const x = margin + i * (featureWidth + 10)
        doc.setFillColor(60, 52, 48)
        doc.rect(x, startY + 35, featureWidth, 60, 'F')
        setTextColor(doc, CREAM)
        doc.setFontSize(11)
        doc.text(feature.title, x + 5, startY + 50)
        setTextColor(doc, WARM_GRAY)
        doc.setFontSize(9)
        const descLines = doc.splitTextToSize(feature.desc, featureWidth - 10)
        doc.text(descLines, x + 5, startY + 65)
      })
      break
    }

    case 'features': {
      setTextColor(doc, TERRACOTTA)
      doc.setFontSize(28)
      doc.text(slide.content.title as string, margin, startY)
      setTextColor(doc, WARM_GRAY)
      doc.setFontSize(10)
      doc.text(slide.content.subtitle as string, margin, startY + 12)

      const categories = slide.content.categories as Array<{ name: string; items: string[] }>
      const catWidth = (pageWidth - margin * 2 - 30) / 4
      categories.forEach((cat, i) => {
        const x = margin + i * (catWidth + 10)
        doc.setFillColor(60, 52, 48)
        doc.rect(x, startY + 25, catWidth, 100, 'F')
        setTextColor(doc, TERRACOTTA)
        doc.setFontSize(11)
        doc.text(cat.name, x + 5, startY + 40)
        setTextColor(doc, CREAM)
        doc.setFontSize(8)
        cat.items.forEach((item, j) => {
          doc.text(`• ${item}`, x + 5, startY + 55 + j * 10)
        })
      })
      break
    }

    case 'live-shopping': {
      setTextColor(doc, TERRACOTTA)
      doc.setFontSize(28)
      doc.text(slide.content.title as string, margin, startY)
      setTextColor(doc, WARM_GRAY)
      doc.setFontSize(10)
      doc.text(slide.content.subtitle as string, margin, startY + 12)

      const stats = slide.content.stats as Array<{ value: string; label: string }>
      stats.forEach((stat, i) => {
        const y = startY + 40 + i * 25
        doc.setFillColor(...TERRACOTTA.map(c => Math.floor(c * 0.3)))
        doc.rect(margin, y, pageWidth - margin * 2, 20, 'F')
        setTextColor(doc, TERRACOTTA)
        doc.setFontSize(18)
        doc.text(stat.value, margin + 10, y + 13)
        setTextColor(doc, CREAM)
        doc.setFontSize(10)
        doc.text(stat.label, margin + 50, y + 13)
      })
      break
    }

    case 'tech': {
      setTextColor(doc, TERRACOTTA)
      doc.setFontSize(28)
      doc.text(slide.content.title as string, margin, startY)
      setTextColor(doc, WARM_GRAY)
      doc.setFontSize(10)
      doc.text(slide.content.subtitle as string, margin, startY + 12)

      const stack = slide.content.stack as Array<{ layer: string; tech: string }>
      const stackWidth = (pageWidth - margin * 2 - 20) / 2
      stack.forEach((item, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = margin + col * (stackWidth + 20)
        const y = startY + 30 + row * 25
        doc.setFillColor(60, 52, 48)
        doc.rect(x, y, stackWidth, 20, 'F')
        setTextColor(doc, TERRACOTTA)
        doc.setFontSize(9)
        doc.text(item.layer.toUpperCase(), x + 5, y + 8)
        setTextColor(doc, CREAM)
        doc.setFontSize(8)
        doc.text(item.tech, x + 5, y + 15)
      })
      break
    }

    case 'market': {
      setTextColor(doc, TERRACOTTA)
      doc.setFontSize(28)
      doc.text(slide.content.title as string, margin, startY)

      const tam = slide.content.tam as { value: string; label: string }
      const sam = slide.content.sam as { value: string; label: string }
      const boxWidth = (pageWidth - margin * 2 - 40) / 3

      // TAM box
      doc.setDrawColor(...TERRACOTTA)
      doc.setLineWidth(0.5)
      doc.rect(margin, startY + 20, boxWidth, 40)
      setTextColor(doc, TERRACOTTA)
      doc.setFontSize(20)
      doc.text(tam.value, margin + boxWidth / 2, startY + 40, { align: 'center' })
      setTextColor(doc, CREAM)
      doc.setFontSize(9)
      doc.text(tam.label, margin + boxWidth / 2, startY + 52, { align: 'center' })

      // SAM box
      doc.setDrawColor(...WARM_GRAY)
      doc.rect(margin + boxWidth + 20, startY + 20, boxWidth, 40)
      setTextColor(doc, CREAM)
      doc.setFontSize(20)
      doc.text(sam.value, margin + boxWidth + 20 + boxWidth / 2, startY + 40, { align: 'center' })
      doc.setFontSize(9)
      doc.text(sam.label, margin + boxWidth + 20 + boxWidth / 2, startY + 52, { align: 'center' })

      // Growth box
      doc.rect(margin + (boxWidth + 20) * 2, startY + 20, boxWidth, 40)
      doc.setFontSize(20)
      doc.text(slide.content.growth as string, margin + (boxWidth + 20) * 2 + boxWidth / 2, startY + 40, { align: 'center' })
      doc.setFontSize(9)
      setTextColor(doc, WARM_GRAY)
      doc.text('Annual Growth Rate', margin + (boxWidth + 20) * 2 + boxWidth / 2, startY + 52, { align: 'center' })

      const trends = slide.content.trends as string[]
      setTextColor(doc, CREAM)
      doc.setFontSize(10)
      trends.forEach((trend, i) => {
        doc.text(`• ${trend}`, margin, startY + 85 + i * 12)
      })
      break
    }

    case 'competitive': {
      setTextColor(doc, TERRACOTTA)
      doc.setFontSize(28)
      doc.text(slide.content.title as string, margin, startY)

      const vs = slide.content.vs as Array<{ competitor: string; ours: string }>
      const vsWidth = (pageWidth - margin * 2 - 10) / 2
      vs.forEach((item, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = margin + col * (vsWidth + 10)
        const y = startY + 20 + row * 30
        doc.setFillColor(60, 52, 48)
        doc.rect(x, y, vsWidth, 25, 'F')
        setTextColor(doc, WARM_GRAY)
        doc.setFontSize(8)
        doc.text(`vs. ${item.competitor}`, x + 5, y + 10)
        setTextColor(doc, CREAM)
        doc.setFontSize(9)
        doc.text(item.ours, x + 5, y + 18)
      })

      const differentiators = slide.content.differentiators as string[]
      doc.setFillColor(...TERRACOTTA.map(c => Math.floor(c * 0.2)))
      doc.rect(margin, startY + 95, pageWidth - margin * 2, 45, 'F')
      setTextColor(doc, CREAM)
      doc.setFontSize(11)
      doc.text('Key Differentiators', margin + 5, startY + 108)
      doc.setFontSize(9)
      differentiators.forEach((diff, i) => {
        const col = i < 3 ? 0 : 1
        const row = i % 3
        doc.text(`• ${diff}`, margin + 5 + col * 80, startY + 120 + row * 10)
      })
      break
    }

    case 'business': {
      setTextColor(doc, TERRACOTTA)
      doc.setFontSize(28)
      doc.text(slide.content.title as string, margin, startY)

      const streams = slide.content.streams as Array<{ name: string; margin: string; desc: string }>
      streams.forEach((stream, i) => {
        const y = startY + 20 + i * 22
        doc.setDrawColor(...WARM_GRAY)
        doc.setLineWidth(0.3)
        doc.rect(margin, y, pageWidth - margin * 2, 20)
        setTextColor(doc, CREAM)
        doc.setFontSize(10)
        doc.text(stream.name, margin + 5, y + 8)
        setTextColor(doc, WARM_GRAY)
        doc.setFontSize(8)
        doc.text(stream.desc, margin + 5, y + 15)
        setTextColor(doc, TERRACOTTA)
        doc.setFontSize(12)
        doc.text(stream.margin, pageWidth - margin - 5, y + 12, { align: 'right' })
      })
      break
    }

    case 'traction': {
      setTextColor(doc, TERRACOTTA)
      doc.setFontSize(28)
      doc.text(slide.content.title as string, margin, startY)

      const metrics = slide.content.metrics as Array<{ value: string; label: string }>
      const metricWidth = (pageWidth - margin * 2 - 30) / 4
      metrics.forEach((metric, i) => {
        const x = margin + i * (metricWidth + 10)
        doc.setFillColor(60, 52, 48)
        doc.rect(x, startY + 15, metricWidth, 35, 'F')
        setTextColor(doc, TERRACOTTA)
        doc.setFontSize(18)
        doc.text(metric.value, x + metricWidth / 2, startY + 32, { align: 'center' })
        setTextColor(doc, WARM_GRAY)
        doc.setFontSize(8)
        doc.text(metric.label, x + metricWidth / 2, startY + 45, { align: 'center' })
      })

      const completed = slide.content.completed as string[]
      setTextColor(doc, CREAM)
      doc.setFontSize(10)
      doc.text('Completed Features:', margin, startY + 70)
      doc.setFontSize(8)
      completed.forEach((item, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        setTextColor(doc, TERRACOTTA)
        doc.text('✓', margin + col * 80, startY + 85 + row * 10)
        setTextColor(doc, CREAM)
        doc.text(item, margin + 10 + col * 80, startY + 85 + row * 10)
      })
      break
    }

    case 'roadmap': {
      setTextColor(doc, TERRACOTTA)
      doc.setFontSize(28)
      doc.text(slide.content.title as string, margin, startY)

      const phases = slide.content.phases as Array<{ phase: string; status: string; items: string[] }>
      phases.forEach((phase, i) => {
        const y = startY + 15 + i * 18
        setTextColor(doc, CREAM)
        doc.setFontSize(10)
        doc.text(phase.phase, margin, y + 5)
        
        // Status color
        if (phase.status === 'Complete') {
          setTextColor(doc, 100, 200, 100)
        } else if (phase.status === 'In Progress') {
          setTextColor(doc, ...TERRACOTTA)
        } else {
          setTextColor(doc, ...WARM_GRAY)
        }
        doc.setFontSize(8)
        doc.text(phase.status, margin, y + 12)
        
        // Items
        setTextColor(doc, CREAM)
        doc.setFontSize(8)
        doc.text(phase.items.join(' | '), margin + 40, y + 8)
      })
      break
    }

    case 'ask': {
      setTextColor(doc, TERRACOTTA)
      doc.setFontSize(28)
      doc.text(slide.content.title as string, margin, startY)

      // Raise amount
      setTextColor(doc, TERRACOTTA)
      doc.setFontSize(36)
      doc.text(slide.content.raise as string, pageWidth / 2, startY + 40, { align: 'center' })
      setTextColor(doc, WARM_GRAY)
      doc.setFontSize(12)
      doc.text('Seed Round', pageWidth / 2, startY + 55, { align: 'center' })

      // Use of funds
      setTextColor(doc, CREAM)
      doc.setFontSize(11)
      doc.text('Use of Funds', margin, startY + 80)

      const use = slide.content.use as Array<{ category: string; percent: number; desc: string }>
      use.forEach((item, i) => {
        const y = startY + 95 + i * 15
        setTextColor(doc, CREAM)
        doc.setFontSize(9)
        doc.text(`${item.category} (${item.percent}%)`, margin, y)
        // Progress bar
        doc.setFillColor(...TERRACOTTA)
        doc.rect(margin, y + 3, (pageWidth - margin * 2) * (item.percent / 100), 5, 'F')
        doc.setFillColor(...WARM_GRAY)
        doc.rect(margin + (pageWidth - margin * 2) * (item.percent / 100), y + 3, (pageWidth - margin * 2) * (1 - item.percent / 100), 5, 'F')
      })

      // Milestones
      const milestones = slide.content.milestones as string[]
      setTextColor(doc, CREAM)
      doc.setFontSize(11)
      doc.text('Key Milestones', margin + (pageWidth - margin * 2) / 2, startY + 80)
      doc.setFontSize(9)
      milestones.forEach((milestone, i) => {
        doc.text(`• ${milestone}`, margin + (pageWidth - margin * 2) / 2, startY + 95 + i * 12)
      })
      break
    }

    case 'closing':
      setTextColor(doc, TERRACOTTA)
      doc.setFontSize(48)
      doc.text(slide.content.headline as string, pageWidth / 2, pageHeight / 2 - 20, { align: 'center' })
      setTextColor(doc, CREAM)
      doc.setFontSize(24)
      doc.text(slide.content.tagline as string, pageWidth / 2, pageHeight / 2 + 20, { align: 'center' })
      setTextColor(doc, WARM_GRAY)
      doc.setFontSize(12)
      doc.text(slide.content.cta as string, pageWidth / 2, pageHeight / 2 + 50, { align: 'center' })
      doc.text(slide.content.contact as string, pageWidth / 2, pageHeight / 2 + 70, { align: 'center' })
      break
  }
}

export async function GET(request: NextRequest) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  // Add custom fonts support
  doc.setFont('helvetica')

  const totalPages = slides.length

  slides.forEach((slide, index) => {
    if (index > 0) {
      doc.addPage()
    }
    addSlide(doc, slide, index + 1, totalPages)
  })

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="CALOR-Investor-Pitch-Deck-2025.pdf"',
      'Content-Length': pdfBuffer.length.toString(),
    },
  })
}
