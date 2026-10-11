/* Base censitária isolada da base de processos GRAPROHAB. */
window.IBGE = (() => {
  let reference, current, loading, year = 2022, city = '', ap = '', source = 'Base censitária processada', message = '', distributions = [], structures = [], metadata = [], distributionsActive = true, explorer = 'populacao_residente';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = value => value === null || value === undefined || value === '' ? '—' : Number(value).toLocaleString('pt-BR', {maximumFractionDigits: 2});
  function validate(rows) {
    if (!Array.isArray(rows) || !rows.length) throw Error('A base municipal está vazia.');
    const keys = new Set();
    return rows.map((row, index) => {
      const r = {...row, ibge_id: String(row.ibge_id ?? '').trim(), ano: Number(row.ano)};
      if (!/^35\d{5}$/.test(r.ibge_id) || ![1991,2000,2010,2022].includes(r.ano) || !String(r.municipio ?? '').trim()) throw Error(`Linha ${index + 1}: informe ibge_id (7 dígitos de SP), municipio e ano censitário.`);
      const key = `${r.ibge_id}:${r.ano}`;
      if (keys.has(key)) throw Error(`Chave repetida: ${key}. A importação não foi aplicada.`);
      keys.add(key);
      for (const field of ['populacao_residente','homens','mulheres','densidade_demografica_hab_km2','taxa_ocupacao_imoveis']) {
        if (r[field] === '' || r[field] === undefined) r[field] = null;
        if (r[field] !== null && (!Number.isFinite(Number(r[field])) || Number(r[field]) < 0)) throw Error(`Linha ${index+1}: valor inválido em ${field}. Use números sem separador de milhares e ponto decimal.`);
        if (r[field] !== null) r[field] = Number(r[field]);
      }
      if (r.taxa_ocupacao_imoveis !== null && r.taxa_ocupacao_imoveis > 1) throw Error(`Linha ${index+1}: taxa_ocupacao_imoveis deve ser uma fração entre 0 e 1.`);
      return r;
    });
  }
  async function load() {
    if (!loading) loading = Promise.all(['municipios','distribuicoes','domicilios_nao_ocupados_2022','metadados'].map(name => loadSiteJSON(`assets/ibge/${name}.json`))).then(([rows,d,h,m]) => {reference = validate(rows); current = reference; distributions = d; structures = h; metadata = m;}).catch(e => {loading = null; throw e;});
    return loading;
  }
  async function importFile(file, element) {
    try {
      let rows;
      if (/\.json$/i.test(file.name)) {const parsed = JSON.parse(await file.text()); rows = Array.isArray(parsed) ? parsed : parsed.municipios;}
      else {
        let matrix;
        if (/\.csv$/i.test(file.name)) matrix = parseDelimited(await file.text());
        else {const book = XLSX.read(await file.arrayBuffer(), {type:'array'}); for (const name of book.SheetNames) {const candidate = XLSX.utils.sheet_to_json(book.Sheets[name], {header:1,defval:''}); if (candidate[0]?.includes('ibge_id') && candidate[0]?.includes('ano')) {matrix = candidate; break;}}}
        if (!matrix) throw Error('Nenhuma aba com cabeçalhos ibge_id e ano.');
        const headers = matrix[0].map(h => String(h).replace(/^\uFEFF/,'').trim());
        rows = matrix.slice(1).filter(r => r.some(v => v !== '')).map(r => Object.fromEntries(headers.map((h,i) => [h, r[i] === '' || r[i] === undefined ? null : r[i]])));
      }
      const checked = validate(rows); current = checked; distributionsActive = false; source = file.name; city = ''; ap = ''; year = Math.max(...checked.map(r => r.ano)); message = 'Base IBGE da sessão atualizada. Recarregar a página restaura a referência.';
    } catch (e) {message = e.message;}
    if (element.isConnected) draw(element);
  }
  const YEARS = [1991,2000,2010,2022];
  const present = v => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
  const pick = (r, keys) => {for (const k of keys) if (present(r[k])) return Number(r[k]); return null;};
  const metric = (id,label,keys,unit='',kind='sum',den=[]) => ({id,label,keys,unit,kind,den});
  const DEMO = [
    metric('populacao_residente','Total da população',['populacao_residente']),
    metric('homens','Homens',['homens']),metric('mulheres','Mulheres',['mulheres']),
    metric('percentual_homens','Homens · distribuição por gênero (%)',['homens'],'%','ratio',['populacao_residente']),
    metric('percentual_mulheres','Mulheres · distribuição por gênero (%)',['mulheres'],'%','ratio',['populacao_residente']),
    metric('densidade','Densidade demográfica',['densidade_demografica_hab_km2'],'hab./km²','density',['area_municipal_km2']),
    metric('densidade_favelas','Densidade demográfica em favelas / aglomerados subnormais',['densidade_fcu_hab_km2','densidade_demografica_aglomerado_subnormal_hab_km2'],'hab./km²','favdensity',['area_fcu_km2','area_aglomerados_subnormais_km2']),
    metric('pop_favelas','População em favelas / aglomerados subnormais',['populacao_fcu','populacao_aglomerado_subnormal','populacao_aglomerado_subnormal_amostra']),
    metric('pct_pop_favelas','População em favelas / aglomerados subnormais (%)',['populacao_fcu','populacao_aglomerado_subnormal','populacao_aglomerado_subnormal_amostra'],'%','ratio',['populacao_residente']),
    metric('pct_dom_favelas','Domicílios em favelas / aglomerados subnormais (%)',['domicilios_fcu','domicilios_aglomerado_subnormal','domicilios_aglomerado_subnormal_amostra'],'%','ratio',['domicilios_permanentes_ocupados','domicilios_ocupados','domicilios_ocupados_amostra','domicilios_permanentes_ocupados_amostra']),
    metric('vida','Expectativa de vida ao nascer',['expectativa_vida_ao_nascer'],'anos','single'),
    metric('envelhecimento','Índice de envelhecimento populacional · 60+ por 100 menores de 15',['indice_envelhecimento_60mais_por_100_menores_15'],'','age'),
    metric('saldo','Saldo migratório (IBGE)',['saldo_migratorio_ibge']),
    metric('crescimento','Taxa de crescimento populacional anual',['crescimento_anual_2010_2022','crescimento_anual_2000_2010','crescimento_anual_1991_2000','crescimento_anual_1980_1991'],'% a.a.','growth'),
    metric('area','Área municipal',['area_municipal_km2'],'km²'),
    metric('area_favelas','Área de favelas / aglomerados subnormais',['area_fcu_km2','area_aglomerados_subnormais_km2'],'km²'),
    metric('numero_fcu','Número de favelas e comunidades urbanas',['numero_fcu'])
  ];
  const HOMES = [
    metric('ocupados','Ocupados · particulares 2000/2010; permanentes 2022',['domicilios_particulares_ocupados_t1310','dppo']),
    metric('vagos','Vagos · particulares 2000/2010; permanentes 2022',['domicilios_particulares_nao_ocupados_vagos_t1310','dppv']),
    metric('ocasional','Uso ocasional · particulares 2000/2010; permanentes 2022',['domicilios_particulares_nao_ocupados_uso_ocasional_t1310','dppuo']),
    metric('total_harmonizado','Total ocupado + vago + uso ocasional',['total_domicilios_particulares_t1310','total_dom_particulares_permanentes_enumerados']),
    metric('taxa_ocupacao','Taxa de ocupação de imóveis',['domicilios_particulares_ocupados_t1310','dppo'],'%','ratio',['total_domicilios_particulares_t1310','total_dom_particulares_permanentes_enumerados']),
    metric('taxa_vagos','Participação dos vagos',['domicilios_particulares_nao_ocupados_vagos_t1310','dppv'],'%','ratio',['total_domicilios_particulares_t1310','total_dom_particulares_permanentes_enumerados']),
    metric('taxa_ocasional','Participação do uso ocasional',['domicilios_particulares_nao_ocupados_uso_ocasional_t1310','dppuo'],'%','ratio',['total_domicilios_particulares_t1310','total_dom_particulares_permanentes_enumerados']),
    metric('nao_ocupados','Particulares permanentes não ocupados · 2022',['dpp_nao_ocupado']),
    metric('recenseados','Total de domicílios recenseados · 2022',['total_domicilios_recenseados']),
    metric('particulares','Total de domicílios particulares · 2022',['domicilios_particulares']),
    metric('permanentes','Total de particulares permanentes · 2022',['domicilios_particulares_permanentes']),
    metric('dppo','Particulares permanentes ocupados (DPPO) · 2022',['dppo']),
    metric('entrevista','DPPO com entrevista · 2022',['dppo_com_entrevista']),
    metric('sem_entrevista','DPPO sem entrevista · 2022',['dppo_sem_entrevista']),
    metric('improvisados','Particulares improvisados · categoria da base 2022',['domicilio_particular_improvisado_ocupado']),
    metric('coletivos','Domicílios coletivos · total',['domicilio_coletivo_total']),
    metric('coletivos_com','Domicílios coletivos com morador',['dccm']),
    metric('coletivos_sem','Domicílios coletivos sem morador',['domicilio_coletivo_sem_morador']),
    metric('dom_favelas','Domicílios em favelas / aglomerados subnormais',['domicilios_fcu','domicilios_aglomerado_subnormal','domicilios_aglomerado_subnormal_amostra']),
    metric('ocupados_amostra_1991','Permanentes ocupados · amostra 1991',['domicilios_permanentes_ocupados_amostra']),
    metric('ocupados_amostra_2000','Ocupados · amostra 2000',['domicilios_ocupados_amostra']),
    metric('ocupados_base_2010','Ocupados · base de aglomerados 2010',['domicilios_ocupados']),
    metric('pct_dom_favelas', 'Domicílios em favelas / aglomerados subnormais (%)',DEMO.find(m=>m.id==='pct_dom_favelas').keys,'%','ratio',DEMO.find(m=>m.id==='pct_dom_favelas').den)
  ];
  const ALL = [...DEMO,...HOMES.filter(m=>!DEMO.some(d=>d.id===m.id))];
  function seriesContext(rows, ids) {
    const byYear = Object.fromEntries(YEARS.map(y=>[y,rows.filter(r=>r.ano===y)]));
    const d = distributionsActive ? distributions.filter(r=>ids.has(String(r.ibge_id))) : [];
    return {byYear,d,expected:ids.size};
  }
  function value(m,y,ctx) {
    const rows=ctx.byYear[y], expected=ctx.expected;
    const result=(v,n)=>({v,known:n,total:expected});
    if(!rows.length) return result(null,0);
    if(m.kind==='single') return rows.length===1?result(pick(rows[0],m.keys),present(pick(rows[0],m.keys))?1:0):result(null,0);
    if(m.kind==='growth') {
      if(rows.length===1) {const v=pick(rows[0],m.keys);return result(v===null?null:v*100,v===null?0:1)}
      const prev={2000:1991,2010:2000,2022:2010}[y];if(!prev)return result(null,0);
      let totalNow=0,totalPrev=0,n=0;
      for(const r of rows){const old=ctx.byYear[prev].find(o=>o.ibge_id===r.ibge_id);const a=pick(r,['populacao_residente']),b=y===2022&&present(r.populacao_2010_compatibilizada)?Number(r.populacao_2010_compatibilizada):old?pick(old,['populacao_residente']):null;if(a!==null&&b!==null&&b>0){totalNow+=a;totalPrev+=b;n++;}}
      return result(n===expected&&totalPrev>0?((totalNow/totalPrev)**(1/(y-prev))-1)*100:null,n);
    }
    if(m.kind==='age'&&rows.length>1){const a=ctx.d.filter(r=>r.ano===y&&r.dimensao==='faixa_etaria');const ids=new Set(a.map(r=>String(r.ibge_id)));let young=0,old=0;for(const r of a){const start=parseInt(r.categoria,10),v=r.populacao??r.estimativa_populacional;if(present(v)){if(start<15)young+=Number(v);if(start>=60)old+=Number(v)}}return result(ids.size&&young>0?old/young*100:null,ids.size)}
    if(m.kind==='age'){const v=pick(rows[0],m.keys);return result(v,v===null?0:1)}
    if(['ratio','density','favdensity'].includes(m.kind)){
      let num=0,den=0,n=0;
      for(const r of rows){let a=pick(r,m.keys),b=pick(r,m.den);
        if(m.kind==='density'){const pub=pick(r,m.keys);a=pub===null?null:pick(r,['populacao_residente']);}
        if(m.kind==='favdensity'){const pub=pick(r,m.keys);a=pub===null?null:pick(r,['populacao_fcu','populacao_aglomerado_subnormal','populacao_aglomerado_subnormal_amostra']);}
        if(a!==null&&b!==null&&b>=0){num+=a;den+=b;n++;}
      }
      // For one municipality, preserve the published density and its rounding.
      if(rows.length===1&&m.kind!=='ratio'){const v=pick(rows[0],m.keys);return result(v,v===null?0:1)}
      return result(n&&den>0?num/den*(m.kind==='ratio'?100:1):null,n);
    }
    const values=rows.map(r=>pick(r,m.keys)).filter(v=>v!==null);
    return result(values.length?values.reduce((a,b)=>a+b,0):null,values.length);
  }
  function cell(point,unit='') {
    const partial=point.v!==null&&point.known<point.total;
    return `<span title="${point.known}/${point.total} municípios com dados">${number(point.v)}${point.v!==null&&unit?' '+escape(unit):''}${partial?` <small class="ibge-partial">(${point.known}/${point.total})</small>`:''}</span>`;
  }
  function matrix(metrics,ctx) {
    return `<div class="tablewrap"><table class="ibge-matrix"><thead><tr><th>Indicador</th>${YEARS.map(y=>`<th class="num">${y}</th>`).join('')}</tr></thead><tbody>${metrics.map(m=>`<tr><th scope="row">${escape(m.label)}${m.unit?` <small>${escape(m.unit)}</small>`:''}</th>${YEARS.map(y=>`<td class="num">${cell(value(m,y,ctx))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  const COLORS=['#438fff','#43c7c1','#b29aff','#ffa969','#ed7fa6','#93bd56','#b1bbca'];
  function plot(title,series,unit='') {
    const points=series.flatMap(s=>s.values.map(p=>p.v).filter(present));
    if(!points.length) return `<div class="ibge-chart-empty"><p>${escape(title)}</p><span class="muted">Dados indisponíveis neste recorte.</span></div>`;
    const w=760,h=280,left=82,right=24,top=24,bottom=48;
    let min=Math.min(0,...points),max=Math.max(0,...points);if(max===min)max=min+1;
    const x=y=>left+(y-1991)/(2022-1991)*(w-left-right),yp=v=>top+(max-v)/(max-min)*(h-top-bottom);
    return `<div class="ibge-chart"><h4>${escape(title)}</h4><div class="legend">${series.map((s,i)=>`<span><i style="background:${COLORS[i%COLORS.length]}"></i>${escape(s.label)}</span>`).join('')}</div><div class="chart-scroll"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${escape(title)} · 1991, 2000, 2010 e 2022">${[0,.25,.5,.75,1].map(t=>{const v=min+(max-min)*t;return `<line x1="${left}" x2="${w-right}" y1="${yp(v)}" y2="${yp(v)}" stroke="var(--border)"/><text x="${left-10}" y="${yp(v)+4}" text-anchor="end">${number(v)}</text>`}).join('')}${YEARS.map(y=>`<text x="${x(y)}" y="${h-16}" text-anchor="middle">${y}</text>`).join('')}${series.map((s,i)=>{const color=COLORS[i%COLORS.length];return s.values.map((p,j)=>{if(p.v===null)return '';const previous=s.values[j-1],line=previous&&previous.v!==null?`<line x1="${x(YEARS[j-1])}" y1="${yp(previous.v)}" x2="${x(YEARS[j])}" y2="${yp(p.v)}" stroke="${color}" stroke-width="2.5"/>`:'';return line+`<circle cx="${x(YEARS[j])}" cy="${yp(p.v)}" r="5" fill="${color}"><title>${YEARS[j]} · ${escape(s.label)}: ${number(p.v)} ${escape(unit)} · cobertura ${p.known}/${p.total}</title></circle>`}).join('')}).join('')}</svg></div><p class="muted ibge-chart-note">${escape(unit||'Quantidade')} · Pontos ausentes não são ligados. Valores com cobertura parcial devem ser lidos com a tabela.</p></div>`;
  }
  const metricPlot=(title,ms,ctx,unit='')=>plot(title,ms.map(m=>({label:m.label,values:YEARS.map(y=>value(m,y,ctx))})),unit||ms[0].unit);
  function distribution(dim,ctx) {
    const raw=ctx.d.filter(r=>r.dimensao===dim),cats=[...new Set(raw.map(r=>r.categoria))].sort((a,b)=>dim==='faixa_etaria'?parseInt(a,10)-parseInt(b,10):a.localeCompare(b,'pt-BR'));
    const totals=Object.fromEntries(YEARS.map(y=>[y,raw.filter(r=>r.ano===y).reduce((a,r)=>a+Number(r.populacao??r.estimativa_populacional??0),0)]));
    const coverage=Object.fromEntries(YEARS.map(y=>[y,new Set(raw.filter(r=>r.ano===y).map(r=>r.ibge_id)).size]));
    const series=cats.map(label=>({label,values:YEARS.map(y=>{const subset=raw.filter(r=>r.ano===y&&r.categoria===label),known=subset.filter(r=>present(r.populacao??r.estimativa_populacional));return {v:known.length?known.reduce((a,r)=>a+Number(r.populacao??r.estimativa_populacional),0):null,known:coverage[y],total:ctx.expected}})}));
    const methods=[...new Set(raw.map(r=>`${r.ano}: ${r.metodo||r.universo||'Método não informado'}`))];
    const percentSeries=series.map(s=>({...s,values:s.values.map((p,j)=>({...p,v:p.v!==null&&totals[YEARS[j]]>0?p.v/totals[YEARS[j]]*100:null}))}));
    return {series,percentSeries,totals,html:series.length?`<div class="tablewrap"><table class="ibge-matrix"><thead><tr><th>Categoria</th>${YEARS.map(y=>`<th class="num">${y} · pessoas / %</th>`).join('')}</tr></thead><tbody>${series.map(s=>`<tr><th scope="row">${escape(s.label)}</th>${s.values.map((p,j)=>`<td class="num">${cell(p)}${p.v!==null&&totals[YEARS[j]]>0?` <small> / ${number(p.v/totals[YEARS[j]]*100)}%</small>`:''}</td>`).join('')}</tr>`).join('')}</tbody></table></div><details><summary>Métodos e universos por censo</summary>${methods.map(m=>`<p class="muted">${escape(m)}</p>`).join('')}</details>`:'<p class="muted">Distribuições indisponíveis para esta base.</p>'};
  }
  function section(id,title,content,open=true) {return `<details id="${id}" class="ibge-section" ${open?'open':''}><summary><h3>${escape(title)}</h3><span class="ibge-section-chevron" aria-hidden="true">⌄</span></summary><div class="ibge-section-body">${content}</div></details>`;}
  const DEMO_NOTE='Favelas e comunidades urbanas (2022) e aglomerados subnormais (censos anteriores) têm definições e universos próprios. 1991/2000 incluem estimativas da amostra. Expectativa de vida e saldo migratório não estão disponíveis na base processada. Crescimento anual: 1980–1991, 1991–2000, 2000–2010 e 2010–2022; no agregado, calculado entre os totais censitários completos disponíveis. Densidade e índices agregados usam razões entre totais, nunca a média simples dos índices municipais.';
  const HOME_NOTE='2000/2010: domicílios particulares da tabela 1310. 2022: particulares permanentes da tabela 4711. 1991: ocupados da amostra, apresentados separadamente. As categorias não têm o mesmo universo em todos os anos; os gráficos indicam essa mudança. Totais e subtotais não devem ser somados entre si.';
  function draw(element) {
    const cities=[...new Map(current.map(r=>[r.ibge_id,r.municipio])).entries()].sort((a,b)=>a[1].localeCompare(b[1],'pt-BR'));
    const ids=new Set(cities.filter(([id,n])=>(!city||id===city)&&(!ap||AP_CITIES[ap].some(v=>canonicalMapName(v)===canonicalMapName(n)))).map(([id])=>id));
    const rows=current.filter(r=>ids.has(r.ibge_id)),ctx=seriesContext(rows,ids);
    const age=distribution('faixa_etaria',ctx),race=distribution('raca_cor',ctx),sex=distribution('sexo',ctx),urban=distribution('situacao_domicilio',ctx);
    const m=id=>ALL.find(m=>m.id===id);
    const selectedMetric=m(explorer)||DEMO[0];
    const choices=ALL.map(m=>`<option value="${m.id}" ${m.id===explorer?'selected':''}>${escape(m.label)}</option>`).join('');
    const temporalDemo=[metricPlot('População residente', [m('populacao_residente')],ctx),metricPlot('Homens e mulheres no tempo',[m('homens'),m('mulheres')],ctx),metricPlot('Distribuição por gênero no tempo',[m('percentual_homens'),m('percentual_mulheres')],ctx,'%'),metricPlot('Crescimento populacional anual',[m('crescimento')],ctx),metricPlot('Índice de envelhecimento',[m('envelhecimento')],ctx),metricPlot('Densidade demográfica',[m('densidade')],ctx)].join('');
    const temporalHome=[metricPlot('Ocupados, vagos e uso ocasional',[m('ocupados'),m('vagos'),m('ocasional')],ctx),metricPlot('Taxas de ocupação, vacância e uso ocasional',[m('taxa_ocupacao'),m('taxa_vagos'),m('taxa_ocasional')],ctx,'%'),metricPlot('Domicílios coletivos',[m('coletivos'),m('coletivos_com'),m('coletivos_sem')],ctx),metricPlot('Domicílios em favelas / aglomerados subnormais',[m('dom_favelas')],ctx),metricPlot('Participação de domicílios em favelas / aglomerados subnormais',[m('pct_dom_favelas')],ctx,'%')].join('');
    const structureRows=distributionsActive?structures.filter(r=>ids.has(String(r.codigo_ibge))):[];
    const types=[...new Set(structureRows.map(r=>r.tipo_estrutura))];
    const structure=types.length?`<div class="tablewrap"><table><thead><tr><th>Estrutura · 2022</th><th class="num">Vagos</th><th class="num">Uso ocasional</th></tr></thead><tbody>${types.map(t=>{const values=['vago','ocasional'].map(s=>{const a=structureRows.filter(r=>r.tipo_estrutura===t&&r.especie.includes(s));return a.length?a.reduce((v,r)=>v+Number(r.domicilios),0):null});return `<tr><th scope="row">${escape(t)}</th>${values.map(v=>`<td class="num">${number(v)}</td>`).join('')}</tr>`}).join('')}</tbody></table></div>`:'<p class="muted">Estruturas de domicílios não ocupados indisponíveis.</p>';
    const header=`<div class="ibge-recorte"><div class="filtergrid"><label>Arranjo populacional<select id="ibge-ap"><option value="">Estado de São Paulo</option>${Object.keys(AP_CITIES).map(n=>`<option ${n===ap?'selected':''}>${escape(n)}</option>`).join('')}</select></label><label>Município<select id="ibge-city"><option value="">Todos do recorte</option>${cities.filter(([id,n])=>!ap||AP_CITIES[ap].some(v=>canonicalMapName(v)===canonicalMapName(n))).map(([id,n])=>`<option value="${id}" ${id===city?'selected':''}>${escape(n)}</option>`).join('')}</select></label><label>Censo para consulta municipal<select id="ibge-year">${YEARS.map(y=>`<option ${y===Number(year)?'selected':''}>${y}</option>`).join('')}</select></label></div><p class="muted">${escape(city?cities.find(([id])=>id===city)?.[1]:ap||'Estado de São Paulo')} · ${ids.size} municípios · ${escape(source)}. As tabelas comparativas e os gráficos mostram os quatro censos; o ano seleciona a tabela municipal detalhada.</p></div>`;
    const jumps=`<nav class="ibge-subnav" aria-label="Subseções do Censo IBGE"><a href="#ibge-demografia">Demografia</a><a href="#ibge-domicilios">Domicílios</a><a href="#ibge-populacao-graficos">Gráficos de população</a><a href="#ibge-domicilios-graficos">Gráficos de domicílios</a><a href="#ibge-explorar">Outros indicadores</a></nav>`;
    const population=section('ibge-demografia','Demografia',`<p class="muted">Indicadores gerais do recorte. — = indisponível; (n/total) = cobertura municipal parcial.</p>${matrix(DEMO,ctx)}<p class="muted">${DEMO_NOTE}</p><h4>Distribuição por gênero</h4>${sex.html}<h4>Distribuição etária · categorias originais</h4>${age.html}<h4>Distribuição por raça / cor</h4>${race.html}<p class="muted">Percentuais de distribuição calculados sobre o total válido da dimensão no recorte. Categorias ausentes não foram preenchidas com zero. “Ignorada” e “Sem declaração” permanecem distintas.</p>`);
    const homes=section('ibge-domicilios','Domicílios',`${matrix(HOMES,ctx)}<p class="muted">${HOME_NOTE}</p><h4>Não ocupados por estrutura física · 2022</h4>${structure}<h4>População por situação urbana / rural</h4>${urban.html}<p class="muted">Urbana/rural aqui conta pessoas, não domicílios.</p>`);
    const populationCharts=section('ibge-populacao-graficos','Gráficos de população',`<div class="ibge-chart-grid">${temporalDemo}${metricPlot('População em favelas / aglomerados subnormais',[m('pop_favelas')],ctx)}${metricPlot('Participação da população em favelas / aglomerados subnormais',[m('pct_pop_favelas')],ctx,'%')}${metricPlot('Densidade em favelas / aglomerados subnormais',[m('densidade_favelas')],ctx)}</div><h4>Raça / cor no tempo</h4><div class="ibge-chart-grid">${plot('Distribuição por raça / cor · pessoas',race.series)}${plot('Distribuição por raça / cor · percentual',race.percentSeries,'%')}</div><h4>Distribuição etária no tempo</h4><label class="ibge-select">Faixa etária<select id="ibge-age">${age.series.map(s=>`<option>${escape(s.label)}</option>`).join('')}</select></label><label class="ibge-select">Medida<select id="ibge-age-unit"><option value="count">Pessoas</option><option value="percent">Percentual da distribuição válida</option></select></label><div id="ibge-age-chart"></div><p class="muted">Faixas originais preservadas. 80 anos ou mais nos censos anteriores corresponde a faixas mais detalhadas em 2022; o gráfico de 80 anos ou mais soma as faixas de 80+ de 2022 para permitir a comparação. A tabela mantém as categorias originais. Consulte os métodos da tabela antes de comparar amostra e universo.</p>`);
    const homeCharts=section('ibge-domicilios-graficos','Gráficos de ocupação de domicílios',`<p class="muted">${HOME_NOTE}</p><div class="ibge-chart-grid">${temporalHome}</div>`);
    const explore=section('ibge-explorar','Outros indicadores e tabela municipal',`<label class="ibge-select">Indicador para comparar no tempo<select id="ibge-metric">${choices}</select></label><div id="ibge-explorer-chart">${metricPlot(selectedMetric.label,[selectedMetric],ctx)}</div><div id="ibge-explorer-table">${matrix([selectedMetric],ctx)}</div><details id="ibge-raw"><summary>Dados municipais · todos os campos disponíveis em ${year}</summary><div id="ibge-raw-table"></div></details>`,false);
    const imports=section('ibge-import','Base e cobertura',`<div class="import-row"><div class="import-copy"><strong>Atualizar somente os dados IBGE</strong><small>CSV, Excel ou JSON municipal. A importação vale para a sessão e não altera a GRAPROHAB. Ao importar uma base municipal, distribuições e estruturas da referência são ocultadas para evitar cruzamento com dados diferentes.</small></div><input id="ibge-file" type="file" accept=".csv,.xlsx,.xls,.json" aria-label="Importar base censitária IBGE"><button class="button" id="ibge-restore">Restaurar referência</button></div><p role="status">${escape(message)}</p><p><a href="assets/ibge/base_unificada_censos_SP_1991_2000_2010_2022.xlsx" download>Baixar base unificada</a> · <a href="assets/ibge/metadados_e_cobertura.csv" download>Metadados e cobertura</a></p>${metadata.map(r=>`<p class="muted"><strong>${escape(r.campo)}:</strong> ${escape(r.definicao)} ${escape(r.cobertura)}</p>`).join('')}`,false);
    element.innerHTML=header+jumps+population+homes+populationCharts+homeCharts+explore+imports;
    element.querySelector('#ibge-year').onchange=e=>{year=Number(e.target.value);draw(element)};
    element.querySelector('#ibge-ap').onchange=e=>{ap=e.target.value;city='';draw(element)};
    element.querySelector('#ibge-city').onchange=e=>{city=e.target.value;draw(element)};
    element.querySelector('#ibge-metric').onchange=e=>{explorer=e.target.value;const picked=m(explorer);element.querySelector('#ibge-explorer-chart').innerHTML=metricPlot(picked.label,[picked],ctx);element.querySelector('#ibge-explorer-table').innerHTML=matrix([picked],ctx)};
    const ageSelect=element.querySelector('#ibge-age'),ageUnit=element.querySelector('#ibge-age-unit');
    const drawAge=()=>{let selected=age.series.find(s=>s.label===ageSelect.value);if(selected){selected={...selected,values:selected.values.map(p=>({...p}))};if(selected.label==='80 anos ou mais'){const parts=age.series.filter(s=>parseInt(s.label,10)>=80&&s.label!=='80 anos ou mais').map(s=>s.values[3]);if(parts.some(p=>p.v!==null)){selected.values[3]={v:parts.reduce((a,p)=>a+(p.v??0),0),known:Math.max(...parts.map(p=>p.known)),total:ctx.expected}}}if(ageUnit.value==='percent')selected.values=selected.values.map((p,j)=>({...p,v:p.v!==null&&age.totals[YEARS[j]]>0?p.v/age.totals[YEARS[j]]*100:null}));}element.querySelector('#ibge-age-chart').innerHTML=selected?plot(`Faixa etária · ${selected.label}`,[selected],ageUnit.value==='percent'?'%':'Pessoas'):'<p class="muted">Sem distribuição etária disponível.</p>'};
    ageSelect.onchange=drawAge;ageUnit.onchange=drawAge;drawAge();
    element.querySelector('#ibge-file').onchange=e=>{if(e.target.files[0])importFile(e.target.files[0],element)};
    element.querySelector('#ibge-restore').onclick=()=>{current=reference;distributionsActive=true;source='Base censitária processada';year=2022;city='';ap='';message='Referência restaurada.';draw(element)};
    element.querySelector('#ibge-raw').ontoggle=e=>{if(!e.target.open||element.querySelector('#ibge-raw-table').innerHTML)return;const selected=rows.filter(r=>r.ano===Number(year));const keys=[...new Set(selected.flatMap(r=>Object.keys(r)))];element.querySelector('#ibge-raw-table').innerHTML=`<p class="muted">Cabeçalhos técnicos da base original; taxas originais em frações de 0 a 1. — indica ausência.</p><div class="tablewrap"><table><thead><tr>${keys.map(k=>`<th>${escape(k)}</th>`).join('')}</tr></thead><tbody>${selected.map(r=>`<tr>${keys.map(k=>`<td>${r[k]===null||r[k]===undefined?'—':escape(typeof r[k]==='number'?number(r[k]):r[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;};
    element.querySelectorAll('.ibge-subnav a').forEach(a=>a.onclick=()=>{const target=element.querySelector(a.getAttribute('href'));if(target)target.open=true});
  }
  return {validate, async mount(element) {try {await load();if(element.isConnected)draw(element)} catch(e) {if(element.isConnected)element.textContent=e.message}}, testing:{DEMO,HOMES,value,seriesContext}};
})();
