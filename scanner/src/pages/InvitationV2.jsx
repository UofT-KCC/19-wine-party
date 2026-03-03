import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { initInvitationV2Engine } from './invitationEngineV2';
import './InvitationV2.css';

// SVG Assets
import titleSvg from '../assets/title.svg';
import blinkPng from '../assets/blink.png';
import slide1Svg from '../assets/slide-1.svg';
import slide2Svg from '../assets/slide-2.svg';
import slide3Svg from '../assets/slide-3.svg';

const InvitationV2 = () => {
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
      engineRef.current = initInvitationV2Engine(canvasContainerRef.current);
    }

    const observerOptions = {
      threshold: 0.1,
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          const sections = document.querySelectorAll('.v2-section');
          const index = Array.from(sections).indexOf(entry.target);
          if (index !== -1) {
            setActiveIndex(index);
          }
        } else {
          entry.target.classList.remove('visible');
        }
      });
    }, observerOptions);

    const engineVisibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          engineRef.current?.resume();
        } else {
          engineRef.current?.pause();
        }
      });
    }, { threshold: 0 });

    const sectionsList = document.querySelectorAll('.v2-section');
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

    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      engineRef.current?.setScrollProgress(0);
    }

    // Set Page Title
    document.title = "Your invitation to Re;Wined";

    return () => {
      sectionObserver.disconnect();
      engineVisibilityObserver.disconnect();
      container?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      engineRef.current?.dispose();
    };
  }, []);

  const scrollToSection = (index) => {
    const sections = document.querySelectorAll('.v2-section');
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
    <div className="v2-root" ref={scrollRef}>
      <div className="v2-bg-glow" aria-hidden="true" />
      
      {/* 3D Canvas Container */}
      <div className="v2-canvas-wrapper" ref={canvasContainerRef}></div>

      {/* Phase 0: Title Section */}
      <section className="v2-section v2-logo-hero">
        <div className="v2-slide-container v2-title-box">
          <img src={titleSvg} alt="Title Slide" className="v2-slide-img" />
          <img src={blinkPng} alt="Blink" className="v2-title-blink" />
        </div>
      </section>

      {/* Phase 1: Slide 1 */}
      <section className="v2-section">
        <div className="v2-slide-container">
          <img src={slide1Svg} alt="Slide 1" className="v2-slide-img" />
          <img src={blinkPng} alt="Blink" className="v2-title-blink-slides" />
        </div>
      </section>

      {/* Phase 2: Slide 2 */}
      <section className="v2-section">
        <div className="v2-slide-container">
          <img src={slide2Svg} alt="Slide 2" className="v2-slide-img" />
          <img src={blinkPng} alt="Blink" className="v2-title-blink-slides" />
        </div>
      </section>

      {/* Phase 3: Slide 3 with QR Overlay */}
      <section className="v2-section">
        <div className="v2-slide-container">
          <img src={slide3Svg} alt="Slide 3" className="v2-slide-img" />
          <img src={blinkPng} alt="Blink" className="v2-title-blink-slides" />
          <div className="v2-qr-overlay">
            <div className="v2-qr-container">
              {submitted && code ? (
                <div 
                  className="v2-qr-box-absolute" 
                  onClick={() => !initialCode && setSubmitted(false)} 
                  style={{ cursor: !initialCode ? 'pointer' : 'default' }}
                >
                  <QRCode 
                    value={code}
                    size={160}
                    fgColor="white"
                    bgColor="transparent"
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                  />
                  {!initialCode && <p className="v2-qr-hint">Tap to edit</p>}
                </div>
              ) : (
                <form className="v2-qr-input-form" onSubmit={handleCodeSubmit}>
                  <input 
                    type="text" 
                    value={code}
                    placeholder="ENTER CODE" 
                    className="v2-qr-input"
                    onChange={(e) => setCode(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="v2-qr-submit">GET QR</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Visual background elements */}
      <div className="v2-floating" style={{ top: '20%', left: '10%' }}></div>
      <div className="v2-floating" style={{ top: '70%', right: '15%', animationDelay: '2s' }}></div>

      {/* Scroll Hint */}
      <div className={`v2-scroll-hint ${!showScrollHint ? 'hidden' : ''}`}>
        <div className="v2-arrow"></div>
        <span>SCROLL</span>
      </div>

      {/* Navigation Dots */}
      <div className={`v2-nav-dots ${activeIndex === 0 ? 'hidden' : ''}`}>
        {[0, 1, 2, 3].map((index) => (
          <button
            key={index}
            className={`v2-nav-dot ${activeIndex === index ? 'active' : ''}`}
            onClick={() => scrollToSection(index)}
            aria-label={`Go to section ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default InvitationV2;
