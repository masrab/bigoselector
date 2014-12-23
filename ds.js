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
    background,
    foreground;

var source_select = d3.select("#source_select");

// initialize the plot
d3.csv(source_select.property('value'), function(err, dataset) {
  draw(dataset);

  // create sliders
  create_sliders(dimensions);
});

// select data source and draw
source_select.on("change", function(){

  // clean the figure (better way??)
  svg.selectAll('g').remove(); 

  // load data and draw
  d3.csv(source_select.property('value'), function(err, dataset) {
    draw(dataset);

    // update sliders
    create_sliders(dimensions);
});



});




// functions 

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
      .property({'type':'range', 'min':0, 'max':100, 'step':10});


}



function draw(dataset) {
  // extract colnames
  dimensions = d3.keys(dataset[0]).filter(function(d) {
    return d != "Name"});

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
      .attr('d', path);

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
function path(d) {
  return line(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
}

function tbl_row(obj) {
  var obj = d3.map(obj);
  obj.remove('Name');
  var header = obj.keys().map(function(v) { return '<th>'+v+'</th>'});
  var row = obj.values().map(function(v) { return '<td>'+v+'</td>'});
  return '<tr>' + header.join('') + '</tr>' + '<tr>'+row.join('')+'</tr>';
}

function highlight(selection) {
  selection.style({'stroke': 'gold', 'stroke-width': '3px'});
  d3.select('#btn-title').text(selection.datum().Name).style('display', 'block');
  d3.select('#tbl_output').html(tbl_row(selection.datum()));
}
