var currentprovision;

var dropdown = d3.select(".nav")
        .append("div")
        .append("select");

var btn = d3.select(".nav")
        .append("div")
        .append("button")
        .html("search")
        .on("click", getdata);

dropdown.selectAll("option")
        .data(taxprovisions)
        .enter().append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) { return d; });

function getdata() {
    var provision = dropdown.property('value');
    console.log(provision);
    if (provision == currentprovision) {
        return;
    }
    currentprovision = provision;

    d3.select(".data")
        .style("opacity", "0.5")
        .append("div")
        .attr("id", "loader");

    var req = new XMLHttpRequest();
    req.open('POST', '/getTaxData', true);
    req.onreadystatechange = function() {
        console.log("readyState: ", this.readyState, "status: ", this.status);
        if (this.readyState == 4 && this.status == 200) {
            retdata = JSON.parse(this.responseText)["taxdata"];
            //under = retdata["under $25 thousand"];
            //calif = under["90210"];
            //console.log(calif);
            loadNewData(retdata);
        }

        d3.select(".users")
            .html("by filers who include");
        d3.select(".provision")
            .html("the " + provision + " provision on their returns");
        d3.select(".nonusers")
            .html("and those who don't:");
    };
    req.addEventListener("progress", prog, false);
    req.setRequestHeader('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
    req.send("taxprovision="+provision);
}

function prog(e) {
    console.log("loaded ", e.loaded, "out of ", e.total);
}
