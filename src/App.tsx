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
            PROTÓTIPO AR • v0.8.0
          </span>

          <h1>X-Burguer Especial</h1>

          <p className="description">
            Visualize o hambúrguer em 3D e abra a realidade aumentada
            diretamente no navegador.
          </p>

          <div className="price">
            <span>R$</span>
            <strong>29,90</strong>
          </div>

          <div className="webxr-info">
            <span className="webxr-info-icon">
              ◎
            </span>

            <div>
              <strong>
                AR direto no navegador
              </strong>

              <p>
                Não abrimos outro aplicativo. A experiência usa WebXR em tela
                cheia, e o próprio model-viewer cuida do posicionamento e do
                rastreamento da superfície.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
