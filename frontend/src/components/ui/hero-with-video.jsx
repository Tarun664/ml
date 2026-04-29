import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Play, Pause, Mail, ArrowRight, Menu, ChevronDown, Sun, Moon, ShieldAlert } from 'lucide-react';

const NavbarHero = ({
  brandName = "CRIMEWATCH",
  heroTitle = "Global Vigilance, Local Safety",
  heroSubtitle = "Empowering Communities",
  heroDescription = "Access real-time crime analytics and neighborhood safety insights. Join the movement to make our streets safer through data.",
  backgroundImage = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2072&q=80", // Earth from space at night
  videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  emailPlaceholder = "Enter your city or zip code"
}) => {
  const [email, setEmail] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEmailSubmit = () => {
    console.log('Search/Email submitted:', email);
  };

  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsVideoPlaying(true);
      setIsVideoPaused(false);
    }
  };

  const handlePauseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsVideoPaused(true);
    }
  };
  
  const handleResumeVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsVideoPaused(false);
    }
  };

  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
    setIsVideoPaused(false);
  };

  const ThemeToggleButton = () => {
    if (!mounted) return <div className="w-10 h-10" />;
    return (
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="bg-muted hover:bg-border flex-shrink-0 p-2.5 rounded-full transition-colors"
        aria-label="Toggle theme"
      >
        {theme === "light" ? <Moon className="h-5 w-5 text-foreground" /> : <Sun className="h-5 w-5 text-foreground" />}
      </button>
    );
  };

  return (
    <div className="relative w-full bg-background overflow-hidden min-h-screen">
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* --- Navbar --- */}
        <div className="py-2 relative z-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <a href="#" className="font-bold text-2xl pb-1 text-foreground cursor-pointer flex-shrink-0 flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-red-500" />
              {brandName}
            </a>
            <nav className="hidden lg:flex text-muted-foreground font-medium">
              <ul className="flex items-center space-x-2">
                <li><a href="#" className="hover:text-foreground px-3 py-2 text-sm transition-colors rounded-lg">Dashboard</a></li>
                <li className="relative">
                  <button onClick={() => toggleDropdown('desktop-resources')} className="flex items-center hover:text-foreground px-3 py-2 text-sm transition-colors rounded-lg">
                    Data Sources<ChevronDown className={`h-4 w-4 ml-1 transition-transform ${openDropdown === 'desktop-resources' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'desktop-resources' && (
                    <ul className="absolute top-full left-0 mt-2 p-2 bg-card border border-border shadow-lg rounded-xl z-20 w-48">
                      <li><a href="#" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">Live API</a></li>
                      <li><a href="#" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">Historical Records</a></li>
                    </ul>
                  )}
                </li>
                <li><a href="#" className="hover:text-foreground px-3 py-2 text-sm transition-colors rounded-lg">Alerts</a></li>
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-3">
              <a href="#" className="text-foreground hover:text-muted-foreground cursor-pointer py-2 px-4 text-sm capitalize font-medium transition-colors rounded-xl">Login</a>
              <button className="bg-foreground hover:bg-muted-foreground text-background py-2.5 px-5 text-sm rounded-xl capitalize font-medium transition-colors flex items-center gap-2">
                Start Surveying<ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <ThemeToggleButton />
            <div className="lg:hidden relative">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="bg-transparent hover:bg-muted border-none p-2 rounded-xl transition-colors">
                <Menu className="h-6 w-6" />
              </button>
              {isMobileMenuOpen && (
                <ul className="absolute top-full right-0 mt-2 p-2 shadow-lg bg-card border border-border rounded-xl w-56 z-30">
                  <li><a href="#" className="block px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg">Dashboard</a></li>
                  <li><button onClick={() => toggleDropdown('mobile-resources')} className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg">
                      Data Sources<ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'mobile-resources' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'mobile-resources' && (<ul className="ml-4 mt-1 border-l border-border pl-3">
                      <li><a href="#" className="block px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg">Live API</a></li>
                      <li><a href="#" className="block px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg">Historical Records</a></li>
                  </ul>)}</li>
                  <li><a href="#" className="block px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg">Alerts</a></li>
                  <li className="border-t border-border mt-2 pt-2 space-y-2">
                    <a href="#" className="block w-full text-center px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg">Login</a>
                    <button className="w-full bg-foreground text-background hover:bg-muted-foreground px-3 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 font-medium">
                      Launch App<ArrowRight className="h-4 w-4" />
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* --- Hero Section --- */}
        <div className="pt-8 pb-10 sm:pt-12 sm:pb-16 text-center">
          <div className="max-w-3xl mx-auto">
            <span className="inline-block py-1 px-3 rounded-full bg-red-500/10 text-red-500 font-semibold text-sm mb-4 border border-red-500/20">{heroSubtitle}</span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl text-foreground font-black tracking-tighter uppercase">{heroTitle}</h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">{heroDescription}</p>
            <div className="mt-8 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
              <div className="relative w-full max-w-xs sm:max-w-sm">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input type="text" placeholder={emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-muted border-border text-foreground placeholder-muted-foreground font-medium pl-12 pr-4 py-3 text-base rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 border" />
              </div>
              <button onClick={handleEmailSubmit} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 text-base rounded-full normal-case font-bold transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20">
                Start Surveying<ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* --- Media Header --- */}
        <header className="relative w-full aspect-video rounded-3xl overflow-hidden border-4 border-border shadow-2xl">
          <img src={backgroundImage} alt="Data visualization dashboard" className={`w-full h-full absolute inset-0 object-cover transition-opacity duration-500 ${isVideoPlaying ? 'opacity-0' : 'opacity-100'}`} />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
          <video ref={videoRef} src={videoUrl} className={`w-full h-full absolute inset-0 object-cover transition-opacity duration-500 ${isVideoPlaying ? 'opacity-100' : 'opacity-0'}`} onEnded={handleVideoEnded} playsInline muted />
          <div className="absolute bottom-6 right-6 z-10">
            {!isVideoPlaying ? (
              <button onClick={handlePlayVideo} className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all duration-300 shadow-xl shadow-red-500/30 scale-100 hover:scale-105 active:scale-95">
                <Play className="h-8 w-8 ml-1" fill="currentColor" />
              </button>
            ) : (
              <button onClick={isVideoPaused ? handleResumeVideo : handlePauseVideo} className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white/30 transition-all duration-300 shadow-lg">
                {isVideoPaused ? <Play className="h-8 w-8 ml-1" fill="currentColor" /> : <Pause className="h-8 w-8" fill="currentColor" />}
              </button>
            )}
          </div>
        </header>
      </div>
    </div>
  );
};

export { NavbarHero };
