# Kivora AR Menu — modo compatível

Esta versão muda a estratégia principal de AR para **marker-based AR** com AR.js.

## Por que

A versão WebXR dependia de `immersive-ar`, ARCore e, para oclusão, Depth Sensing. Muitos aparelhos não oferecem essas APIs ou apresentam desempenho inconsistente.

## Como funciona agora

1. O usuário imprime o marcador Hiro com 8 cm.
2. O cardápio abre `/ar-marker.html` apenas quando o usuário entra no modo AR.
3. AR.js usa a câmera e o marcador para estimar posição e perspectiva.
4. `size="0.08"` informa ao rastreador que o marcador mede 8 cm.
5. Depois que o GLB carrega, o código mede o bounding box do modelo e calcula a escala necessária para que a largura cadastrada em `products.ts` seja representada em metros.
6. O alimento aparece ao lado do marcador para que o marcador continue visível mesmo quando o usuário aproxima a mão do produto.

## Performance

- Sem WebXR/ARCore na rota principal.
- Sem Depth Sensing.
- Renderizador sem antialiasing.
- Câmera/rastreamento em 480x640.
- Detecção limitada a 30 Hz.
- Sem sombras em tempo real no modo AR.
- AR.js/A-Frame só carregam na página de câmera.

## Limitação importante

Oclusão real da mão na frente/atrás do modelo exige informação de profundidade ou uma etapa de visão computacional adicional. Para manter compatibilidade e fluidez, esta versão não ativa esse recurso por padrão.
