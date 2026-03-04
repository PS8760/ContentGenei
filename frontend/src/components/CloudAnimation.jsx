import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const CloudAnimation = () => {
  const containerRef = useRef(null)
  const cloudsRef = useRef([])

  useEffect(() => {
    const clouds = cloudsRef.current
    
    // Animate clouds floating across the screen
    clouds.forEach((cloud, index) => {
      if (cloud) {
        gsap.to(cloud, {
          x: '100vw',
          duration: 20 + index * 5,
          repeat: -1,
          ease: 'none',
          delay: index * 3
        })
        
        // Add subtle vertical movement
        gsap.to(cloud, {
          y: '+=20',
          duration: 3 + index,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        })
      }
    })
  }, [])

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Cloud 1 */}
      <div
        ref={el => cloudsRef.current[0] = el}
        className="absolute top-20 -left-32 opacity-20 dark:opacity-10"
        style={{ transform: 'translateX(-100%)' }}
      >
        <svg width="200" height="80" viewBox="0 0 200 80" fill="none">
          <ellipse cx="50" cy="50" rx="40" ry="25" fill="currentColor" className="text-gray-400 dark:text-gray-600" />
          <ellipse cx="90" cy="45" rx="50" ry="30" fill="currentColor" className="text-gray-400 dark:text-gray-600" />
          <ellipse cx="140" cy="50" rx="45" ry="28" fill="currentColor" className="text-gray-400 dark:text-gray-600" />
        </svg>
      </div>

      {/* Cloud 2 */}
      <div
        ref={el => cloudsRef.current[1] = el}
        className="absolute top-40 -left-32 opacity-15 dark:opacity-8"
        style={{ transform: 'translateX(-100%)' }}
      >
        <svg width="180" height="70" viewBox="0 0 180 70" fill="none">
          <ellipse cx="45" cy="45" rx="35" ry="22" fill="currentColor" className="text-gray-300 dark:text-gray-700" />
          <ellipse cx="80" cy="40" rx="45" ry="25" fill="currentColor" className="text-gray-300 dark:text-gray-700" />
          <ellipse cx="125" cy="45" rx="40" ry="24" fill="currentColor" className="text-gray-300 dark:text-gray-700" />
        </svg>
      </div>

      {/* Cloud 3 */}
      <div
        ref={el => cloudsRef.current[2] = el}
        className="absolute top-60 -left-32 opacity-25 dark:opacity-12"
        style={{ transform: 'translateX(-100%)' }}
      >
        <svg width="220" height="90" viewBox="0 0 220 90" fill="none">
          <ellipse cx="55" cy="55" rx="45" ry="28" fill="currentColor" className="text-gray-500 dark:text-gray-500" />
          <ellipse cx="100" cy="50" rx="55" ry="32" fill="currentColor" className="text-gray-500 dark:text-gray-500" />
          <ellipse cx="155" cy="55" rx="50" ry="30" fill="currentColor" className="text-gray-500 dark:text-gray-500" />
        </svg>
      </div>
    </div>
  )
}

export default CloudAnimation
