import './App.css'
import BurgerARViewer from './components/BurgerARViewer'

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
          <span className="viewer-badge">VISUALIZAÇÃO 3D + AR</span>

          <BurgerARViewer />

          <p className="viewer-tip">
            Arraste para girar • No celular, use “Ver na minha mesa”
          </p>
        </div>

        <div className="product-info">
          <span className="eyebrow">PROTÓTIPO AR • v0.7.1</span>

          <h1>X-Burguer Especial</h1>

          <p className="description">
            Visualize o hambúrguer em 3D e use o AR nativo do aparelho para
            posicioná-lo sobre uma superfície real.
          </p>

          <div className="price">
            <span>R$</span>
            <strong>29,90</strong>
          </div>

          <div className="native-info">
            <span className="native-info-icon">◎</span>

            <div>
              <strong>Google Scene Viewer / ARCore</strong>

              <p>
                No Android compatível, o sistema nativo cuida da detecção,
                posicionamento e rastreamento do produto.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
