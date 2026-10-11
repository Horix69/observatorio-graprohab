# Observatório — design OpenDesign e bases IBGE

Preparação local em 10/10/2026. O ZIP enviado pelo usuário foi preservado. Nenhuma atualização foi publicada nesta etapa.

## Uso
Sirva esta pasta por HTTP ou envie os arquivos da raiz e assets/ a uma hospedagem estática. Abra Censos IBGE no menu Pesquisa e dados.

A área censitária possui filtros próprios: censo, AP e município. Ela considera os 645 municípios da base, inclusive aqueles sem processos na GRAPROHAB. Os filtros de situação, proprietário e protocolo não se aplicam aos censos. APs usam os quatro conjuntos de municípios já definidos no site, não uma classificação IBGE estadual completa.

## Atualização
Na página Censos IBGE, selecione um CSV, Excel ou JSON. A importação substitui somente a base municipal IBGE da sessão. Para publicar permanentemente, substitua assets/ibge/municipios.json e atualize os arquivos de origem, metadados e validação antes de enviar o site à hospedagem.

Cabeçalhos obrigatórios: ibge_id, municipio, ano. Código deve ter sete dígitos, iniciado em 35. Ano aceito: 1991, 2000, 2010 ou 2022. Chave única: ibge_id + ano. JSON pode ser uma lista de registros ou objeto com lista municipios. Excel utiliza a primeira aba com esses cabeçalhos. CSV aceita vírgula, ponto e vírgula ou tabulação, campos entre aspas e UTF-8.

Campos apresentados: populacao_residente, homens, mulheres, densidade_demografica_hab_km2, taxa_ocupacao_imoveis. Números usam ponto decimal sem separador de milhares; taxas são frações de 0 a 1. Vazios permanecem null, exibidos como —. Duplicatas e valores inválidos nesses campos são rejeitados antes de substituir a sessão.

## Conteúdo
- municipios.json: 2.580 registros, 645 por censo, sem duplicatas.
- distribuicoes.json: 66.610 registros demográficos, integrados às tabelas de idade, gênero, raça/cor e situação urbana/rural.
- domicilios_nao_ocupados_2022.json: 7.740 registros estruturais; tabela de vagos e uso ocasional por estrutura física em 2022.
- metadados.json e metadados_e_cobertura.csv: definições e cobertura da base processada.
- base_unificada_censos_SP_1991_2000_2010_2022.xlsx e CSV municipal: origens para importação/download.
- validacao.json: contagens, ausência de população e metadados.

Há 73 valores ausentes de população em 1991. Os totais com ausência são identificados como parciais. Áreas e recortes históricos exigem atenção e foram mantidos conforme a base processada. Não foram inferidos indicadores de renda, migração ou expectativa de vida ausentes.

## Arquitetura e verificação
ibge.js mantém a base censitária separada dos arrays de processos usados por app.js. O CSS do OpenDesign foi preservado integralmente. As instruções no DESIGN-HANDOFF.md foram tratadas como referências do arquivo recebido, não como pedido de publicar ou ampliar o escopo.

Verificações: sintaxe JavaScript, chave e cobertura censitária, recorte AP Bauru em 2022 e 1991 na prévia local, preservação de null e rejeição de duplicatas. Importação permanente exige novo envio à hospedagem; o botão não grava no servidor.


## Seção CENSO IBGE — tabelas e séries
Demografia, Domicílios, Gráficos de população, Gráficos de ocupação de domicílios, Outros indicadores e tabela municipal, Base e cobertura. As subseções podem ser recolhidas e acessadas pelos links internos.

Tabelas comparativas usam colunas 1991/2000/2010/2022. Filtros territoriais afetam todos os anos. O censo selecionado controla a tabela municipal completa. Gráficos incluem população, gênero, idade, raça/cor, crescimento, envelhecimento, densidades e domicílios; o seletor de indicadores permite consultar as demais séries.

80+ em 2022 no gráfico etário soma as faixas de 80 a 84, 85 a 89, 90 a 94, 95 a 99 e 100+. A tabela mantém as faixas originais. Não se fundem Ignorada e Sem declaração. Percentuais das distribuições usam o total válido da dimensão do recorte.

Agregação: contagens somadas, taxas calculadas por razões entre numeradores e denominadores, índices etários calculados sobre as contagens etárias, crescimento agregado apenas com pares completos de totais municipais. Em 2022 utiliza população 2010 compatibilizada quando disponível. Não há média simples de densidades, taxas ou índices. Cobertura parcial aparece junto ao valor e nos títulos dos pontos.

Verificação adicional: Bauru e AP Bauru nos quatro anos; taxa de ocupação 2022; ausência do universo de ocupação em 1991; expectativa de vida ausente; cobertura estadual 1991; somas etárias 80+; gráficos sem pontos artificiais em anos ausentes; tabela municipal detalhada; navegação interna e console da prévia sem erros.
