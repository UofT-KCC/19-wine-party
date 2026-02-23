import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{
      fontFamily: '-apple-system, sans-serif',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fcfaf8',
      color: '#333'
    }}>
      <h1 style={{ fontSize: '3rem', color: '#7b1c35', marginBottom: '10px' }}>UTKCC 19th Wine Party</h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '40px' }}>Select an application below</p>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <Link to="/scanner" style={{
          textDecoration: 'none',
          padding: '20px 40px',
          backgroundColor: '#3498db',
          color: 'white',
          borderRadius: '12px',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }}>
          QR Scanner (Staff)
        </Link>
        
        <Link to="/invitation" style={{
          textDecoration: 'none',
          padding: '20px 40px',
          backgroundColor: '#7b1c35',
          color: 'white',
          borderRadius: '12px',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 10px rgba(123, 28, 53, 0.2)'
        }}>
          Get Invitation
        </Link>
      </div>
    </div>
  );
}

export default Home;
