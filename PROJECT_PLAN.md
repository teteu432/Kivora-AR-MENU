# Plano do novo Kivora AR Menu

## Etapa 1 — câmera ✅
getUserMedia, câmera traseira, erro de permissões explícito.

## Etapa 2 — cartão ✅ (esta entrega)
OpenCV.js em baixa resolução, Canny + contornos + quadriláteros + proporção 8:5 + suavização.

## Etapa 3 — pose
Calibrar câmera aproximada e usar solvePnP. Desenhar apenas um cubo simples.

## Etapa 4 — âncora/perspectiva
Confirmar que o cubo fica preso ao cartão e pode ser visto pelas laterais.

## Etapa 5 — escala física
Objeto virtual de 8 cm comparado ao cartão de 8 cm.

## Etapa 6 — produto
Hambúrguer 13 cm.

## Etapa 7 — pizza
Pizza 32 cm.

## Etapa 8 — otimização e fallback
Ajustes de Android intermediário, fallback 3D comum e UX comercial.
