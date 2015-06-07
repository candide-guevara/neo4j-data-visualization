const TRANSITION_DURATION = 500;
const DATA_TAB_ID = "num_data";
const TAB_HEADER_CLASS = "tab_header";
const TAB_ROW_CLASS = "tab_row";

function identity(d) { return d; }

///////////////////////////// FILTER FACTORIES /////////////////////////////////////////////

function filterRouteFactory(ref, exclude) {
  return function(d) {
    return exclude ^ (d.pt_1 == ref.pt_1 && d.pt_2 == ref.pt_2);
  };
}
function filterPointFactory(ref, exclude) {
  return function(d) {
    return exclude ^ (d.pt_1 == ref.airport || d.pt_2 == ref.airport);
  };
}
function filterAirportFactory(ref, exclude) {
  return function(d) {
    return exclude ^ (ref.some(function(item) {
      return item.pt_1 == d.airport || item.pt_2 == d.airport;
    }));
  };
}
function filterAirlineFactory(ref, exclude) {
  return function(d) {
    return exclude ^ (ref.some(function(item) { return item.airline == d; } ));
  };
}

///////////////////////////////////////////////////////////////////////////////////////////

function getDataTable() {
  var sel = d3.select('#' + DATA_TAB_ID + ' table');
  if (sel.empty()) {
    sel = d3.select('#' + DATA_TAB_ID).append('table');
    var header = sel.append('tr');
    header.attr('class', TAB_HEADER_CLASS);
    header.selectAll('th')
      .data(['Airline', 'Route', 'Number of Flights', 'Average Price'])
      .enter().append('th').text(identity);
  }
  return sel;
}

function highlightCheapestAirline(airlineLegend, selectedData) {
  var cheapestData = selectedData.reduce(function(acc, cur) {
    return acc === null || acc.avg > cur.avg ? cur : acc;
  }, null);
  var cheapestSel = airlineLegend.filter(function(d) {
    return cheapestData.airline == d;
  });
  airlineLegend.attr('transform', '');
  cheapestSel.transition().duration(800).attr('transform', 'translate(0,10) scale(2)');
  /*airlineLegend.select('circle').attr('class', 'unselected');
  cheapestSel.select('circle').attr('class', 'selected');*/
}

function updateRouteData(data) {
  function adapter(routeObj) {
    var cells = [];
    cells.push(routeObj.airline);
    cells.push(routeObj.pt_1 + "-" + routeObj.pt_2);
    cells.push(routeObj.weigth);
    cells.push(Math.floor(routeObj.avg) + " EUR");
    return cells;
  }
  
  var table = getDataTable();
  var rows = table.selectAll('tr.'+TAB_ROW_CLASS).data(data);
  rows.exit().remove();
  rows.enter().append('tr').attr('class', TAB_ROW_CLASS);
  
  var cells = rows.selectAll('td').data(adapter);
  cells.enter().append('td');
  cells.text(identity);
}

///////////////////////////// ENTRY FUNCTION /////////////////////////////////////////////

function setMouseHooverListeners(arcs, chords, arcLegend, airlineLegend) { 
  
///////////////////////////// EVENT HANDLERS /////////////////////////////////////////////

  function highlightAll() {
    chords.attr('opacity', 1.0).transition();
    arcLegend.attr('opacity', 1.0).transition();
    airlineLegend.attr('transform', '');
    airlineLegend.attr('opacity', 1.0).transition();
  }
  
  function cancelAllTransitions() {
    chords.interrupt().transition();
    arcLegend.interrupt().transition();
    airlineLegend.interrupt().transition();
  }
  
  function highlightSameRoute(d) {
    cancelAllTransitions();
    var selectedChords = chords.filter(filterRouteFactory(d, false));
    var selectedData = selectedChords.data();
    
    selectedChords.attr('opacity', 1.0);
    arcLegend.filter(filterAirportFactory(selectedData, false)).attr('opacity', 1.0);
    airlineLegend.filter(filterAirlineFactory(selectedData, false)).attr('opacity', 1.0);
    
    chords.filter(filterRouteFactory(d, true))
      .transition().duration(TRANSITION_DURATION).attr('opacity', 0.1);
    arcLegend.filter(filterAirportFactory(selectedData, true))
      .transition().duration(TRANSITION_DURATION).attr('opacity', 0.1);
    airlineLegend.filter(filterAirlineFactory(selectedData, true))
      .transition().duration(TRANSITION_DURATION).attr('opacity', 0.1);
    
    updateRouteData(selectedData);
    highlightCheapestAirline(airlineLegend, selectedData);
  }  
  
  function highlightRoutesSharingPoint(d) {
    cancelAllTransitions();
    var selectedData = chords.filter(filterPointFactory(d, false)).attr('opacity', 1.0).data();
    arcLegend.filter(filterAirportFactory(selectedData, false)).attr('opacity', 1.0);
    airlineLegend.filter(filterAirlineFactory(selectedData, false)).attr('opacity', 1.0);
    
    chords.filter(filterPointFactory(d, true))
      .transition().duration(TRANSITION_DURATION).attr('opacity', 0.1);
    arcLegend.filter(filterAirportFactory(selectedData, true))
      .transition().duration(TRANSITION_DURATION).attr('opacity', 0.1);
    airlineLegend.filter(filterAirlineFactory(selectedData, true))
      .transition().duration(TRANSITION_DURATION).attr('opacity', 0.1);
  }

/////////////////////////////// ATTACH EVENTS ///////////////////////////////////////////////
  
  chords.on("mouseover", highlightSameRoute);
  arcs.on("mouseover", highlightRoutesSharingPoint);
  getTargetSvg().on("click", highlightAll);
}
