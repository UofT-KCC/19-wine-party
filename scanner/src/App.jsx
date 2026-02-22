import { useState, useCallback } from 'react';
import QRScanner from './components/QRScanner';
import './App.css';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState({ type: '', text: 'QR 코드를 스캔해주세요' });
  const [userName, setUserName] = useState('');

  const onScanSuccess = useCallback((decodedText) => {
    if (isProcessing) return; // 이미 요청 중이면 무시
    
    setIsProcessing(true);
    setStatus({ type: 'loading', text: '데이터 확인 중...' });
    setUserName('');

    // 백엔드(GAS) 호출
    fetch(`${import.meta.env.VITE_GAS_URL}?id=${decodedText}`, { redirect: 'follow' })
      .then(response => response.json())
      .then(data => {
        if (data.status === "success") {
          setStatus({ type: 'success', text: '✅ 체크인 성공!' });
          setUserName(data.name + ' 님');
        } else if (data.status === "already") {
          setStatus({ type: 'error', text: '⚠️ 이미 입장 완료' });
          setUserName(data.name + ' 님');
        } else {
          setStatus({ type: 'error', text: '❌ 등록되지 않은 정보' });
        }
        
        // 3초 후 다음 스캔을 위해 초기화
        setTimeout(() => {
          setIsProcessing(false);
          setStatus({ type: '', text: 'QR 코드를 스캔해주세요' });
          setUserName('');
        }, 3000);
      })
      .catch(err => {
        console.error(err);
        setStatus({ type: 'error', text: '네트워크 오류 발생' });
        setIsProcessing(false);
      });
  }, [isProcessing]);

  return (
    <>
      <h2>스태프용 체크인 스캐너</h2>
      <QRScanner onScanSuccess={onScanSuccess} />
      
      <div id="result-container">
        <div id="status-text" className={`status-msg ${status.type}`}>
          {status.text}
        </div>
        <div id="name-text" style={{ fontSize: '1.5rem', marginTop: '10px' }}>
          {userName}
        </div>
      </div>
    </>
  );
}

export default App;
