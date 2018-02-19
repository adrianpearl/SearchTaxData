d3.select(".taxwrap").hide();

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
    .ticks(10)
    .tickFormat(function(d) { return d/1e6; })
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

var taxsvg = d3.select(".taxwrap").append("svg")
    .attr("width", width)
    .attr("height", ch);
var radius = Math.min(width, ch) / 2.5;
var usersg = taxsvg.append("g")
    .attr("transform", "translate(" + ((width-radius) / 3) + "," + ch / 2 + ")");
var dollarsg = taxsvg.append("g")
    .attr("transform", "translate(" + (((2 * width) + radius) / 3) + "," + ch / 2 + ")");
// Define the div for the tooltip

var piecolor = d3.scaleOrdinal(d3.schemeAccent);

var userspie = d3.pie()
    .sort(null)
    .value(function(d) { return d.users; });

var dollarspie = d3.pie()
    .sort(null)
    .value(function(d) { return d.dollars; });

var piepath = d3.arc()
    .outerRadius(radius - 10)
    .innerRadius(radius - 60);

var pielabel = d3.arc()
    .outerRadius(radius - 40)
    .innerRadius(radius - 40);

var summarytable, taxtable;
var incomedata = [], summarydata = [], taxdata = [];

function chartTaxUsage() {
    var piedata = [
        {"category" : "under 25", "users" : 20, "dollars" : 50},
        {"category" : "under 50", "users" : 30, "dollars" : 40},
        {"category" : "under 75", "users" : 40, "dollars" : 30},
        {"category" : "under 100", "users" : 50, "dollars" : 20}
    ]

    var arc = usersg.selectAll("path")
        .data(userspie(taxdata))
        .enter()
        .append("path")

    arc.on("mouseover", function(d) {
            //console.log(d);
            angle = (d.endAngle + d.startAngle)/2;
            angle = (Math.PI/2) - angle;
            //console.log(angle);
            userstip.transition()
                .duration(200)
                .attr( "fill-opacity", 0.9 );
            userstip.text(d.value)
                .attr("transform", function(d) { return "translate(" + (1.15*radius*Math.cos(angle)) + "," + (-1.15*radius*Math.sin(angle)) + ")"; })
            })
        .on("mouseout", function(d) {
            userstip.transition()
                .duration(500)
                .attr( "fill-opacity", 0 );
            });

    arc.transition()
        .duration(500)
        .attr("fill", function(d, i) {
            return piecolor(d.data.category);
        })
        .attr("d", piepath)
        .each(function(d) {
            this._current = d;
        }); // store the initial angles

    var arc2 = dollarsg.selectAll("path")
        .data(dollarspie(taxdata))
        .enter()
        .append("path");

    arc2.on("mouseover", function(d) {
            //console.log(d);
            angle = (d.endAngle + d.startAngle)/2;
            angle = (Math.PI/2) - angle;
            //console.log(angle);
            dollarstip.transition()
                .duration(200)
                .attr( "fill-opacity", 0.9 );
            dollarstip.text(d.value)
                .attr("transform", function(d) { return "translate(" + (1.15*radius*Math.cos(angle)) + "," + (-1.15*radius*Math.sin(angle)) + ")"; })
            })
        .on("mouseout", function(d) {
            dollarstip.transition()
                .duration(500)
                .attr( "fill-opacity", 0 );
            });

    arc2.transition()
        .duration(500)
        .attr("fill", function(d, i) {
            return piecolor(d.data.category);
        })
        .attr("d", piepath)
        .each(function(d) {
            this._current = d;
        }); // store the initial angles

    var userstip = usersg.append("text")
        .attr("transform",
            "translate(" + 0 + " ," + 0 + ")")
        .attr( "fill-opacity", 0 )
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Users");

    var dollarstip = dollarsg.append("text")
        .attr("transform",
            "translate(" + 0 + " ," + 0 + ")")
        .attr( "fill-opacity", 0 )
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Dollars");

    usersg.append("text")
        .attr("transform",
            "translate(" + 0 + " ," + 9 + ")")
        .style("text-anchor", "middle")
        .html("users per bracket");

    dollarsg.append("text")
        .attr("transform",
            "translate(" + 0 + " ," + 0 + ")")
        .style("text-anchor", "middle")
        .text("total dollars");

    var legend = taxsvg.selectAll(".legend")
        .data(taxdata)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(" + (30 + (i * (width-60) / 6)) + "," + (ch - 20) + ")"; });

    legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function(d, i) {return piecolor(d.category);});

    legend.append("text")
        .attr("x", 20)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(function(d, i) {
            //console.log(d.category);
            return d.category.substring(0, d.category.lastIndexOf(" "));
        });

}

