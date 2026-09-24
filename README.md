# Kivora AR Menu — V4 Stable Anchor

Protótipo de cardápio 3D + AR com foco em alimentos em escala física consistente.

## O que mudou na V4

- WebXR próprio e enxuto no Android compatível.
- Hit-test apenas para escolher a mesa.
- Após o toque, o produto deixa de seguir a câmera.
- Uso de `XRAnchor` quando disponível; fallback para pose fixa.
- Escala AR calculada diretamente em metros (`realWidthCm / 100`).
- Sem Depth Sensing, sombras em tempo real ou antialiasing no AR principal.
- `<model-viewer>` continua responsável pelo preview 3D e pelos fallbacks nativos.

## Rodar

```bash
npm install
npm run dev
```

Para testar câmera AR, publique em HTTPS (por exemplo, Vercel) e abra diretamente no Chrome/Safari.

Leia `STABLE_AR_NOTES.md` para o roteiro de teste.
