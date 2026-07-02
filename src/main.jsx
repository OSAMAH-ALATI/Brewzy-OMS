import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import './rtl.css'
import { AppProvider } from './context/AppContext.jsx'
import { LanguageProvider } from './lib/i18n.js'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
