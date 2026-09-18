# Kivora AR Menu v0.4.0

Versão com detecção de superfície mais estável e troca para X-Burguer.

## Melhorias desta versão

- modelo principal de hambúrguer;
- fallback automático para o modelo anterior se a URL do hambúrguer falhar;
- retículo amarelo ao encontrar pontos preliminares;
- retículo verde apenas quando a superfície estiver estável;
- suavização do marcador;
- exigência de vários frames estáveis antes de liberar o posicionamento;
- filtro menos rígido para facilitar a detecção.

## Instalação limpa

Git Bash:
```bash
rm -rf node_modules
rm -f package-lock.json
npm install
npm run build
```

PowerShell:
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npm run build
```

Depois publique no GitHub/Vercel.

Na interface deve aparecer `PROTÓTIPO AR • v0.4.0`.
