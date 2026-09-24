# Kivora AR Menu — Zero / Stage 2

Projeto refeito do zero.

## Objetivo desta versão

Validar somente a fundação do rastreamento:

1. abrir a câmera com `getUserMedia`;
2. carregar OpenCV.js;
3. procurar um quadrilátero com proporção aproximada de 8:5;
4. desenhar os quatro cantos detectados;
5. suavizar pequenas oscilações.

**Não há modelo 3D nesta etapa.** Isso é intencional.

## Como rodar

```bash
npm install
npm run dev
```

Para câmera em celular, publique em HTTPS (Vercel funciona bem).

## Debug

Abra com:

`/?debug=true`

O painel mostra FPS do tracking, confiança, proporção detectada, área e tempo de processamento.

## Teste de aceite

Use o cartão físico de 8 × 5 cm criado no protótipo.

- Mostre o cartão inteiro.
- A borda deve ficar contornada.
- Os quatro cantos devem receber TL/TR/BR/BL.
- Aproxime e afaste.
- Incline o cartão.
- Caminhe levemente para os lados.

Só após essa etapa ficar estável devemos implementar `solvePnP` e Three.js.
