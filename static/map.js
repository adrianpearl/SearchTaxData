d3.selection.prototype.hide = function() {
  this.style('display', 'none');
  return this;
}

d3.selection.prototype.show = function() {
  this.style('display', 'initial');
  return this;
}

var width = 800,
    height = 500,
    region = "The United States",
    bracket = "under $25 thousand",
    centered;

var viewbounds = [[0, 0], [width, height]];

var projection = d3.geoAlbersUsa()
    .scale(1080)
    .translate([width / 2, height / 2]);

var path = d3.geoPath()
    .projection(projection);

var svg = d3.select(".mapwrap").append("svg")
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g");

function distance(a, b) {
  var dx = a.cx-b.cx;
  var dy = a.cy-b.cy;
  return dx*dx + dy*dy;
}

var trees = new Object();
var datasets = new Object();
var dataset = new Object();
var dots = [[],[]];

var natdotsize = 4000.0,
    dotsize = 4000.0;

var natrad = 1.0,
    rad = 1.0;

var categories = ["under $25", "$25 to $50", "$50 to $75", "$75 to $100", "$100 to $200", "over $200"]

d3.json("https://rawgit.com/adrianpearl/d220ba6495918884b836cf4e09f32553/raw/d1737c98dd6fd68f172b4a348bc11222278560af/us.json", function(error, us) {
    if (error) return console.error(error);

    var t0 = performance.now();
    g.append("g")
        .attr("id", "states")
      .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
      .enter().append("path")
        .attr("d", path)
        .on("click", clicked);

    g.append("g")
            .attr("id", "cds")
        .selectAll("path")
            .data(topojson.feature(us, us.objects.cds).features)
        .enter().append("path")
            .attr("d", path)
            //.on("click", clicked);

    g.append("path")
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr("id", "state-borders")
        .attr("d", path);

    g.append("path")
        .datum(topojson.mesh(us, us.objects.cds, function(a, b) { return a !== b; }))
        .attr("id", "cd-borders")
        .attr("d", path);

    svg.append("text")
        .attr("id", "back-btn")
        .attr("transform", "translate(" + (50) + "," + (50) + ")")
        .html("&larr;")
        .on("click", zoomout);

    var t1 = performance.now();
    console.log("States stroke: " + (t1 - t0) + " milliseconds.")

    setup();
});

function setup() {
    us = zipsgeo;

    var t0 = performance.now();
    trees = setupTrees(us);
    var t1 = performance.now();
    console.log("Set up trees: " + (t1 - t0) + " milliseconds.")

    d3.select(".dropdown-content").hide()
        .selectAll("div")
        .data(categories)
        .enter()
        .append("div")
        .style("font-size", "1em")
        .html(function (d) {return d;})
        .on("click", switchBracket);

    d3.select(".dropbtn")
        .on("mouseover", function() {
            d3.select(".dropdown-content").show();
        });

    // Hackish way of making the dropdown hide when anything else is hovered
    d3.selectAll(".nav, rect, svg, .top")
        .on("mouseover", function() {
            d3.select(".dropdown-content").hide();
        });

    for (var cat in zipfilers) {
        datasets[cat] = {};
        for (var zip in zipfilers[cat]) {
            totalfilers = zipfilers[cat][zip][0]
            datasets[cat][zip] = [totalfilers, 0, 0];
        }
    }

    dataset = datasets["under $25 thousand"];

    t0 = performance.now();
    renderDataset();
    t1 = performance.now();
    t0 = performance.now();
    filltables();
    chartSummaryIncome();
    chartTaxUsage();
    t1 = performance.now();
    console.log("Render dataset: " + (t1 - t0) + " milliseconds.")

    d3.select(".loading-overlay")
        .style("opacity",1)
        .transition()
            .duration(750)
            .style("opacity",0)
            .on("end", function() {
                d3.select(".loading-overlay").remove();
            });
}

function clicked(d) {
    if (d == undefined) {
        return;
    }
    if (d && centered !== d) {
        zoomon(d);
    }
}

function zoomon(d) {
    var x, y, k;

    if (d) {
        var centroid = path.centroid(d);
        var bounds = path.bounds(d);
        //console.log(centroid);
        //console.log(bounds);
        var wd = bounds[1][0] - bounds[0][0];
        var hd = bounds[1][1] - bounds[0][1];
        x = centroid[0];
        y = centroid[1];
        k = 0.9*Math.min(width/wd, height/hd);
        centered = d;
        region = FIPS[centered.id.substring(0,2)]["name"];
        if (centered.id.length == 4) {
            region += " District " + parseInt(centered.id.substring(2,4)).toString();
        }
    } else {
        x = width/2;
        y = height/2;
        k = 1;
        centered = null;
        region = "The United States";
    }

    wview = width/k;
    hview = height/k;
    viewbounds = [[x-(wview/2), y-(hview/2)],[x+(wview/2), y+(hview/2)]];

    g.selectAll("path")
      .classed("active", centered && function(d) { return d.id == centered.id.substring(0,2); });

    //d3.selectAll("circle").remove();
    rad = natrad / Math.pow(k, 0.75);
    dotsize = Math.max(natdotsize / k, 300);
    //console.log(rad, dotsize);
    if (d) {
        showCDs(d.id);
    }

    g.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .on("end", function() {
          renderDataset();
          filltables();
          switchSummaryIncome();
          switchTaxUsage();
      });
}

