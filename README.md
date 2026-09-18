# Kivora AR Menu — Surface Placement

Versão com WebXR Hit Test para detectar superfícies e posicionar o modelo 3D.

## Instalação

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Teste de AR

O modo AR precisa ser testado em HTTPS e em um aparelho/navegador com suporte a WebXR immersive-ar + hit-test.

1. Publique na Vercel.
2. Abra o link HTTPS no celular.
3. Toque em "Ver na minha mesa".
4. Mova o aparelho devagar apontando para uma mesa.
5. Quando o círculo verde aparecer, toque na tela para colocar o prato.

A detecção procura uma superfície aproximadamente horizontal. Ela não classifica semanticamente "mesa".
