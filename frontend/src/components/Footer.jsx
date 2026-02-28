import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const Footer = () => {
  const footerRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    gsap.fromTo(contentRef.current,
      { y: 80, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 90%",
        }
      }
    )
  }, [])

  return (
    <footer ref={footerRef} className="bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white relative overflow-hidden theme-transition">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-gray-900/10 to-black/5 dark:from-blue-900/10 dark:via-indigo-900/10 dark:to-blue-900/10"></div>
      
      <div ref={contentRef} className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 content-layer">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-black to-gray-700 dark:from-blue-600 dark:to-indigo-700 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="text-gray-900 dark:text-white font-bold text-2xl tracking-tight theme-transition">ContentGenie</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed max-w-md text-lg mb-8 font-normal theme-transition">
              Empowering creators and businesses with AI-powered content creation, 
              personalization, and management solutions that drive engagement and growth.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="w-12 h-12 bg-gray-200 dark:bg-white/10 rounded-xl flex items-center justify-center hover:bg-gray-300 dark:hover:bg-white/20 transition-all duration-100 backdrop-blur-sm theme-transition social-icon">
                <span className="text-xl">📧</span>
              </a>
              <a href="#" className="w-12 h-12 bg-gray-200 dark:bg-white/10 rounded-xl flex items-center justify-center hover:bg-gray-300 dark:hover:bg-white/20 transition-all duration-100 backdrop-blur-sm theme-transition social-icon">
                <span className="text-xl">🐦</span>
              </a>
              <a href="#" className="w-12 h-12 bg-gray-200 dark:bg-white/10 rounded-xl flex items-center justify-center hover:bg-gray-300 dark:hover:bg-white/20 transition-all duration-100 backdrop-blur-sm theme-transition social-icon">
                <span className="text-xl">💼</span>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg tracking-wide theme-transition">PRODUCT</h4>
            <ul className="space-y-4 text-gray-700 dark:text-gray-300 theme-transition">
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block theme-transition">Features</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block theme-transition">Pricing</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block theme-transition">API</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block theme-transition">Integrations</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg tracking-wide theme-transition">COMPANY</h4>
            <ul className="space-y-4 text-gray-700 dark:text-gray-300 theme-transition">
              <li><a href="/about" className="hover:text-gray-900 dark:hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block theme-transition">About</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block theme-transition">Blog</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block theme-transition">Careers</a></li>
              <li><a href="/contact" className="hover:text-gray-900 dark:hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block theme-transition">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-300/50 dark:border-gray-700/50 pt-10 flex flex-col md:flex-row justify-between items-center theme-transition">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 md:mb-0 theme-transition">
            © 2024 ContentGenie. All rights reserved. Built with ❤️ for creators.
          </p>
          <div className="flex space-x-8">
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 text-sm theme-transition">Privacy Policy</a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 text-sm theme-transition">Terms of Service</a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 text-sm theme-transition">Support</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer