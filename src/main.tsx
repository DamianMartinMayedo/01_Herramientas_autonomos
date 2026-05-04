import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    return this.state.hasError
      ? <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',gap:'1rem',padding:'2rem',textAlign:'center'}}><div style={{fontSize:'3rem'}}>⚠️</div><p style={{fontFamily:'var(--font-display)',fontSize:'var(--text-xl)',fontWeight:700}}>Algo salió mal</p><p style={{color:'var(--color-text-muted)'}}>Recarga la página o vuelve al inicio.</p><a href="/" style={{color:'var(--color-primary)',textDecoration:'underline'}}>Volver al inicio</a></div>
      : this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
