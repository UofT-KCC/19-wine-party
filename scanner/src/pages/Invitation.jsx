import { useEffect, useRef } from 'react';
import { initInvitationEngine } from './invitationEngine';
import './Invitation.css';

const Invitation = () => {
  const scrollRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    if (canvasContainerRef.current) {
      engineRef.current = initInvitationEngine(canvasContainerRef.current);
    }

    const observerOptions = {
      threshold: 0.1, // Trigger when even a small part is visible
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else {
          entry.target.classList.remove('visible');
        }
      });
    }, observerOptions);

    // Visibility-based pausing for 3D Engine (Best Practice)
    const engineVisibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          engineRef.current?.resume();
        } else {
          engineRef.current?.pause();
        }
      });
    }, { threshold: 0 });

    const sections = document.querySelectorAll('.v3-section');
    sections.forEach((section) => sectionObserver.observe(section));
    
    if (canvasContainerRef.current) {
      engineVisibilityObserver.observe(canvasContainerRef.current);
    }

    const handleScroll = () => {
      if (scrollRef.current && engineRef.current) {
        const scrollTop = scrollRef.current.scrollTop;
        const scrollHeight = scrollRef.current.scrollHeight - scrollRef.current.clientHeight;
        const progress = Math.max(0, Math.min(1, scrollTop / scrollHeight));
        engineRef.current.setScrollProgress(progress);
      }
    };

    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }

    const handleResize = () => {
      engineRef.current?.onResize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      sectionObserver.disconnect();
      engineVisibilityObserver.disconnect();
      container?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      engineRef.current?.dispose();
    };
  }, []);

  return (
    <div className="v3-root" ref={scrollRef}>
      <div className="v3-bg-glow" aria-hidden="true" />
      
      {/* 3D Canvas Container - Sticky Background */}
      <div className="v3-canvas-wrapper" ref={canvasContainerRef}></div>

      {/* Phase 1: Logo Hero Section */}
      <section className="v3-section v3-logo-hero">
        <div className="v3-logo-box">
          <img src="/icons/logo.png" alt="Wine Party Logo" className="v3-main-logo" />
        </div>
      </section>

      {/* Phase 2: Hero Section */}
      <section className="v3-section">
        <div className="v3-card">
          <h1>함께하면 더<br/>특별한 밤.</h1>
          <p>오늘, UTKCC와 함께 건배하세요</p>
        </div>
      </section>

      {/* Phase 3: Story Section */}
      <section className="v3-section">
        <div className="v3-card">
          <h1>대화가 쌓일수록<br/>깊어진다.</h1>
          <p>
            서로의 잔을 채우며 시작되는 대화,<br/>
            특별한 공연과 함께하는 풍성한 디너가<br/>
            여러분을 기다립니다.
          </p>
        </div>
      </section>

      {/* Phase 4: QR Section */}
      <section className="v3-section">
        <div className="v3-card">
          <h1>INVITATION</h1>
          <div className="v3-qr-box">
            <img src="/icons/qrcode.png" alt="QR Code" />
          </div>
          
          <div className="v3-info">
            <div className="v3-info-row">
              <span className="v3-info-label">TIME</span>
              <span className="v3-info-value">2026. 03. 14. 18:00</span>
            </div>
            <div className="v3-info-row">
              <span className="v3-info-label">PLACE</span>
              <span className="v3-info-value">강남구 테헤란로 카페 루이</span>
            </div>
          </div>
        </div>
      </section>

      {/* Visual background elements */}
      <div className="v3-floating" style={{ top: '20%', left: '10%' }}></div>
      <div className="v3-floating" style={{ top: '70%', right: '15%', animationDelay: '2s' }}></div>
    </div>
  );
};

export default Invitation;
