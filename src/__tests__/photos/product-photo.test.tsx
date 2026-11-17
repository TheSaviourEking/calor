import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProductPhoto from '@/components/product/ProductPhoto'

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
    unoptimized,
  }: {
    src: string
    alt: string
    className?: string
    unoptimized?: boolean
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} data-unoptimized={String(!!unoptimized)} />
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

  it('renders the placeholder tile when there is no photo', () => {
    render(<ProductPhoto src={null} alt="Ora" />)
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('O')).toBeInTheDocument()
  })
})
