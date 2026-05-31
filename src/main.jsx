import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import App from './App';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'sans-serif', padding:'2rem', textAlign:'center', background:'#F5F1EA' }}>
          <div style={{ fontSize:'2rem', marginBottom:'1rem' }}>⚠️</div>
          <div style={{ fontSize:'1.1rem', fontWeight:600, marginBottom:'0.5rem', color:'#1C1C2E' }}>Something went wrong</div>
          <div style={{ fontSize:'0.875rem', color:'#6B7280', maxWidth:'480px', marginBottom:'1.5rem' }}>
            {this.state.error.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ padding:'0.5rem 1.25rem', background:'#2D7A6A', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'0.875rem' }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
