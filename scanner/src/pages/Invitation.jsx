import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { initInvitationEngine } from './invitationEngine';
import './Invitation.css';

const Invitation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialCode = queryParams.get('code') || '';

  const [code, setCode] = useState(initialCode);
  const [submitted, setSubmitted] = useState(!!initialCode);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
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
          
          // Determine the index of the intersecting section
          const sections = document.querySelectorAll('.v3-section');
          const index = Array.from(sections).indexOf(entry.target);
          if (index !== -1) {
            setActiveIndex(index);
          }
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

    const sectionsList = document.querySelectorAll('.v3-section');
    sectionsList.forEach((section) => sectionObserver.observe(section));
    
    if (canvasContainerRef.current) {
      engineVisibilityObserver.observe(canvasContainerRef.current);
    }

    const handleScroll = () => {
      if (scrollRef.current && engineRef.current) {
        const scrollTop = scrollRef.current.scrollTop;
        const scrollHeight = scrollRef.current.scrollHeight - scrollRef.current.clientHeight;
        const progress = Math.max(0, Math.min(1, scrollTop / scrollHeight));
        engineRef.current.setScrollProgress(progress);

        // Hide hint when nearing the end (Phase 4)
        if (progress > 0.8) {
          setShowScrollHint(false);
        } else if (progress < 0.1) {
          setShowScrollHint(true);
        }
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

    // Force scroll to top on mount and set initial progress
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      engineRef.current?.setScrollProgress(0);
    }

    return () => {
      sectionObserver.disconnect();
      engineVisibilityObserver.disconnect();
      container?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      engineRef.current?.dispose();
    };
  }, []);

  const scrollToSection = (index) => {
    const sections = document.querySelectorAll('.v3-section');
    if (sections[index]) {
      sections[index].scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCodeSubmit = (e) => {
    if (e) e.preventDefault();
    if (code.trim()) {
      setSubmitted(true);
      navigate(`?code=${encodeURIComponent(code.trim())}`, { replace: true });
    }
  };

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
        <div className="v3-card v3-card-hero">
          <div className="v3-hero-tag">UTKCC 2026</div>
          <h1 className="v3-title-rewined">RE;WINED</h1>
          <p className="v3-tagline">Your Career, Aging to Excellence 🍷</p>
          
          <div className="v3-hero-questions">
            <p className="v3-q-item"><span>📌</span> 의미 있는 연결을 찾고 계신가요?</p>
            <p className="v3-q-item"><span>📌</span> 커리어의 방향을 더 그리고 싶으신가요?</p>
            <p className="v3-q-item"><span>📌</span> 깊이 있는 인사이트가 필요하신가요?</p>
          </div>
        </div>
      </section>

      {/* Phase 3: Program Section */}
      <section className="v3-section">
        <div className="v3-card v3-card-program">
          <h2 className="v3-program-title">PROGRAM</h2>
          
          <div className="v3-program-group">
            <div className="v3-part-header">🍷 Part 1 | Insight Pairing</div>
            <div className="v3-program-item">
              <span className="v3-icon">✉️</span>
              <div className="v3-item-content">
                <strong>1-1 | Fireside Chat Panel</strong>
                <span>각 분야 선배님들과의 Q&A 패널 토크</span>
              </div>
            </div>
            <div className="v3-program-item">
              <span className="v3-icon">✉️</span>
              <div className="v3-item-content">
                <strong>1-2 | Your Story, Their Advice</strong>
                <span>사전 질문 기반 인터랙티브 Q&A</span>
              </div>
            </div>
          </div>

          <div className="v3-program-divider"></div>

          <div className="v3-program-group">
            <div className="v3-part-header">🍷 Part 2 | Career Networking</div>
            <div className="v3-program-item">
              <span className="v3-icon">✉️</span>
              <div className="v3-item-content">
                <strong>2-1 | Industry Group Networking</strong>
                <span>관심 분야별 소규모 그룹 세션</span>
              </div>
            </div>
            <div className="v3-program-item">
              <span className="v3-icon">✉️</span>
              <div className="v3-item-content">
                <strong>2-2 | Open Networking</strong>
                <span>자유로운 대화와 인연의 확장</span>
              </div>
            </div>
          </div>
          
          <p className="v3-program-footer">좋은 대화와 새로운 연결이 숙성되는 순간.</p>
        </div>
      </section>

      {/* Phase 4: QR Section */}
      <section className="v3-section">
        <div className="v3-card v3-card-invitation">
          <h1>INVITATION</h1>
          <div className="v3-qr-box">
            <div className="v3-qr-container">
              {submitted && code ? (
                <div className="v3-qr-display" onClick={() => !initialCode && setSubmitted(false)} style={{ cursor: !initialCode ? 'pointer' : 'default' }}>
                  <QRCode 
                    value={code}
                    size={180}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                  />
                  {!initialCode && <p className="v3-qr-hint">Tap to edit</p>}
                </div>
              ) : (
                <form className="v3-qr-input-form" onSubmit={handleCodeSubmit}>
                  <input 
                    type="text" 
                    value={code}
                    placeholder="Enter code" 
                    className="v3-qr-input"
                    onChange={(e) => setCode(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="v3-qr-submit">ENTER</button>
                </form>
              )}
            </div>
          </div>
          {submitted && code && (
            <p className="v3-qr-footer">SCAN AT ENTRANCE</p>
          )}
          
          <div className="v3-info">
            <div className="v3-info-row">
              <span className="v3-info-label">TIME</span>
              <span className="v3-info-value">March 7, 2026 7PM</span>
            </div>
            <div className="v3-info-row">
              <span className="v3-info-label">PLACE</span>
              <span className="v3-info-value">1 Bloor St E</span>
            </div>
            <div className="v3-info-row">
              <span className="v3-info-label">DRESS CODE</span>
              <span className="v3-info-value">Formal Cocktail Attire</span>
            </div>
          </div>
        </div>
      </section>

      {/* Visual background elements */}
      <div className="v3-floating" style={{ top: '20%', left: '10%' }}></div>
      <div className="v3-floating" style={{ top: '70%', right: '15%', animationDelay: '2s' }}></div>

      {/* Scroll Hint */}
      <div className={`v3-scroll-hint ${!showScrollHint ? 'hidden' : ''}`}>
        <div className="v3-arrow"></div>
        <span>SCROLL</span>
      </div>

      {/* Navigation Dots */}
      <div className={`v3-nav-dots ${activeIndex === 0 ? 'hidden' : ''}`}>
        {[0, 1, 2, 3].map((index) => (
          <button
            key={index}
            className={`v3-nav-dot ${activeIndex === index ? 'active' : ''}`}
            onClick={() => scrollToSection(index)}
            aria-label={`Go to section ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Invitation;
