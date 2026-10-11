# Observatório GRAPROHAB — envio pelo navegador

Extraia o ZIP. Envie os arquivos da raiz e toda a pasta assets para a raiz do repositório, mantendo a estrutura. Não envie o ZIP como arquivo do site. São menos de 100 arquivos; se a interface recusar o lote, envie os arquivos da raiz primeiro, depois as subpastas dentro de assets, preservando os caminhos.

GitHub Pages: Settings > Pages > Deploy from a branch > main > / (root).

Os JSON maiores foram divididos em partes e são remontados pelo data-loader.js. Todas as linhas e indicadores da base foram preservados. Não altere ou exclua os arquivos *-parte-*.json.

As planilhas históricas GRAPROHAB ficam no pacote separado Planilhas_GRAPROHAB_Referencia.zip. Elas não são necessárias ao funcionamento deste site. O Excel unificado IBGE, metadados, gráficos, tabelas, limites municipais e exportações filtradas estão incluídos.

Esta versão é para hospedagem estática. Requer HTTP; abrir index.html por file:// não carrega as bases. Dados publicados ficarão acessíveis conforme a hospedagem. Importações pelo site valem para a sessão, não gravam no GitHub.
