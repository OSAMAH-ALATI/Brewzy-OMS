import { useApp } from '../context/AppContext.jsx'

export default function Toast() {
  const { toast } = useApp()
  return (
    <div className={'toast' + (toast ? ' show' : '')}>
      <span className="toast-icon">{toast?.icon || '✓'}</span>
      <span className="toast-msg">{toast?.msg || ''}</span>
    </div>
  )
}
