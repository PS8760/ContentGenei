import { useEffect, useRef } from 'react'

const FloatingEmojis = () => {
  const containerRef = useRef(null)
  const emojisRef = useRef([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Cool emoji sets for different sections
    const emojiSets = [
      '✨', '🚀', '💡', '⭐', '🎯', '🔥', '💫', '🌟',
      '👍', '❤️', '🎉', '💪', '🎨', '📱', '💻', '🎵',
      '🌈', '⚡', '🎪', '🎭', '🎬', '📸', '🎮', '🎲'
    ]

    const createFloatingEmojis = () => {
      const emojis = []
      
      // Create 20 floating emojis at random positions
      for (let i = 0; i < 20; i++) {
        const emoji = document.createElement('div')
        emoji.className = 'floating-emoji'
        
        const randomEmoji = emojiSets[Math.floor(Math.random() * emojiSets.length)]
        const x = Math.random() * (window.innerWidth - 100) + 50
        const y = Math.random() * (window.innerHeight - 100) + 50
        const size = Math.random() * 20 + 25 // 25-45px
        const opacity = Math.random() * 0.4 + 0.3 // 0.3-0.7
        const rotation = Math.random() * 360
        
        emoji.style.cssText = `
          position: fixed;
          left: ${x}px;
          top: ${y}px;
          font-size: ${size}px;
          opacity: ${opacity};
          pointer-events: none;
          z-index: 5;
          transform: rotate(${rotation}deg);
          user-select: none;
          will-change: transform, opacity;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        `
        
        emoji.textContent = randomEmoji
        container.appendChild(emoji)
        
        emojis.push({
          element: emoji,
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.3,
          rotationSpeed: (Math.random() - 0.5) * 2,
          floatPhase: Math.random() * Math.PI * 2,
          originalOpacity: opacity
        })
      }
      
      return emojis
    }

    const emojis = createFloatingEmojis()
    emojisRef.current = emojis

    // Animation loop
    let time = 0
    let animationFrame
    
    const animate = () => {
      time += 0.02
      
      emojis.forEach((emoji, index) => {
        const { element, vx, vy, rotationSpeed, floatPhase, originalOpacity } = emoji
        
        // Update position with gentle drift
        emoji.x += vx
        emoji.y += vy
        
        // Boundary wrapping
        if (emoji.x < -50) emoji.x = window.innerWidth + 50
        if (emoji.x > window.innerWidth + 50) emoji.x = -50
        if (emoji.y < -50) emoji.y = window.innerHeight + 50
        if (emoji.y > window.innerHeight + 50) emoji.y = -50
        
        // Floating animation
        const floatY = Math.sin(time + floatPhase) * 15
        const floatX = Math.cos(time * 0.7 + floatPhase) * 8
        
        // Rotation animation
        const currentRotation = time * rotationSpeed * 10
        
        // Opacity pulsing
        const opacityPulse = Math.sin(time * 2 + index) * 0.2 + 1
        
        // Apply transformations
        element.style.transform = `
          translate3d(${emoji.x + floatX}px, ${emoji.y + floatY}px, 0) 
          rotate(${currentRotation}deg) 
          scale(${0.8 + Math.sin(time + index) * 0.2})
        `
        element.style.opacity = originalOpacity * opacityPulse
      })
      
      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    // Mouse interaction - emojis react to cursor
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e
      
      emojis.forEach((emoji) => {
        const distance = Math.sqrt(
          Math.pow(clientX - emoji.x, 2) + Math.pow(clientY - emoji.y, 2)
        )
        
        if (distance < 150) {
          const force = (150 - distance) / 150
          const angle = Math.atan2(emoji.y - clientY, emoji.x - clientX)
          
          // Gentle repulsion
          emoji.vx += Math.cos(angle) * force * 0.02
          emoji.vy += Math.sin(angle) * force * 0.02
          
          // Limit velocity
          emoji.vx = Math.max(-1, Math.min(1, emoji.vx))
          emoji.vy = Math.max(-1, Math.min(1, emoji.vy))
          
          // Add a little spin when interacted with
          emoji.rotationSpeed += force * 0.5
        }
      })
    }

    // Handle window resize
    const handleResize = () => {
      emojis.forEach((emoji) => {
        emoji.x = Math.random() * (window.innerWidth - 100) + 50
        emoji.y = Math.random() * (window.innerHeight - 100) + 50
      })
    }

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      emojis.forEach(({ element }) => {
        if (element.parentNode) {
          element.parentNode.removeChild(element)
        }
      })
      emojisRef.current = []
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-5 overflow-hidden"
      style={{ 
        background: 'transparent'
      }}
    />
  )
}

export default FloatingEmojis