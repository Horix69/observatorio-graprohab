# On Demand de SJRP

Página integrada ao menu Pesquisa e dados do Observatório GRAPROHAB. Link direto após publicar: `https://horix69.github.io/observatorio-graprohab/#on-demand-sjrp`.

## Atualizar o site no GitHub

1. Extraia o pacote completo.
2. No repositório `observatorio-graprohab`, substitua `index.html` e `app.js` pelos arquivos desta versão.
3. Adicione `sjrp.js`, `sjrp.css` e a pasta `assets/sjrp` com seus dois arquivos (`dados.json` e `leis_revisadas.csv`).
4. Os demais arquivos e pastas do site estão preservados no pacote. Se preferir substituir tudo, envie o conteúdo extraído para a raiz do repositório, mantendo a estrutura. Não envie apenas o ZIP.
5. Faça o commit e aguarde o GitHub Pages publicar. Atualize o navegador e abra o item “On Demand de SJRP”.

Não exige instalação ou compilação. Os caminhos são relativos, compatíveis com GitHub Pages. A integração não substitui as bases GRAPROHAB, IBGE ou PNAD.

## Conteúdo e interação

Página longa com 17 seções: categorias de titulares; empresas/SPEs; copropriedade; autoria; indicadores sobrepostos de atividade; série anual; mandatos; fases das gestões; participação empresarial; titulares e fichas; agrupamentos empresariais candidatos; sobrenomes entre leis; sobrenomes dentro da mesma lei; localidades; contrapartidas; base de leis; fontes e método.

Filtros próprios por período, gestão, categoria, busca e medida dos gráficos. Os anos são aplicados pelo botão “Aplicar período” ou Enter. Gráficos e tabelas acompanham o recorte; os gráficos podem ser baixados em SVG e a tabela de leis em CSV. Os links dos documentos abrem em outra aba. A visualização inicial mantém o estilo do site e a nova página usa Montserrat.

## Retificações incorporadas em 19/11/2026

- AD significa áreas dominiais doadas à Prefeitura dentro do empreendimento.
- Conforme esclarecimento do responsável pelo levantamento, 20 leis não especificam a metragem a incorporar ao perímetro urbano. Sua área analítica é nula e não zero. Os 20 casos correspondem aos registros numéricos que estavam na coluna Contrapartida e foram discutidos na revisão. A lista explícita de leis consta nos metadados e no final da página.
- Há outras duas áreas já ausentes na planilha original: 529/2016 e 385/2013. Total: 22 leis sem área.
- Os valores originais de Área m2 desses 20 registros foram preservados em `area_original_m2`, exclusivamente para rastreabilidade; não participam de nenhum cálculo da página. O valor original da coluna Contrapartida também é preservado, sem ser interpretado como valor monetário ou metragem.
- A metragem das áreas dominiais doadas não foi validada e permanece nula. Não deve ser somada a partir de referências numéricas de outra coluna.
- A data da 764/2024 foi corrigida para 20/12/2024, mantendo a data original em campo separado.
- A 9.013/2003, substituída pela 9.124/2003, fica fora do recorte padrão. Existe opção para manter o histórico completo. Isso não significa auditoria integral da vigência das demais leis.

## Controles numéricos

| Universo | Leis | Com área | Sem área | Área conhecida m² |
|---|---:|---:|---:|---:|
| Padrão, sem a repetição conhecida | 158 | 136 | 22 | 44.843.262,1274 |
| Histórico completo | 159 | 137 | 22 | 44.885.353,4474 |

Soma de áreas conhecidas não é área territorial líquida. Não somar áreas entre titulares de copropriedade. Resultados de áreas e percentuais desta versão substituem os totais anteriores à retificação dos 20 casos.

## Arquivos de dados

- `assets/sjrp/dados.json`: metadados, 159 registros históricos, 209 identificações nominais de titulares, fontes e notas de evidência.
- `assets/sjrp/leis_revisadas.csv`: base integral com ausências preservadas em branco. O botão de exportação da página produz o recorte filtrado.

Nomes empresariais semelhantes, sobrenomes repetidos e endereços compartilhados não comprovam identidade jurídica, parentesco ou controle econômico. As fichas distinguem CNPJ associado, CNPJ candidato e pistas de busca. A classificação externa registra evidência encontrada e não comprova atuação histórica em todas as datas.

## Verificação realizada

Sintaxe JavaScript validada; reconciliação de categorias e áreas; carregamento por HTTP; navegação original e nova; filtros de período, busca e medida; histórico; abertura de ficha; apresentação de áreas ausentes; exportação CSV verificada com valores nulos. Os arquivos originais, exceto index.html e app.js, foram comparados byte a byte com o pacote recebido.

A atualização ainda precisa ser enviada ao GitHub para mudar o site público.
