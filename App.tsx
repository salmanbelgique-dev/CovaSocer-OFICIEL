
import React, { useState, useEffect, useCallback } from 'react';
import { Logo } from './components/Logo';
import { ThemeToggle } from './components/ThemeToggle';
import { MatchTable } from './components/MatchTable';
import { Theme, Match } from './types';
import { fetchLiveMatches, fetchLivescores } from './services/matchService';
import { format } from 'date-fns';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<'matches' | 'articles'>('matches');

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Full match list load (every 60s)
  useEffect(() => {
    const loadMatches = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchLiveMatches();
        if (data.length > 0) {
          setMatches(data);
        } else {
          setError('No matches available');
        }
      } catch (err) {
        setError('Failed to load matches');
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
    const interval = setInterval(loadMatches, 60000);
    return () => clearInterval(interval);
  }, []);

  // Live minute updates (every 15s) - merges live data into existing matches
  useEffect(() => {
    const updateLiveMinutes = async () => {
      try {
        const liveData = await fetchLivescores();
        if (liveData.length > 0) {
          setMatches(prev => {
            const liveMap = new Map(liveData.map(m => [m.id, m]));
            return prev.map(match => {
              const liveMatch = liveMap.get(match.id);
              if (liveMatch) {
                return {
                  ...match,
                  liveMinute: liveMatch.liveMinute,
                  stateName: liveMatch.stateName,
                  status: liveMatch.status,
                  score: liveMatch.score
                };
              }
              return match;
            });
          });
        }
      } catch (err) {
        // Silently fail - full reload will catch up
      }
    };

    const liveInterval = setInterval(updateLiveMinutes, 15000);
    // Also run once after initial load
    const timeout = setTimeout(updateLiveMinutes, 3000);
    return () => {
      clearInterval(liveInterval);
      clearTimeout(timeout);
    };
  }, []);

  const filters = [
    { id: 'all', label: 'All Matches' },
    { id: 'international', label: 'International' },
    { id: 'premier', label: 'Premier League' },
    { id: 'spain', label: 'Copa Del Rey' },
    { id: 'italy', label: 'Serie A' },
    { id: 'germany', label: 'Bundesliga' },
    { id: 'france', label: 'Ligue 1' },
    { id: 'live', label: 'Live Now' },
    { id: 'finished', label: 'Finished Matches' }
  ];

  const countryFilters: Record<string, string> = {
    premier: 'ENGLAND',
    spain: 'SPAIN',
    italy: 'ITALY',
    germany: 'GERMANY',
    france: 'FRANCE',
  };

  const countryPriority: Record<string, number> = {
    ENGLAND: 0,
    SPAIN: 1,
    ITALY: 2,
    GERMANY: 3,
    FRANCE: 4,
  };

  const leaguePriority = (match: Match): number => {
    return countryPriority[match.country] ?? 5;
  };

  const filteredMatches = matches.filter(match => {
    const isFinished = match.status === 'finished';
    if (activeFilter === 'finished') return isFinished;
    if (activeFilter === 'all') return !isFinished;
    if (activeFilter === 'live') return match.status === 'live';
    if (activeFilter === 'international') {
      const leagueUpper = match.league.toUpperCase();
      const isInternational = 
        match.country.toUpperCase() === 'INTERNATIONAL' || 
        leagueUpper.includes('INTERNATIONAL') || 
        leagueUpper.includes('FRIENDLY') ||
        leagueUpper.includes('FRIENDLIES');
      const isClub = leagueUpper.includes('CLUB');
      return !isFinished && isInternational && !isClub;
    }
    if (countryFilters[activeFilter]) return !isFinished && match.country === countryFilters[activeFilter];
    return !isFinished;
  }).sort((a, b) => {
    // 1. Status Priority (Live > Upcoming > Finished)
    const statusOrder: Record<string, number> = { 'live': 0, 'upcoming': 1, 'finished': 2 };
    const orderA = statusOrder[a.status.toLowerCase()] ?? 3;
    const orderB = statusOrder[b.status.toLowerCase()] ?? 3;
    
    if (orderA !== orderB) return orderA - orderB;

    // 2. Time Sorting
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();

    if (a.status.toLowerCase() === 'finished') {
      // For finished matches, show the most recently finished first
      if (timeA !== timeB) return timeB - timeA;
    } else {
      // For live and upcoming matches, show the soonest starting first
      if (timeA !== timeB) return timeA - timeB;
    }
    
    // 3. Fallback to league priority if times are identical
    return leaguePriority(a) - leaguePriority(b);
  });

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDark ? 'bg-[#0A0F1E] text-white' : 'bg-[#F8FAFC] text-[#0A0F1E]'
    }`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full ${isDark ? 'bg-[#D4FF00]/10' : 'bg-blue-200/30'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full ${isDark ? 'bg-[#D4FF00]/5' : 'bg-blue-100/20'}`}></div>
      </div>

      <header className="relative z-20 border-b border-white/10 backdrop-blur-xl sticky top-0 shadow-lg shadow-black/10 bg-[#0A0F1E]/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-brand text-xl sm:text-2xl font-bold tracking-tighter text-white">
              COVA<span className="text-[#D4FF00]">SCORE</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold uppercase tracking-widest">
              <button onClick={() => setActivePage('matches')} className={`transition-colors ${activePage === 'matches' ? 'text-[#D4FF00]' : 'text-white/80 hover:text-[#D4FF00]'}`}>Matches</button>
              <button onClick={() => setActivePage('articles')} className={`transition-colors ${activePage === 'articles' ? 'text-[#D4FF00]' : 'text-white/80 hover:text-[#D4FF00]'}`}>Articles</button>
            </nav>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            <button 
              className="md:hidden p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 py-4 px-4">
            <nav className="flex flex-col gap-4 text-sm font-semibold uppercase tracking-widest">
              <button onClick={() => { setActivePage('matches'); setMobileMenuOpen(false); }} className={`transition-colors py-2 text-left ${activePage === 'matches' ? 'text-[#D4FF00]' : 'text-white/80 hover:text-[#D4FF00]'}`}>Matches</button>
              <button onClick={() => { setActivePage('articles'); setMobileMenuOpen(false); }} className={`transition-colors py-2 text-left ${activePage === 'articles' ? 'text-[#D4FF00]' : 'text-white/80 hover:text-[#D4FF00]'}`}>Articles</button>
            </nav>
          </div>
        )}
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {activePage === 'matches' ? (
          <>
            <div className="mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-3 sm:mb-4 tracking-tight leading-none">
                TODAY'S <span className="text-[#D4FF00]">CLASHES</span>
              </h1>
              
              <p className={`text-base sm:text-lg max-w-2xl mb-6 sm:mb-8 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                Real-time scores, upcoming fixtures, and detailed statistics. Tracking every pulse of the beautiful game.
              </p>

              <div className="flex items-center gap-3 mb-6 sm:mb-10">
                <div className={`h-[1px] flex-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                <div className={`px-3 sm:px-4 py-2 rounded-xl ${isDark ? 'bg-[#D4FF00]/5 border border-[#D4FF00]/20' : 'bg-slate-100 border border-slate-200'}`}>
                   <span className={`font-brand text-lg sm:text-xl font-bold tracking-widest ${isDark ? 'text-[#D4FF00]' : 'text-[#A0C800]'}`}>
                    {format(currentTime, 'HH:mm:ss')}
                   </span>
                   <span className={`ml-2 text-[10px] font-black uppercase tracking-tighter ${isDark ? 'text-white/40' : 'text-slate-600 font-extrabold'}`}>UTC+1</span>
                </div>
                <div className={`h-[1px] flex-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
              </div>
            </div>

            <section className="space-y-6 sm:space-y-8">
              <div className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b pb-4 sm:pb-6 ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-1 rounded-full font-bold text-[10px] sm:text-xs uppercase tracking-tighter transition-all ${
                        activeFilter === filter.id
                          ? 'bg-[#D4FF00] text-[#0A0F1E] shadow-[0_0_15px_rgba(212,255,0,0.3)]'
                          : isDark
                            ? 'border border-white/10 text-white/60 hover:text-white hover:border-white/30'
                            : 'border border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <div className={`text-sm ${isDark ? 'font-medium text-white/60' : 'font-bold text-slate-600'}`}>
                  Date: <span className="text-[#D4FF00] font-bold">{format(new Date(), 'dd MMM yyyy')}</span>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-2 border-[#D4FF00] border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className={`text-lg ${isDark ? 'text-white/60' : 'text-slate-500'}`}>Loading live matches...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className={`text-lg ${isDark ? 'text-white/60' : 'text-slate-500'}`}>{error}</p>
                </div>
              ) : filteredMatches.length > 0 ? (
                <MatchTable matches={filteredMatches} theme={theme} />
              ) : (
                <div className="text-center py-12">
                  <p className={`text-lg ${isDark ? 'text-white/60' : 'text-slate-500'}`}>No matches found for this filter.</p>
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <div className="mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-3 sm:mb-4 tracking-tight leading-none">
                FOOTBALL <span className="text-[#D4FF00]">ARTICLES</span>
              </h1>
              
              <p className={`text-base sm:text-lg max-w-2xl mb-6 sm:mb-8 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                In-depth analysis, transfer news, and stories from the world of football.
              </p>

              <div className="flex items-center gap-3 mb-6 sm:mb-10">
                <div className={`h-[1px] flex-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                <div className="px-6 sm:px-8 py-2.5 rounded-full bg-[#D4FF00] shadow-[0_0_15px_rgba(212,255,0,0.3)]">
                   <span className="font-brand text-lg sm:text-xl font-black tracking-widest text-[#0A0F1E]">
                    COMING SOON
                   </span>
                </div>
                <div className={`h-[1px] flex-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
              </div>
            </div>

            <section className="space-y-6 sm:space-y-8">
              <div className="flex flex-col items-center justify-center py-20 sm:py-32">
                <Logo size={64} />
                <h2 className="text-2xl sm:text-3xl font-black mt-6 mb-4 tracking-tight">
                  LAUNCHING <span className="text-[#D4FF00]">SOON</span>
                </h2>
                <p className={`text-center max-w-md ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                  We're working on bringing you the best football articles, match analysis, and exclusive stories. Stay tuned!
                </p>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className={`relative z-10 border-t py-8 sm:py-12 mt-12 sm:mt-20 ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <Logo size={32} />
          </div>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
            &copy; 2026 EFOOTBALL GLOBAL. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default App;
