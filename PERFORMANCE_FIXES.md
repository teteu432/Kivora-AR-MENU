# Kivora AR Menu — V4.1 Performance Fixes

Esta revisão foi criada depois do teste em aparelho real mostrar travamentos e dificuldade para reconhecer uma mesa escura.

## Causa principal do travamento encontrada

Na V4, a função de status do AR era chamada dentro do `setAnimationLoop`. Em uma sessão XR comum isso pode acontecer 60 vezes por segundo. Como o callback atualizava estado React (`setXrStatus`), a interface podia ser renderizada repetidamente enquanto o Three.js e o WebXR também renderizavam a câmera.

Na V4.1 as mensagens são limitadas a aproximadamente 3 atualizações por segundo.

## Outras reduções de carga

- framebuffer XR reduzido para 0.50 em aparelhos mais modestos e 0.64 nos demais;
- foveation aumentado;
- precisão `mediump`;
- stencil desativado;
- retículo com menos segmentos;
- hit-test amostrado em aproximadamente 30 Hz;
- preview `<model-viewer>` fica invisível durante a sessão XR;
- `auto-rotate` removido do preview;
- sombras do preview reduzidas.

## Detecção da mesa

A V4 exigia 8 frames estáveis e tolerava apenas cerca de 1,8 cm de oscilação entre hits. Em superfícies uniformes isso podia fazer o círculo nunca ficar pronto.

A V4.1 usa:

- 3 frames estáveis;
- tolerância de aproximadamente 4 cm durante a busca;
- pequeno tempo de graça para não piscar o retículo quando um frame perde o hit;
- suavização visual da posição do retículo.

A medida do produto continua sendo calculada em metros e não depende da distância da câmera.

## Limitação física

WebXR/ARCore ainda depende de pontos visuais do ambiente. Uma mesa preta totalmente lisa é um dos cenários mais difíceis. Bordas da mesa, um guardanapo, prato, copo ou outros objetos próximos ajudam o rastreamento sem funcionar como marcador obrigatório.
