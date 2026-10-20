# Observatório GRAPROHAB e Censo IBGE

Site estático com o design atualizado e bases censitárias de 1991, 2000, 2010 e 2022.

## Publicar no GitHub Pages
1. Extraia o ZIP.
2. Envie os arquivos extraídos para a raiz do repositório. `index.html`, `app.js`, `ibge.js`, `style.css`, `ibge.css` e a pasta `assets` devem ficar juntos. Envie os arquivos, não apenas o ZIP.
3. Em Settings > Pages, selecione Deploy from a branch, a branch com os arquivos (normalmente main) e a pasta / (root).
4. Salve e aguarde a publicação. O GitHub mostrará o endereço do site.

Não é necessário instalar dependências ou compilar. Preserve a pasta assets e o arquivo .nojekyll. Se usar o envio pelo navegador, habilite a exibição de arquivos ocultos para enviar .nojekyll também. A estrutura usa caminhos relativos e funciona no endereço de um projeto do GitHub Pages.

O mapa-base OpenStreetMap requer conexão à internet. As bases IBGE e os limites municipais acompanham o pacote. Para manter o ZIP leve para envio pelo GitHub, as planilhas XLSX de origem não são incluídas; o site oferece a base municipal em CSV para download. A importação de CSV/Excel/JSON atualiza somente a sessão do navegador; para atualizar permanentemente, substitua os arquivos de dados e envie novamente ao repositório.

Ao publicar pelo GitHub Pages, o conteúdo ficará acessível conforme as regras da sua hospedagem. A restrição de acesso do antigo site privado não acompanha este pacote.

Consulte INTEGRACAO-IBGE.md para as definições, cobertura e instruções de atualização dos dados.
