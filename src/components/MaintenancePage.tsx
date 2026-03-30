import { useEffect, useState } from 'react';

export default function MaintenancePage() {
  const [dots, setDots] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Animasi titik-titik bergerak
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(dotsInterval);
  }, []);

  // Update waktu setiap detik
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="maintenance-page">
      {/* Animated background particles */}
      <div className="particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="particle" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>

      {/* Ornamental Arabic pattern top */}
      <div className="arabic-ornament top">
        <svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,30 Q50,5 100,30 Q150,55 200,30 Q250,5 300,30 Q350,55 400,30" 
                stroke="rgba(167,243,208,0.3)" strokeWidth="1.5" fill="none"/>
          <path d="M0,20 Q50,45 100,20 Q150,-5 200,20 Q250,45 300,20 Q350,-5 400,20" 
                stroke="rgba(167,243,208,0.2)" strokeWidth="1" fill="none"/>
        </svg>
      </div>

      {/* Main content card */}
      <div className="maintenance-card">
        {/* Logo / Icon */}
        <div className="maintenance-icon-wrapper">
          <div className="maintenance-icon">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Gear icon */}
              <circle cx="40" cy="40" r="15" stroke="white" strokeWidth="3" fill="none"/>
              <path d="M40 20 L40 15 M40 65 L40 60 M60 40 L65 40 M15 40 L20 40 
                       M54.1 25.9 L57.7 22.3 M22.3 57.7 L25.9 54.1 
                       M54.1 54.1 L57.7 57.7 M22.3 22.3 L25.9 25.9"
                    stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="40" cy="40" r="6" fill="white" opacity="0.8"/>
            </svg>
          </div>
          <div className="maintenance-icon-ring" />
          <div className="maintenance-icon-ring ring-2" />
        </div>

        {/* Arabic text */}
        <p className="arabic-text">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>

        {/* Main title */}
        <h1 className="maintenance-title">Sedang Dalam Pemeliharaan</h1>
        <p className="maintenance-subtitle">Under Maintenance</p>

        {/* Divider */}
        <div className="maintenance-divider">
          <span />
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                  stroke="#6ee7b7" strokeWidth="1.5" fill="rgba(16,185,129,0.2)"/>
          </svg>
          <span />
        </div>

        {/* Message */}
        <p className="maintenance-message">
          Kami sedang melakukan pembaruan dan perbaikan sistem untuk memberikan pengalaman yang lebih baik bagi Anda.
          Silsilah Digital Keluarga Iman Diharjo akan segera kembali.
        </p>

        {/* Animated loading bar */}
        <div className="loading-bar-container">
          <div className="loading-bar">
            <div className="loading-bar-fill" />
          </div>
          <p className="loading-text">Memproses pembaruan{dots}</p>
        </div>

        {/* Info cards */}
        <div className="info-cards">
          <div className="info-card">
            <div className="info-card-icon">🔧</div>
            <div>
              <p className="info-card-label">Status</p>
              <p className="info-card-value">Pemeliharaan Aktif</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-card-icon">🕐</div>
            <div>
              <p className="info-card-label">Waktu Saat Ini</p>
              <p className="info-card-value">{formatTime(currentTime)}</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-card-icon">📅</div>
            <div>
              <p className="info-card-label">Tanggal</p>
              <p className="info-card-value">{formatDate(currentTime)}</p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="maintenance-footer">
          Terima kasih atas kesabaran Anda 🙏
        </p>
      </div>

      {/* Ornamental Arabic pattern bottom */}
      <div className="arabic-ornament bottom">
        <svg viewBox="0 0 400 60" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,30 Q50,5 100,30 Q150,55 200,30 Q250,5 300,30 Q350,55 400,30" 
                stroke="rgba(167,243,208,0.3)" strokeWidth="1.5" fill="none"/>
          <path d="M0,40 Q50,15 100,40 Q150,65 200,40 Q250,15 300,40 Q350,65 400,40" 
                stroke="rgba(167,243,208,0.2)" strokeWidth="1" fill="none"/>
        </svg>
      </div>

      <style>{`
        .maintenance-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #064e3b 0%, #065f46 25%, #047857 50%, #065f46 75%, #064e3b 100%);
          position: relative;
          overflow: hidden;
          padding: 2rem;
          font-family: 'Inter', sans-serif;
        }

        /* Particles */
        .particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(167, 243, 208, 0.4);
          border-radius: 50%;
          animation: floatParticle calc(8s + var(--i, 0) * 0.5s) ease-in-out infinite;
          left: calc(var(--i, 0) * 5.5%);
          top: 100%;
        }
        @keyframes floatParticle {
          0% { top: 100%; opacity: 0; transform: scale(0); }
          10% { opacity: 1; transform: scale(1); }
          90% { opacity: 0.5; }
          100% { top: -5%; opacity: 0; transform: scale(0.5); }
        }

        /* Ornaments */
        .arabic-ornament {
          position: absolute;
          width: 100%;
          max-width: 600px;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0.6;
        }
        .arabic-ornament.top { top: 20px; }
        .arabic-ornament.bottom { bottom: 20px; }

        /* Card */
        .maintenance-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(167, 243, 208, 0.2);
          border-radius: 2rem;
          padding: 3rem 2.5rem;
          max-width: 560px;
          width: 100%;
          text-align: center;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.1);
          position: relative;
          z-index: 10;
        }

        /* Icon */
        .maintenance-icon-wrapper {
          position: relative;
          width: 100px;
          height: 100px;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .maintenance-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
          animation: spinGear 4s linear infinite;
          position: relative;
          z-index: 2;
        }
        @keyframes spinGear {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .maintenance-icon-ring {
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 2px dashed rgba(167, 243, 208, 0.4);
          animation: spinRing 8s linear infinite reverse;
        }
        .ring-2 {
          inset: -15px;
          border-style: dotted;
          opacity: 0.3;
          animation-duration: 12s;
        }
        @keyframes spinRing {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Arabic text */
        .arabic-text {
          font-size: 1.3rem;
          color: rgba(167, 243, 208, 0.9);
          margin-bottom: 1rem;
          letter-spacing: 0.05em;
          direction: rtl;
        }

        /* Title */
        .maintenance-title {
          font-size: 1.8rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.25rem;
          line-height: 1.2;
        }
        .maintenance-subtitle {
          font-size: 1rem;
          color: rgba(167, 243, 208, 0.7);
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }

        /* Divider */
        .maintenance-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .maintenance-divider span {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(167, 243, 208, 0.3), transparent);
        }

        /* Message */
        .maintenance-message {
          color: rgba(209, 250, 229, 0.8);
          font-size: 0.95rem;
          line-height: 1.7;
          margin-bottom: 2rem;
        }

        /* Loading bar */
        .loading-bar-container {
          margin-bottom: 2rem;
        }
        .loading-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 0.75rem;
        }
        .loading-bar-fill {
          height: 100%;
          width: 60%;
          background: linear-gradient(90deg, #10b981, #34d399, #6ee7b7);
          border-radius: 999px;
          animation: loadingPulse 2.5s ease-in-out infinite;
        }
        @keyframes loadingPulse {
          0% { width: 20%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 20%; margin-left: 80%; }
        }
        .loading-text {
          font-size: 0.85rem;
          color: rgba(167, 243, 208, 0.6);
          min-width: 180px;
          text-align: center;
        }

        /* Info cards */
        .info-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 480px) {
          .info-cards { grid-template-columns: 1fr; }
          .maintenance-title { font-size: 1.4rem; }
          .maintenance-card { padding: 2rem 1.5rem; }
        }
        .info-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(167, 243, 208, 0.15);
          border-radius: 1rem;
          padding: 0.875rem 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-align: left;
          transition: background 0.2s;
        }
        .info-card:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .info-card-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        .info-card-label {
          font-size: 0.7rem;
          color: rgba(167, 243, 208, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.1rem;
        }
        .info-card-value {
          font-size: 0.8rem;
          color: rgba(209, 250, 229, 0.9);
          font-weight: 600;
          line-height: 1.3;
        }

        /* Footer */
        .maintenance-footer {
          font-size: 0.85rem;
          color: rgba(167, 243, 208, 0.5);
        }
      `}</style>
    </div>
  );
}
