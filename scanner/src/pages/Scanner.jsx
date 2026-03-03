import { useState, useCallback, useRef, useEffect } from 'react';
import QRScanner from '../components/QRScanner';
import './Scanner.css';

function Scanner() {
  useEffect(() => {
    document.title = "Wine Party QR Scanner";
  }, []);

  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [userName, setUserName] = useState('');
  const [subMessage, setSubMessage] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  
  const isProcessingRef = useRef(false);
  const timeoutRef = useRef(null);
  const lastScannedCodeRef = useRef(null);
  const lastScannedTimeRef = useRef(0);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      // Use square wave for a more realistic barcode scanner beep
      // 'square' produces a buzzy, electronic sound typical of store scanners
      oscillator.type = 'square'; 
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      
      // Duration set to 0.2s
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.2);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.log('Audio not supported or blocked');
    }
  };

  const onScanSuccess = useCallback((decodedText) => {
    const now = Date.now();
    
    // 같은 QR 코드를 3초 안에 다시 스캔하는 것 방지 (중복 호출 방지)
    if (lastScannedCodeRef.current === decodedText && (now - lastScannedTimeRef.current < 3000)) {
      return;
    }

    // 서버와 통신(fetch) 중일 때만 다른 스캔을 차단함
    if (isProcessingRef.current) return; 
    
    // 이전 스캔의 안내 초기화 타이머를 중지하고 새로운 스캔 결과로 덮어쓰기 준비
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    lastScannedCodeRef.current = decodedText;
    lastScannedTimeRef.current = now;

    playBeep();
    
    isProcessingRef.current = true;
    setIsProcessing(true);
    setStatus({ type: 'loading', text: '데이터 확인 중...' });
    setUserName('');
    setSubMessage('');

    const resetScanner = () => {
      setScanSuccess(false);
      setStatus({ type: '', text: '' });
      setUserName('');
      setSubMessage('');
      setIsProcessing(false);
      lastScannedCodeRef.current = null; // 리셋되면 같은 QR도 바로 다시 스캔 가능
    };

    fetch(`${import.meta.env.VITE_GAS_URL}?id=${decodedText}`, { redirect: 'follow' })
      .then(response => response.json())
      .then(data => {
        // 서버 응답이 왔으므로, 결과 화면과는 무관하게 새로운 스캔을 즉시 허용
        isProcessingRef.current = false;
        setIsProcessing(false);

        if (data.status === "success" || data.status === "already") {
          setScanSuccess(true);
          setStatus({ 
            type: 'success', // 강제 초록색 적용
            text: data.status === "success" ? '✅ 체크인 성공!' : '✅ 이미 입장 완료' 
          });
          setUserName(`환영합니다, ${data.name}님.`);
          setSubMessage('명찰을 수령해주세요.');
          
          timeoutRef.current = setTimeout(resetScanner, 8000); // 8초 뒤 화면 리셋
        } else {
          // 유효하지 않은 코드
          setScanSuccess(false);
          setStatus({ type: 'error', text: `유효하지 않은 코드입니다: ${decodedText}` });
          timeoutRef.current = setTimeout(resetScanner, 3000); // 에러는 3초 뒤 화면 리셋
        }
      })
      .catch(err => {
        console.error(err);
        isProcessingRef.current = false;
        setIsProcessing(false);
        setScanSuccess(false);
        setStatus({ type: 'error', text: `오류가 발생했습니다: ${decodedText}` });
        timeoutRef.current = setTimeout(resetScanner, 3000);
      });
  }, []); 

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="scanner-page">
      <div className="v3-bg-glow" aria-hidden="true" />
      
      <button className="v3-fullscreen-btn" onClick={toggleFullScreen} aria-label="Toggle Fullscreen">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      </button>
      
      {/* Visual background elements */}
      <div className="v3-floating" style={{ top: '10%', left: '-10%' }}></div>
      <div className="v3-floating" style={{ bottom: '-10%', right: '-10%', animationDelay: '5s' }}></div>
      
      <div className="app-container">
        <div className="header-section">
          <h2 className="title">UTKCC 19th Wine Party</h2>
          <p className="subtitle">Please Scan your Invitation QR Code</p>
        </div>
        
        <div className="main-content">
          <div className="scanner-section">
            <QRScanner onScanSuccess={onScanSuccess} />
          </div>
          
          <div className={`result-section ${scanSuccess ? 'success-mode' : ''}`}>
            <div className="result-header">
              <div className="status-msg">
                READY TO SCAN
              </div>
              <hr className="divider" />
            </div>
            
            <div className="result-body">
              {!isProcessing && !scanSuccess && !status.text && (
                <div>
                  <div className="status-msg" style={{ color: 'var(--v3-wine)' }}>
                    Please show your QR code <br />from the digital invitation.
                  </div>
                </div>
              )}

              {status.text && (
                <div className={`status-msg ${status.type}`}>
                  {status.text}
                </div>
              )}
              {userName && (
                <div className="name-text">
                  {userName}
                </div>
              )}
              {subMessage && (
                <div className="sub-message">
                  {subMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Scanner;
