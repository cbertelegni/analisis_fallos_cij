	// spreadsheet: https://docs.google.com/spreadsheet/ccc?key=0AuNh4LTzbqXMdGNmS2tSY0NaNXV5cEsxTWVhTjdLN2c&usp=drive_web#gid=19
var delitos = ["lesa", "tráfico", "trata de personas", "amparo"];
var tribunales= ["Cámara Federal de Apelaciones de La Plata",
"Cámara Federal de Apelaciones de Bahía Blanca",
"Cámara Federal de Apelaciones de Bahía Blanca",
"Cámara Federal de Apelaciones de Mar del Plata"]
var COL = {
	"expediente" : 0,
	"jurisdiccion" : 1,
	"tribunal" : 2,
	"demandado" : 3,	
	"caratula" : 5,
	"fallo" : 6,
	"archivo" : 7
};

var data;
// d3.text("leyes_diputados.csv", function(data) { // get csv ### csv local para desarrollo
d3.text( "db/cij_all.csv", function(data) { // get csv from google

	data = d3.csv.parseRows(data); // parsear csv
	var head = data[0]; // cabecera de la tabla
	data.splice(0,1);	// borro cabecera del arr
	
	tooltip = d3.select("#tooltip");
	// var tribunales= get_filtros(data, COL.tribunal); //busca trunales
	// console.log(tribunales);
	var li_tribunales = crear_tribunales(tribunales); //imprime trunales
	
	li_tribunales.on("click", function(d){
		d3.select("#viz_ref_p h2").html(d);
		if(d3.select(this).attr("class") != "active"){
			
			d3.selectAll("#tribunales .active").attr("class", "");
			d3.select(this).attr("class", "active");
		}else{
			// d3.select(this).attr("class", "")
		}
		var _tribunal = filtrar_data(data, COL.tribunal, d);
		
		var out= {};
		delitos.forEach(function(x, i){
			out[x] = filtrar_data(_tribunal, COL.fallo, x);
		});
		// console.log(out);
		dibujar_pie(out, _tribunal);
		d3.event.preventDefault();
	});

});

function dibujar_pie(_out, _tribunal){
	var total = _tribunal.length;
	console.log(total)
	var cScale = d3.scale.linear().domain([0, total]).range([0, 2 * Math.PI]);
	console.log(tooltip)
	var color = d3.scale.category10(); 
	var d= [];
	var anterior = 0;
	for(o in _out){ // arma la data
		var actual = _out[o].length + anterior;
		var tmp = [anterior,actual, _out[o], o] 
		anterior += _out[o].length
		d.push(tmp)
	}
		d.push([anterior,(total), _out, "Otros"])
		
		console.log(d)
	var data = d;

	gen_referencias("#viz_ref", data, color, total);
	var vis = d3.select("#svg_donut");
	vis.selectAll("path").remove();

	var arc = d3.svg.arc()
	.outerRadius(200)
	.startAngle(function(d){return cScale(d[0]);})
	.endAngle(function(d){return cScale(d[1]);});
	
	vis.selectAll("path")
	.data(data)
	.enter()
	.append("path")
	.on("mousemove", function(d){
			// console.log(d);
			var t = d[1] - d[0];
			var text = d[3] + " " + (t * 100/total).toFixed(2) + "%";
			text += "<br> Total: " + t;
			mover_tooltip(text);
		})
	.on("mouseout", function(){
		tooltip.style("display", "none")
		})
	.transition()
	.attr("d", arc)
	.style("fill", function(d, i){return color(i);})
	.attr("transform", "translate(300,200)");
}

function crear_tribunales(_tribunales){
	var t = d3.select("#tribunales")
				.selectAll("li")
				.data(_tribunales).enter()
				.append("li").text(function(d){ return d});
	return t;
}

function get_filtros( _data, _col ){	// retorna obj con los filtros	
	var _get_uniques = function(_columna, __data__){ // retorna un arr de los unicos en una columna
		this.data= __data__ ? __data__ : _data;

		var tmp= this.data.map(function(d){
			return d[_columna];
		});
		return d3.set(tmp).values().sort();
	}

	return _get_uniques(_col);
}

function filtrar_data(_data, col_id, str){
	_data = _data.filter(function(d){
		// return d[col_id] == str;
		var patt=new RegExp(str, "i")
		// return d[col_id] == str;
		
		return patt.test(d[col_id]);
	});
	return _data;
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
})

function gen_referencias(id, _data, _color, _total){
	var w_ref = parseInt(100/_data.length);
	// console.log(w_ref)
	d3.select(id).select("svg").remove()
	var svg_ref = d3.select(id).append('svg').style({"width": "100%" ,"height": "35px"});
	var referencias = svg_ref.append('g').attr("class", "referencias")
						.selectAll("g")
						.data(_data).enter()
						.append('g').attr("class", "item")

	var rect_ref = referencias.append('rect')
					.style('fill', function(d, i){ 
							return	_color(i);
						})
					.attr('width', 7)
					.attr('height', 7)
					.attr('x', function(d, i){ return ((i * w_ref) + "%")})
					.attr('y', 20)
										
	referencias.append('text').text(function(d){ 
			var t = d[1] - d[0];
			var text = d[3] + " " + (t * 100/_total).toFixed(2) + "%";
			return text;
		})
		.attr('x', function(d, i){ return ((i * w_ref)+2 + "%")})
		// .attr('x', "+=7px")
		.attr('y', 27)

	return rect_ref;
}