function setupTrees(data) {
    var thetrees = new Object();

    for (const [state, zips] of Object.entries(data)) {
        //console.log(state);
        tree = new kdTree(zips, distance, ["cx","cy"]);
        /*if (state == "HI") {
            console.log(zips);
            console.log(tree);
        }*/
        thetrees[state] = tree;
    }
    return thetrees;
}

function renderDataset() {
    maxi = 2;
    colors = ["#FF6200", "#00AA2A"];
    index = 0;
    dots = [[],[]];
    while (index < maxi) {
        console.log("rendering");
        visible_states = findVisibleStates();

        for (i in visible_states) {
            state = visible_states[i];
            tree = trees[state];
            processTree(tree, index);
        }
        //tree = trees["IL"];
        //processTree(tree, index);
        index++;
    }
    d3.selectAll("circle").remove();
    index = 0;
    while (index < maxi) {
        g.append("g")
            .attr("class", "bubble")
          .selectAll("circle")
            .data(dots[index])
          .enter().append("circle")
            .attr("transform", function(d) {
                return "translate(" + projection(d) + ")";
            })
            .attr("fill", colors[index])
            .attr("r", rad);
        index++;
    }

    d3.select(".dotsize")
        .html(parseInt(dotsize).toString());

    d3.selectAll(".region")
        .html(region);
}

function processTree(tree, index) {
    var s = 0;
    var treepoints = [];
    while (tree.root != null) {
        //console.log("render dot");
        rval = renderDot(tree, index, 0);
        s = s + rval["sum"];
        p = rval["points"];
        for (var i in p) {
            treepoints.push(p[i]);
        }
        //treepoints = treepoints.concat(rval["points"]);
    }
    //console.log("zips visited: ", s);
    //console.log("points to reload: ", treepoints.length)
    for (var i in treepoints) {
        //console.log(treepoints[i]);
        tree.insert(treepoints[i]);
    }
}

function renderDot(tree, index, s) {
    //console.log("render");
    var points = [];
    var zipgeo = (tree.root.obj);
    if (zipgeo == undefined) {
        console.log(tree.root.obj);
    }
    //console.log("zipcode: ", zipgeo.zipcode);
    filers = parseInt(dataset[zipgeo.zipcode][index]);
    s = s + 1;

    if (filers > dotsize) {
        addDots(zipgeo, parseInt(Math.floor(filers/dotsize)), index);
        tree.remove(zipgeo);
        points.push(zipgeo);
        //console.log(points);
        return {points: points, sum: s};;
    }

    var sum = 0;
    sum = sum + filers;
    neighbors = [zipgeo];

    while (sum < dotsize) {
        //console.log("sum: ", sum);
        var neighbor = tree.nearest(zipgeo, 2);
        if (neighbor.length == 0) {
            // No neighbors returned - there weren't enough unused nodes in
            // the tree to add up to a dot
            //console.log("couldn't find enough neighbors");
            return {points: points, sum: s};;
        }
        //console.log(neighbor);
        ngeo = neighbor[0][0];
        if (ngeo == undefined) {
            console.log(neighbor);
        }
        //console.log("neighborzip: ", ngeo.zipcode);
        nfilers = parseInt(dataset[ngeo.zipcode][index]);
        if (nfilers > dotsize) {
            n = parseInt(Math.floor(nfilers/dotsize));
            addDots(ngeo, n, index);
        } else {
            neighbors.push(ngeo);
            sum = sum + nfilers;
        }
        s = s + 1;
        tree.remove(ngeo);
        points.push(ngeo);
        //console.log(points);
        //console.log("removed: ", r);
    }

    // Neighbors is now a group of nearby zips whose statistics add up to at
    // least 'dotsize'
    addDot(neighbors, index);
    tree.remove(zipgeo);
    points.push(zipgeo);
    //console.log(points);
    return {points: points, sum: s};
}

function addDots(zipgeo, n, index) {
    minx = zipgeo.minx;
    maxx = zipgeo.maxx;
    miny = zipgeo.miny;
    maxy = zipgeo.maxy;
    while (n--) {
        var dx = (Math.random()*(maxx-minx)) + minx;
        var dy = (Math.random()*(maxy-miny)) + miny;

        //console.log(x, y);

        dots[index].push([dx, dy]);
    }
}

function addDot(neighbors, index) {
    //console.log("draw dot");
    var cxsum = 0;
    var cysum = 0;
    for (i in neighbors) {
        neighbor = neighbors[i];
        cxsum += neighbor.cx;
        cysum += neighbor.cy;
    }
    mx = cxsum / neighbors.length;
    my = cysum / neighbors.length;

    //console.log(mx, my);

    dots[index].push([mx, my]);
}

