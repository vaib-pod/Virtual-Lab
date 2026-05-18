import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // This is crucial for Tailwind to apply!

ReactDOM.createRoot(document.getElementById('root')).render(
  // Removed <React.StrictMode> to prevent Matter.js from double-rendering the canvas
  <App />
)