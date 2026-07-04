---
layout: page
title: Buscar
permalink: /buscar/
---

<link href="{{ site.baseurl }}/pagefind/pagefind-ui.css" rel="stylesheet">
<div id="search"></div>
<script src="{{ site.baseurl }}/pagefind/pagefind-ui.js"></script>
<script>
	window.addEventListener('DOMContentLoaded', function () {
		new PagefindUI({
			element: '#search',
			showSubResults: true,
			showImages: false,
			translations: {
				placeholder: 'Buscar no blog\u2026',
				clear_search: 'Limpar',
				load_more: 'Carregar mais resultados',
				search_label: 'Buscar neste site',
				filters_label: 'Filtros',
				zero_results: 'Nenhum resultado para [SEARCH_TERM]',
				many_results: '[COUNT] resultados para [SEARCH_TERM]',
				one_result: '[COUNT] resultado para [SEARCH_TERM]',
				alt_search: 'Nenhum resultado para [SEARCH_TERM]. Mostrando resultados para [DIFFERENT_TERM]',
				search_suggestion: 'Nenhum resultado para [SEARCH_TERM]. Tente uma destas buscas:',
				searching: 'Buscando por [SEARCH_TERM]\u2026'
			}
		});
	});
</script>
