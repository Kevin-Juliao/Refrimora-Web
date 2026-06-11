import { useEffect, useState, useMemo } from 'react';

export default function LoginTransition({ onComplete }) {
  const [stage, setStage] = useState('off'); // 'off' -> 'on' -> 'zoom' -> 'explode' -> 'fadeout'

  useEffect(() => {
    // Stage timings:
    // 0.0s: 'off' (initial render)
    // 0.3s: 'on' (AC turns on, starts blowing air and small snowflakes)
    // 1.5s: 'zoom' (Central snowflake appears and starts growing to cover the screen)
    // 2.3s: 'explode' (Central snowflake pops/explodes into expansion particles)
    // 3.2s: 'fadeout' (Overlay starts fading out)
    // 3.5s: Trigger onComplete

    const tOn = setTimeout(() => setStage('on'), 300);
    const tZoom = setTimeout(() => setStage('zoom'), 1500);
    const tExplode = setTimeout(() => setStage('explode'), 2300);
    const tFade = setTimeout(() => setStage('fadeout'), 3200);
    const tComplete = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3550);

    return () => {
      clearTimeout(tOn);
      clearTimeout(tZoom);
      clearTimeout(tExplode);
      clearTimeout(tFade);
      clearTimeout(tComplete);
    };
  }, [onComplete]);

  // Generate falling snowflake configs
  const snowflakes = useMemo(() => {
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 14 + 8, // 8px to 22px
      delay: `${Math.random() * 1.5}s`,
      duration: `${Math.random() * 1.8 + 1.2}s`,
      wobble: `${Math.random() * 30 - 15}px`,
    }));
  }, []);

  // Generate expansion particles for the pop explosion
  const explosionParticles = useMemo(() => {
    return Array.from({ length: 36 }).map((_, i) => {
      const angle = (i * 10) + Math.random() * 8;
      const rad = (angle * Math.PI) / 180;
      const dist = Math.random() * 160 + 120; // Explosion radius distance
      return {
        id: i,
        x: `${Math.cos(rad) * dist}px`,
        y: `${Math.sin(rad) * dist}px`,
        size: Math.random() * 8 + 4,
        duration: `${Math.random() * 0.4 + 0.5}s`,
      };
    });
  }, []);

  return (
    <div className={`login-transition-overlay ${stage}`}>
      <div className="login-transition-container">
        
        {/* Background glow elements */}
        <div className="ac-portal-glow" />
        
        {/* Stage 1: The Air Conditioner Unit */}
        {(stage === 'off' || stage === 'on' || stage === 'zoom') && (
          <div className={`transition-ac-wrapper ${stage === 'on' || stage === 'zoom' ? 'ac-active' : ''}`}>
            {/* The AC Split Body */}
            <div className="transition-ac-body">
              {/* Brand Logo inside AC */}
              <div className="ac-brand">❄ Refrimora</div>
              
              {/* Digital Temp Indicator */}
              <div className="ac-display">16°C</div>
              
              {/* Air Swing Flap (moves down on active) */}
              <div className="ac-swing-flap" />
              
              {/* LED Lights */}
              <div className="ac-led-indicator">
                <span className="led-power" />
                <span className="led-timer" />
              </div>
            </div>
            
            {/* Air flow breeze indicators */}
            <div className="ac-breeze-flow">
              <div className="breeze-wave breeze-1" />
              <div className="breeze-wave breeze-2" />
              <div className="breeze-wave breeze-3" />
            </div>
          </div>
        )}

        {/* Small drifting snowflakes while AC is blowing */}
        {(stage === 'on' || stage === 'zoom') && (
          <div className="transition-snowflakes-container">
            {snowflakes.map(sf => (
              <svg 
                key={sf.id} 
                className="drifting-snowflake"
                style={{
                  left: sf.left,
                  width: sf.size,
                  height: sf.size,
                  animationDelay: sf.delay,
                  animationDuration: sf.duration,
                  '--wobble-offset': sf.wobble
                }}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                <line x1="4.93" y1="19.07" x2="19.07" y2="4.93" />
              </svg>
            ))}
          </div>
        )}

        {/* Stage 2 & 3: Central Snowflake Zoom & Explosion */}
        {(stage === 'zoom' || stage === 'explode') && (
          <div className="zoom-snowflake-wrapper">
            <svg 
              className={`major-snowflake ${stage === 'explode' ? 'exploding' : ''}`}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.2"
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              <line x1="4.93" y1="19.07" x2="19.07" y2="4.93" />
              {/* Extra details on the major snowflake */}
              <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M12 6l-2 2M12 6l2 2M12 18l-2-2M12 18l2-2" />
              <path d="M6 12l2-2M6 12l2 2M18 12l-2-2M18 12l2 2" />
            </svg>

            {/* Stage 3: Burst particles on explode */}
            {stage === 'explode' && (
              <div className="explosion-particles">
                {explosionParticles.map(p => (
                  <span
                    key={p.id}
                    className="burst-particle"
                    style={{
                      '--target-x': p.x,
                      '--target-y': p.y,
                      width: p.size,
                      height: p.size,
                      animationDuration: p.duration,
                    }}
                  />
                ))}
                {/* Shockwave expanding circle */}
                <div className="shockwave-ring" />
              </div>
            )}
          </div>
        )}

        {/* Audio click visual effect */}
        {stage === 'explode' && <div className="flash-white-overlay" />}

      </div>
    </div>
  );
}
