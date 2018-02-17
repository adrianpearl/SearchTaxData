var margin = {top: 50, left: 150, bottom: 50};
var cw = (width - margin.left)/2,
    ch = 2*height/3;

var summarysvg = d3.select(".summarywrap").append("svg")
    .attr("width", width)
    //.style("background-color", "#bbb")
    .attr("height", ch);

var summaryg = summarysvg.append("g");

var x, x2, y, z, keys;
var summarycolors = ["#98abc5", "#8a89a6", "#7b6888", "#6b486b"];

var summaryoffset = 0.75*margin.left,
    incomeoffset = 0.9*margin.left;

var summarytable, taxtable;
var incomedata, summarydata;

// set x scale
y = d3.scaleBand()
    .rangeRound([0, (ch) - margin.top - margin.bottom])
    .paddingInner(0.05)
    .align(0.1);

// set y scale
x = d3.scaleLinear()
    .rangeRound([0, cw]);

x2 = d3.scaleLinear()
    .rangeRound([0, cw]);

// set the colors
z = d3.scaleOrdinal()
    .range(summarycolors);

var yAxis = d3.axisLeft(y)
    .tickFormat(function(d, i){
        return d.substring(0, d.lastIndexOf(" ")); });

var xAxis = d3.axisBottom(x)
    .tickFormat(d3.formatPrefix(".1", 1e6))
    .tickSize(-(ch - margin.top - margin.bottom));

var xAxis2 = d3.axisBottom(x2)
    .tickFormat(function(d) { return d/1e9; })
    .tickSize(-(ch - margin.top - margin.bottom));

function customXAxis(g) {
    g.call(xAxis);
    g.select(".domain").remove()
    g.selectAll(".tick line").attr("stroke", "#6C7A89");
}

function customXAxis2(g) {
    g.call(xAxis2);
    g.select(".domain").remove()
    g.selectAll(".tick line").attr("stroke", "#6C7A89");
}

function customYAxis(g) {
    g.call(yAxis);
    g.select(".domain").remove()
    g.selectAll(".tick line").attr("stroke", "#fff");
}

function chartSummaryIncome() {
    filltables();

    //console.log("summarydata: ", summarydata);
    summaryg.append("rect")
        .attr("width", cw)
        .attr("height", ch - margin.bottom - margin.top)
        .attr("transform", "translate(" + summaryoffset + "," +  margin.top + ")")
        .attr("fill", "#ECF0F1");

    summaryg.append("rect")
        .attr("width", cw)
        .attr("height", ch - margin.bottom - margin.top)
        .attr("transform", "translate(" + (incomeoffset + cw) + "," +  margin.top + ")")
        .attr("fill", "#ECF0F1");

    othercs =  ["#a05d56", "#d0743c", "#ff8c00"]

    summaryg.append("text")
        .attr("transform",
            "translate(" + 0 + " ," + (margin.top/2) + ")")
        .style("text-anchor", "left")
        .text("Income Bracket");
    summaryg.append("text")
        .attr("fill", "#777")
        .style("font-size", "0.7em")
        .attr("transform",
            "translate(" + 0 + " ," + ((margin.top/2) + 16) + ")")
        .style("text-anchor", "left")
        .text("thousands of dollars");

    summaryg.append("text")
        .attr("transform",
            "translate(" + (summaryoffset + (cw/2)) + " ," + (margin.top/2) + ")")
        .style("text-anchor", "middle")
        .text("Number of Taxpayers");
    summaryg.append("text")
        .attr("transform",
            "translate(" + (summaryoffset + (cw/2)) + " ," + ((margin.top/2) + 16) + ")")
        .attr("fill", "#777")
        .style("font-size", "0.7em")
        .style("text-anchor", "middle")
        .text("thousands of people");

    summaryg.append("text")
        .attr("transform",
            "translate(" + (incomeoffset + 3*cw/2) + " ," + (margin.top/2) + ")")
        .style("text-anchor", "middle")
        .text("Total Adjusted Gross Income");
    summaryg.append("text")
        .attr("transform",
            "translate(" + (incomeoffset + 3*cw/2) + " ," + ((margin.top/2) + 16) + ")")
        .attr("fill", "#777")
        .style("font-size", "0.7em")
        .style("text-anchor", "middle")
        .text("billions of dollars");

    keys = Object.keys(summarydata[0]).slice(2);
    y.domain(summarydata.map(function(d) { return d.category; }));
    x.domain([0, d3.max(summarydata, function(d) { return d.Total; })]).nice();
    x2.domain([0, d3.max(incomedata, function(d) { return d.AGI; })]).nice();
    z.domain(keys);

    summaryg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + summaryoffset + "," + (ch - margin.bottom) + ")")
        .call(customXAxis);

    summaryg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + (margin.left*0.6) + "," + margin.top + ")")
        .call(customYAxis);

    summaryg.append("g")
        .attr("class", "x2 axis")
        .attr("transform", "translate(" + (cw + incomeoffset) + "," + (ch - margin.bottom) + ")")
        .call(customXAxis2);

    var legend = summaryg.selectAll(".legend")
        .data(summarycolors)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + ((margin.top/2) + (ch/3) + (i*19)) + ")"; });

    legend.append("rect")
        .attr("x", cw - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function(d, i) {return summarycolors.slice()[i];});

    legend.append("text")
        .attr("x", cw + 5)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(function(d, i) {
        switch (i) {
            case 0: return "Single filers";
            case 1: return "Joint filers";
            case 2: return "Head household";
            case 3: return "Dependents";
        }
        });

    summaryg.append("g")
        .attr("class", "summary")
    summaryg.append("g")
        .attr("class", "income")

    update();

}

