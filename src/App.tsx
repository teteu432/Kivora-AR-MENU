import './App.css'
import BurgerWebXR from './components/BurgerWebXR'

function App() {
  return (
    <main className="page">
      <header className="header">
        <div className="brand">
          <div className="brand-mark">K</div>

          <div className="brand-copy">
            <strong>Kivora AR Menu</strong>
            <span>Cardápio em Realidade Aumentada</span>
          </div>
        </div>
      </header>

      <section className="product">
        <div className="viewer-card">
          <span className="viewer-badge">
            VISUALIZAÇÃO 3D
          </span>

          <BurgerWebXR />
        </div>

        <div className="product-info">
          <span className="eyebrow">
            PROTÓTIPO AR • v0.8.2
          </span>

          <h1>X-Burguer Especial</h1>

          <p className="description">
            Calibração física corrigida: qualquer tamanho agora é calculado
            sempre a partir da dimensão original do modelo 3D.
          </p>

          <div className="price">
            <span>R$</span>
            <strong>29,90</strong>
          </div>

          <div className="webxr-info">
            <span className="webxr-info-icon">
              ↔
            </span>

            <div>
              <strong>
                Sem escala acumulativa
              </strong>

              <p>
                13 cm e 15 cm agora diferem apenas 15,4%, como deveria acontecer
                no mundo real.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
