	// spreadsheet: https://docs.google.com/spreadsheet/ccc?key=0AuNh4LTzbqXMdGNmS2tSY0NaNXV5cEsxTWVhTjdLN2c&usp=drive_web#gid=19
	
	
var KEY = "0AuNh4LTzbqXMdGNmS2tSY0NaNXV5cEsxTWVhTjdLN2c",
	DATA_URL = function(k){
		return "https://docs.google.com/spreadsheet/pub?key={{key}}&output=csv".replace("{{key}}", k);
	}

var COL = {
	"ley" : 0,
	"personas" : 2,
	"bloque" : 3,
	"prov" : 4,	
	"votos" : 5
};

var data;
// d3.text("leyes_diputados.csv", function(data) { // get csv ### csv local para desarrollo
d3.text(DATA_URL(KEY), function(data) { // get csv from google

	data = d3.csv.parseRows(data); // parsear csv
	var head = data[0]; // cabecera de la tabla
	data.splice(0,1);	// borro cabecera del arr
	DATA = data;
	LISTAS = get_filtros( DATA ); // listados de filtros

	// d3.scale.category10()
	scale = d3.scale.category10(LISTAS.votos);

	// console.log(LISTAS)

	table = d3.select("#viz") // crear tabla ***
		.append("table")
		.attr("class", "table table-striped table-bordered dataTable")
		;

	thead = table.append("thead")
				.append('tr')
				.selectAll("th")
				.data(head).enter()
				.append('th').text(function(d){return d;});
	tbody = table.append("tbody");
	
	
	// START
// ***********  TABLA
	generar_filtros(data);

	var hash = window.location.hash;
	//  *****if(hash) filtrar_data(null, hash);

	d3.select("a#reset_filtros") // rest filtros
	.on("click", function(){
		table.style({"overflow":"hidden"})
		.transition().style({"height": "0px", "overflow":"hidden"})
		.duration(200);
		
		var filtros = d3.selectAll("#filtros select")[0]
			.forEach(function(el){ el.disabled=false; });

		$("#viz table").dataTable().fnDestroy();
		generar_filtros(data);
		d3.event.preventDefault();
	});

	tooltip = d3.select("#tooltip");

// ***********  LEYES
	var lista_leyes = d3.select("#lista_leyes").
		selectAll("li").data(LISTAS.ley).enter()
		.append("li").text(function(d){return d})
		.on("click", function(ley){
			dibujar_svg_diputados(ley, this);
		});
		rect_ref = gen_referencias("#viz_ref_l");
		pintar_referencias(rect_ref);
// ***********  PERSONAS
	var lista_leyes = d3.select("#lista_personas").
		selectAll("li").data(LISTAS.personas).enter()
		.append("li")
		.attr('id', function(d, i){
			return "persona_"+i;
		})
		.text(function(d){return d})
		.on("click", function(persona){
			// console.log(persona)
			dibujar_svg_persona(persona, this, "#viz_persona");
		});
		rect_ref_personas = gen_referencias("#viz_ref_p");
		pintar_referencias(rect_ref_personas);
// ***********  BLOQUES
	var lista_leyes = d3.select("#lista_bloques").
		selectAll("li").data(LISTAS.bloque).enter()
		.append("li").text(function(d){return d})
		.attr('id', function(d, i){
			return "bloque_"+i;
		})
		.on("click", function(bloque){
			dibujar_svg_bloque_politico(bloque, this);
		});
		rect_ref_bloques = gen_referencias("#viz_ref_b");
		pintar_referencias(rect_ref_bloques);


});

function gen_referencias(id){
	var w_ref = parseInt(100/LISTAS.votos.length);
	// console.log(w_ref)
	var svg_ref = d3.select(id).append('svg').style({"width": "100%" ,"height": "35px"});
	var referencias = svg_ref.append('g').attr("class", "referencias")
						.selectAll("g")
						.data(LISTAS.votos).enter()
						.append('g').attr("class", "item")
						


	var rect_ref = referencias.append('rect')
					// .style('fill', function(d){ 
					// 	if(d[5])
					// 		return	scale(d[5]);
					// 	else
					// 		return "#000";
					// 	})
					.attr('width', 7)
					.attr('height', 7)
					.attr('x', function(d, i){ return ((i * w_ref) + "%")})
					.attr('y', 20)
										
	referencias.append('text').text(function(d){ 
									if(d)
										return d;
									else
										return "No definido";
								})
						.attr('x', function(d, i){ return ((i * w_ref)+2 + "%")})
						// .attr('x', "+=7px")
						.attr('y', 27)

	return rect_ref;
}


