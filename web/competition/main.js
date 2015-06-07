const MAX_OND = 60;
const GRAPH_WIDTH = 600, GRAPH_HEIGHT = 600;
const TARGET_ELT_ID = 'graph_div';
const ARC_WIDTH_FACTOR = 0.85;
const RADIAL_SCALE = d3.scale.linear().domain([0,1]).range([10, GRAPH_HEIGHT*0.45]);
const AIRPORT_SCALE = d3.scale.linear().domain([0,500,1000,2000,25000]).range([0,500,900,1500,5000]);
const AIRLINE_COLORS = d3.scale.category10();

function getDataThroughAjaxCall(onds, callback) {
  var query = "start n=node(2) \
    match (n)-->(m)-->(p)-->(q)-->(o)-->(r) \
    return m.myid, p.myid, o.airline, count(*) as weigth, avg(r.myid)\
    order by weigth descending \
    limit " + onds + ";";
  neoproxy.callDb(query, callback);
}

function buildChordGraph(neoData) {
  var dataSet = buildDataSetFromNeoResult(neoData);
  console.log(dataSet);
  var translatedSvgGroup = getTranslatedSvgGroup();
  var arcs = buildArcs(dataSet, translatedSvgGroup);
  var chords = buildChords(dataSet, translatedSvgGroup);
  var arcLegend = buildArcsLegend(dataSet, translatedSvgGroup);
  var airlineLegend = buildAirlineLegend(dataSet);
  setMouseHooverListeners(arcs, chords, arcLegend, airlineLegend);
}

function buildDataSetFromNeoResult(neoData) {
  var dataSet = {
      maxFg : 0, scaledMaxFg : 0,
      airportToIdx : {},
      airports : [],
      airlines : [],
      onds : []
  };
  var tmpMap = {};
  
  dataSet.maxFg = neoData.reduce(function (acc, cur) { 
    return acc += 2*cur[3]; 
  }, 0);
  
  neoData.forEach(function (d) {
    if (!( d[0] in tmpMap ))
      tmpMap[d[0]] = 0;
    tmpMap[d[0]] += d[3];
    if (!( d[1] in tmpMap ))
      tmpMap[d[1]] = 0;
    tmpMap[d[1]] += d[3];
  });
  
  for (var prop in tmpMap) {
    var l = dataSet.airports.push({ airport:prop, weigth : tmpMap[prop] });
    dataSet.scaledMaxFg += AIRPORT_SCALE(tmpMap[prop]);
    dataSet.airportToIdx[prop] = l-1;
  }
  tmpMap = {};
  
  neoData.forEach(function (d) {
    var route = d.slice(0,2).sort();
    var key = route.join() + d[2];
    if (!( key in tmpMap ))
      tmpMap[key] = { pt_1:route[0], pt_2:route[1], airline:d[2], weigth:0, avg:d[4] };    
    tmpMap[key].weigth += d[3];
  });
  
  for (var prop in tmpMap) 
    dataSet.onds.push(tmpMap[prop]);
  dataSet.onds.sort(function(a,b) {return a.airline < b.airline;} );
  
  tmpMap = {};  
  dataSet.onds.forEach(function (d) {
    if (!( d.airline in tmpMap )) {
      tmpMap[d.airline] = 1;
      dataSet.airlines.push(d.airline);
    }
  });
  return dataSet;
}

function getTranslatedSvgGroup() {
  var translateToCenter = 'translate(' 
    + Math.floor(GRAPH_WIDTH*0.5) + ", "
    + Math.floor(GRAPH_HEIGHT*0.54) + ")";
  var target = d3.select('#' + TARGET_ELT_ID).append('svg')
    .attr('height', GRAPH_WIDTH + 'px').attr('width', GRAPH_HEIGHT + 'px')
    .append('g')
    .attr('transform', translateToCenter);
  return target;
}

function getTargetSvg() {
  var target = d3.select('#' + TARGET_ELT_ID + ' svg');
  //!target.empty() || throw "Could not find SVG target";
  return target;
}

function buildArcs(dataSet, svgSelection) {
  var startRad = 0;
  function getEndAngle(d,i) { 
    var rad = 2 * Math.PI * AIRPORT_SCALE(d.weigth) / dataSet.scaledMaxFg;
    dataSet.airports[i].radius = rad;
    dataSet.airports[i].startRad = startRad;
    //console.log("Rad " + d.airport + " : " + rad);
    return startRad += rad; 
  }
  var arcPath = d3.svg.arc()  
    .outerRadius(RADIAL_SCALE(1))
    .innerRadius(RADIAL_SCALE(ARC_WIDTH_FACTOR))
    .startAngle(function() { return startRad; })
    .endAngle(getEndAngle);
  
  var colorScale = d3.scale.category20b();
  
  var arcs = svgSelection.append('g').selectAll('path').data(dataSet.airports)
    .enter().append('path');
  arcs.attr('id', function(d) { return d.airport; } )
    .attr('d', arcPath)
    .attr('fill', function (d) { return colorScale(d.airport); });
  return arcs;
}

function buildArcsLegend(dataSet, svgSelection) {
  function positionFactory(func) {
    function giveCoordinate(d) {
      var rad = d.startRad + (d.radius - Math.PI)/2;
      //console.log(rad);
      return func(rad) * RADIAL_SCALE(1);
    }
    return giveCoordinate;
  }
  var texts = svgSelection.append('g').selectAll('text').data(dataSet.airports)
    .enter().append('text')
    .attr('x', positionFactory(Math.cos))
    .attr('y', positionFactory(Math.sin))
    .text(function(d) { return d.airport; } );
  return texts;
}

function buildChords(dataSet, svgSelection) {
  var startRad = {};
  dataSet.airports.forEach(function(d) {
    startRad[d.airport] = d.startRad;
  });
  
  function arcAccessorFactory(propName) {
    function accessor(d) {
      var idx = dataSet.airportToIdx[d[propName]];
      var arc = {};
      arc.radius = RADIAL_SCALE(ARC_WIDTH_FACTOR);
      arc.startAngle = startRad[d[propName]]+0.0;
      arc.endAngle = startRad[d[propName]] + dataSet.airports[idx].radius * d.weigth / dataSet.airports[idx].weigth;
      startRad[d[propName]] = arc.endAngle+0.0;
      //console.log(arc);
      return arc;
    }
    return accessor;
  }
  
  var chordPath = d3.svg.chord()  
    .source(arcAccessorFactory('pt_1'))
    .target(arcAccessorFactory('pt_2'));
  
  var chords = svgSelection.append('g').selectAll('path').data(dataSet.onds)
    .enter().append('path');
  chords.attr('id', function(d) { return d.pt_1+d.pt_2+"-"+d.airline; } )
    .attr('d', chordPath)
    .attr('fill', function (d) { return AIRLINE_COLORS(d.airline); });
  return chords;
}

function buildAirlineLegend(dataSet) {
  function shiftRight(d,i) {
    return 'translate(' + (55*i+20) + ',' + 30 + ')';
  }
  
  var legend = getTargetSvg().append('g').selectAll('g')
    .data(dataSet.airlines )
    .enter().append('g').attr('transform', shiftRight).append('g');
  
  legend.append('circle')
    .attr('fill', AIRLINE_COLORS)
    .attr('r', '0.5em').attr('cy', '-0.4em');
  legend.append('text')
    .attr('x', '1.2em' ).text(identity);
  return legend;
}
