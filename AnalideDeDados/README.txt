# PET Saúde Digital — dashboard renovado

## Arquivos
- `main.html`: estrutura da página e componentes.
- `main.css`: identidade visual responsiva inspirada na referência enviada.
- `main.js`: leitura das planilhas, filtros, KPIs, gráficos, tabela, exportação CSV e navegação.

## Como integrar
1. Faça uma cópia de segurança da pasta atual `AnalideDeDados`.
2. Substitua `main.html`, `main.css` e `main.js` pelos arquivos deste pacote.
3. Mantenha a pasta `dados/` no mesmo diretório de `main.html`, com os arquivos Excel.
4. Os nomes de arquivos esperados são:
   - `dados_gestantes_1.xlsx` até `dados_gestantes_5.xlsx`
   - `desenvolvimento infantil 1.xlsx` até `desenvolvimento infantil 5.xlsx`
5. Publique pelo Netlify como já faz atualmente. Para testar localmente, use um servidor HTTP local (por exemplo, a extensão Live Server no VS Code); abrir `main.html` diretamente por `file://` impede o `fetch` das planilhas em vários navegadores.

## Recursos
- Navegação lateral: Visão Geral, Equipes, UBSs, Indicadores e Comparativos.
- Filtros por tipo de indicador, UBS, equipe e competência.
- Cards com equipes únicas, total de pacientes conforme os registros, média aritmética de boas práticas, maior razão e registros com razão zero.
- Gráficos de evolução, comparação, quantidade por equipe e distribuição por faixa.
- Busca na tabela, seletor de colunas e exportação CSV.
- Importação manual de arquivos Excel pelo botão “Adicionar dados”.

## Observações importantes
- A leitura de cabeçalhos tenta localizar colunas por termos aproximados, mas os cabeçalhos reais podem variar entre versões de planilhas. Verifique a tabela e o console do navegador após integrar.
- A soma de pacientes entre competências pode repetir a mesma população em períodos diferentes. O card representa a soma dos registros atualmente filtrados, não necessariamente indivíduos únicos.
- A média de boas práticas é a média aritmética do campo “somatório das boas práticas” nos registros carregados. Confirme com a equipe se esse é o indicador desejado.
- As faixas ≥40%, 20–39,99% e <20% são apenas sinalização visual inicial e precisam ser confirmadas com a equipe técnica.
- Não usar os resultados para decisão assistencial ou avaliação oficial antes de validar as fórmulas e os dados com as planilhas de origem.
- O carregamento dos gráficos depende de Chart.js e a leitura de Excel depende de SheetJS, ambos incluídos via CDN; é necessária conexão à internet para carregá-los.