function filtrar(_data){
	var filtros = d3.selectAll("#filtros select");
	var data_tmp = _data;
	var id_filtro_seleccionado = [];
	var hash= [];
	filtros[0].forEach(function(el){
		var col_name = el.id;
		var value = el.options[el.selectedIndex].value;
		var indice_col =  COL[col_name];
		if (value != "*"){
			el.disabled=true;
			id_filtro_seleccionado.push( "#"+col_name);
			console.log(value)
			data_tmp = data_tmp.filter(function(d){
				// console.log(d[indice_col] == value)
				// d[indice_col] == 
				return d[indice_col] == value;
			});

			hash.push(el.id + "=" + value);
		}

	});
	if(hash[0]){ window.location.hash=hash.join("&"); }

	var combos = d3.selectAll("select")
	if(id_filtro_seleccionado[0]){
		id_filtro_seleccionado.forEach(function(x){
			combos = combos.filter(":not(" + x + ")");
			// console.log(combos)
		});
	}

	generar_filtros(data_tmp, combos);
	escribir_tabla(data_tmp);

}


function escribir_tabla(_data){ // imprime la tabla
	
	tbody.html("");
	var tr = tbody.selectAll("tr")
		.data(_data)
		.enter()
		.append("tr");

	var td = tr.selectAll("td")
		.data(function(d){return d })
		.enter()
		.append("td")
		.html(function(d, i){
			var regex =  /^(http\:\/\/)|(https\:\/\/)/gi;
			if(regex.test(d)){
				var out = "<a href='"+d+"' title='Votación Nominal' target='_blank'>Ver original</a>"
			}else{
				var out = d;
			};
			return out;
		});

	// table.style({"display": "block"})
	// .style({"height": "auto", "overflow":"hidden"});
	
	$("#viz table").dataTable( {
			// "sDom": "<'row'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>",
			//"sDom": "l f r t p i",
			"sDom": "f r t p i",
			"sPaginationType": "bootstrap",
			"oLanguage": {
				"sLengthMenu": "_MENU_ Filas por página.",
				"oPaginate": {
					"sNext": "Proximo",
					"sPrevious": "Anterior"
				},
				"sInfo": "Total: _TOTAL_ filas",
				"sSearch": "Buscar en la tabla",
				"sInfoFiltered": "(filtrado a partir de _MAX_ filas)",
				"sInfoEmpty": "No hay resultados",
				"sZeroRecords": "No hay resultados",
			},
			"bDestroy": true
	});

	// table_sort();

}
	// $("#viz table").dataTable().fnDestroy();

function generar_filtros(_data, _combos){
	var f = get_filtros(_data);
	
	this.filtros = d3.selectAll("#filtros select") // puntero a los combos
		.on("change", function(){
			$("#viz table").dataTable().fnDestroy();
			filtrar(_data);

			// ******************************filtrar_data(this);
		});
	var combos = _combos ? _combos : this.filtros;	
	
	combos[0].forEach(function(el){
		var filtro_id = el.id, // nombre el filtro actual
			dx = d3.select(el); // puntero al filtro actual
			
		dx.html(""); // borro el contenido

		dx.selectAll("option") // reescribo el contenido
		.data(f[filtro_id]).enter()
		.append("option").text(function(d){ return d});
		
		dx.insert("option", ":first-child").attr({"value": "*", "selected": "true"}).text("Todos"); // preppend de la opccion "Todos".
		
	});
}

function get_filtros( _data ){	// retorna obj con los filtros	
	var _get_uniques = function(_columna, __data__){ // retorna un arr de los unicos en una columna
		this.data= __data__ ? __data__ : _data;

		var tmp= this.data.map(function(d){
			return d[_columna];
		});
		return d3.set(tmp).values().sort();
	}

	this.f = {
		"ley" 		: _get_uniques(COL.ley),
		"personas"	: _get_uniques(COL.personas),
		"bloque"	: _get_uniques(COL.bloque),
		"prov"		: _get_uniques(COL.prov),
		"votos"		: _get_uniques(COL.votos)
	};
	return this.f;
}

