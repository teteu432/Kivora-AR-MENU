import './App.css'
import { APP_VERSION } from './config'
import BurgerPreview from './components/BurgerPreview'
import ReliableARPlacement from './components/ReliableARPlacement'

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

          <BurgerPreview />

          <p className="viewer-tip">
            Arraste para girar • Use o zoom para aproximar
          </p>
        </div>

        <div className="product-info">
          <span className="eyebrow">PROTÓTIPO AR • {APP_VERSION}</span>

          <h1>X-Burguer Especial</h1>

          <p className="description">
            Visualize o hambúrguer em 3D e, no celular, posicione-o sobre uma
            superfície real usando WebXR Hit Test.
          </p>

          <div className="price">
            <span>R$</span>
            <strong>29,90</strong>
          </div>

          <ReliableARPlacement />

          <div className="instructions-card">
            <div className="instructions-icon">◎</div>

            <div>
              <strong>Fluxo desta versão</strong>

              <p>
                Primeiro garantimos câmera + Hit Test + posicionamento sem
                filtros agressivos. Quando isso estiver validado no aparelho,
                adicionamos suavização e preferência por superfícies de mesa.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
