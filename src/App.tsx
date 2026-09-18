import './App.css'
import ReliableARPlacement from './components/ReliableARPlacement'

const BURGER_MODEL_URL =
  'https://cdn.jsdelivr.net/gh/mindset-code/burger-house-3d@c2bddc597efe4870326c843a6e056727752fc261/public/hamburger__food_big-hamburger.glb'

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
            alt="Hambúrguer 3D"
            camera-controls
            auto-rotate
            shadow-intensity="1.2"
            shadow-softness="0.9"
            exposure="1.05"
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
          <span className="eyebrow">PROTÓTIPO AR • v0.5.0</span>

          <h1>X-Burguer Especial</h1>

          <p className="description">
            Aponte o celular para a mesa, espere o círculo verde aparecer e
            toque para posicionar o lanche no ambiente.
          </p>

          <div className="price">
            <span>R$</span>
            <strong>29,90</strong>
          </div>

          <ReliableARPlacement />

          <div className="instructions-card">
            <div className="instructions-icon">◎</div>

            <div>
              <strong>Posicionamento simplificado</strong>
              <p>
                Nesta versão, qualquer superfície encontrada pelo Hit Test
                exibe imediatamente o marcador. Primeiro vamos garantir uma
                detecção confiável; depois refinamos a identificação de mesa.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