function filtrar_data(_data, col_id, str){
	_data = _data.filter(function(d){
		return d[col_id] == str;
	});
	return _data;
}


function dibujar_svg_diputados(ley, el){
	var $el = $(el);

	if($el.hasClass('active')){
		return false;
	}else{
		$("ul#lista_leyes li.active").removeClass('active');
		$el.addClass('active');
	}
	var data_ley = DATA;
	// data_ley = data_ley.filter(function(d){
	// 	return d[COL.ley] == ley;
	// });
	d3.select("#nombre_ley").html(ley + " <small>(**)</small>");
	data_ley = filtrar_data(data_ley, COL.ley, ley);
	data_ley.sort(function(a, b){
		if(a[COL.votos] < b[COL.votos]){
			return 1;
		}else if((a[COL.votos] == b[COL.votos])){
			return 0;
		}else{
			return -1;
		}
	})
	var svg = d3.select("#viz_ley svg")
		.style({"width": "100%", "height": "100%"});
		svg.selectAll("path").remove();

	var paths = svg.selectAll("path")
		.data(data_ley).enter()
		.append('path')
		.on("mouseover", function(d){
			var text = d[COL.personas] + "<br>" + d[COL.bloque] + "<br>" + d[COL.votos] + "<br>" + d[COL.ley]
			mover_tooltip(text);
			
		})
		.on("mouseout", function(){
			tooltip.style("display", "none")
		})
		// .attr('d',  function(d, x){
		// 	return gen_radom_d_path();
		// })
		.attr('d', function(d, i){
			// pats_d
			return pats_d[i];
		})
		.style("fill", "#fff")
		.transition()
		.style("fill", function(d){
			if(d[5])
				return	scale(d[5]);
			else
				return "#000"
		});
		// pintar_referencias(rect_ref)
		d3.selectAll("#viz_ref_l .item")
			.on("click", function(d){
				var select = svg.selectAll("path").filter(function(x){
					return d == COL.votos;	
				});

				select.style("display", "none")
			});
}
function pintar_referencias(__ref__){
	__ref__.style("fill", function(d){
			if(d)
				return	scale(d);
			else
				return "#000"
		});
}

function dibujar_svg_persona(persona, el, id_content){

	var $el = $(el);
	var id_persona  = "barra_" + el.id;
	if($el.hasClass('active')){
		$el.removeClass('active');
		d3.select("#"+id_persona).remove();
		return false;
	}else{
		// $("ul#viz_persona li.active").removeClass('active');
		$el.addClass('active');
	}



		crear_barra_persona(id_content, id_persona, persona)
		// console.log(detalle_p)

}

function crear_barra_persona(id_content, id_persona, persona){
	var data_p 		= DATA;
		data_p 		= filtrar_data(data_p, COL.personas, persona);
	var detalle_p	= get_filtros(data_p);
	
	var cant_votos	= data_p.length,
		tipo_voto	= [];
	LISTAS.votos.forEach(function(d, i){
		tipo_voto[i] = data_p.filter(function(x){
			return d == x[COL.votos];
		});
	});

	var svg_p = d3.select(id_content).append('svg')
				.attr('id', id_persona)
				.attr('width', '100%')
				.attr('height', '80px');
	
	var width_x = 0;
	
	var c = {
		"title_x": 0,
		"title_y": 20,
		"bajada_x": 0,
		"bajada_y": 35,
		"posision_linea": 40,
		"alto_line": 30
	}
	// var text = detalle_p.personas[0]
	svg_p.append('text').text(persona) // tittle persona
		.attr('x', c.title_x)
		.attr('y', c.title_y)
		.attr('class', "title")
	svg_p.append('text').text(cant_votos + " sesiones tomadas en cuenta para este calculo") // bajada
		.attr('x', c.bajada_x)
		.attr('y', c.bajada_y)
		.attr('class', "bajada");
		// .attr('width', "100%")
		// .attr( "text-anchor", "middle")
		// .style("font-size", "12px");

	svg_p.append("g").selectAll("rect").data(tipo_voto).enter()
		.append('rect')
		.on({
			"mousemove": function(d, i){
				var text = d.length + " " + d[0][COL.votos] +
					" de "+cant_votos+" sesiones. <br>" +
					"Esto significa el " + parseInt(d3.select(this).attr("width").replace("%", "")) + "% (*)" ;
				mover_tooltip(text);
			},
			"mouseout": function(d, i){
				tooltip.html("")
				.style("display", "none")

			}
		})

		.attr({
			"height": c.alto_line,
			// "x": ,
			"y": c.posision_linea
		})
		.attr('width', 0)
		.attr('x', 0)
		.transition()
		.attr('width',  function(d){ 
				if(d.length){	
					// var w = (cant_votos/d.length) *100;
					var w = (100*d.length) /cant_votos;
					return w + "%";
				}
			})
		.attr("x", function(d){
				if(d.length){
					var w = (100*d.length) /cant_votos;
					width_x += w;
					var x = width_x - w;
					return x + "%";
				}	
			})
		.style( "fill", function(d){
			if(d[0])
				return scale(d[0][COL.votos]);
		});
}

