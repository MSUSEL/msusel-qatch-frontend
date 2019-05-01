// modules ================================================
var crossfilter = require('crossfilter');
var d3 = require('d3');
dc = require('dc');
var queue = require('d3-queue');


// config =================================================
dc.config.defaultColors(d3.schemeSet2);


// main loop ===============================================
queue.queue()
    .defer(getJson, "/api/data")
    .await(makeGraphs);

function makeGraphs(error, apiData) {

    //Start Transformations
    var dataSet = apiData;
    var dateFormat = d3.timeFormat("%Y-%m-%d-%H:%M:%S");
    var dateParse = d3.timeParse(dateFormat);

    dataSet.forEach(function (d) {
        d.analysis_time = dateParse(d.analysis_time);
        d.maxTqiInfluence = d.characteristics.characteristics[maxCharWeightIndex(d)].name;
        d.maxSecurityInfluence = d.properties.properties[maxPropWeightIndex(d, 2)].name;
        d.tqi_value = d.tqi.eval;
    });
    console.log(dataSet[0]);

    //Create a Crossfilter instance
    var ndx = crossfilter(dataSet);
    var all = ndx.groupAll();

    //Define Dimensions
    var timeScanned = ndx.dimension(function (d) { return d.analysis_time; });
    var tqiMaxInfluence = ndx.dimension(function (d) { return d.maxTqiInfluence; });
    var securityMaxInfluence = ndx.dimension(function (d) { return d.maxSecurityInfluence; });
    var projectRoot = ndx.dimension(function (d) { return d.path; });

    // Groups
    var projectRootGroup = projectRoot.group();
    var timeScannedGroup = timeScanned.group();
    var tqiCharacteristicGroup = tqiMaxInfluence.group();
    var securityCharacteristicGroup = securityMaxInfluence.group();

    // Map-reduces
    var tqiCharacteristicReduce = tqiCharacteristicGroup.reduce(
        function(p, v) {
            p += v.characteristics.characteristics[0].eval;
            return p;
        },
        function(p, v) {
            p -= v.characteristics.characteristics[0].eval;
            return p;
        },
        function() { 
            return 0.0
        }
    );

    var securityCharacteristicReduce = securityCharacteristicGroup.reduce(
        function(p, v) {
            p += v.characteristics.characteristics[2].eval;
            return p;
        },
        function(p, v) {
            p -= v.characteristics.characteristics[2].eval;
            return p;
        },
        function() { 
            return 0.0
        }
    );

    var timeScannedTqi = timeScannedGroup.reduceSum(function (d) {
        return d.tqi_value;
    });

    print_filter(tqiCharacteristicReduce);

    //Define threshold values for data
    var minDate = timeScanned.bottom(1)[0].date_posted;
    var maxDate = timeScanned.top(1)[0].date_posted;

    // Widgets
    var projectSelect = dc.selectMenu('#projectselect');
    var qualityGate = dc.pieChart("#quality-gate");
    var qualityChart = dc.lineChart("#quality-chart");
    var iso25kChart = dc.barChart("#iso-25k-chart");
    var securityAspectsChart = dc.barChart("#security-chart");
    // var qualityChart = dc.lineChart("#quality-chart");
    // var gradeLevelChart = dc.rowChart("#grade-chart");
    // var resourceTypeChart = dc.rowChart("#resource-chart");
    // var techDebtChart = dc.pieChart("#tech-debt");
    // var povertyLevelChart = dc.rowChart("#poverty-chart");
    // var totalProjects = dc.numberDisplay("#total-projects");
    // var netDonations = dc.numberDisplay("#net-donations");
    // var threatProfileChart = dc.barChart("#threat-profile");

    qualityGate
        .dimension(projectRoot)
        .group(projectRootGroup)
        .minAngleForLabel(360);

    iso25kChart
        .centerBar(false)
        .dimension(tqiMaxInfluence)
        .elasticY(true)
        .group(tqiCharacteristicGroup)
        // .ordering(function (d) { return d.value; })
        .renderHorizontalGridLines(true)
        .renderVerticalGridLines(true)
        .transitionDuration(1000)
        .x(d3.scaleBand().domain(projectRoot))
        .xUnits(dc.units.ordinal);


    securityAspectsChart
        .centerBar(false)
        .dimension(securityMaxInfluence)
        .elasticY(true)
        .group(securityCharacteristicGroup)
        // .ordering(function (d) { return d.value; })
        .renderHorizontalGridLines(true)
        .renderVerticalGridLines(true)
        .transitionDuration(1000)
        .x(d3.scaleBand().domain(projectRoot))
        .xUnits(dc.units.ordinal);

    projectSelect
        .dimension(projectRoot)
        .group(projectRootGroup)
        .multiple(true);

    qualityChart
        .brushOn(true)
        .curve(d3.curveStepAfter)
        .dimension(timeScanned)
        .elasticX(true)
        .elasticY(false)
        .group(timeScannedTqi).valueAccessor(function (d) { return d.value })
        .renderArea(true)
        .renderHorizontalGridLines(true)
        .renderVerticalGridLines(true)
        .transitionDuration(500)
        .x(d3.scaleTime().domain([minDate, maxDate]))
        .xAxisLabel("Time of Analysis")
        .yAxisLabel("TQI")
        .yAxis().ticks(6);
        
    dc.dataCount("#row-selection")
        .crossfilter(ndx)
        .groupAll(all);

    // qualitySelect = dc.selectMenu('#qaselect')
    //     .dimension(projectRoot)
    //     .group(projectRootGroup);


    // totalProjects
    //     .formatNumber(d3.format("d"))
    //     .valueAccessor(function (d) { return d; })
    //     .group(all);

    // netDonations
    //     .formatNumber(d3.format("d"))
    //     .valueAccessor(function (d) { return d; })
    //     .group(netTotalDonations)
    //     .formatNumber(d3.format(".3s"));

    // qualityChart
    //     //.width(600)
    //     .height(220)
    //     .margins({ top: 10, right: 50, bottom: 30, left: 50 })
    //     .dimension(timeScanned)
    //     .group(timeScannedTqi).valueAccessor(function (d) { return d.value })
    //     // .stack()
    //     .renderArea(true)
    //     .transitionDuration(500)
    //     .x(d3.scaleTime().domain([minDate, maxDate]))
    //     .elasticX(true)
    //     .elasticY(false)
    //     .brushOn(true)
    //     .legend(dc.legend().x(60).y(10).itemHeight(13).gap(5))
    //     .renderHorizontalGridLines(true)
    //     .renderVerticalGridLines(true)
    //     .xAxisLabel("Time of Analysis")
    //     .yAxisLabel("TQI")
    //     .yAxis().ticks(6);

    // resourceTypeChart
    //     //.width(300)
    //     .height(220)
    //     .dimension(resourceType)
    //     .group(projectsByResourceType)
    //     .elasticX(true)
    //     .xAxis().ticks(5);

    // povertyLevelChart
    //     //.width(300)
    //     .height(220)
    //     .dimension(povertyLevel)
    //     .group(projectsByPovertyLevel)
    //     .xAxis().ticks(4);

    // gradeLevelChart
    //     //.width(300)
    //     .height(220)
    //     .dimension(gradeLevel)
    //     .group(projectsByGrade)
    //     .xAxis().ticks(4);

    // techDebtChart
    //     .height(220)
    //     //.width(350)
    //     .legend(dc.legend().x(0).y(190).itemHeight(13).gap(5))
    //     .radius(100)
    //     .innerRadius(40)
    //     .transitionDuration(1000)
    //     .renderLabel(false)
    //     .renderTitle(false)
    //     .ordinalColors(["#56B2EA", "#E064CD", "#F8B700", "#78CC00", "#7B71C5"])
    //     .dimension(projectRoot)
    //     .group(projectRootTqi);

    // threatProfileChart
    //     //.width(800)
    //     .height(220)
    //     .transitionDuration(1000)
    //     .dimension(projectRoot)
    //     .group(securityGroupInfluences)
    //     .margins({ top: 10, right: 50, bottom: 30, left: 50 })
    //     .centerBar(false)
    //     .gap(5)
    //     .elasticY(true)
    //     .x(d3.scaleBand().domain(projectRoot))
    //     .xUnits(dc.units.ordinal)
    //     .renderHorizontalGridLines(true)
    //     .renderVerticalGridLines(true)
    //     .ordering(function (d) { return d.value; })
    //     .yAxis().tickFormat(d3.format("s"));


    dc.renderAll();
}


// helper functions ===============================================

function getJson(url, callback) {
    d3.json(url).then(function (d) {
        callback(null, d);
    });
}

function maxCharWeightIndex(dataPoint) {
    return dataPoint.tqi.weights.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
}

function maxPropWeightIndex(dataPoint, characteristicIndex) {
    return dataPoint.characteristics.characteristics[characteristicIndex].weights.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
}

function print_filter(filter) {
    var f = eval(filter);
    if (typeof (f.length) != "undefined") { } else { }
    if (typeof (f.top) != "undefined") { f = f.top(Infinity); } else { }
    if (typeof (f.dimension) != "undefined") { f = f.dimension(function (d) { return ""; }).top(Infinity); } else { }
    console.log(filter + "(" + f.length + ") = " + JSON.stringify(f).replace("[", "[\n\t").replace(/}\,/g, "},\n\t").replace("]", "\n]"));
}