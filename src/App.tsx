import './App.css'
import ARSurfacePlacement from './components/ARSurfacePlacement'

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
            src="https://modelviewer.dev/shared-assets/models/shishkebab.glb"
            alt="Modelo 3D de um espetinho"
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
          <span className="eyebrow">PROTÓTIPO AR • v0.3</span>

          <h1>Espetinho Especial</h1>

          <p className="description">
            Visualize o produto em 3D e depois posicione-o em uma superfície
            real usando a câmera do celular.
          </p>

          <div className="price">
            <span>R$</span>
            <strong>34,90</strong>
          </div>

          <ARSurfacePlacement />

          <div className="instructions-card">
            <div className="instructions-icon">◎</div>

            <div>
              <strong>Detecção de superfície</strong>

              <p>
                Aponte para a mesa e mova o celular lentamente. Quando o
                círculo verde aparecer, toque na tela para posicionar o prato.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
