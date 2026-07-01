import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import { AppProvider } from './context/AppContext.jsx'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
)
