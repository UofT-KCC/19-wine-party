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
  
  // Use a ref to keep track of isProcessing without adding it to dependency array
  // This prevents the scanner from remounting or re-initiating unnecessarily
  const isProcessingRef = useRef(false);

  const onScanSuccess = useCallback((decodedText) => {
    if (isProcessingRef.current) return; // 이미 요청 중이면 무시
    
    isProcessingRef.current = true;
    setIsProcessing(true);
    setStatus({ type: 'loading', text: '데이터 확인 중...' });
    setUserName('');
    setSubMessage('');
    setCountdown(null);

    // 백엔드(GAS) 호출
    fetch(`${import.meta.env.VITE_GAS_URL}?id=${decodedText}`, { redirect: 'follow' })
      .then(response => response.json())
      .then(data => {
        if (data.status === "success" || data.status === "already") {
          setScanSuccess(true);
          setStatus({ 
            type: data.status === "success" ? 'success' : 'error', 
            text: data.status === "success" ? '✅ 체크인 성공!' : '⚠️ 이미 입장 완료' 
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
  }, []); // Empty dependency array relying on ref

  return (
    <>
      <h2>스태프용 체크인 스캐너</h2>
      <div style={{ display: scanSuccess ? 'none' : 'block' }}>
        <QRScanner onScanSuccess={onScanSuccess} />
      </div>
      
      <div id="result-container" style={{ minHeight: scanSuccess ? '300px' : '80px', transition: 'min-height 0.3s' }}>
        <div id="status-text" className={`status-msg ${status.type}`}>
          {status.text}
        </div>
        {userName && (
          <div id="name-text" style={{ fontSize: '1.8rem', marginTop: '20px', fontWeight: 'bold' }}>
            {userName}
          </div>
        )}
        {subMessage && (
          <div style={{ fontSize: '1.5rem', marginTop: '10px' }}>
            {subMessage}
          </div>
        )}
        {countdown !== null && (
          <div style={{ fontSize: '1.2rem', marginTop: '30px', color: '#666', fontWeight: 'bold' }}>
            {countdown}초 뒤에 다시 스캔 화면으로 돌아갑니다.
          </div>
        )}
      </div>
    </>
  );
}

export default App;
