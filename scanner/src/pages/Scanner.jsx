import { useState, useCallback, useRef } from 'react';
import QRScanner from '../components/QRScanner';
import './Scanner.css';

function Scanner() {
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

  return (
    <div className="scanner-page">
      <div className="app-container">
        <div className="header-section">
          <h2 className="title">UTKCC 19th Wine Party</h2>
          <p className="subtitle">Please Scan the QR code from the Invitation</p>
        </div>
        
        <div className="main-content">
          <div className="scanner-section">
            <QRScanner onScanSuccess={onScanSuccess} />
          </div>
          
          <div className={`result-section ${scanSuccess ? 'success-mode' : ''}`} id="result-container">
            <div className="result-header">
              <div className="status-msg">
                QR 코드를 스캔해주세요
              </div>
              <hr className="divider" />
            </div>
            
            <div className="result-body">
              {!isProcessing && !scanSuccess && !status.text && (
                <div style={{ textAlign: 'center' }}>
                  <div className="status-msg" style={{ marginBottom: '15px', color: 'var(--wine-red)', fontWeight: '600', lineHeight: '1.5' }}>
                    이메일로 보내드린 초대장을 확인하여 <br />QR코드를 발급해주세요!
                  </div>
                  <div style={{ marginTop: '30px', fontSize: '0.8rem', color: '#999', fontWeight: '300' }}>
                    입장에 도움이 필요하신 경우 안내 데스크로 문의 바랍니다.
                  </div>
                </div>
              )}

              {status.text && (
                <div id="status-text" className={`status-msg ${status.type}`} style={{ marginBottom: '15px' }}>
                  {status.text}
                </div>
              )}
              {userName && (
                <div id="name-text" className="name-text" style={{ marginTop: '10px' }}>
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
