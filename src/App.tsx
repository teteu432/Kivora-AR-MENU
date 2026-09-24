import {
  useMemo,
  useState,
} from 'react'
import './App.css'
import ProductViewer from './components/ProductViewer'
import {
  products,
  type Product3D,
} from './products'

function money(value: number) {
  return value
    .toFixed(2)
    .replace('.', ',')
}

function App() {
  const [selectedId, setSelectedId] =
    useState(products[0].id)

  const selected =
    useMemo(
      () =>
        products.find(
          (product) =>
            product.id ===
            selectedId
        ) ?? products[0],
      [selectedId]
    )

  const choose =
    (product: Product3D) => {
      setSelectedId(product.id)
    }

  return (
    <main className="page">
      <header className="header">
        <div className="brand">
          <div className="brand-symbol">
            K
          </div>

          <div>
            <strong>
              Kivora AR Menu
            </strong>
            <span>
              Experiência gastronômica em realidade aumentada
            </span>
          </div>
        </div>

        <div className="demo-badge">
          DEMO AR • v3 Native
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="hero-kicker">
            CARDÁPIO IMERSIVO
          </span>

          <h1>
            Escolha. Visualize.
            <br />
            <em>Veja na sua mesa.</em>
          </h1>

          <p>
            Conheça o tamanho e a apresentação do prato antes mesmo do pedido.
            Selecione uma opção e experimente em realidade aumentada.
          </p>
        </div>

        <div className="menu-tabs">
          {products.map(
            (product) => (
              <button
                type="button"
                key={product.id}
                className={
                  selected.id ===
                  product.id
                    ? 'menu-tab active'
                    : 'menu-tab'
                }
                onClick={() =>
                  choose(product)
                }
              >
                <span className="tab-emoji">
                  {product.emoji}
                </span>

                <span className="tab-copy">
                  <small>
                    {product.category}
                  </small>

                  <strong>
                    {product.shortName}
                  </strong>
                </span>

                <span className="tab-price">
                  R$ {money(
                    product.price
                  )}
                </span>
              </button>
            )
          )}
        </div>
      </section>

      <section className="experience">
        <div className="viewer-column">
          <ProductViewer
            key={selected.id}
            product={selected}
          />
        </div>

        <article className="details-card">
          <div className="category-row">
            <span>
              {selected.category}
            </span>

            <span className="availability">
              ● Disponível
            </span>
          </div>

          <h2>
            {selected.name}
          </h2>

          <p className="product-description">
            {selected.description}
          </p>

          <div className="meta-row">
            <div>
              <small>
                Tamanho real
              </small>

              <strong>
                {selected.realWidthCm} cm
              </strong>
            </div>

            <div>
              <small>
                Referência
              </small>

              <strong>
                {selected.note}
              </strong>
            </div>
          </div>

          <div className="price-row">
            <div>
              <span>
                A partir de
              </span>

              <strong>
                R$ {money(
                  selected.price
                )}
              </strong>
            </div>

            <div className="ar-ready">
              <span>AR</span>
              <small>
                Pronto para visualizar
              </small>
            </div>
          </div>

          <div className="experience-note">
            <span>✦</span>

            <p>
              A experiência prioriza o AR nativo disponível no aparelho e mantém o 3D como fallback.
              Modelos de produção devem ser exportados em escala física real para preservar as medidas.
            </p>
          </div>
        </article>
      </section>

      <footer className="footer">
        <strong>
          Kivora AR Menu
        </strong>

        <span>
          Protótipo demonstrativo • AR nativo + fallback 3D
        </span>
      </footer>
    </main>
  )
}

export default App
