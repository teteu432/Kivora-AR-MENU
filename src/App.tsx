import './App.css'

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
            alt="Modelo 3D de um prato"
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            ar-placement="floor"
            ar-scale="fixed"
            scale="0.2 0.2 0.2"
            touch-action="pan-y"
            loading="eager"
            style={{
              width: '100%',
              height: '100%',
            }}
          >
            <button slot="ar-button" className="ar-button">
              📷 Ver na minha mesa
            </button>
          </model-viewer>

          <div className="viewer-help">
            Arraste para girar • Use o scroll para aproximar
          </div>
        </div>

        <div className="product-info">
          <span className="category">PRATO ESPECIAL</span>
          <h1>Espetinho Especial</h1>

          <p className="description">
            Uma experiência diferente para conhecer seu pedido antes mesmo
            dele chegar à mesa.
          </p>

          <div className="price">
            <span>R$</span>
            <strong>34,90</strong>
          </div>

          <div className="actions">
            <button className="primary-button">
              Adicionar ao pedido
            </button>

            <button className="secondary-button">
              ♡ Favoritar
            </button>
          </div>

          <div className="ar-info">
            <div className="ar-info-icon">📱</div>

            <div>
              <strong>Visualize antes de pedir</strong>
              <p>
                No celular, toque em &quot;Ver na minha mesa&quot; para
                visualizar o prato usando realidade aumentada.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
