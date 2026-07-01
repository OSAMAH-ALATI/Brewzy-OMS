// Shown when Firebase env vars are missing. Guides the user through setup.
export default function SetupScreen() {
  return (
    <div id="auth-screen">
      <div className="auth-wrap" style={{ maxWidth: 560 }}>
        <div className="auth-card" style={{ textAlign: 'left' }}>
          <img className="auth-logo-img" src="/auth-logo.png" alt="Brewzy" style={{ height: 90 }} />
          <h2 style={{ color: '#fff', fontSize: 20, marginBottom: 12, textAlign: 'center' }}>One quick setup step</h2>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
            Brewzy stores its data in your own free Firebase project so every device stays in sync.
            Connect it once:
          </p>
          <ol style={{ color: 'rgba(255,255,255,.78)', fontSize: 13, lineHeight: 1.9, paddingLeft: 20 }}>
            <li>Create a free project at <span style={{ color: '#9DC3BC' }}>console.firebase.google.com</span></li>
            <li>Add a <b>Web app</b>, then enable <b>Firestore Database</b> and <b>Anonymous Authentication</b></li>
            <li>Copy <code>.env.example</code> to <code>.env</code> and paste your config values</li>
            <li>Restart the dev server (<code>npm run dev</code>)</li>
          </ol>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, marginTop: 18, textAlign: 'center' }}>
            Full instructions are in <code>README.md</code>.
          </p>
        </div>
      </div>
    </div>
  )
}
