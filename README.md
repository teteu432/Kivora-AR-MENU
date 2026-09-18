# Kivora AR Menu

Protótipo de cardápio em realidade aumentada com:

- visualização 3D no navegador;
- WebXR no celular;
- Hit Test para detectar superfícies;
- filtro para superfícies aproximadamente horizontais;
- marcador verde;
- toque para posicionar o prato;
- tamanho físico aproximado do objeto.

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Teste em AR

Para Realidade Aumentada, publique na Vercel e abra a URL HTTPS no Chrome de um Android compatível com WebXR/ARCore.

Fluxo esperado:

1. Abra o produto.
2. Toque em "Ver na minha mesa".
3. Aponte para a mesa.
4. Mova o aparelho lentamente.
5. Quando aparecer o círculo verde, toque na tela.
6. O modelo será colocado naquele ponto.

O protótipo detecta uma superfície horizontal. Ele não classifica semanticamente se o objeto real é especificamente uma mesa.

## Como saber se a Vercel publicou a versão nova

Na tela do produto deve aparecer:

`PROTÓTIPO AR • v0.3`

Se aparecer "PRATO ESPECIAL" ou um botão branco de AR dentro do visualizador 3D, a Vercel ainda está mostrando a versão anterior.
