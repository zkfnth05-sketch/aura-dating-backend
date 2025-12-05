'use client';

export default function SplashScreen() {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
        <div className="relative flex items-center justify-center">
          {/* Aura Logo */}
          <span className="font-headline text-6xl font-bold text-primary z-10 scale-y-[.85]">
            Aura
          </span>
        </div>
      </div>
    );
  }
  