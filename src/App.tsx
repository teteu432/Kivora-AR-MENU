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
          <span className="eyebrow">PROTÓTIPO AR • v0.7.0</span>

          <h1>X-Burguer Especial</h1>

          <p className="description">
            A experiência de realidade aumentada agora usa o mecanismo nativo
            de AR do aparelho para detectar a superfície e posicionar o lanche.
          </p>

          <div className="price">
            <span>R$</span>
            <strong>29,90</strong>
          </div>

          <div className="native-info">
            <span className="native-info-icon">◎</span>

            <div>
              <strong>AR nativo no Android</strong>

              <p>
                Aponte o celular para a mesa e mova-o lentamente. O próprio
                ARCore orienta a detecção e o posicionamento. A escala do
                hambúrguer fica bloqueada para manter o tamanho planejado.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
