export type DiagnosticState = {
  secureContext: boolean
  xrApi: boolean
  immersiveAr: 'checking' | 'yes' | 'no'
  model: 'loading' | 'ready' | 'error'
  session: 'idle' | 'active'
  hitTest: 'idle' | 'requesting' | 'ready' | 'error'
  hitEverDetected: boolean
  lastError: string | null
}

type Props = {
  diagnostic: DiagnosticState
}

function valueLabel(value: boolean) {
  return value ? 'OK' : 'Não'
}

export default function ARDiagnostics({ diagnostic }: Props) {
  return (
    <details className="diagnostics">
      <summary>Diagnóstico técnico</summary>

      <div className="diagnostics-grid">
        <span>HTTPS / contexto seguro</span>
        <strong>{valueLabel(diagnostic.secureContext)}</strong>

        <span>API WebXR</span>
        <strong>{valueLabel(diagnostic.xrApi)}</strong>

        <span>immersive-ar</span>
        <strong>{diagnostic.immersiveAr}</strong>

        <span>Modelo 3D</span>
        <strong>{diagnostic.model}</strong>

        <span>Sessão</span>
        <strong>{diagnostic.session}</strong>

        <span>Hit Test</span>
        <strong>{diagnostic.hitTest}</strong>

        <span>Algum hit detectado</span>
        <strong>{valueLabel(diagnostic.hitEverDetected)}</strong>
      </div>

      {diagnostic.lastError && (
        <p className="diagnostic-error">
          Último erro: {diagnostic.lastError}
        </p>
      )}
    </details>
  )
}
