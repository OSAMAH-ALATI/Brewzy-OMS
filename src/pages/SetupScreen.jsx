import { useT } from '../lib/i18n.js'

// Shown when Firebase env vars are missing. Guides the user through setup.
export default function SetupScreen() {
  const { t } = useT()
  return (
    <div id="auth-screen">
      <div className="auth-wrap" style={{ maxWidth: 560 }}>
        <div className="auth-card" style={{ textAlign: 'left' }}>
          <img className="auth-logo-img" src="/auth-logo.png" alt="Brewzy" style={{ height: 90 }} />
          <h2 style={{ color: '#fff', fontSize: 20, marginBottom: 12, textAlign: 'center' }}>{t('One quick setup step')}</h2>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
            {t('Brewzy stores its data in your own free Firebase project so every device stays in sync. Connect it once:')}
          </p>
          <ol style={{ color: 'rgba(255,255,255,.78)', fontSize: 13, lineHeight: 1.9, paddingLeft: 20 }}>
            <li>{t('Create a free project at')} <span style={{ color: '#9DC3BC' }}>console.firebase.google.com</span></li>
            <li>{t('Add a')} <b>{t('Web app')}</b>{t(', then enable')} <b>{t('Firestore Database')}</b> {t('and')} <b>{t('Anonymous Authentication')}</b></li>
            <li>{t('Copy')} <code>.env.example</code> {t('to')} <code>.env</code> {t('and paste your config values')}</li>
            <li>{t('Restart the dev server')} (<code>npm run dev</code>)</li>
          </ol>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, marginTop: 18, textAlign: 'center' }}>
            {t('Full instructions are in')} <code>README.md</code>.
          </p>
        </div>
      </div>
    </div>
  )
}
