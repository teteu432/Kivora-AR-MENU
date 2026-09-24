# Kivora AR Menu V4 — Stable Anchor

Esta versão corrige dois sintomas observados no teste real:

1. o alimento mudava de tamanho/percepção ao ser afastado;
2. o alimento acompanhava/mudava de posição ao caminhar lateralmente com a câmera.

## Alteração de arquitetura

O WebXR do `<model-viewer>` não é mais usado como modo principal.

No Android compatível, o botão abre um WebXR próprio e enxuto:

- hit-test somente para localizar a mesa antes da colocação;
- escala calculada uma vez em metros (`realWidthCm / 100`);
- depois do toque, o modelo deixa de receber a pose do hit-test;
- se `XRHitTestResult.createAnchor()` estiver disponível, é criado um `XRAnchor`;
- se Anchors não estiver disponível, a pose é congelada no `local referenceSpace`;
- a escala nunca é recalculada por distância da câmera;
- sem depth sensing, sombras em tempo real ou antialiasing.

## Fluxo de teste

1. Abra no Chrome via HTTPS.
2. Toque em `Ver na minha mesa`.
3. Mova o aparelho até o círculo ficar verde.
4. Toque uma vez na mesa para fixar.
5. Sem tocar na tela, recue 30–50 cm: o alimento deve ficar menor na imagem por perspectiva, sem aumentar fisicamente.
6. Caminhe lentamente para a esquerda/direita: o alimento deve permanecer no mesmo ponto da mesa e revelar suas laterais.
7. Use `Reposicionar` apenas se quiser escolher outro ponto.

Observação: tracking de AR ainda depende da câmera/ARCore e da textura/iluminação da mesa. Superfícies muito lisas, pretas, brilhantes ou sem detalhes podem produzir drift físico do próprio sistema de rastreamento.
