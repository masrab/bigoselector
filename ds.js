var margin = {top: 30, right: 10, bottom: 10, left: 10},
    width = 1000 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;


var svg = d3.select(".chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


var x = d3.scale.ordinal().rangePoints([0, width], 1),
    y = {};

var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    foreground;

var source_select = d3.select("#source_select");

// first time
// load data and render the page
d3.csv(source_select.property("value"), function(err, dataset) {
  render_page(dataset);
});


// on source change
source_select.on("change", function(){

  // clean up svg canvas
  svg.selectAll('*').remove(); 
  // load data and render the page
  d3.csv(source_select.property("value"), function(err, dataset) {
    render_page(dataset);
  });

});




// functions 


function obj_ascending (obj1, obj2) {
  return d3.ascending(d3.values(obj1), d3.values(obj2));
}

function obj_descending (obj1, obj2) {
  return d3.descending(d3.values(obj1), d3.values(obj2));
}


function render_page(dataset){

  // extract colnames
  var dimensions = d3.keys(dataset[0]).filter(function(d) {
    return d != "Name"});


  draw(dataset, dimensions);

  // create sliders
  create_sliders(dimensions);



  var n = get_size();
  var scores = score(dataset, n);
  render_ranking(scores); 

  d3.selectAll(".controls input")
  .on("input", function() {

    var n = get_size();
    var scores = score(dataset, n);
    render_ranking(scores); 

  });

};


function render_ranking (scores) {

  d3.select("div#ranking").selectAll("*").remove();

  d3.select("div#ranking")
  .append("ol")
  .selectAll("li")
  .data(scores)
  .enter()
  .append("li")
  .sort(obj_descending)
  .text(function(d) {return d3.keys(d)+": "+ d3.values(d).map(d3.format(".4f"));})


}

function print_debug(names, weight, row_scores, row_costs){

 var score_div = d3.select("div.debug");

 score_div.html(null);

 score_div.append('h2').text('Weights: ');
 score_div.append('p').text(weight.map(d3.format("%")));


 score_div.append('h2').text('row_scores: ');
 score_div.append("div")
 .selectAll("p")
 .data(row_scores)
 .enter()
 .append("p")
 .text(function(d,i) { return names[i]+ ': '+ d.map(d3.format(".3f")).join('  ,  '); });


 score_div.append('h2').text('row_costs: ');
 score_div.append("div")
 .selectAll("p")
 .data(row_costs)
 .enter()
 .append("p")
 .text(function(d,i) { return names[i]+ ': '+ d.map(d3.format(".3f")).join('  ,  '); });

 console.log('row_costs: ', row_costs);
 console.log('row_scores: ', row_scores); 

}





function score(dataset, n) {
  // n: problem size
  var values = get_slider_values(),
  slider_sum = d3.sum(values),
  weight = values.map(function(x) { return x/slider_sum;});
  console.log(weight);

  //calc cost for each row
  var row_costs = dataset.map(function(d) {return row_cost(d, n);} );

  var row_scores = row_costs.map(function(cost) { return row_score(weight, cost)});

  var scores = row_scores.map(function(rs) {return d3.sum(rs);});

  var names = dataset.map(function(d){ return d.Name;});
  print_debug(names, weight, row_scores, row_costs);


  var scores_obj = [];
  for (i in names) {
    tmp = {};
    tmp[names[i]] = scores[i];
    scores_obj.push(tmp);
  };

 return scores_obj;
}

// calculate score for given cost and weight vectors
function row_score(weight, cost){
// weight: vector of weights (length = # dimensions)
// cost: vector of cost calculated from equations (length = # dimensions)
var score = [];

for (i in cost){
  score[i] = weight[i] * (1/cost[i]);
};

return score;
};

// calculate cost vector for a single row
function row_cost(d, n) {
  // d: object representing one row of data
  // n: problem size

  var d = d3.map(d);
  d.remove('Name');

  var dimensions = d.keys();
  var cost = [];

  var cost = dimensions.map(function(dim) {
   return equations[d.get(dim)](n); 
 });


  return cost;
};

var equations= 
{
  'O(n!)': function(x) {
    var rval=1;
    for (var i = 2; i <= x; i++) {
      rval = rval * i;
    }
    return rval;
  },

  'O(n^2)': function(x) {
    return x * x;
  },

  'O(n log(n))': function(x) {
    return x * Math.log(x);
  },

  'O(log(n))': function(x) {
    return Math.log(x);
  },

  'O(n)': function(x) {
    return x;
  },

  'O(m+n)': function(x) {
    return x;
  },

  'O(1)': function(x) {
    return 1;
  },

  'Undefined': function(x) {
    // return 1e15;
    return Infinity;
  }

};

function get_size(){
  return +d3.select("div#size input").property('value');
}


function get_slider_values() {
  var slider_values = 
  d3.selectAll('div#sliders input')[0]
  .map(function(slider) {return +slider.value;});

  return slider_values;
};


// dynamically create sliders for each input dimension
function create_sliders(dimensions) {

    d3.select('#sliders')
    .selectAll('div')
    .remove();
    
    d3.select('#sliders')
    .selectAll('div')
      .data(dimensions)
    .enter()
      .append('div')
      .attr('id', function(d,i) { return 'slider'+i; })
      .append('label')
      .text(function(d) { return d; })
      .append('input')
      .property({'type':'range', 'min':0, 'max':100, 'step':25});


}



function draw(dataset, dimensions) {
  
  x.domain(dimensions);

  // create an array of scales. one for each column
  dimensions.forEach(function(d){ 
    y[d] = d3.scale.ordinal()
        .domain(d3.set(dataset.map(function(row) { return row[d];})).values().sort()) // extract column
        .rangePoints([0,height-20])
  });

  var foreground = svg.append('g')
      .attr('class', 'foreground')
      .selectAll('path')
      .data(dataset)
      .enter()
      .append('path')
      .attr('d', function(d) { return path(d,dimensions); } );

  // Add a group element for each dimension.
  var g = svg.selectAll(".dimension")
            .data(dimensions)
          .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function(d) { return "translate(" + x(d) + ")"; });

  g.append("g")
      .attr("class", "axis")
      .each(function(d) { d3.select(this).call(axis.scale(y[d])); });
      
  var labels = g.append("text")
      .style("text-anchor", "middle")
      .attr("y", -15)
      .attr('class', 'label')
      .text(function(d) { return d; });

      // highlight the first path
      d3.select('.foreground path').call(highlight);

      // hover effect
      foreground
      .on('mouseover', function(d) { 
        d3.selectAll('.foreground path').style({'stroke': '#ddd', 'stroke-width': '1px'})
        d3.select(this).call(highlight);
      });


}


// Returns the path for a given data point.
function path(d, dimensions) {
  return line(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
}

function tbl_row(obj) {
  var obj = d3.map(obj);
  obj.remove('Name');
  var header = obj.keys().map(function(v) { return '<th>'+v+'</th>'});
  var row = obj.values().map(function(v) { return '<td>'+v+'</td>'});
  return '<tr>' + header.join('') + '</tr>' + '<tr>'+row.join('')+'</tr>';
}

function highlight(selected_path) {
  selected_path.style({'stroke': 'gold', 'stroke-width': '3px'});
  d3.select('#btn-title').text(selected_path.datum().Name).style('display', 'block');
  d3.select('#tbl_output').html(tbl_row(selected_path.datum()));
}
