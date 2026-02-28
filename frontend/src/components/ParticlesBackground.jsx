import { useEffect, useRef } from 'react'

const ParticlesBackground = () => {
  const containerRef = useRef(null)
  const particlesRef = useRef([])
  const animationFrameRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create different types of particles with better visibility
    const createParticles = () => {
      const particles = []
      
      // Main floating particles - enhanced visibility
      for (let i = 0; i < 35; i++) {
        const particle = document.createElement('div')
        particle.className = 'particle-main'
        
        const x = Math.random() * window.innerWidth
        const y = Math.random() * window.innerHeight
        const size = Math.random() * 4 + 2
        const opacity = Math.random() * 0.8 + 0.4
        
        particle.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          background: rgba(0, 0, 0, ${opacity});
          border-radius: 50%;
          pointer-events: none;
          left: ${x}px;
          top: ${y}px;
          filter: blur(0.5px);
          will-change: transform, opacity;
          box-shadow: 0 0 ${size * 3}px rgba(0, 0, 0, ${opacity * 0.6});
          z-index: 1;
        `
        
        container.appendChild(particle)
        particles.push({ 
          element: particle, 
          type: 'main',
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 0.8,
          originalOpacity: opacity,
          baseColor: 'rgba(0, 0, 0, ' + opacity + ')'
        })
      }

      // Larger accent particles - more visible
      for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div')
        particle.className = 'particle-accent'
        
        const x = Math.random() * window.innerWidth
        const y = Math.random() * window.innerHeight
        const size = Math.random() * 6 + 4
        const opacity = Math.random() * 0.6 + 0.3
        
        particle.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          background: radial-gradient(circle, rgba(0, 0, 0, ${opacity}) 0%, rgba(40, 40, 40, ${opacity * 0.8}) 50%, rgba(80, 80, 80, ${opacity * 0.4}) 100%);
          border-radius: 50%;
          pointer-events: none;
          left: ${x}px;
          top: ${y}px;
          filter: blur(1px);
          will-change: transform, opacity;
          box-shadow: 0 0 ${size * 4}px rgba(0, 0, 0, ${opacity * 0.5});
          z-index: 1;
        `
        
        container.appendChild(particle)
        particles.push({ 
          element: particle, 
          type: 'accent',
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.6,
          originalOpacity: opacity,
          pulsePhase: Math.random() * Math.PI * 2
        })
      }

      // Tiny sparkle particles - enhanced for visibility
      for (let i = 0; i < 25; i++) {
        const particle = document.createElement('div')
        particle.className = 'particle-sparkle'
        
        const x = Math.random() * window.innerWidth
        const y = Math.random() * window.innerHeight
        const size = Math.random() * 3 + 1.5
        const opacity = Math.random() * 0.9 + 0.5
        
        particle.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          background: rgba(60, 60, 60, ${opacity});
          border-radius: 50%;
          pointer-events: none;
          left: ${x}px;
          top: ${y}px;
          box-shadow: 0 0 ${size * 5}px rgba(80, 80, 80, ${opacity * 0.7});
          will-change: transform, opacity;
          z-index: 1;
        `
        
        container.appendChild(particle)
        particles.push({ 
          element: particle, 
          type: 'sparkle',
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.2,
          originalOpacity: opacity,
          twinklePhase: Math.random() * Math.PI * 2
        })
      }

      return particles
    }

    const particles = createParticles()
    particlesRef.current = particles

    // Enhanced animation loop with smoother and faster animations
    let time = 0
    const animate = () => {
      time += 0.025 // Increased from 0.01 for faster animation

      // Check if dark mode is active
      const isDarkMode = document.documentElement.classList.contains('dark')

      particles.forEach((particle) => {
        const { element, type, vx, vy, originalOpacity } = particle
        
        // Update position with smoother movement
        particle.x += vx * 1.5 // Increased speed multiplier
        particle.y += vy * 1.5

        // Boundary checking with wrapping
        if (particle.x < -10) particle.x = window.innerWidth + 10
        if (particle.x > window.innerWidth + 10) particle.x = -10
        if (particle.y < -10) particle.y = window.innerHeight + 10
        if (particle.y > window.innerHeight + 10) particle.y = -10

        // Adjust opacity based on theme
        const themeOpacityMultiplier = isDarkMode ? 0.9 : 1.0

        if (type === 'main') {
          // Faster gentle floating
          const floatY = Math.sin(time * 1.5 + particle.x * 0.015) * 15
          element.style.transform = `translate3d(${particle.x}px, ${particle.y + floatY}px, 0)`
          element.style.opacity = originalOpacity * themeOpacityMultiplier
          
          // Update particle color based on theme
          if (isDarkMode) {
            element.style.background = `rgba(147, 197, 253, ${originalOpacity * themeOpacityMultiplier})`
            element.style.boxShadow = `0 0 ${element.offsetWidth * 3}px rgba(147, 197, 253, ${originalOpacity * themeOpacityMultiplier * 0.6})`
          } else {
            element.style.background = `rgba(0, 0, 0, ${originalOpacity * themeOpacityMultiplier})`
            element.style.boxShadow = `0 0 ${element.offsetWidth * 3}px rgba(0, 0, 0, ${originalOpacity * themeOpacityMultiplier * 0.6})`
          }
          
        } else if (type === 'accent') {
          // Faster pulsing effect
          const pulse = Math.sin(time * 3 + particle.pulsePhase) * 0.4 + 1
          const floatY = Math.sin(time * 1.2 + particle.x * 0.008) * 20
          element.style.transform = `translate3d(${particle.x}px, ${particle.y + floatY}px, 0) scale(${pulse})`
          element.style.opacity = originalOpacity * themeOpacityMultiplier
          
          // Update accent particle color based on theme
          if (isDarkMode) {
            element.style.background = `radial-gradient(circle, rgba(147, 197, 253, ${originalOpacity * themeOpacityMultiplier}) 0%, rgba(96, 165, 250, ${originalOpacity * themeOpacityMultiplier * 0.8}) 50%, rgba(59, 130, 246, ${originalOpacity * themeOpacityMultiplier * 0.4}) 100%)`
            element.style.boxShadow = `0 0 ${element.offsetWidth * 4}px rgba(147, 197, 253, ${originalOpacity * themeOpacityMultiplier * 0.5})`
          } else {
            element.style.background = `radial-gradient(circle, rgba(0, 0, 0, ${originalOpacity * themeOpacityMultiplier}) 0%, rgba(40, 40, 40, ${originalOpacity * themeOpacityMultiplier * 0.8}) 50%, rgba(80, 80, 80, ${originalOpacity * themeOpacityMultiplier * 0.4}) 100%)`
            element.style.boxShadow = `0 0 ${element.offsetWidth * 4}px rgba(0, 0, 0, ${originalOpacity * themeOpacityMultiplier * 0.5})`
          }
          
        } else if (type === 'sparkle') {
          // Faster twinkling effect
          const twinkle = Math.sin(time * 4 + particle.twinklePhase) * 0.5 + 0.5
          const floatY = Math.sin(time * 2.5 + particle.x * 0.012) * 12
          element.style.opacity = originalOpacity * twinkle * themeOpacityMultiplier
          element.style.transform = `translate3d(${particle.x}px, ${particle.y + floatY}px, 0)`
          
          // Update sparkle particle color based on theme
          if (isDarkMode) {
            element.style.background = `rgba(96, 165, 250, ${originalOpacity * twinkle * themeOpacityMultiplier})`
            element.style.boxShadow = `0 0 ${element.offsetWidth * 5}px rgba(96, 165, 250, ${originalOpacity * twinkle * themeOpacityMultiplier * 0.7})`
          } else {
            element.style.background = `rgba(60, 60, 60, ${originalOpacity * twinkle * themeOpacityMultiplier})`
            element.style.boxShadow = `0 0 ${element.offsetWidth * 5}px rgba(80, 80, 80, ${originalOpacity * twinkle * themeOpacityMultiplier * 0.7})`
          }
        }
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Enhanced mouse interaction effect with faster response
    let mouseTimeout
    const handleMouseMove = (e) => {
      if (mouseTimeout) return
      
      mouseTimeout = setTimeout(() => {
        const { clientX, clientY } = e
        
        particles.forEach((particle) => {
          const distance = Math.sqrt(
            Math.pow(clientX - particle.x, 2) + Math.pow(clientY - particle.y, 2)
          )
          
          if (distance < 120) { // Increased interaction radius
            const force = (120 - distance) / 120
            const angle = Math.atan2(particle.y - clientY, particle.x - clientX)
            
            particle.vx += Math.cos(angle) * force * 0.08 // Increased force
            particle.vy += Math.sin(angle) * force * 0.08
            
            // Increased velocity limits for faster movement
            particle.vx = Math.max(-3, Math.min(3, particle.vx))
            particle.vy = Math.max(-3, Math.min(3, particle.vy))
          }
        })
        
        mouseTimeout = null
      }, 8) // Reduced throttling for more responsive interaction
    }

    // Handle window resize
    const handleResize = () => {
      particles.forEach((particle) => {
        particle.x = Math.random() * window.innerWidth
        particle.y = Math.random() * window.innerHeight
      })
    }

    // Handle theme changes
    const handleThemeChange = () => {
      const isDarkMode = document.documentElement.classList.contains('dark')
      
      particles.forEach((particle) => {
        const { element, type, originalOpacity } = particle
        const themeOpacityMultiplier = isDarkMode ? 0.8 : 1.2
        
        if (type === 'main') {
          element.style.background = isDarkMode 
            ? `rgba(147, 197, 253, ${originalOpacity * themeOpacityMultiplier})`
            : `rgba(0, 0, 0, ${originalOpacity * themeOpacityMultiplier})`
        }
      })
    }

    // Listen for theme changes
    const observer = new MutationObserver(handleThemeChange)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      observer.disconnect()
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      particles.forEach(({ element }) => {
        if (element.parentNode) {
          element.parentNode.removeChild(element)
        }
      })
      particlesRef.current = []
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden particles-container opacity-90 dark:opacity-70"
      style={{ 
        background: 'transparent',
        mixBlendMode: 'normal'
      }}
    />
  )
}

export default ParticlesBackground