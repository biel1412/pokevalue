# PokéValue ⚡

Sua carteira de cartas Pokémon TCG, no celular. Tire uma foto da carta, cadastre o valor de mercado e acompanhe seu patrimônio num dashboard no estilo de app financeiro.

**Abrir o app:** https://biel1412.github.io/pokevalue/

## Funcionalidades

- **Dashboard**: patrimônio total, variação no período (7D / 1M / 3M / 1A / Tudo), gráfico interativo (arraste o dedo), investido × lucro, suas cartas mais valiosas e alocação por tipo
- **Escanear carta**: foto pela câmera ou galeria (comprimida automaticamente), nome, coleção, número, tipo, raridade, condição (M/NM/SP/MP/HP/D), idioma, quantidade, preço pago e valor de mercado
- **Busca automática**: digite o nome (ex.: `charizard ex 125`), escolha a carta e o app preenche coleção, número, tipo, raridade, imagem oficial e **preço de mercado convertido para R$** (TCGplayer em US$ e Cardmarket em €, com cotação do dia). Dados da [TCGdex](https://tcgdex.dev), câmbio da [Frankfurter](https://frankfurter.dev)
- **Atualizar todos os preços** com um toque (tela inicial ou Perfil) para as cartas vinculadas à busca
- **Pesquisa manual**: atalhos para Liga Pokémon, TCGplayer e Cardmarket
- **Inventário**: grade com busca, filtros por tipo e favoritas, ordenação por valor, valorização, data ou nome
- **Detalhe da carta**: efeito 3D/holo ao tocar, histórico de preço, lucro/prejuízo, atualização rápida do valor
- **Análise**: distribuição por tipo, raridade e coleção, maiores altas e cartas em queda
- **Modo privacidade**: botão de olho esconde todos os valores
- **Backup**: exportar/importar tudo (inclusive fotos) em `.json`
- **Funciona offline** e pode ser instalado na tela inicial (PWA)

## Instalar no celular

- **iPhone (Safari):** Compartilhar → *Adicionar à Tela de Início*
- **Android (Chrome):** menu ⋮ → *Instalar app*

## Onde ficam os dados

Tudo fica salvo **no próprio aparelho** (IndexedDB do navegador). Nada é enviado para servidores. Use *Perfil → Exportar backup* de vez em quando para guardar uma cópia.

## Desenvolvimento

App estático, sem etapa de build: HTML, CSS e JavaScript puro.

```bash
python3 -m http.server 8080
# abra http://localhost:8080
```

```
index.html            estrutura e barra de navegação
css/app.css           visual
js/db.js              armazenamento (IndexedDB)
js/app.js             telas, rotas e lógica
sw.js                 cache offline
manifest.webmanifest  configuração de PWA
```

---

Fã-app não oficial. Pokémon é marca registrada da Nintendo / Creatures / GAME FREAK / The Pokémon Company. Os valores são informados manualmente pelo usuário.
