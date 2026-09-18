import './App.css'
import ProductWebXR from './components/ProductWebXR'
import { xBurger } from './products'

function App() {
  return (
    <main className="page">
      <header className="header">
        <div className="brand">
          <div className="brand-mark">
            K
          </div>

          <div className="brand-copy">
            <strong>
              Kivora AR Menu
            </strong>
            <span>
              Cardápio em Realidade Aumentada
            </span>
          </div>
        </div>
      </header>

      <section className="product">
        <div className="viewer-card">
          <span className="viewer-badge">
            VISUALIZAÇÃO 3D
          </span>

          <ProductWebXR
            product={xBurger}
          />
        </div>

        <div className="product-info">
          <span className="eyebrow">
            PROTÓTIPO AR • v0.8.3
          </span>

          <h1>
            {xBurger.name}
          </h1>

          <p className="description">
            {xBurger.description}
          </p>

          <div className="price">
            <span>R$</span>
            <strong>
              {xBurger.price
                .toFixed(2)
                .replace('.', ',')}
            </strong>
          </div>

          <div className="physical-card">
            <span>↔</span>

            <div>
              <strong>
                Tamanho real cadastrado
              </strong>

              <p>
                Este produto está configurado
                com {xBurger.realWidthCm} cm de
                largura. A escala fica fixa
                durante o AR.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
