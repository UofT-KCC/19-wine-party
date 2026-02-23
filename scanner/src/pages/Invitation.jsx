import { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import './Invitation.css';

function Invitation() {
  const [inputValue, setInputValue] = useState('');
  const [qrCodeValue, setQrCodeValue] = useState('');
  const qrRef = useRef();

  const handleGenerate = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setQrCodeValue(inputValue.trim());
    }
  };

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `wine-party-invite-${qrCodeValue}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <div className="invitation-page">
      <div className="container">
        <div className="card">
          <h1 className="title">UTKCC 19th Wine Party</h1>
          <p className="subtitle">Generate your invitation QR code</p>

          <form onSubmit={handleGenerate} className="form">
            <input
              type="text"
              className="input"
              placeholder="Enter your unique code"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" className="button">
              Generate QR Code
            </button>
          </form>

          {qrCodeValue && (
            <div className="qr-container">
              <div className="qr-wrapper" ref={qrRef}>
                <QRCode
                  value={qrCodeValue}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                />
              </div>
              <p className="qr-value">{qrCodeValue}</p>
              <button onClick={downloadQRCode} className="button secondary">
                Save as Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Invitation;
