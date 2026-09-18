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
            PROTÓTIPO AR • v0.8.1
          </span>

          <h1>X-Burguer Especial</h1>

          <p className="description">
            Calibre a largura real do hambúrguer e confira o resultado
            diretamente na mesa usando WebXR.
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
                Escala física configurável
              </strong>

              <p>
                Nesta versão, o tamanho não é mais apenas uma estimativa fixa.
                Você pode calibrar o produto em centímetros antes de abrir a
                câmera.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
