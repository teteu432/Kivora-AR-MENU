import './App.css'
import ARSurfacePlacement from './components/ARSurfacePlacement'

const BURGER_MODEL_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Hamburger/glTF-Binary/Hamburger.glb'

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
            alt="Modelo 3D de um x-burguer"
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
          <span className="eyebrow">PROTÓTIPO AR • v0.4.0</span>

          <h1>X-Burguer Especial</h1>

          <p className="description">
            Visualize o hambúrguer em 3D e depois posicione-o em uma superfície
            real usando a câmera do celular com detecção estabilizada.
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
                O marcador amarelo indica leitura inicial da superfície. O
                marcador verde indica que a superfície está estável e pronta
                para posicionar o x-burguer.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
