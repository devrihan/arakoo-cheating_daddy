import React, { useEffect, useRef, useState } from 'react';

const OnboardingView = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const [step, setStep] = useState(0);

  // Gradient Animation Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Resize handler
    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Animation vars
    let t = 0;
    let animationId;
    
    // Distinct color palettes for steps
    const palettes = [
        [[20,20,30], [40,30,50]], // Step 0: Purple Dark
        [[10,20,30], [20,40,60]], // Step 1: Blue Dark
        [[20,30,20], [30,50,30]], // Step 2: Green Dark
    ];
    const currentPalette = palettes[step % palettes.length];

    const animate = () => {
      t += 0.005;
      const w = canvas.width;
      const h = canvas.height;
      
      const r1 = currentPalette[0][0] + Math.sin(t) * 10;
      const g1 = currentPalette[0][1] + Math.cos(t) * 10;
      const b1 = currentPalette[0][2] + Math.sin(t * 0.5) * 10;
      
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, `rgb(${r1},${g1},${b1})`);
      gradient.addColorStop(1, `rgb(10,10,10)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resize);
    };
  }, [step]);

  const slides = [
    {
        title: "Welcome to Cheating Daddy",
        desc: "Your invisible AI copilot for interviews, exams, and meetings.",
        icon: "👋"
    },
    {
        title: "Complete Privacy",
        desc: "Running locally with content protection. Invisible to screen sharing tools.",
        icon: "🔒"
    },
    {
        title: "Context Aware",
        desc: "Watches your screen and listens to system audio to give perfect answers.",
        icon: "🧠"
    }
  ];

  const handleNext = () => {
    if (step < slides.length - 1) setStep(s => s + 1);
    else onComplete();
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
      
      <div style={{ 
          position: 'absolute', zIndex: 1, 
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          textAlign: 'center', color: 'white', width: '80%'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>{slides[step].icon}</div>
        <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>{slides[step].title}</h1>
        <p style={{ fontSize: '16px', color: '#ccc', marginBottom: '40px', lineHeight: '1.5' }}>
            {slides[step].desc}
        </p>
        
        <button 
          onClick={handleNext}
          style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '12px 32px',
              borderRadius: '30px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
        >
            {step === slides.length - 1 ? "Get Started" : "Next"}
        </button>

        <div style={{ marginTop: '40px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {slides.map((_, i) => (
                <div key={i} style={{ 
                    width: '8px', height: '8px', borderRadius: '50%', 
                    background: i === step ? 'white' : 'rgba(255,255,255,0.3)' 
                }} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingView;