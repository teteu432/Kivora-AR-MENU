import './App.css'
import ARSurfacePlacement from './components/ARSurfacePlacement'

function App() {
  return (
    <main className="page">
      <header className="header">
        <div className="brand">
          <span className="brand-icon">K</span>

          <div>
            <strong>Kivora AR Menu</strong>
            <small>Cardápio em Realidade Aumentada</small>
          </div>
        </div>
      </header>

      <section className="product">
        <div className="viewer-container">
          <span className="badge">Visualização 3D</span>

          <model-viewer
            src="https://modelviewer.dev/shared-assets/models/shishkebab.glb"
            alt="Modelo 3D do prato"
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

          <div className="viewer-help">
            Arraste para girar • Use o zoom para aproximar
          </div>
        </div>

        <div className="product-info">
          <span className="category">PROTÓTIPO AR</span>
          <h1>Espetinho Especial</h1>

          <p className="description">
            Visualize o prato em 3D e, no celular, posicione-o em uma
            superfície real usando detecção de superfície.
          </p>

          <div className="price">
            <span>R$</span>
            <strong>34,90</strong>
          </div>

          <ARSurfacePlacement />

          <div className="surface-info">
            <span className="surface-icon">◎</span>
            <div>
              <strong>Como funciona</strong>
              <p>
                Aponte para uma mesa e mova o celular devagar. Quando o
                círculo verde aparecer, toque para posicionar o prato naquele
                ponto.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
