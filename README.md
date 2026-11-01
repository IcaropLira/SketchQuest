# Hiraku SketchQuest

Gerador de ideias de desenho, na mesma família visual do portfólio Hiraku. React + TypeScript (Vite), 100% no navegador: sem servidor, sem conta. Os dados ficam no `localStorage`.

## Rodar

```
npm install
npm run dev
npm run build
```

## Deploy

Vercel (framework Vite, build `npm run build`, saída `dist`). O `vercel.json` já faz o rewrite das rotas.

## O que tem

- **Gerador**: frases aleatórias montadas por partes (quem, como, fazendo, detalhe, onde) com concordância de gênero, mais frases prontas. Modo aleatório, pronto ou misto; nível de detalhe simples, normal ou rico.
- **Tema da vez** em retângulo: o clique abre um modal com todos os temas (multi-seleção, busca, aplicar/cancelar).
- **Opções de geração**: tipo de frase, proporção de prontas, detalhe (inclusive partes personalizadas), palavras genéricas, desafio, paleta (tamanho e harmonia), não repetir recentes, gerar ao trocar de tema, tamanho do lote e restaurar padrões.
- **Apagar**: ideia por ideia no histórico, "apagar esta", limpar o histórico, e em Salvos limpar histórico/favoritos/estatísticas ou tudo.
- **Travar partes** da frase (🔒) e gerar o resto, ou sortear só uma parte (🎲).
- **Histórico** (← / →), favoritos, copiar, compartilhar por link, baixar cartão PNG, "Desenhei" (conta para a sequência).
- **15 temas** + **mistura de temas** + **temas próprios** (editor em *Meus temas*).
- **Desafios extras** (44 regras) e **paletas** sugeridas; página de paletas com 8 harmonias, travar cores, copiar HEX/CSS.
- **Ideia do dia**, igual para todo mundo (semente = data).
- **Lote** de 5 ideias de uma vez.
- **Sessão cronometrada**: fila de desenhos, apito, pausar/pular, tela acesa (Wake Lock).
- **Quadro de rabiscos**: lápis, borracha, desfazer/refazer, cores da paleta da ideia, papéis, cronômetro, exportar PNG.
- **Salvos**: filtros, busca, notas, nota de 1 a 5 estrelas, exportar `.txt`, backup/restauração em `.json`.
- **Progresso**: sequência de dias, calendário, temas favoritos e 12 conquistas.

## Estrutura

```
src/
  data/themes/    # conteúdo dos temas (grupoA/B/C) e index
  data/extras.ts  # desafios, adjetivos/ações/detalhes globais, cores
  lib/            # gerador, gramática pt-BR, paletas, estatísticas, share
  store/          # estado global + persistência
  components/     # Layout, PromptCard, ThemePicker, Heatmap...
  pages/          # uma por rota
```

## Escrevendo conteúdo para um tema

- Substantivos com artigo: `o dragão`, `a bruxa`.
- Adjetivos com forma feminina depois de `|`: `velho|velha` (sem `|`, vale para os dois).
- Ações também aceitam `visto|vista de cima`.
- `noGlobal: true` num tema impede mistura com adjetivos/ações genéricos (bom para temas de objetos).
- Para adicionar um tema novo: crie o objeto em `src/data/themes/` e inclua em `BUILTIN_THEMES`.
