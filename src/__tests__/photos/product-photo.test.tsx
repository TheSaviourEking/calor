import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProductPhoto from '@/components/product/ProductPhoto'

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
    unoptimized,
    fill,
    sizes,
    priority,
  }: {
    src: string
    alt: string
    className?: string
    unoptimized?: boolean
    fill?: boolean
    sizes?: string
    priority?: boolean
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} data-unoptimized={String(!!unoptimized)}
      data-fill={String(!!fill)}
      data-sizes={sizes}
      data-priority={String(!!priority)}
    />
  ),
}))

describe('ProductPhoto', () => {
  it('blends only white-background photos', () => {
    render(<ProductPhoto src="https://x/a.jpg" alt="A" treatment="blend" />)
    expect(screen.getByAltText('A')).toHaveClass('mix-blend-multiply')
  })

  it('does not blend originals or composites', () => {
    render(
      <>
        <ProductPhoto src="https://x/a.jpg" alt="O" treatment="original" />
        <ProductPhoto src="https://x/b.jpg" alt="C" treatment="composite" />
      </>,
    )
    expect(screen.getByAltText('O')).not.toHaveClass('mix-blend-multiply')
    expect(screen.getByAltText('C')).not.toHaveClass('mix-blend-multiply')
  })

  it('treats an unknown treatment as original', () => {
    render(<ProductPhoto src="https://x/a.jpg" alt="U" />)
    expect(screen.getByAltText('U').closest('[data-treatment]')).toHaveAttribute(
      'data-treatment',
      'original',
    )
  })

  it('serves data: URLs unoptimized', () => {
    render(<ProductPhoto src="data:image/png;base64,AAAA" alt="D" />)
    expect(screen.getByAltText('D')).toHaveAttribute('data-unoptimized', 'true')
  })

  it('serves hosts outside the next/image allowlist unoptimized', () => {
    render(<ProductPhoto src="https://evil.example/a.jpg" alt="E" />)
    expect(screen.getByAltText('E')).toHaveAttribute('data-unoptimized', 'true')
  })

  it('keeps allowlisted hosts and site-relative paths optimized', () => {
    render(
      <>
        <ProductPhoto src="https://pub-1.r2.dev/a.jpg" alt="R" />
        <ProductPhoto src="/images/products/a.png" alt="L" />
      </>,
    )
    expect(screen.getByAltText('R')).toHaveAttribute('data-unoptimized', 'false')
    expect(screen.getByAltText('L')).toHaveAttribute('data-unoptimized', 'false')
  })

  it('renders the placeholder tile when there is no photo', () => {
    render(<ProductPhoto src={null} alt="Ora" />)
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('O')).toBeInTheDocument()
  })

  it.each([
    ['square', ['relative', 'aspect-square'], ['absolute']],
    ['portrait', ['relative', 'aspect-[3/4]'], ['absolute']],
    ['fill', ['absolute', 'inset-0'], ['relative']],
  ] as const)('maps aspect=%s to the right tile classes', (aspect, has, lacks) => {
    render(<ProductPhoto src="https://x/a.jpg" alt="T" aspect={aspect} />)
    const tile = screen.getByAltText('T').closest('[data-treatment]')!
    for (const c of has) expect(tile).toHaveClass(c)
    for (const c of lacks) expect(tile).not.toHaveClass(c)
    expect(tile).toHaveClass('bg-sand')
  })

  it('forwards fill, sizes and priority and never crops the product', () => {
    render(<ProductPhoto src="https://x/a.jpg" alt="F" sizes="50vw" priority />)
    const img = screen.getByAltText('F')
    expect(img).toHaveAttribute('data-fill', 'true')
    expect(img).toHaveAttribute('data-sizes', '50vw')
    expect(img).toHaveAttribute('data-priority', 'true')
    expect(img).toHaveClass('object-contain')
    expect(img).not.toHaveClass('object-cover')
  })
})
