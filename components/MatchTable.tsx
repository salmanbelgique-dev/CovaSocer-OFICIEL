
import React, { useState } from 'react';
import { Match, MatchStatus, Theme } from '../types';
import { format } from 'date-fns';
import { Clock, Play, CheckCircle, Pause } from 'lucide-react';

// Helper to get display text for live match status
function getLiveDisplayText(match: Match): string {
  const state = match.stateName || '';
  if (state === 'HT') return 'HT';
  if (state === 'PEN_BREAK') return 'PEN';
  if (state === 'INPLAY_PENALTIES') return 'PEN';
  if (match.liveMinute != null) return `${match.liveMinute}'`;
  return 'LIVE';
}

function isHalfTime(match: Match): boolean {
  return match.stateName === 'HT';
}

interface MatchTableProps {
  matches: Match[];
  theme: Theme;
}

export const MatchTable: React.FC<MatchTableProps> = ({ matches, theme }) => {
  const isDark = theme === 'dark';
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleClick = (id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {matches.map((match) => {
        const isSelected = selectedId === match.id;

        const cardHighlight = isDark
          ? 'border-[#D4FF00]/60 bg-[#D4FF00]/[0.04] shadow-[0_0_20px_rgba(212,255,0,0.08)] scale-[1.01]'
          : 'shadow-lg border-blue-400 scale-[1.01]';

        const logoCircleHighlight = isDark
          ? 'border-[#D4FF00]/30 bg-[#D4FF00]/5'
          : 'border-blue-300 bg-blue-50';

        return (
        <div 
          key={match.id}
          onClick={() => handleClick(match.id)}
          className={`group relative overflow-hidden transition-all duration-300 rounded-xl sm:rounded-2xl border cursor-pointer ${
            isDark 
              ? `bg-white/[0.03] border-white/10 sm:hover:border-[#D4FF00]/60 sm:hover:bg-[#D4FF00]/[0.04] sm:hover:shadow-[0_0_20px_rgba(212,255,0,0.08)] sm:hover:scale-[1.01] ${isSelected ? cardHighlight : ''}` 
              : `bg-white border-slate-200 shadow-sm sm:hover:shadow-lg sm:hover:border-blue-400 sm:hover:scale-[1.01] ${isSelected ? cardHighlight : ''}`
          }`}
        >
          {match.status === MatchStatus.LIVE && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4FF00]"></div>
          )}

          <div className="p-4 sm:p-6">
            <div className="flex flex-col items-center gap-4 sm:hidden">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isDark 
                      ? `bg-white/5 border-white/10 ${isSelected ? logoCircleHighlight : ''}`
                      : `bg-slate-50 border-slate-100 ${isSelected ? logoCircleHighlight : ''}`
                  }`}>
                    <img src={match.homeTeam.logo} alt={match.homeTeam.name} className={`w-6 h-6 object-contain transition-all duration-300 ${isSelected ? '' : 'grayscale'}`} />
                  </div>
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {match.homeTeam.name}
                  </span>
                </div>
                
                <div className="flex flex-col items-center px-3 min-w-[80px]">
                  {match.status === MatchStatus.UPCOMING ? (
                    <span className={`text-xl font-black font-brand ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {format(new Date(match.startTime), 'HH:mm')}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-black font-brand ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {match.score.home}
                      </span>
                      <span className="text-white/30">-</span>
                      <span className={`text-2xl font-black font-brand ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {match.score.away}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className={`text-sm font-bold text-right ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {match.awayTeam.name}
                  </span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isDark 
                      ? `bg-white/5 border-white/10 ${isSelected ? logoCircleHighlight : ''}`
                      : `bg-slate-50 border-slate-100 ${isSelected ? logoCircleHighlight : ''}`
                  }`}>
                    <img src={match.awayTeam.logo} alt={match.awayTeam.name} className={`w-6 h-6 object-contain transition-all duration-300 ${isSelected ? '' : 'grayscale'}`} />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between w-full">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">
                  {match.league}
                </span>
                {match.status === MatchStatus.UPCOMING && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-500/10 text-slate-500">
                    <Clock size={8} /> Upcoming
                  </span>
                )}
                {match.status === MatchStatus.LIVE && (
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${isHalfTime(match) ? 'bg-orange-500/20 text-orange-400' : 'bg-[#D4FF00]/20 text-[#D4FF00] animate-pulse'}`}>
                    {isHalfTime(match) ? <Pause size={8} /> : <Play size={8} fill="currentColor" />} {getLiveDisplayText(match)}
                  </span>
                )}
                {match.status === MatchStatus.FINISHED && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-white/10 text-white/50">
                    <CheckCircle size={8} /> FT
                  </span>
                )}
              </div>
            </div>

            <div className="hidden sm:flex items-center justify-between gap-6">
              <div className="flex-1 flex items-center justify-end gap-4">
                <span className={`text-lg md:text-xl font-bold tracking-tight text-right ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {match.homeTeam.name}
                </span>
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isDark ? 'bg-white/5 border-white/10 group-hover:border-[#D4FF00]/30 group-hover:bg-[#D4FF00]/5' : 'bg-slate-50 border-slate-100 group-hover:border-blue-300 group-hover:bg-blue-50'
                }`}>
                  <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-8 h-8 md:w-10 md:h-10 object-contain grayscale group-hover:grayscale-0 transition-all duration-300" />
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-2 px-8 min-w-[180px]">
                 <div className="mb-2">
                  {match.status === MatchStatus.UPCOMING && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-500/10 text-slate-500 border border-slate-500/20">
                      <Clock size={10} /> Upcoming
                    </span>
                  )}
                  {match.status === MatchStatus.LIVE && (
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isHalfTime(match) ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' : 'bg-[#D4FF00]/20 text-[#D4FF00] border-[#D4FF00]/40 animate-pulse'}`}>
                      {isHalfTime(match) ? <Pause size={10} /> : <Play size={10} fill="currentColor" />} {isHalfTime(match) ? 'Half Time' : `Live • ${getLiveDisplayText(match)}`}
                    </span>
                  )}
                  {match.status === MatchStatus.FINISHED && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-white/50 border border-white/10">
                      <CheckCircle size={10} /> Finished
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center gap-4">
                  {match.status === MatchStatus.UPCOMING ? (
                    <div className={`text-2xl md:text-3xl font-black font-brand ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {format(new Date(match.startTime), 'HH:mm')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-6">
                      <span className={`text-4xl md:text-5xl font-black font-brand ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {match.score.home}
                      </span>
                      <span className="text-white/20 text-2xl font-light">:</span>
                      <span className={`text-4xl md:text-5xl font-black font-brand ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {match.score.away}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                  {match.league}
                </div>
              </div>

              <div className="flex-1 flex items-center justify-start gap-4">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isDark ? 'bg-white/5 border-white/10 group-hover:border-[#D4FF00]/30 group-hover:bg-[#D4FF00]/5' : 'bg-slate-50 border-slate-100 group-hover:border-blue-300 group-hover:bg-blue-50'
                }`}>
                  <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-8 h-8 md:w-10 md:h-10 object-contain grayscale group-hover:grayscale-0 transition-all duration-300" />
                </div>
                <span className={`text-lg md:text-xl font-bold tracking-tight text-left ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {match.awayTeam.name}
                </span>
              </div>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
};
