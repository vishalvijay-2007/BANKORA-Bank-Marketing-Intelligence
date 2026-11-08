import React from 'react';

interface BankoraLogoProps {
  collapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isDark?: boolean;
}

export const BankoraLogo: React.FC<BankoraLogoProps> = ({ collapsed = false, size = 'md' }) => {

  const iconDims = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Custom Geometric Banking & Predictive Intelligence Emblem */}
      <div
        className={`${iconDims} relative shrink-0 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-[1px] shadow-md shadow-blue-600/20`}
      >
        <div className="w-full h-full rounded-[11px] bg-[#090E21] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/25 via-transparent to-violet-500/25" />
          <svg
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 relative z-10"
          >
            <defs>
              <linearGradient id="bankoraGradA" x1="4" y1="30" x2="32" y2="6" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38BDF8" />
                <stop offset="0.5" stopColor="#3B82F6" />
                <stop offset="1" stopColor="#8B5CF6" />
              </linearGradient>
              <linearGradient id="bankoraGradB" x1="8" y1="8" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#60A5FA" />
                <stop offset="1" stopColor="#A78BFA" />
              </linearGradient>
            </defs>
            {/* Architectural Banking Pediment & Ascending Quant Pillars */}
            <path
              d="M18 5L6 11.5V14H30V11.5L18 5Z"
              fill="url(#bankoraGradA)"
            />
            <rect x="8.5" y="16.5" width="3.8" height="11" rx="1.2" fill="url(#bankoraGradB)" opacity="0.75" />
            <rect x="16.1" y="14.5" width="3.8" height="13" rx="1.2" fill="url(#bankoraGradA)" />
            <rect x="23.7" y="12.5" width="3.8" height="15" rx="1.2" fill="url(#bankoraGradA)" />
            {/* Predictive Trajectory Vector */}
            <path
              d="M6.5 29.5H29.5"
              stroke="url(#bankoraGradA)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {!collapsed && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-black tracking-wider text-base leading-none bg-gradient-to-r from-slate-950 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-100 dark:to-indigo-200 bg-clip-text text-transparent whitespace-nowrap">
              BANKORA
            </span>
            <span className="text-[9px] font-mono font-semibold px-1 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              AI
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 tracking-tight truncate mt-0.5 font-medium">
            Intelligent Banking. Smarter Decisions.
          </span>
        </div>
      )}
    </div>
  );
};
