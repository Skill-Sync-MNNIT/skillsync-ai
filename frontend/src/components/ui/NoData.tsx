import React from 'react';
import { Player } from '@lottiefiles/react-lottie-player';

type AnimationType = 'not-found' | 'search' | 'chat' | 'notifications';

const ANIMATIONS: Record<AnimationType, string> = {
  'not-found': 'https://assets3.lottiefiles.com/packages/lf20_suhe7qtm.json', // Robot 40
  'search': 'https://lottie.host/bf631cb4-c47b-461d-bc02-6240a93156bf/WaIibl6KJK.json', // Requested search animation
  'chat': 'https://lottie.host/fbb21614-aef4-4fed-8984-51aebbe8a522/3uFdrWesv5.json', // Requested chat animation
  'notifications': 'https://lottie.host/972e961f-2c23-4522-a3c8-2353278d1202/TATvJyh4VZ.json' // Requested notification animation
};

interface NoDataProps {
  title: string;
  description?: string;
  height?: string;
  action?: React.ReactNode;
  type?: AnimationType;
}

export const NoData: React.FC<NoDataProps> = ({
  title,
  description,
  height = '250px',
  action,
  type = 'not-found'
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-12 animate-fade-in w-full max-w-lg mx-auto">
      <div className="w-full mix-blend-multiply dark:mix-blend-screen opacity-90 drop-shadow-sm">
        <Player
          autoplay
          loop
          src={ANIMATIONS[type]}
          style={{ height, width: '100%' }}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="mt-8">
          {action}
        </div>
      )}
    </div>
  );
};
