import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SearchForm from "../components/SearchForm";

interface FormSearchFilters {
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  dropoffLocation: string;
  dropoffDate: string;
  dropoffTime: string;
}

export default function HomePage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [textVisible, setTextVisible] = useState(false);
  const rafId = useRef<number | null>(null);
  const lastScrollY = useRef(0);
  
  // Hero images array
  const heroImages = [
    '/hero-audi-a6-avant.png',
    '/hero-1.png',
    '/hero-2.png',
    '/hero-3.png',
    '/hero-4.png'
  ];

  // Optimized scroll handler with requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (rafId.current !== null) {
      return;
    }

    rafId.current = requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      const heroSection = heroRef.current;
      
      // Skip if we're at the top and were already at the top (avoid conflicts with scroll to top)
      if (currentScrollY === 0 && lastScrollY.current === 0) {
        rafId.current = null;
        return;
      }
      
      if (heroSection) {
        const heroHeight = heroSection.offsetHeight;
        const heroTop = heroSection.offsetTop;
        const heroBottom = heroTop + heroHeight;
        
        // Only apply parallax when hero section is in view
        if (currentScrollY >= heroTop && currentScrollY <= heroBottom) {
          setScrollY(currentScrollY);
        } else if (currentScrollY < heroTop) {
          setScrollY(0);
        } else {
          setScrollY(heroBottom - heroTop);
        }
      } else {
        setScrollY(currentScrollY);
      }
      
      lastScrollY.current = currentScrollY;
      rafId.current = null;
    });
  }, []);

  // Scroll to top on mount/refresh - separate effect to avoid conflicts
  useEffect(() => {
    window.scrollTo(0, 0);
    setScrollY(0);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Animate text on mount
    setTimeout(() => {
      setTextVisible(true);
    }, 300);

    // Auto-rotate hero images every 5 seconds
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      clearInterval(imageInterval);
    };
  }, [handleScroll, heroImages.length]);

  const handleSearch = (_searchFilters: FormSearchFilters) => {
    // Данные уже сохранены в контексте через SearchForm
    // Параметр _searchFilters оставлен для совместимости с интерфейсом SearchForm
    navigate('/search');
  };

  // Enhanced parallax effects with different speeds for different layers
  const heroSection = heroRef.current;
  const heroHeight = heroSection?.offsetHeight || 800;
  const scrollProgress = Math.min(scrollY / heroHeight, 1);
  
  // Different parallax speeds for depth effect (only apply when hero is in viewport)
  const isHeroInView = scrollY < heroHeight;
  const backgroundParallax = isHeroInView ? scrollY * 0.3 : 0; // Slowest layer (background)
  const midParallax = isHeroInView ? scrollY * 0.5 : 0; // Medium layer (images)
  const contentParallax = isHeroInView ? scrollY * 0.1 : 0; // Fastest layer (content)

  return (
    <div className="min-h-screen bg-gray-900 overflow-x-hidden">
      <Header />

      {/* Hero Section with Parallax */}
      <section 
        ref={heroRef}
        className="relative w-full overflow-hidden hero-section-height"
      >
        {/* Background Layer - Deepest parallax */}
        <div 
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `translateY(${backgroundParallax}px) scale(1.05)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900"></div>
        </div>

        {/* Image Layer - Medium parallax with smooth crossfade */}
        <div 
          className="absolute top-0 left-0 right-0 bottom-0 will-change-transform overflow-hidden"
          style={{
            transform: `translateY(${midParallax}px)`,
          }}
        >
          {heroImages.map((image, index) => {
            const isActive = index === currentImageIndex;
            const distance = Math.abs(index - currentImageIndex);
            const minDistance = Math.min(distance, heroImages.length - distance);
            
            return (
              <div
                key={index}
                className={`absolute top-0 left-0 right-0 bottom-0 transition-all duration-[3000ms] ease-in-out ${
                  isActive 
                    ? 'opacity-100 z-10' 
                    : 'opacity-0 z-0'
                }`}
                style={{
                  transform: `translateY(${midParallax}px)`,
                  transitionDelay: isActive ? '0ms' : `${minDistance * 50}ms`,
                  overflow: 'hidden',
                }}
              >
                <img
                  src={image}
                  alt={`Premium Car Rental ${index + 1}`}
                  className="w-full h-full object-cover"
                  style={{ 
                    objectPosition: 'center bottom',
                    height: '100%',
                    maxHeight: '100%',
                    width: '100%',
                    display: 'block',
                    verticalAlign: 'bottom'
                  }}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80";
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Animated gradient overlays with parallax */}
        <div 
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            transform: `translateY(${contentParallax * 0.3}px)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/50 to-black/85"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50"></div>
          <div 
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
            style={{
              opacity: 1 - scrollProgress * 0.5,
            }}
          ></div>
        </div>

        {/* Scroll Indicator with smooth animation */}
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 z-40">
          <a 
            href="#features" 
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors duration-300 group"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center group-hover:border-white transition-colors">
              <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-bounce"></div>
            </div>
          </a>
        </div>

        {/* Image Navigation Dots with Progress */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-40 flex space-x-3 items-center">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className="group relative flex items-center"
              aria-label={`Go to image ${index + 1}`}
            >
              <div className={`h-1 rounded-full transition-all duration-300 ${
                index === currentImageIndex
                  ? 'bg-orange-500 w-8'
                  : 'bg-white/30 hover:bg-white/50 w-2'
              }`} />
              {index === currentImageIndex && (
                <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-pulse"></div>
              )}
            </button>
          ))}
        </div>

        {/* Content Overlay with subtle parallax */}
        <div 
          className="relative z-30 container mx-auto px-4 md:px-6 h-full flex flex-col justify-start pt-12 md:pt-16"
          style={{
            transform: `translateY(${contentParallax}px)`,
            willChange: 'transform',
          }}
        >
          <div className="max-w-7xl mx-auto w-full">
            {/* Search Form - Beautiful Floating Card (MOVED TO TOP) */}
            <div 
              className="mb-4 md:mb-6 transform transition-all duration-700 ease-out"
              style={{
                opacity: 1 - scrollProgress * 0.3,
                transform: `translateY(${scrollProgress * 20}px)`,
              }}
            >
              <div className="bg-black/95 backdrop-blur-strong rounded-3xl shadow-elegant-xl p-4 md:p-6 lg:p-8 border border-white/20 relative overflow-hidden">
                {/* Decorative gradient overlay */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                  <div className="mb-4 md:mb-5">
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white font-display mb-1 md:mb-2">
                      Finde dein perfektes Auto
                    </h2>
                    <p className="text-gray-300 text-sm md:text-base">
                      Wähle Ort, Datum und Zeit für deine Reise
                    </p>
                  </div>
                  <SearchForm onSearch={handleSearch} />
                </div>
              </div>
            </div>

            {/* Hero Text (MOVED TO BOTTOM) with parallax */}
            <div 
              className="mt-4 md:mt-6 transform transition-all duration-700 ease-out"
              style={{
                opacity: 1 - scrollProgress * 0.5,
                transform: `translateY(${scrollProgress * 30}px)`,
              }}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-3 md:mb-4 leading-tight font-display drop-shadow-2xl">
                <span 
                  className={`inline-block transition-all duration-1000 ease-out ${
                    textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: '200ms' }}
                >
                  Dein Weg.
                </span>
                <br />
                <span 
                  className={`text-orange-500 drop-shadow-lg inline-block transition-all duration-1000 ease-out ${
                    textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: '400ms' }}
                >
                  Dein Auto.
                </span>
              </h1>
              <p 
                className={`text-lg md:text-xl text-gray-200 max-w-2xl drop-shadow-lg transition-all duration-1000 ease-out ${
                  textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{
                  transitionDelay: '600ms'
                }}
              >
                Premium Autovermietung in ganz Deutschland. Fair, schnell, zuverlässig.
              </p>
            </div>
          </div>
        </div>

      </section>


      {/* Features Section */}
      <section 
        id="features"
        className="py-16 md:py-24 bg-white dark:bg-gray-900 relative overflow-hidden z-10"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-elegant-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 font-display">
                Deutschlandweit
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Über 50 Standorte in allen großen Städten Deutschlands
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-elegant-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 font-display">
                Premium Flotte
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Von sportlichen Cabrios bis zu luxuriösen SUVs – für jeden Geschmack
              </p>
              </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-elegant-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 font-display">
                Service ohne Kompromisse
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Transparent, zuverlässig, ohne versteckte Kosten – einfach ehrlich
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Gradient Background */}
      <section 
        className="py-20 md:py-28 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display">
            Premium fahren. Fair zahlen.
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Hochwertige Fahrzeuge zu fairen Preisen. Unsere Flotte wächst kontinuierlich, von Berlin bis München, von Hamburg bis Frankfurt.
          </p>
          <button
            onClick={() => navigate('/search')}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-5 rounded-xl text-lg transition-colors shadow-elegant-xl overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center">
              Flotte entdecken
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
