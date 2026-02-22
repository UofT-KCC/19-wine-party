import { useState, useCallback, useRef } from 'react';
import QRScanner from './components/QRScanner';
import './App.css';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState({ type: '', text: 'QR 코드를 스캔해주세요' });
  const [userName, setUserName] = useState('');
  const [subMessage, setSubMessage] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  
  const isProcessingRef = useRef(false);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.log('Audio not supported or blocked');
    }
  };

  const onScanSuccess = useCallback((decodedText) => {
    if (isProcessingRef.current) return; 
    
    playBeep();
    
    isProcessingRef.current = true;
    setIsProcessing(true);
    setStatus({ type: 'loading', text: '데이터 확인 중...' });
    setUserName('');
    setSubMessage('');
    setCountdown(null);

    fetch(`${import.meta.env.VITE_GAS_URL}?id=${decodedText}`, { redirect: 'follow' })
      .then(response => response.json())
      .then(data => {
        if (data.status === "success" || data.status === "already") {
          setScanSuccess(true);
          setStatus({ 
            type: 'success', // 강제 초록색 적용
            text: data.status === "success" ? '✅ 체크인 성공!' : '✅ 이미 입장 완료' 
          });
          setUserName(`환영합니다, ${data.name}님.`);
          setSubMessage('명찰을 수령해주세요.');
          
          let timeLeft = 5;
          setCountdown(timeLeft);
          
          const timerId = setInterval(() => {
            timeLeft -= 1;
            setCountdown(timeLeft);
            if (timeLeft <= 0) {
              clearInterval(timerId);
              setScanSuccess(false);
              setStatus({ type: '', text: 'QR 코드를 스캔해주세요' });
              setUserName('');
              setSubMessage('');
              setCountdown(null);
              setIsProcessing(false);
              isProcessingRef.current = false;
            }
          }, 1000);
        } else {
          // 유효하지 않은 코드
          setStatus({ type: 'error', text: `유효하지 않은 코드입니다: ${decodedText}` });
          setTimeout(() => {
            setStatus({ type: '', text: 'QR 코드를 스캔해주세요' });
            setIsProcessing(false);
            isProcessingRef.current = false;
          }, 2000);
        }
      })
      .catch(err => {
        console.error(err);
        setStatus({ type: 'error', text: `유효하지 않은 코드입니다: ${decodedText}` });
        setTimeout(() => {
          setStatus({ type: '', text: 'QR 코드를 스캔해주세요' });
          setIsProcessing(false);
          isProcessingRef.current = false;
        }, 2000);
      });
  }, []); 

  return (
    <div className="app-container">
      <div className="header-section">
        <h2 style={{ fontSize: '2.5rem', margin: '0', color: '#333' }}>UTKCC 19th Wine Party</h2>
        <p style={{ fontSize: '1.2rem', color: '#666', marginTop: '10px' }}>
          Please Scan the QR code from the Invitation
        </p>
      </div>
      
      <div className="main-content">
        <div className="scanner-section" style={{ display: scanSuccess ? 'none' : 'flex' }}>
          <QRScanner onScanSuccess={onScanSuccess} />
        </div>
        
        <div className={`result-section ${scanSuccess ? 'success-mode' : ''}`} id="result-container">
          <div id="status-text" className={`status-msg ${status.type}`}>
            {status.text}
          </div>
          {userName && (
            <div id="name-text" style={{ fontSize: '1.8rem', marginTop: '30px', fontWeight: 'bold' }}>
              {userName}
            </div>
          )}
          {subMessage && (
            <div style={{ fontSize: '1.5rem', marginTop: '15px' }}>
              {subMessage}
            </div>
          )}
          {countdown !== null && (
            <div style={{ fontSize: '1.2rem', marginTop: '40px', color: '#666', fontWeight: 'bold' }}>
              {countdown}초 뒤에 다시 스캔 화면으로 돌아갑니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
