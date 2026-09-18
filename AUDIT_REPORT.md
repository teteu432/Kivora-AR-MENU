# Auditoria Kivora AR Menu v0.6.0

## Problemas encontrados e corrigidos

1. **Duas engines/camadas 3D desnecessárias**
   - O projeto usava `@google/model-viewer` para preview e Three.js para AR.
   - Isso já havia causado conflito de `peerDependencies` com `three`.
   - Correção: `@google/model-viewer` foi removido. Preview e AR agora usam Three.js.

2. **DOM Overlay sem controle**
   - Uma versão anterior usou o `body` como overlay e o site ficou sobre a câmera.
   - O helper `ARButton` do Three.js r172 também cria um overlay automaticamente quando nenhum é fornecido.
   - Correção: o projeto fornece um overlay próprio, transparente, contendo apenas um botão de saída. O site inteiro nunca é usado como overlay.

3. **Hit Test diferente do exemplo oficial**
   - Versões anteriores mantinham reference spaces próprios e filtros extras.
   - Correção: o loop usa `renderer.xr.getReferenceSpace()` e solicita o Hit Test a partir do `viewer` space, seguindo o exemplo oficial do Three.js r172.

4. **Filtros bloqueando a detecção**
   - Inclinação, estabilidade e thresholds foram adicionados antes do Hit Test básico estar confiável.
   - Correção: removidos nesta fase. Qualquer hit válido mostra o retículo.

5. **Possível conflito entre React e DOM manual**
   - Um botão criado manualmente podia ser anexado dentro de um nó que React também reconciliava com um placeholder.
   - Correção: o host do botão AR agora é sempre vazio para o React; placeholders ficam como irmãos.

6. **Inicialização serial desnecessária**
   - Em desktop sem AR, o diagnóstico do modelo podia ficar eternamente em `loading` porque a função retornava antes de carregar o GLB.
   - Correção: verificação de AR e carregamento do modelo acontecem em paralelo.

7. **StrictMode / cleanup**
   - A auditoria considerou dupla execução de effects em desenvolvimento.
   - Correção: canvas, listeners, MutationObserver, Hit Test Source, sessão, botão AR e overlay possuem cleanup explícito.

8. **Modelo sem instrumentação de falha**
   - Correção: o carregamento é centralizado, cacheado e possui erro explícito. O botão AR só é criado quando o modelo e o suporte AR estão prontos.

9. **Escala física**
   - Correção: o GLB é medido com `Box3` e normalizado para 0,15 m no maior eixo horizontal. A base é alinhada a Y=0.

10. **Diagnóstico de aparelho**
    - Correção: a interface mostra contexto seguro, WebXR, immersive-ar, modelo, sessão, Hit Test e se algum hit chegou a ser detectado.

## Validações realizadas neste ambiente

- JSON de `package.json`, `tsconfig.json` e `vercel.json`: válido.
- Transpilação sintática de todos os arquivos `.ts` e `.tsx` com TypeScript 5.8.3: sem erros sintáticos.
- Busca por referências residuais a `model-viewer`: nenhuma no código.
- Estrutura do fluxo Hit Test comparada com o exemplo oficial do Three.js r172.
- `@vitejs/plugin-react@5.0.4` aceita Vite 7 em seu peer range.
- `three` e `@types/three` estão alinhados em 0.172.0.

## Limitação do ambiente desta auditoria

O ambiente usado para gerar este ZIP não possui acesso ao registry do npm. A tentativa de `npm install --offline` confirmou que os pacotes não estão em cache, portanto **não foi possível executar um `npm install` completo nem o `npm run build` real aqui**.

Isso é uma limitação de rede do ambiente, não uma confirmação de erro no projeto. Por isso o projeto inclui `npm run typecheck` e o build deve ser executado na máquina do usuário antes do push.

## Checklist antes do GitHub

```bash
rm -rf node_modules
rm -f package-lock.json
npm install
npm run typecheck
npm run build
```

Só faça o push se os três comandos concluírem sem erro.

## Checklist físico no Android

1. Abrir URL HTTPS da Vercel.
2. Confirmar `PROTÓTIPO AR • v0.6.0`.
3. Abrir `Diagnóstico técnico`.
4. Confirmar:
   - HTTPS: OK
   - WebXR: OK
   - immersive-ar: yes
   - Modelo 3D: ready
5. Tocar em `Ver na minha mesa`.
6. Confirmar que somente câmera/AR aparece, sem o site sobreposto.
7. Mover lentamente sobre a mesa.
8. Confirmar círculo verde.
9. Tocar para posicionar o hambúrguer.
10. Sair do AR e abrir novamente.

Se o círculo não aparecer, encerre o AR e abra o painel de diagnóstico. O campo `Hit Test` e `Algum hit detectado` indicam se o problema está na criação do Hit Test ou no rastreamento de superfícies do aparelho.