function arcTween(a) {
    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function(t) {
        return piepath(i(t));
    };
}

function switchTaxUsage() {
    var piedata = [
        {"category" : "under 25", "users" : 50, "dollars" : 50},
        {"category" : "under 50", "users" : 40, "dollars" : 40},
        {"category" : "under 75", "users" : 30, "dollars" : 30},
        {"category" : "under 100", "users" : 20, "dollars" : 20}
    ]

    var arc = usersg.selectAll("path")
        .data(userspie(taxdata))
        .transition().duration(750).attrTween("d", arcTween);

    var arc2 = dollarsg.selectAll("path")
        .data(dollarspie(taxdata))
        .transition().duration(750).attrTween("d", arcTween);

    d3.select(".taxwrap").show();

}

function chartSummaryIncome() {

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
        .text("millions of people");

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

    var summarygs = summaryg.select("g.summary")
        .selectAll("g")
        .data(d3.stack().keys(keys)(summarydata))
        .enter().append("g")
            .attr("fill", function(d) { return z(d.key); })
        .selectAll("rect")
        .data(function(d) { return d; })
        .enter().append("rect")
            .attr("x", function(d) { return summaryoffset + x(d[0]); })
            .attr("y", function(d) { return margin.top + y(d.data.category); })
            .attr("width", function(d) { return x(d[1]) - x(d[0]); })
            .attr("height", y.bandwidth());

    var incomegs = summaryg.select("g.income")
        .selectAll("rect")
        .data(incomedata)
        .enter().append("rect")
            .attr("fill", "#a05d56")
            .attr("x", function(d) { return incomeoffset + x2(0) + cw; })
            .attr("y", function(d) { return margin.top + y(d.category); })
            .attr("height", y.bandwidth())
            .attr("width", function(d) { return x2(d.AGI) - x2(0); });

}

function switchSummaryIncome() {

    x.domain([0, d3.max(summarydata, function(d) { return d.Total; })]).nice();
    x2.domain([0, d3.max(incomedata, function(d) { return d.AGI; })]).nice();

    var summarygs = summaryg.select("g.summary")
        .selectAll("g")
        .data(d3.stack().keys(keys)(summarydata))
        .selectAll("rect")
        .data(function(d) { return d; });

    var incomegs = summaryg.select("g.income")
        .selectAll("rect")
        .data(incomedata);

    var svgtr = d3.select(".summarywrap").transition();

    // Make the changes
    svgtr.select(".x.axis")
        .duration(750)
        .call(customXAxis);
    svgtr.select(".x2.axis")
        .duration(750)
        .call(customXAxis2);

    summarygs.attr("x", function(d) {return summaryoffset + x(d[0]); })         .attr("width", function(d) { return x(d[1]) - x(d[0]); });

    incomegs.attr("width", function(d) { return x2(d.AGI) - x2(0); });

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
    incomedata.splice(0, incomedata.length);
    summarydata.splice(0, summarydata.length);
    taxdata.splice(0, taxdata.length);
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
        taxdata.push({
            "category" : cat,
            "users" : taxtable[cat][0],
            "dollars" : taxtable[cat][1]
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
