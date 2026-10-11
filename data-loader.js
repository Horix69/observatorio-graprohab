async function loadSiteJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw Error('Arquivo de dados indisponível: ' + path);
  const data = await response.json();
  if (!data.parts) return data;
  const directory = path.slice(0, path.lastIndexOf('/') + 1);
  const chunks = await Promise.all(data.parts.map(name => loadSiteJSON(directory + name)));
  const rows = chunks.flat();
  return data.format === 'rows' ? {columns: data.columns, rows} : rows;
}
