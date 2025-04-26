import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import setupInterceptors from './utils/setupInterceptors';

// Initialize fetch interceptors before rendering the app
setupInterceptors();

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>,
)