function dibujar_svg_bloque_politico(bloque, el){
	var $el = $(el);
	var id_bloque  = "content_" + el.id;
	
	if($el.hasClass('active')){
		$el.removeClass('active');
		d3.select("#"+id_bloque).remove();
		return false;
	}else{
		$("ul#lista_bloques li.active").removeClass('active');
		d3.select(".bloques").remove();
		$el.addClass('active');
	}
	var div_bloque = d3.select("#viz_partidos").append('div').attr("id", id_bloque).attr('class', 'bloques well');
		div_bloque.append('h2').html(bloque);
		div_bloque.append('hr');

	var data_b	= DATA;
	data_b 		= filtrar_data(data_b, COL.bloque, bloque);
	var detalle_b	= get_filtros(data_b);
	
	detalle_b.personas.forEach(function(persona, i){
		var id_persona =  id_bloque +"_persona_" + i;
		crear_barra_persona("#"+id_bloque, id_persona, persona)
		// console.log(x, i)
	})


}

function mover_tooltip(t){
	tooltip.html(t)
		.style("display", "block")
		.transition().duration(50)
			.style({
				"left": (d3.event.clientX + 30) + "px",
				"top": (d3.event.clientY - 30) + "px"
			});
}
$(function(){ 
	$("#tab a").click(function(event) {
		var $el = $(this);
		var id 	= $el.attr("href");
		if($el.is(".active")) return false;
		$("#tab .active").removeClass('active');
		$el.parent().addClass('active');
		
		$(".tab-pane.active").fadeOut('fast', function() {
			$(this).removeClass('active');
			$(id).fadeIn('fast', function() {
				$(this).addClass('active');
			});
		});
		return false;
	});
	$.get("bancas_diputados.txt", function(d){ // busca el svg
		$("#viz_ley").html(d);
		var p = $("#viz_ley path");
		pats_d = [];
		p.each(function(i, el){
			pats_d[i] = $(el).attr("d");
		})
		p.remove();
	});
})

function get_random(n, int){
	n = Math.random()*n;
	if(int) n = parseInt(n);
	return n;
}
function gen_radom_d_path(){
	var randoms = [get_random(get_random(300, true), true), get_random(get_random(300, true), true), get_random(get_random(300, true), true), get_random(get_random(300, true), true), get_random(get_random(300, true), true), get_random(get_random(300, true), true)];
	// var path = "M {{0}} {{1}} q {{2}} {{+-}}{{3}} {{4}} {{5}}z"
	var path = "M{{0}} {{1}} L{{2}} {{3}} L{{4}} {{5}} Z"
	randoms.forEach(function(x, i){
		var key = "{{"+i+"}}";
		path = path.replace(key, x);
	});
	return path;
}

function table_sort(){
	$("#viz table").dataTable( {
			// "sDom": "<'row'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>",
			//"sDom": "l f r t p i",
			"sDom": "f r t p i",
			"sPaginationType": "bootstrap",
			"oLanguage": {
				"sLengthMenu": "_MENU_ Filas por página.",
				"oPaginate": {
					"sNext": "Proximo",
					"sPrevious": "Anterior"
				},
				"sInfo": "Total: _TOTAL_ filas",
				"sSearch": "Buscar en la tabla",
				"sInfoFiltered": "(filtrado a partir de _MAX_ filas)",
				"sInfoEmpty": "No hay resultados",
				"sZeroRecords": "No hay resultados",
			},
			"bDestroy": true,
	});
}
