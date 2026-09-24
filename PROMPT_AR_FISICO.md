# Prompt técnico — Kivora AR Menu: escala física, referência de superfície e oclusão

Quero evoluir um cardápio gastronômico em realidade aumentada feito com React + TypeScript + Three.js/WebXR + model-viewer.

## Objetivo principal
A experiência deve fazer o alimento virtual parecer ter tamanho físico consistente e previsível em diferentes tentativas e aparelhos compatíveis. O usuário deve conseguir apontar o celular para uma mesa, visualizar uma referência física do espaço que o produto ocupará e só então posicionar o modelo 3D.

## Requisitos funcionais

1. Escala física por produto
- Cada produto deve possuir largura/diâmetro real em centímetros no cadastro.
- Ao carregar o GLB, calcular o bounding box original do modelo.
- Converter a largura cadastrada de centímetros para metros.
- Aplicar escala uniforme ao GLB para que sua maior dimensão horizontal corresponda à medida física cadastrada.
- Depois de colocado em AR, o produto deve permanecer com escala bloqueada; não permitir pinch para redimensionar no fluxo WebXR.

2. Referência física antes da colocação
- Usar WebXR Hit Test para detectar a mesa/superfície horizontal.
- Antes de mostrar o alimento, renderizar um footprint/contorno sobre a mesa.
- O footprint deve ter exatamente o diâmetro/largura física cadastrada do produto, por exemplo 13 cm para hambúrguer e 32 cm para pizza.
- O marcador deve acompanhar a superfície com suavização de posição e rotação.
- Só considerar o ponto pronto para colocação após vários frames estáveis e com boa orientação horizontal.
- Mudar visualmente o marcador de estado "procurando" para "pronto".
- O usuário toca na tela apenas quando o marcador estiver estabilizado.

3. Posicionamento consistente
- O modelo deve ser centralizado em X/Z e ter sua base Y=0 antes da colocação.
- Ao colocar, copiar apenas posição e rotação do hit-test; manter a escala física calculada, sem herdar qualquer escala variável da matriz do hit-test.
- O modelo deve encostar visualmente na superfície, sem flutuar ou afundar.

4. Oclusão / mão na frente e atrás
- Solicitar WebXR Depth Sensing como recurso opcional.
- Preferir caminho GPU para permitir que o renderer use a profundidade real da câmera na composição.
- Quando disponível, objetos reais mais próximos da câmera, como a mão, devem ocluir o alimento virtual.
- Quando a mão estiver atrás do objeto virtual, o alimento deve continuar visível à frente.
- O recurso nunca deve ser obrigatório: aparelhos sem depth sensing continuam com AR normal.
- Informar discretamente na interface se a oclusão de profundidade está ativa ou não.

5. Compatibilidade ampla
- Priorizar WebXR no Chrome/Android compatível com ARCore.
- Quando WebXR não estiver disponível, oferecer fallback usando model-viewer com Scene Viewer no Android e Quick Look no iOS quando suportado.
- Manter a visualização 3D comum disponível mesmo quando AR não existir.
- Não bloquear toda a experiência por causa de recursos avançados opcionais.

6. Performance
- Carregar Three.js e a lógica WebXR somente quando o usuário tocar em "Abrir câmera AR" (lazy/dynamic import).
- Em aparelhos com pouca memória, reduzir pixel ratio, framebuffer scale e antialiasing.
- Usar foveation no WebXR quando possível.
- Não usar sombras pesadas em tempo real.
- Manter geometrias do marcador simples.
- Modelos GLB devem ser otimizados para mobile, preferencialmente com geometria e texturas compactadas.

7. UX
- Fluxo: selecionar produto → tocar "Ver na minha mesa" → instrução curta → abrir câmera → encontrar mesa → footprint físico aparece → footprint estabiliza → toque para posicionar.
- Mostrar durante o AR a medida real cadastrada do produto.
- O marcador deve representar visualmente o espaço físico que o produto ocupará.
- Interface deve ser discreta para não cobrir a câmera.

## Critério de sucesso
Em duas sessões diferentes no mesmo aparelho, o mesmo produto deve ocupar aproximadamente o mesmo espaço físico da mesa. O usuário deve conseguir comparar o footprint com objetos reais e perceber uma escala coerente. Em aparelhos com WebXR Depth Sensing, a mão deve conseguir passar visualmente na frente do modelo por oclusão de profundidade.
