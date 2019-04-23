var totalTqi = 0.0

queue()
    .defer(d3.json, "/testExport/testCollection")
    .await(makeWidgets);

function makeWidgets(error, jsonData) {

    // collect and clean data
    var analysisRuns = jsonData;
    var dateFormat = d3.time.format("%Y-%m-%d-%H:%M:%S");
    analysisRuns.forEach(function(d) {
        console.log("----------")
        console.log(totalTqi)
        console.log(d["tqi"]["eval"])
        console.log("----------")
        d["analysis_time"] = dateFormat.parse(d["analysis_time"]);
        d["analysis_time"].setDate(1);
        totalTqi += d["tqi"]["eval"];
    });

    // create crossfilter instance
    var ndx = crossfilter(analysisRuns);

    // define dimensions
    var dateDim = ndx.dimension(function(d) { return d["analysis_time"]; });
    var totalTqiDim  = ndx.dimension(function(d) { return d["tqi"]["eval"]; });

    // calculate metrics
    var numProjectsByDate = dateDim.group(); 
    var totalTqiMetric = totalTqiDim.group();
    var max_tqi = totalTqiMetric.top(1)[0].value;
    var all = ndx.groupAll();


    // define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["analysis_time"];
    var maxDate = dateDim.top(1)[0]["analysis_time"];
    
    // charts
    var timeChart = dc.barChart("#time-chart");
    timeChart
		.width(600)
		.height(160)
		.margins({top: 10, right: 50, bottom: 30, left: 50})
		.dimension(dateDim)
		.group(numProjectsByDate)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.xAxisLabel("Time")
        .yAxis().ticks(4);
        
    // render
    dc.renderAll();
}