function findVisibleStates() {
    var visible_states = [];
    if (centered == null) {
        for (var state in FIPS) {
            visible_states.push(FIPS[state]["abbreviation"]);
        }
    } else {
        w = viewbounds[1][0] - viewbounds[0][0]
        h = viewbounds[1][1] - viewbounds[0][1]
        view80 = [[viewbounds[0][0] + (w/5), viewbounds[0][1] + (h/5)], [viewbounds[1][0] - (w/5), viewbounds[1][1] - (h/5)]]
        g.selectAll("g").selectAll("path").each( function(d) {
            //console.log(d);
            stfip = FIPS[d.id];
            if (stfip != undefined) {
                st = stfip["abbreviation"];
                //console.log(st);
                if (!(visible_states.includes(st))) {
                    bounds = path.bounds(d);
                    if (!(bounds[0][0] > view80[1][0] || bounds[0][1] > view80[1][1] || bounds[1][0] < view80[0][0] || bounds[1][1] < view80[0][1])) {
                        //console.log("visible");
                        visible_states.push(st);
                    }
                }
            }
        });
    }
    //console.log(visible_states);
    return visible_states;
}

function showCDs(st) {
    g.select("g#cds").selectAll("path")
        .classed("active", function(d) { return d.id.substring(0,2) == st.substring(0,2); })
        .on("click", clicked);
    g.select("path#cd-borders")
        .style("stroke-width", "0.1px");
}

function zoomout() {
    if (!centered) {
        console.log("not centered");
        return;
    }
    //console.log(centered.id);
    if (centered.id.length == 2) {
        zoomon(null);
    } else {
        var st = g.select("g#states").selectAll("path")
            .filter(function(d) {
                //console.log(d.id.substring(0,2));
                return d.id == centered.id.substring(0,2);
            })
            .each(function(d) {
                //console.log(d);
                zoomon(d);
            });
    }
}

function loadNewData(newdata) {
    for (var cat in zipfilers) {
        datasets[cat] = {};
        for (var zip in zipfilers[cat]) {
            totalfilers = zipfilers[cat][zip][0]
            users = newdata[cat][zip][0]
            dollars = newdata[cat][zip][1]
            datasets[cat][zip] = [totalfilers - users, users, dollars];
        }
    }
    dataset = datasets[bracket];
    renderDataset();
    filltables();
    switchTaxUsage();
    d3.select(".data")
        .style("opacity", "1.0");
    d3.select("#loader").remove();
    //SHOW DATA AGAIN
}

function switchBracket(d) {
    current = d3.select(".dropbtn").html();
    d3.select(".dropbtn")
        .html(d + " " + "&#x25BE;");
    bracket = d + " thousand";
    dataset = datasets[bracket];
    d3.select(".dropdown-content")
        .transition()
            .duration(250)
            .style("opacity",0)
            .on("end", function() {
                d3.select(".dropdown-content")
                    .hide()
                    .style("opacity",1.0);
                if (current.includes(d)) {
                    return;
                } else {
                    renderDataset();
                }
            });
}

/*d3.json("build/zips.json", function(error, zctas) {
    if (error) throw error;
    output = [];
    features = topojson.feature(zctas, zctas.objects.zips).features;

    var l=features.length;
    console.log(l);
    var i = 17000;
    while(i < l) {
        //console.log(i);
        f = features[i]
        z = f.id;
        b = pathnullp.bounds(f);

        output.push({
            zip: z,
            minx: b[0][0],
            maxx: b[1][0],
            miny: b[0][1],
            maxy: b[1][1]
        });
        i = i + 1;
    }

    console.log("hello");
    downloadCSV(output);
});

function convertArrayOfObjectsToCSV(args) {
    var result, ctr, keys, columnDelimiter, lineDelimiter, data;

    data = args.data || null;
    if (data == null || !data.length) {
        return null;
    }

    columnDelimiter = args.columnDelimiter || ',';
    lineDelimiter = args.lineDelimiter || '\n';

    keys = Object.keys(data[0]);

    result = '';
    //result += keys.join(columnDelimiter);
    //result += lineDelimiter;

    data.forEach(function(item) {
        ctr = 0;
        keys.forEach(function(key) {
            if (ctr > 0) result += columnDelimiter;

            result += item[key];
            ctr++;
        });
        result += lineDelimiter;
    });

    return result;
}

function downloadCSV(outdata) {
    var filename, link;
    var csv = convertArrayOfObjectsToCSV({
        data: outdata
    });
    if (csv == null) return;

    filename = 'export.csv';

    if (!csv.match(/^data:text\/csv/i)) {
        csv = 'data:text/csv;charset=utf-8,' + csv;
    }
    data = encodeURI(csv);

    link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    //document.body.appendChild(link);
    console.log("hi");
    link.click();
}*/
