'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, UploadCloud, Video, Plus, Trash2, Info, X, Lock } from 'lucide-react'
import Link from 'next/link'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

// Helper component for shadcn tooltip
function HelpTooltip({ content }: { content: string }) {
    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center ml-1.5 focus:outline-none">
                        <Info className="w-3.5 h-3.5 text-warm-gray/60 hover:text-terracotta transition-colors" />
                    </button>
                </TooltipTrigger>
                <TooltipContent className="bg-charcoal text-warm-white border-charcoal">
                    <p className="max-w-xs">{content}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default function AdminProductForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [uploadingMedia, setUploadingMedia] = useState(false)
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
    const [showNewCategory, setShowNewCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')

    const [badges, setBadges] = useState<string[]>([])
    const [_showNewBadge, setShowNewBadge] = useState(false)
    const [newBadgeName, setNewBadgeName] = useState('')

    useEffect(() => {
        // Fetch categories
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setCategories(data)
            })
            .catch(err => console.error('Failed to fetch categories:', err))

        // Fetch existing badges
        fetch('/api/products/badges')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setBadges(data)
            })
            .catch(err => console.error('Failed to fetch badges:', err))
    }, [])

    const _handleAddBadge = () => {
        const trimmed = newBadgeName.trim().toLowerCase()
        if (!trimmed) return
        if (!badges.includes(trimmed)) {
            setBadges(prev => [...prev, trimmed].sort())
        }
        setFormData(prev => ({ ...prev, badge: trimmed }))
        setNewBadgeName('')
        setShowNewBadge(false)
    }

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return

        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategoryName.trim() })
            })

            if (!res.ok) throw new Error('Failed to create category')

            const newCat = await res.json()
            setCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)))
            setFormData(prev => ({ ...prev, categoryId: newCat.id }))
            setNewCategoryName('')
            setShowNewCategory(false)
        } catch (error) {
            console.error(error)
            alert('Error creating category')
        }
    }

    const [formData, setFormData] = useState({
        name: '',
        shortDescription: '',
        fullDescription: '',
        priceDollar: '',
        originalPriceDollar: '',
        compareAtPriceDollar: '',
        sku: '',
        status: 'draft',
        categoryId: '',
        isDigital: false,
        isRestricted: false,
        requiresConsentGate: false,
        inventoryCount: '0',
        badge: 'none',
        materialInfo: '',
        cleaningGuide: '',
        usageGuide: '',
        estimatedDeliveryDays: '5',
        metaTitle: '',
        metaDescription: '',
        waterproofRating: '',
        whatsInTheBox: '',
        batteryType: '',
        chargeTimeMinutes: '',
        usageTimeMinutes: '',
        chargingMethod: '',
    })

    const [safetyData, setSafetyData] = useState({
        bodySafe: false,
        phthalateFree: false,
        latexFree: false,
        waterproof: false,
        certifications: [] as string[],
        warnings: [] as string[],
        ageRestriction: '18+',
        contentWarning: '',
    })
    const [newCertification, setNewCertification] = useState('')
    const [newWarning, setNewWarning] = useState('')

    const [tags, setTags] = useState<string[]>([])
    const [newTag, setNewTag] = useState('')

    const [sensoryProfile, setSensoryProfile] = useState({
        textureType: '',
        textureIntensity: 5,
        surfaceFeel: '',
        firmness: '',
        flexibility: '',
        vibrationLevels: 0,
        vibrationPatterns: 0,
        motorType: '',
        maxIntensity: 5,
        noiseLevel: '',
        temperatureResponsive: false,
        warmingSupported: false,
        coolingSupported: false,
        weight: 0,
        hasElectronics: true,
        weightFeel: '',
        gripFeel: '',
        warmingSensation: false,
        coolingSensation: false,
    })

    const [features, setFeatures] = useState<{ name: string, description: string, category: string, iconType: string, isKeyFeature: boolean }[]>([])

    const [sizeVisualization, setSizeVisualization] = useState({
        length: '',
        width: '',
        height: '',
        diameter: '',
        insertableLength: '',
        circumference: '',
    })

    const [sizeRecommendation, setSizeRecommendation] = useState({
        fitType: '',
        notes: '',
    })

    const [model3D, setModel3D] = useState({
        modelUrl: '',
        modelType: 'glb',
        thumbnailUrl: '',
        arSupported: true,
        arScale: 1.0,
    })

    const [regionalPrices, setRegionalPrices] = useState<{ countryCode: string, currency: string, priceCents: string, compareAtPriceCents: string }[]>([])

    const [images, setImages] = useState<{ url: string, altText: string, sortOrder: number }[]>([])
    const [videos, setVideos] = useState<{ url: string, thumbnailUrl?: string, title?: string, description?: string, duration?: number, source: string, videoType: string, isFeatured: boolean, sortOrder: number }[]>([])
    const [newImageUrl, setNewImageUrl] = useState('')
    const [newVideoUrl, setNewVideoUrl] = useState('')

    const [variants, setVariants] = useState<{ id?: string, name: string, priceDollar: string, sku: string, stock: string }[]>([])

    const addVariant = () => {
        setVariants([...variants, { name: '', priceDollar: formData.priceDollar || '', sku: '', stock: '0' }])
    }

    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index))
    }

    const handleVariantChange = (index: number, field: string, value: string) => {
        const updated = [...variants]
        updated[index] = { ...updated[index], [field]: value }
        setVariants(updated)
    }

    // Tag management
    const addTag = () => {
        const trimmed = newTag.trim().toLowerCase()
        if (trimmed && !tags.includes(trimmed)) {
            setTags(prev => [...prev, trimmed])
            setNewTag('')
        }
    }

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove))
    }

    // Feature management
    const addFeature = () => {
        setFeatures([...features, { name: '', description: '', category: 'design', iconType: 'info', isKeyFeature: false }])
    }

    const removeFeature = (index: number) => {
        setFeatures(features.filter((_, i) => i !== index))
    }

    const handleFeatureChange = (index: number, field: string, value: any) => {
        const updated = [...features]
        updated[index] = { ...updated[index], [field]: value }
        setFeatures(updated)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked
            setFormData({ ...formData, [name]: checked })
        } else {
            setFormData({ ...formData, [name]: value })
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingMedia(true)
        const form = new FormData()
        form.append('file', file)

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: form
            })

            if (!res.ok) {
                console.error(await res.text())
                throw new Error('Upload failed')
            }

            const data = await res.json()
            if (data.url) {
                if (type === 'image') {
                    setImages(prev => [...prev, { url: data.url, altText: formData.name || '', sortOrder: prev.length }])
                } else {
                    setVideos(prev => [...prev, {
                        url: data.url,
                        title: formData.name + ' Demo',
                        source: 'upload',
                        videoType: 'demo',
                        isFeatured: prev.length === 0,
                        sortOrder: prev.length
                    }])
                }
            }
        } catch (error) {
            console.error('Error uploading file:', error)
            alert('Error uploading file. Please ensure Cloudflare R2 credentials are set.')
        } finally {
            setUploadingMedia(false)
            e.target.value = ''
        }
    }

    const addImageUrl = () => {
        if (newImageUrl.trim()) {
            setImages(prev => [...prev, { url: newImageUrl.trim(), altText: formData.name || '', sortOrder: prev.length }])
            setNewImageUrl('')
        }
    }

    const addVideoUrl = () => {
        if (newVideoUrl.trim()) {
            setVideos(prev => [...prev, {
                url: newVideoUrl.trim(),
                title: formData.name + ' Demo',
                source: 'external',
                videoType: 'demo',
                isFeatured: prev.length === 0,
                sortOrder: prev.length
            }])
            setNewVideoUrl('')
        }
    }

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index))
    }

    const handleImageChange = (index: number, field: string, value: any) => {
        const updated = [...images]
        updated[index] = { ...updated[index], [field]: value }
        setImages(updated)
    }

    const removeVideo = (index: number) => {
        setVideos(videos.filter((_, i) => i !== index))
    }

    const handleVideoChange = (index: number, field: string, value: any) => {
        const updated = [...videos]
        updated[index] = { ...updated[index], [field]: value }
        setVideos(updated)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Build structured safetyInfo JSON
            const safetyInfoJson = JSON.stringify({
                bodySafe: safetyData.bodySafe,
                phthalateFree: safetyData.phthalateFree,
                latexFree: safetyData.latexFree,
                waterproof: safetyData.waterproof,
                certifications: safetyData.certifications,
                warnings: safetyData.warnings,
                ageRestriction: safetyData.ageRestriction || null,
                contentWarning: safetyData.contentWarning || null,
            })

            const payload = {
                ...formData,
                safetyInfo: safetyInfoJson,
                price: formData.priceDollar ? Math.round(parseFloat(formData.priceDollar) * 100) : 0,
                originalPrice: formData.originalPriceDollar ? Math.round(parseFloat(formData.originalPriceDollar) * 100) : null,
                compareAtPrice: formData.compareAtPriceDollar ? Math.round(parseFloat(formData.compareAtPriceDollar) * 100) : null,
                inventoryCount: formData.inventoryCount ? parseInt(formData.inventoryCount, 10) : 0,
                estimatedDeliveryDays: formData.estimatedDeliveryDays ? parseInt(formData.estimatedDeliveryDays, 10) : 5,
                images: images,
                videos: videos,
                tags: tags,
                sensoryProfile: sensoryProfile,
                features: features,
                sizeVisualization: sizeVisualization,
                sizeRecommendation: sizeRecommendation,
                model3D: model3D.modelUrl ? model3D : null,
                regionalPrices: regionalPrices.map(rp => ({
                    countryCode: rp.countryCode,
                    currency: rp.currency,
                    priceCents: Math.round(parseFloat(rp.priceCents) * 100),
                    compareAtPriceCents: rp.compareAtPriceCents ? Math.round(parseFloat(rp.compareAtPriceCents) * 100) : null,
                })),
                variants: variants.map(v => ({
                    name: v.name,
                    price: v.priceDollar ? Math.round(parseFloat(v.priceDollar) * 100) : 0,
                    sku: v.sku,
                    stock: parseInt(v.stock, 10) || 0
                }))
            }

            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to create product')
            }

            router.push('/admin/products')
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Error creating product. Please try again.')
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center bg-warm-white p-6 border border-sand sticky top-0 z-20 shadow-sm">
                <div>
                    <h1 className="font-display text-2xl text-charcoal">{formData.name || 'Untitled Product'}</h1>
                    <p className="text-xs font-body text-warm-gray uppercase tracking-widest mt-1">
                        {formData.isDigital ? 'Digital Asset Editor' : 'Physical Product Editor'}
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link href="/admin/products" className="px-4 py-2 border border-sand font-body text-sm text-charcoal hover:bg-cream transition-colors">
                        Cancel
                    </Link>
                    <button type="submit" disabled={loading || uploadingMedia} className="px-6 py-2 bg-charcoal text-cream font-body uppercase text-sm tracking-wider flex items-center gap-2 hover:bg-charcoal/90 disabled:opacity-50">
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Product'}
                    </button>
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="w-full justify-start bg-sand/30 p-1 mb-8 rounded-none border-b border-sand overflow-x-auto">
                    <TabsTrigger value="general" className="rounded-none data-[state=active]:bg-warm-white data-[state=active]:border-sand border border-transparent px-8 py-3 font-body text-xs uppercase tracking-widest">General</TabsTrigger>
                    <TabsTrigger value="media" className="rounded-none data-[state=active]:bg-warm-white data-[state=active]:border-sand border border-transparent px-8 py-3 font-body text-xs uppercase tracking-widest">Media</TabsTrigger>
                    <TabsTrigger value="discovery" className="rounded-none data-[state=active]:bg-warm-white data-[state=active]:border-sand border border-transparent px-8 py-3 font-body text-xs uppercase tracking-widest">Discovery</TabsTrigger>
                    <TabsTrigger value="sensory" className="rounded-none data-[state=active]:bg-warm-white data-[state=active]:border-sand border border-transparent px-8 py-3 font-body text-xs uppercase tracking-widest flex items-center gap-2">
                        Sensory {formData.isDigital && <Lock className="w-3 h-3 text-warm-gray" />}
                    </TabsTrigger>
                    <TabsTrigger value="technical" className="rounded-none data-[state=active]:bg-warm-white data-[state=active]:border-sand border border-transparent px-8 py-3 font-body text-xs uppercase tracking-widest flex items-center gap-2">
                        Technical {formData.isDigital && <Lock className="w-3 h-3 text-warm-gray" />}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-warm-white p-6 border border-sand">
                        <h2 className="font-display text-charcoal text-xl mb-6 border-b border-sand pb-2">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-body text-charcoal mb-2 flex items-center">Product Name * <HelpTooltip content="The primary name displayed on the shop and product page." /></label>
                                <Input name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Silk Touch Vibrator" className="w-full bg-cream border-sand font-body text-charcoal rounded-none px-4 py-6" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-body text-charcoal mb-2 flex items-center">Short Description (Excerpt) * <HelpTooltip content="A brief 1-2 sentence summary shown on product cards and in search results." /></label>
                                <Textarea name="shortDescription" required value={formData.shortDescription} onChange={handleChange} placeholder="Brief summary for product cards..." rows={2} className="w-full bg-cream border-sand font-body text-charcoal rounded-none px-4 py-3 resize-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-body text-charcoal mb-2 flex items-center">Full Description * <HelpTooltip content="The comprehensive description shown on the product detail page. Supports multiple paragraphs." /></label>
                                <Textarea name="fullDescription" required value={formData.fullDescription} onChange={handleChange} placeholder="Comprehensive product details for the detail page..." rows={6} className="w-full bg-cream border-sand font-body text-charcoal rounded-none px-4 py-3 resize-y" />
                            </div>
                            <div>
                                <label className="block text-sm font-body text-charcoal mb-2 flex items-center">Status <HelpTooltip content="Draft products are hidden. Active products are published to the store." /></label>
                                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                    <SelectTrigger className="w-full bg-cream border-sand rounded-none px-4 py-6">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-cream border-sand">
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-body text-charcoal mb-2 flex items-center">Category * <HelpTooltip content="Categorizes the product for shop routing and discovery." /></label>
                                <div className="flex gap-2">
                                    <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                                        <SelectTrigger className="w-full bg-cream border-sand rounded-none px-4 py-6">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-cream border-sand">
                                            <SelectItem value="none">None</SelectItem>
                                            {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Dialog open={showNewCategory} onOpenChange={setShowNewCategory}>
                                        <DialogTrigger asChild>
                                            <Button type="button" variant="outline" size="icon" className="h-12 w-12 rounded-none border-sand hover:border-terracotta"><Plus className="w-4 h-4" /></Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-cream border-sand">
                                            <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
                                            <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category Name" className="bg-warm-white border-sand rounded-none" />
                                            <DialogFooter><Button type="button" onClick={handleAddCategory} className="bg-charcoal text-white rounded-none">Create</Button></DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-body text-charcoal mb-2 flex items-center">Product Badge <HelpTooltip content="Optional badge displayed on top of the product card." /></label>
                                <Select value={formData.badge} onValueChange={(v) => setFormData({ ...formData, badge: v })}>
                                    <SelectTrigger className="w-full bg-cream border-sand rounded-none px-4 py-6">
                                        <SelectValue placeholder="No Badge" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-cream border-sand">
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="bestseller">Bestseller</SelectItem>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="sale">Sale</SelectItem>
                                        <SelectItem value="editors-pick">Editors Pick</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-6 py-4 md:col-span-2 border-t border-sand/30 mt-4">
                                <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-warm-gray cursor-pointer">
                                    <Switch name="isDigital" checked={formData.isDigital} onCheckedChange={(v) => setFormData({ ...formData, isDigital: v })} />
                                    Is Digital Product
                                    <HelpTooltip content="Hides technical and shipping specs for non-physical goods." />
                                </label>
                                <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-warm-gray cursor-pointer">
                                    <Switch name="isRestricted" checked={formData.isRestricted} onCheckedChange={(v) => setFormData({ ...formData, isRestricted: v })} />
                                    Age Restricted (18+)
                                    <HelpTooltip content="Flags the product as mature content requiring 18+ gateway via the app." />
                                </label>
                                <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-warm-gray cursor-pointer">
                                    <Switch name="requiresConsentGate" checked={formData.requiresConsentGate} onCheckedChange={(v) => setFormData({ ...formData, requiresConsentGate: v })} />
                                    Requires Consent Gate
                                    <HelpTooltip content="Forces users to explicitly view and accept a consent modal before accessing the product detail page." />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-warm-white p-6 border border-sand">
                        <h2 className="font-display text-charcoal text-xl mb-6 border-b border-sand pb-2">Pricing & Variants</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-body text-charcoal mb-2 flex items-center">
                                    Base Price ($) * {variants.length > 0 && <span className="text-[9px] text-terracotta ml-1.5 uppercase font-semibold">(Fallback)</span>}
                                    <HelpTooltip content="The current selling price. Required." />
                                </label>
                                <Input type="number" name="priceDollar" value={formData.priceDollar} onChange={handleChange} className="bg-cream border-sand rounded-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-body text-charcoal mb-2 flex items-center">
                                    Original Price {variants.length > 0 && <span className="text-[9px] text-terracotta ml-1.5 uppercase font-semibold">(Fallback)</span>}
                                    <HelpTooltip content="The pre-sale MSRP. If higher than Base Price, the item will show on sale." />
                                </label>
                                <Input type="number" name="originalPriceDollar" value={formData.originalPriceDollar} onChange={handleChange} className="bg-cream border-sand rounded-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-body text-charcoal mb-2 flex items-center">
                                    Global SKU {variants.length > 0 && <span className="text-[9px] text-terracotta ml-1.5 uppercase font-semibold">(Fallback)</span>}
                                    <HelpTooltip content="A unique stock keeping unit string." />
                                </label>
                                <Input name="sku" value={formData.sku} onChange={handleChange} className="bg-cream border-sand rounded-none" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-body text-warm-gray uppercase tracking-widest">Variant List</h3>
                                <Button type="button" variant="outline" size="sm" onClick={addVariant} className="rounded-none border-sand text-[10px]"><Plus className="w-3 h-3 mr-1" /> Add Variant</Button>
                            </div>
                            {variants.map((variant, index) => (
                                <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-cream border border-sand items-end">
                                    <div className="col-span-4"><Input value={variant.name} onChange={(e) => handleVariantChange(index, 'name', e.target.value)} placeholder="Name" className="bg-warm-white border-sand text-xs rounded-none" /></div>
                                    <div className="col-span-3"><Input value={variant.priceDollar} onChange={(e) => handleVariantChange(index, 'priceDollar', e.target.value)} placeholder="Price" className="bg-warm-white border-sand text-xs rounded-none" /></div>
                                    <div className="col-span-3"><Input value={variant.sku} onChange={(e) => handleVariantChange(index, 'sku', e.target.value)} placeholder="SKU" className="bg-warm-white border-sand text-xs rounded-none" /></div>
                                    <div className="col-span-1"><Input value={variant.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} placeholder="Stock" className="bg-warm-white border-sand text-xs rounded-none" /></div>
                                    <div className="col-span-1 flex justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(index)} className="text-warm-gray hover:text-terracotta"><Trash2 className="w-4 h-4" /></Button></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {!formData.isDigital && (
                        <div className="bg-warm-white p-6 border border-sand">
                            <h2 className="font-display text-charcoal text-xl mb-6 border-b border-sand pb-2">Logistics</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-body text-charcoal mb-2 flex items-center">Estimated Delivery (Days) <HelpTooltip content="Standard shipping turnaround time in days." /></label>
                                    <Input type="number" name="estimatedDeliveryDays" value={formData.estimatedDeliveryDays} onChange={handleChange} className="bg-cream border-sand rounded-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-body text-charcoal mb-2 flex items-center">Base Inventory Count <HelpTooltip content="Amount of physical stock available for the base product." /></label>
                                    <Input type="number" name="inventoryCount" value={formData.inventoryCount} onChange={handleChange} className="bg-cream border-sand rounded-none" />
                                </div>
                            </div>
                        </div>
                    )}

                    {!formData.isDigital && (
                        <div className="bg-warm-white p-6 border border-sand">
                            <h2 className="font-display text-charcoal text-xl mb-6 border-b border-sand pb-2">Care & Practical Info</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-body text-charcoal mb-2 flex items-center">Material / Composition <HelpTooltip content="What the product is made of (e.g. Medical Grade Silicone)." /></label>
                                    <Textarea name="materialInfo" value={formData.materialInfo} onChange={handleChange} placeholder="e.g. Medical grade silicone, ABS plastic" className="bg-cream border-sand rounded-none" />
                                </div>

                                {/* Safety & Compliance */}
                                <div className="border border-sand p-4 bg-cream/50">
                                    <h3 className="font-display text-charcoal text-lg mb-4">Safety & Compliance</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <label className="flex items-center gap-2 text-sm font-body text-charcoal cursor-pointer">
                                            <input type="checkbox" checked={safetyData.bodySafe} onChange={e => setSafetyData(prev => ({ ...prev, bodySafe: e.target.checked }))} className="accent-terracotta w-4 h-4" />
                                            Body-Safe
                                        </label>
                                        <label className="flex items-center gap-2 text-sm font-body text-charcoal cursor-pointer">
                                            <input type="checkbox" checked={safetyData.phthalateFree} onChange={e => setSafetyData(prev => ({ ...prev, phthalateFree: e.target.checked }))} className="accent-terracotta w-4 h-4" />
                                            Phthalate-Free
                                        </label>
                                        <label className="flex items-center gap-2 text-sm font-body text-charcoal cursor-pointer">
                                            <input type="checkbox" checked={safetyData.latexFree} onChange={e => setSafetyData(prev => ({ ...prev, latexFree: e.target.checked }))} className="accent-terracotta w-4 h-4" />
                                            Latex-Free
                                        </label>
                                        <label className="flex items-center gap-2 text-sm font-body text-charcoal cursor-pointer">
                                            <input type="checkbox" checked={safetyData.waterproof} onChange={e => setSafetyData(prev => ({ ...prev, waterproof: e.target.checked }))} className="accent-terracotta w-4 h-4" />
                                            Waterproof
                                        </label>
                                    </div>

                                    {/* Certifications */}
                                    <div className="mb-4">
                                        <label className="block text-xs font-body text-warm-gray uppercase tracking-widest mb-2">Certifications</label>
                                        <div className="flex gap-2 mb-2">
                                            <Input value={newCertification} onChange={e => setNewCertification(e.target.value)} placeholder="e.g. CE Certified" className="bg-white border-sand rounded-none text-sm flex-1" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newCertification.trim()) { setSafetyData(prev => ({ ...prev, certifications: [...prev.certifications, newCertification.trim()] })); setNewCertification('') } } }} />
                                            <button type="button" onClick={() => { if (newCertification.trim()) { setSafetyData(prev => ({ ...prev, certifications: [...prev.certifications, newCertification.trim()] })); setNewCertification('') } }} className="px-3 py-1 bg-charcoal text-cream text-xs font-body uppercase tracking-wider"><Plus className="w-3 h-3" /></button>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {safetyData.certifications.map((cert, i) => (
                                                <Badge key={i} variant="outline" className="bg-green-50 border-green-200 text-green-700 text-xs gap-1">
                                                    {cert}
                                                    <button type="button" onClick={() => setSafetyData(prev => ({ ...prev, certifications: prev.certifications.filter((_, idx) => idx !== i) }))}><X className="w-3 h-3" /></button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Warnings */}
                                    <div>
                                        <label className="block text-xs font-body text-warm-gray uppercase tracking-widest mb-2">Warnings</label>
                                        <div className="flex gap-2 mb-2">
                                            <Input value={newWarning} onChange={e => setNewWarning(e.target.value)} placeholder="e.g. Not suitable for those with latex allergies" className="bg-white border-sand rounded-none text-sm flex-1" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newWarning.trim()) { setSafetyData(prev => ({ ...prev, warnings: [...prev.warnings, newWarning.trim()] })); setNewWarning('') } } }} />
                                            <button type="button" onClick={() => { if (newWarning.trim()) { setSafetyData(prev => ({ ...prev, warnings: [...prev.warnings, newWarning.trim()] })); setNewWarning('') } }} className="px-3 py-1 bg-charcoal text-cream text-xs font-body uppercase tracking-wider"><Plus className="w-3 h-3" /></button>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {safetyData.warnings.map((w, i) => (
                                                <Badge key={i} variant="outline" className="bg-amber-50 border-amber-200 text-amber-700 text-xs gap-1">
                                                    {w}
                                                    <button type="button" onClick={() => setSafetyData(prev => ({ ...prev, warnings: prev.warnings.filter((_, idx) => idx !== i) }))}><X className="w-3 h-3" /></button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Waterproof Rating */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-body text-charcoal mb-2 flex items-center">Waterproof Rating <HelpTooltip content="IPX rating for water resistance (e.g. IPX7 = submersible up to 1m)." /></label>
                                        <select name="waterproofRating" value={formData.waterproofRating} onChange={handleChange as any} className="w-full bg-cream border border-sand rounded-none px-4 py-2 font-body text-sm text-charcoal">
                                            <option value="">None</option>
                                            <option value="IPX4">IPX4 — Splash-proof</option>
                                            <option value="IPX5">IPX5 — Water jet resistant</option>
                                            <option value="IPX6">IPX6 — Powerful water jet resistant</option>
                                            <option value="IPX7">IPX7 — Submersible (up to 1m)</option>
                                            <option value="IPX8">IPX8 — Submersible (beyond 1m)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-body text-charcoal mb-2 flex items-center">What&apos;s in the Box <HelpTooltip content="List each item included in the packaging (one per line)." /></label>
                                        <Textarea name="whatsInTheBox" value={formData.whatsInTheBox} onChange={handleChange} placeholder={"1x Silk Touch Vibrator\n1x USB-C Charging Cable\n1x Storage Pouch\n1x Quick Start Guide"} className="bg-cream border-sand rounded-none min-h-[100px]" />
                                    </div>
                                </div>

                                {/* Battery & Charging (for electronics) */}
                                {sensoryProfile.hasElectronics && (
                                    <div className="border border-sand p-4 bg-cream/50">
                                        <h3 className="font-display text-charcoal text-lg mb-4">Battery & Charging</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-xs font-body text-warm-gray uppercase tracking-widest mb-1">Battery Type</label>
                                                <select name="batteryType" value={formData.batteryType} onChange={handleChange as any} className="w-full bg-white border border-sand rounded-none px-3 py-2 font-body text-sm text-charcoal">
                                                    <option value="">Select</option>
                                                    <option value="rechargeable_lithium">Rechargeable Li-Ion</option>
                                                    <option value="aaa">AAA Batteries</option>
                                                    <option value="aa">AA Batteries</option>
                                                    <option value="cr2032">CR2032 Button Cell</option>
                                                    <option value="usb_powered">USB Powered (no battery)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-body text-warm-gray uppercase tracking-widest mb-1">Charge Time</label>
                                                <div className="flex items-center gap-1">
                                                    <Input type="number" name="chargeTimeMinutes" value={formData.chargeTimeMinutes} onChange={handleChange} placeholder="90" className="bg-white border-sand rounded-none text-sm" />
                                                    <span className="text-xs text-warm-gray font-body">min</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-body text-warm-gray uppercase tracking-widest mb-1">Usage Time</label>
                                                <div className="flex items-center gap-1">
                                                    <Input type="number" name="usageTimeMinutes" value={formData.usageTimeMinutes} onChange={handleChange} placeholder="60" className="bg-white border-sand rounded-none text-sm" />
                                                    <span className="text-xs text-warm-gray font-body">min</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-body text-warm-gray uppercase tracking-widest mb-1">Charging Method</label>
                                                <select name="chargingMethod" value={formData.chargingMethod} onChange={handleChange as any} className="w-full bg-white border border-sand rounded-none px-3 py-2 font-body text-sm text-charcoal">
                                                    <option value="">Select</option>
                                                    <option value="usb-c">USB-C</option>
                                                    <option value="micro-usb">Micro-USB</option>
                                                    <option value="magnetic">Magnetic</option>
                                                    <option value="wireless">Wireless / Qi</option>
                                                    <option value="dock">Charging Dock</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-body text-charcoal mb-2 flex items-center">Cleaning Guide <HelpTooltip content="Instructions for cleaning and maintenance before or after use." /></label>
                                        <Textarea name="cleaningGuide" value={formData.cleaningGuide} onChange={handleChange} className="bg-cream border-sand rounded-none min-h-[100px]" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-body text-charcoal mb-2 flex items-center">Usage Instructions <HelpTooltip content="Step-by-step instructions on operating the product." /></label>
                                        <Textarea name="usageGuide" value={formData.usageGuide} onChange={handleChange} className="bg-cream border-sand rounded-none min-h-[100px]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="media" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-warm-white p-6 border border-sand">
                        <div className="flex justify-between items-center mb-6 border-b border-sand pb-2">
                            <h2 className="font-display text-charcoal text-xl">Product Images</h2>
                            <label className="cursor-pointer px-4 py-2 bg-charcoal text-cream font-body uppercase text-[10px] tracking-widest hover:bg-charcoal/90 transition-colors flex items-center gap-2">
                                <UploadCloud className="w-3 h-3" />
                                {uploadingMedia ? 'Uploading...' : 'Upload Image'}
                                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} className="hidden" disabled={uploadingMedia} />
                            </label>
                        </div>

                        <div className="flex gap-2 mb-6">
                            <Input
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                placeholder="Or enter image URL..."
                                className="bg-cream border-sand rounded-none font-body"
                            />
                            <Button type="button" onClick={addImageUrl} className="bg-charcoal text-white rounded-none">Add Link</Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {images.map((img, idx) => (
                                <div key={idx} className="p-4 bg-cream border border-sand space-y-3 relative group">
                                    <div className="aspect-video bg-warm-white overflow-hidden border border-sand/50">
                                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase text-warm-gray tracking-wider">Alt Text</label>
                                        <Input
                                            value={img.altText}
                                            onChange={(e) => handleImageChange(idx, 'altText', e.target.value)}
                                            placeholder="Descriptive alt text for SEO"
                                            className="bg-warm-white border-sand text-xs rounded-none"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-charcoal/10 hover:bg-terracotta hover:text-white"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    {idx === 0 && <Badge className="absolute top-2 left-2 bg-terracotta text-white rounded-none border-none text-[8px] uppercase tracking-tighter">Main</Badge>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-warm-white p-6 border border-sand">
                        <div className="flex justify-between items-center mb-6 border-b border-sand pb-2">
                            <h2 className="font-display text-charcoal text-xl">Product Videos</h2>
                            <label className="cursor-pointer px-4 py-2 bg-charcoal text-cream font-body uppercase text-[10px] tracking-widest hover:bg-charcoal/90 transition-colors flex items-center gap-2">
                                <Video className="w-3 h-3" />
                                {uploadingMedia ? 'Uploading...' : 'Upload Video'}
                                <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} className="hidden" disabled={uploadingMedia} />
                            </label>
                        </div>

                        <div className="flex gap-2 mb-6">
                            <Input
                                value={newVideoUrl}
                                onChange={(e) => setNewVideoUrl(e.target.value)}
                                placeholder="Or enter video URL (Vimeo/YouTube/Raw)..."
                                className="bg-cream border-sand rounded-none font-body"
                            />
                            <Button type="button" onClick={addVideoUrl} className="bg-charcoal text-white rounded-none">Add Link</Button>
                        </div>

                        <div className="space-y-4">
                            {videos.map((vid, idx) => (
                                <div key={idx} className="p-4 bg-cream border border-sand grid grid-cols-1 md:grid-cols-12 gap-4 relative group">
                                    <div className="md:col-span-3 aspect-video bg-charcoal flex items-center justify-center">
                                        <Video className="text-white/20 w-8 h-8" />
                                    </div>
                                    <div className="md:col-span-9 grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <Input
                                                value={vid.title || ''}
                                                onChange={(e) => handleVideoChange(idx, 'title', e.target.value)}
                                                placeholder="Video Title"
                                                className="bg-warm-white border-sand text-xs rounded-none"
                                            />
                                        </div>
                                        <div>
                                            <Select value={vid.videoType} onValueChange={(v) => handleVideoChange(idx, 'videoType', v)}>
                                                <SelectTrigger className="bg-warm-white border-sand text-xs rounded-none h-9"><SelectValue /></SelectTrigger>
                                                <SelectContent className="bg-cream border-sand">
                                                    <SelectItem value="demo">Product Demo</SelectItem>
                                                    <SelectItem value="tutorial">Tutorial</SelectItem>
                                                    <SelectItem value="review">Review</SelectItem>
                                                    <SelectItem value="unboxing">Unboxing</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={vid.isFeatured}
                                                onCheckedChange={(ch) => handleVideoChange(idx, 'isFeatured', ch)}
                                            />
                                            <span className="text-[10px] uppercase text-warm-gray tracking-wider">Featured</span>
                                        </div>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeVideo(idx)} className="absolute -top-2 -right-2 bg-white border border-sand text-warm-gray hover:text-terracotta rounded-full"><Trash2 className="w-3 h-3" /></Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="discovery" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-warm-white p-6 border border-sand">
                        <h2 className="font-display text-charcoal text-xl mb-6 border-b border-sand pb-2">Tags & Metadata</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-body text-charcoal mb-2">Search Tags</label>
                                <div className="flex gap-2 mb-3">
                                    <Input
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        placeholder="Add a tag..."
                                        className="bg-cream border-sand rounded-none font-body"
                                    />
                                    <Button type="button" onClick={addTag} className="bg-charcoal text-white rounded-none">Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <Badge key={tag} className="bg-sand text-charcoal hover:bg-terracotta hover:text-white transition-colors py-1 pl-3 pr-1 rounded-none font-body text-[10px] uppercase tracking-wider flex items-center gap-1">
                                            {tag}
                                            <button type="button" onClick={() => removeTag(tag)} className="hover:bg-black/10 rounded-full p-0.5"><Plus className="w-3 h-3 rotate-45" /></button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-sand/30">
                                <div>
                                    <label className="block text-sm font-body text-charcoal mb-2">Meta Title (SEO)</label>
                                    <Input name="metaTitle" value={formData.metaTitle || ''} onChange={handleChange} className="bg-cream border-sand rounded-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-body text-charcoal mb-2">Meta Description (SEO)</label>
                                    <Textarea name="metaDescription" rows={3} value={formData.metaDescription || ''} onChange={handleChange} className="bg-cream border-sand rounded-none resize-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-warm-white p-6 border border-sand">
                        <div className="flex justify-between items-center mb-6 border-b border-sand pb-2">
                            <h2 className="font-display text-charcoal text-xl">Key Features</h2>
                            <Button type="button" variant="outline" size="sm" onClick={addFeature} className="rounded-none border-sand text-[10px] uppercase tracking-widest"><Plus className="w-3 h-3 mr-1" /> Add Feature Builder</Button>
                        </div>
                        <div className="space-y-4">
                            {features.map((feat, idx) => (
                                <div key={idx} className="p-4 bg-cream border border-sand space-y-4 relative group">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            value={feat.name}
                                            onChange={(e) => handleFeatureChange(idx, 'name', e.target.value)}
                                            placeholder="Feature Name (e.g. Ergonomic Grip)"
                                            className="bg-warm-white border-sand text-xs rounded-none"
                                        />
                                        <Select value={feat.category} onValueChange={(v) => handleFeatureChange(idx, 'category', v)}>
                                            <SelectTrigger className="bg-warm-white border-sand text-xs rounded-none h-11"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-cream border-sand">
                                                <SelectItem value="power">Power & Battery</SelectItem>
                                                <SelectItem value="controls">Controls & Interface</SelectItem>
                                                <SelectItem value="material">Material Quality</SelectItem>
                                                <SelectItem value="design">Design & Ergonomics</SelectItem>
                                                <SelectItem value="connectivity">Connectivity</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Textarea
                                            value={feat.description}
                                            onChange={(e) => handleFeatureChange(idx, 'description', e.target.value)}
                                            placeholder="Detailed feature description..."
                                            rows={2}
                                            className="bg-warm-white border-sand text-xs rounded-none md:col-span-2 resize-none"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-warm-gray cursor-pointer">
                                            <Switch checked={feat.isKeyFeature} onCheckedChange={(v) => handleFeatureChange(idx, 'isKeyFeature', v)} /> Focus Feature
                                        </label>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(idx)} className="absolute -top-2 -right-2 bg-white border border-sand text-warm-gray hover:text-terracotta rounded-full"><Trash2 className="w-3 h-3" /></Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="sensory" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {formData.isDigital ? (
                        <div className="bg-warm-white p-20 border border-sand border-dashed text-center">
                            <Info className="w-8 h-8 text-warm-gray mx-auto mb-4" />
                            <h3 className="font-display text-xl text-charcoal">Not Applicable</h3>
                            <p className="text-xs font-body text-warm-gray uppercase tracking-widest mt-2">Sensory profiles are reserved for physical products.</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-warm-white p-6 border border-sand">
                                <div className="flex justify-between items-center mb-6 border-b border-sand pb-2">
                                    <h2 className="font-display text-charcoal text-xl">Feel & Texture</h2>
                                    <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-warm-gray cursor-pointer">
                                        <Switch checked={sensoryProfile.hasElectronics} onCheckedChange={(v) => setSensoryProfile({ ...sensoryProfile, hasElectronics: v })} /> Electronic Product
                                    </label>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-warm-gray mb-2">Texture Type</label>
                                        <Select value={sensoryProfile.textureType} onValueChange={(v) => setSensoryProfile({ ...sensoryProfile, textureType: v })}>
                                            <SelectTrigger className="bg-cream border-sand rounded-none"><SelectValue placeholder="Select Type" /></SelectTrigger>
                                            <SelectContent className="bg-cream border-sand">
                                                <SelectItem value="smooth">Smooth</SelectItem>
                                                <SelectItem value="textured">Textured</SelectItem>
                                                <SelectItem value="ribbed">Ribbed</SelectItem>
                                                <SelectItem value="realistic">Realistic</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs uppercase tracking-widest text-warm-gray mb-2">Texture Intensity (1-10): {sensoryProfile.textureIntensity}</label>
                                        <input
                                            type="range" min="1" max="10"
                                            value={sensoryProfile.textureIntensity}
                                            onChange={(e) => setSensoryProfile({ ...sensoryProfile, textureIntensity: parseInt(e.target.value) })}
                                            className="w-full accent-charcoal"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-warm-gray mb-2">Firmness</label>
                                        <Select value={sensoryProfile.firmness} onValueChange={(v) => setSensoryProfile({ ...sensoryProfile, firmness: v })}>
                                            <SelectTrigger className="bg-cream border-sand rounded-none"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-cream border-sand">
                                                <SelectItem value="soft">Soft</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="firm">Firm</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-warm-gray mb-2">Flexibility</label>
                                        <Select value={sensoryProfile.flexibility} onValueChange={(v) => setSensoryProfile({ ...sensoryProfile, flexibility: v })}>
                                            <SelectTrigger className="bg-cream border-sand rounded-none"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-cream border-sand">
                                                <SelectItem value="rigid">Rigid</SelectItem>
                                                <SelectItem value="semi-flexible">Semi-Flexible</SelectItem>
                                                <SelectItem value="flexible">Flexible</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {sensoryProfile.hasElectronics && (
                                <div className="bg-warm-white p-6 border border-sand">
                                    <h2 className="font-display text-charcoal text-xl mb-6 border-b border-sand pb-2">Vibration & Power</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-warm-gray mb-2">Motor Type</label>
                                            <Input value={sensoryProfile.motorType} onChange={(e) => setSensoryProfile({ ...sensoryProfile, motorType: e.target.value })} placeholder="e.g. Rumbly" className="bg-cream border-sand rounded-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-warm-gray mb-2">Noise Level</label>
                                            <Select value={sensoryProfile.noiseLevel} onValueChange={(v) => setSensoryProfile({ ...sensoryProfile, noiseLevel: v })}>
                                                <SelectTrigger className="bg-cream border-sand rounded-none"><SelectValue /></SelectTrigger>
                                                <SelectContent className="bg-cream border-sand">
                                                    <SelectItem value="silent">Silent</SelectItem>
                                                    <SelectItem value="quiet">Quiet</SelectItem>
                                                    <SelectItem value="well_insulated">Well Insulated</SelectItem>
                                                    <SelectItem value="moderate">Moderate</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center gap-4 lg:col-span-2">
                                            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-warm-gray">
                                                <Switch checked={sensoryProfile.warmingSupported} onCheckedChange={(v) => setSensoryProfile({ ...sensoryProfile, warmingSupported: v })} /> Warming
                                            </label>
                                            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-warm-gray">
                                                <Switch checked={sensoryProfile.coolingSupported} onCheckedChange={(v) => setSensoryProfile({ ...sensoryProfile, coolingSupported: v })} /> Cooling
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>

                <TabsContent value="technical" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {formData.isDigital ? (
                        <div className="bg-warm-white p-20 border border-sand border-dashed text-center">
                            <Info className="w-8 h-8 text-warm-gray mx-auto mb-4" />
                            <h3 className="font-display text-xl text-charcoal">Not Applicable</h3>
                            <p className="text-xs font-body text-warm-gray uppercase tracking-widest mt-2">Technical specs and 3D models are reserved for physical products.</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-warm-white p-6 border border-sand">
                                <h2 className="font-display text-charcoal text-xl mb-6 border-b border-sand pb-2">Dimensions & Fit</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-warm-gray mb-1">Length (cm)</label>
                                        <Input value={sizeVisualization.length} onChange={(e) => setSizeVisualization({ ...sizeVisualization, length: e.target.value })} className="bg-cream border-sand rounded-none font-body" />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-warm-gray mb-1">Width (cm)</label>
                                        <Input value={sizeVisualization.width} onChange={(e) => setSizeVisualization({ ...sizeVisualization, width: e.target.value })} className="bg-cream border-sand rounded-none font-body" />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-warm-gray mb-1">Insertable (cm)</label>
                                        <Input value={sizeVisualization.insertableLength} onChange={(e) => setSizeVisualization({ ...sizeVisualization, insertableLength: e.target.value })} className="bg-cream border-sand rounded-none font-body" />
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t border-sand/30 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-body text-charcoal mb-2">Fit Recommendation</label>
                                        <Select value={sizeRecommendation.fitType} onValueChange={(v) => setSizeRecommendation({ ...sizeRecommendation, fitType: v })}>
                                            <SelectTrigger className="bg-cream border-sand rounded-none px-4 py-6 font-body text-charcoal"><SelectValue placeholder="How does it fit?" /></SelectTrigger>
                                            <SelectContent className="bg-cream border-sand">
                                                <SelectItem value="runs_small">Runs Small</SelectItem>
                                                <SelectItem value="true_to_size">True to Size</SelectItem>
                                                <SelectItem value="runs_large">Runs Large</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-body text-charcoal mb-2">Sizing Notes</label>
                                        <Textarea value={sizeRecommendation.notes} onChange={(e) => setSizeRecommendation({ ...sizeRecommendation, notes: e.target.value })} rows={2} className="bg-cream border-sand rounded-none resize-none font-body" placeholder="e.g. Best for beginners..." />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-warm-white p-6 border border-sand">
                                <h2 className="font-display text-charcoal text-xl mb-6 border-b border-sand pb-2">3D & AR Experience</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-warm-gray mb-2">Model URL (GLB)</label>
                                            <Input value={model3D.modelUrl} onChange={(e) => setModel3D({ ...model3D, modelUrl: e.target.value })} placeholder="https://..." className="bg-cream border-sand rounded-none" />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-warm-gray">
                                                <Switch checked={model3D.arSupported} onCheckedChange={(v) => setModel3D({ ...model3D, arSupported: v })} /> AR Support
                                            </label>
                                            <div>
                                                <label className="block text-[8px] uppercase tracking-tighter text-warm-gray">AR Scale</label>
                                                <Input type="number" step="0.1" value={model3D.arScale} onChange={(e) => setModel3D({ ...model3D, arScale: parseFloat(e.target.value) })} className="w-20 h-8 bg-cream border-sand text-xs rounded-none" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-cream border border-dashed border-sand flex items-center justify-center p-8">
                                        {model3D.modelUrl ? (
                                            <div className="text-center">
                                                <UploadCloud className="w-8 h-8 mx-auto text-terracotta mb-2" />
                                                <p className="font-body text-[10px] text-warm-gray uppercase tracking-widest">3D Model Linked Successfully</p>
                                            </div>
                                        ) : (
                                            <p className="font-body text-[10px] text-warm-gray uppercase tracking-widest">No 3D Model Provided</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-warm-white p-6 border border-sand">
                                <div className="flex justify-between items-center mb-6 border-b border-sand pb-2">
                                    <h2 className="font-display text-charcoal text-xl">Regional Pricing overrides</h2>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setRegionalPrices([...regionalPrices, { countryCode: 'US', currency: 'USD', priceCents: '0', compareAtPriceCents: '' }])} className="rounded-none border-sand text-[10px] uppercase tracking-widest"><Plus className="w-3 h-3 mr-1" /> Add Region</Button>
                                </div>
                                <div className="space-y-3">
                                    {regionalPrices.map((rp, idx) => (
                                        <div key={idx} className="grid grid-cols-4 md:grid-cols-12 gap-3 p-3 bg-cream border border-sand items-end">
                                            <div className="col-span-1 md:col-span-2">
                                                <Input value={rp.countryCode} onChange={(e) => {
                                                    const updated = [...regionalPrices];
                                                    updated[idx].countryCode = e.target.value.toUpperCase();
                                                    setRegionalPrices(updated);
                                                }} placeholder="Country (US)" className="bg-warm-white border-sand text-xs rounded-none" />
                                            </div>
                                            <div className="col-span-1 md:col-span-2">
                                                <Input value={rp.currency} onChange={(e) => {
                                                    const updated = [...regionalPrices];
                                                    updated[idx].currency = e.target.value.toUpperCase();
                                                    setRegionalPrices(updated);
                                                }} placeholder="Currency (USD)" className="bg-warm-white border-sand text-xs rounded-none" />
                                            </div>
                                            <div className="col-span-1 md:col-span-3">
                                                <Input value={rp.priceCents} onChange={(e) => {
                                                    const updated = [...regionalPrices];
                                                    updated[idx].priceCents = e.target.value;
                                                    setRegionalPrices(updated);
                                                }} placeholder="Price" className="bg-warm-white border-sand text-xs rounded-none" />
                                            </div>
                                            <div className="col-span-1 md:col-span-1 flex justify-end">
                                                <Button type="button" variant="ghost" size="icon" onClick={() => setRegionalPrices(regionalPrices.filter((_, i) => i !== idx))} className="text-warm-gray hover:text-terracotta"><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </form >
    )
}
