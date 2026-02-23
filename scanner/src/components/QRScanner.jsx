import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Create an instance of the scanner
    const html5QrcodeScanner = new Html5QrcodeScanner("reader", {
      fps: 30, // Increased FPS for faster recognition
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        // 화면의 80% 크기로 인식 박스를 최대한 키움
        const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
        const qrboxSize = Math.floor(minEdgeSize * 0.8);
        return { width: qrboxSize, height: qrboxSize };
      },
      rememberLastUsedCamera: true
    }, false);

    // Render it
    html5QrcodeScanner.render((decodedText) => {
      onScanSuccess(decodedText);
    }, (errorMessage) => {
      // Optional: handle scan errors or ignore them since they trigger frequently
    });

    // Observer to change button text dynamically since html5-qrcode hardcodes "Request Camera Permissions"
    const observer = new MutationObserver(() => {
      if (containerRef.current) {
        const buttons = containerRef.current.querySelectorAll('button');
        buttons.forEach(btn => {
          if (btn.innerText.includes('Request Camera Permissions')) {
            btn.innerText = 'Start Scanning';
          }
        });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }

    // Cleanup function when component unmounts
    return () => {
      observer.disconnect();
      html5QrcodeScanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [onScanSuccess]);

  return <div id="reader" ref={containerRef}></div>;
};

export default QRScanner;
