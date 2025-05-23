'use client'

import { useEffect, useState } from 'react'

export interface Quote {
  text: string
  author: string
}

const quotes: Quote[] = [
  {
    text: "Horizon is a major leap forward for our merchants, and it wouldn't have happened without the intensity, focus, and execution you brought to the team.",
    author: "Harley Finkelstein, Shopify President"
  },
  {
    text: "One of the engineers I look up to most in the world is @mxstbr.",
    author: "Sarah Drasner, Sr. Director of Engineering at Google"
  },
  {
    text: "Max Stoiber is a living legend in the JavaScript world. Cofounder & CEO of Stellate, co-creator of styled-components & react-boilerplate.",
    author: "Josh Cirre, DevRel at Laravel"
  },
  {
    text: "Spectrum.chat: The team behind it truly understands the importance and impact that online communities can have.",
    author: "Josh Dunsterville, Sketch community founder"
  }
]

export function Quotes() {
  const [scrollY, setScrollY] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const getQuoteOpacity = (index: number) => {
    if (!mounted) return index === 0 ? 1 : 0 // Show only first quote during SSR
    
    const viewportHeight = window.innerHeight
    const quoteHeight = viewportHeight
    const quoteStart = index * quoteHeight
    const quoteEnd = quoteStart + quoteHeight
    const quoteCenter = quoteStart + quoteHeight / 2
    
    // Calculate distance from current scroll position to quote center
    const viewportCenter = scrollY + viewportHeight / 2
    const distanceFromCenter = Math.abs(viewportCenter - quoteCenter)
    
    // Fade zone is 30% of viewport height for more defined transitions
    const fadeZone = viewportHeight * 0.3
    
    if (distanceFromCenter <= fadeZone) {
      // Within fade zone - calculate opacity
      return Math.max(0, 1 - (distanceFromCenter / fadeZone))
    }
    
    return 0
  }

  return (
    <div className="scroll-smooth">
      {/* Create spacer divs to establish scroll height with snap points */}
      {quotes.map((_, index) => (
        <div 
          key={`spacer-${index}`} 
          className="h-screen snap-start snap-always" 
        />
      ))}
      
      {/* Fixed quotes that don't scroll */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {quotes.map((quote, index) => (
          <div 
            key={index}
            className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 transition-opacity duration-500 ease-out"
            style={{
              opacity: getQuoteOpacity(index)
            }}
          >
            <blockquote className="max-w-4xl">
              <p className="text-2xl md:text-4xl lg:text-5xl font-light text-slate-900 dark:text-slate-100 leading-relaxed mb-8">
                "{quote.text}"
              </p>
              <footer className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium">
                — {quote.author}
              </footer>
            </blockquote>
          </div>
        ))}
      </div>
    </div>
  )
} 