function update() {

    var summarygs = summaryg.select("g.summary")
        .selectAll("g")
        .data(d3.stack().keys(keys)(summarydata))
        .enter().append("g")
            .attr("fill", function(d) { return z(d.key); })
        .selectAll("rect")
        .data(function(d) { return d; });

    summarygs.enter().append("rect")
            .attr("x", function(d) { return summaryoffset + x(d[0]); })
            .attr("y", function(d) { return margin.top + y(d.data.category); })
            .attr("width", function(d) { return x(d[1]) - x(d[0]); })
            .attr("height", y.bandwidth());

    summarygs.exit().remove();

    var incomegs = summaryg.select("g.income")
        .selectAll("g")
        .data(incomedata);

    incomegs.enter().append("rect")
            .attr("fill", "#a05d56")
            .attr("x", function(d) { return incomeoffset + x2(0) + cw; })
            .attr("y", function(d) { return margin.top + y(d.category); })
            .attr("height", y.bandwidth())
            .attr("width", function(d) { return x2(d.AGI) - x2(0); });

    incomegs.exit().remove();

}

function switchSummaryIncome() {
    filltables();

    console.log(d3.max(incomedata, function(d) { return d.AGI; }));

    x.domain([0, d3.max(summarydata, function(d) { return d.Total; })]).nice();
    x2.domain([0, d3.max(incomedata, function(d) { return d.AGI; })]).nice();

    var svgtr = d3.select(".summarywrap").transition();

    // Make the changes
        svgtr.select(".x.axis")
            .duration(750)
            .call(customXAxis);
        svgtr.select(".x2.axis")
            .duration(750)
            .call(customXAxis2);

    update();

}

function filltables() {
    taxtable = {
        "under $25 thousand": [0, 0],
        "$25 to $50 thousand": [0, 0],
        "$50 to $75 thousand": [0, 0],
        "$75 to $100 thousand": [0, 0],
        "$100 to $200 thousand": [0, 0],
        "over $200 thousand": [0, 0]
    };
    summarytable = {
        "under $25 thousand": [0, 0, 0, 0, 0, 0],
        "$25 to $50 thousand": [0, 0, 0, 0, 0, 0],
        "$50 to $75 thousand": [0, 0, 0, 0, 0, 0],
        "$75 to $100 thousand": [0, 0, 0, 0, 0, 0],
        "$100 to $200 thousand": [0, 0, 0, 0, 0, 0],
        "over $200 thousand": [0, 0, 0, 0, 0, 0]
    };
    if (centered == null) {
        for (var cat in datasets) {
            for (var zip in datasets[cat]) {
                taxtable[cat][0] += datasets[cat][zip][1];
                taxtable[cat][1] += datasets[cat][zip][2];
                for (var i in summarytable[cat]) {
                    summarytable[cat][i] += (zipfilers[cat][zip][i]);
                }
            }
        }
    } else {
        st = FIPS[centered.id.substring(0,2)]["abbreviation"];
        tree = trees[st];
        if (centered.id.length == 4) {
            addzipdata(tree.root, centered.geometry.coordinates[0]);
        } else {
            addzipdata(tree.root, null);
        }
    }
    incomedata = [],
    summarydata = [];
    for (var cat in summarytable) {
        summarydata.push({
            "category" : cat,
            "Total" : summarytable[cat].slice(1,5).reduce((a, b) => a + b, 0),
            "Single" : summarytable[cat][1],
            "Joint" : summarytable[cat][2],
            "Head Household" : summarytable[cat][3],
            "Dependents" : summarytable[cat][4]
        });
        incomedata.push({
            "category" : cat,
            "AGI" : summarytable[cat][5]
        });
    }
}

function addzipdata(node, coordinates) {
    if (node.left != null) {
        addzipdata(node.left, coordinates);
    }
    if (node.right != null) {
        addzipdata(node.right, coordinates);
    }
    zipcode = node.obj.zipcode;
    ziplocation = [node.obj.cx, node.obj.cy];
    if (coordinates != null) {
        if (!(pointInPolygon(ziplocation, coordinates))) {
            return;
        }
    }
    for (var cat in taxtable) {
        taxtable[cat][0] += datasets[cat][zipcode][1];
        taxtable[cat][1] += datasets[cat][zipcode][2];
        for (var i in summarytable[cat]) {
            summarytable[cat][i] += zipfilers[cat][zipcode][i];
        }
    }
}

// from http://bl.ocks.org/bycoffe/5575904
function pointInPolygon(point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    var xi, xj, i, intersect,
        x = point[0],
        y = point[1],
        inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      xi = vs[i][0],
      yi = vs[i][1],
      xj = vs[j][0],
      yj = vs[j][1],
      intersect = ((yi > y) != (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
}
