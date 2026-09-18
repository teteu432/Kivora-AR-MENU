import './App.css'
import ARSurfacePlacement from './components/ARSurfacePlacement'

const BURGER_MODEL_URL =
  'https://cdn.3dassets.dev/assets/34314/v1/model.glb'

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
          <span className="viewer-badge">VISUALIZAÇÃO 3D</span>

          <model-viewer
            src={BURGER_MODEL_URL}
            alt="Combo 3D com x-burguer e batata"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            touch-action="pan-y"
            loading="eager"
            style={{
              width: '100%',
              height: '100%',
            }}
          />

          <p className="viewer-tip">
            Arraste para girar • Use o zoom para aproximar
          </p>
        </div>

        <div className="product-info">
          <span className="eyebrow">PROTÓTIPO AR • v0.4.1</span>

          <h1>X-Burguer Especial</h1>

          <p className="description">
            Visualize o lanche em 3D e posicione-o sobre a mesa usando
            realidade aumentada com detecção estabilizada de superfície.
          </p>

          <div className="price">
            <span>R$</span>
            <strong>29,90</strong>
          </div>

          <ARSurfacePlacement />

          <div className="instructions-card">
            <div className="instructions-icon">◎</div>

            <div>
              <strong>Detecção aprimorada</strong>
              <p>
                Amarelo significa que a superfície está sendo analisada.
                Verde significa que o ponto está estável e pronto para receber
                o lanche.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
