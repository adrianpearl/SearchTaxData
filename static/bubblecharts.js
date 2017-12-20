var initX2 = 3028.0;
var initY2 = 1825.09;
var canvaswoverh = initX2/initY2;

// The bounding box of the map canvas for every state.
// Used whenever a state is viewed to adjust the charts bounding box to match the map
var viewboxstates = [];
var viewboxcds = [];

// Holds whatever data the chart is currently displaying
var chartdata = [];

$(function() {
	console.log("bubble charts!");
	
	var ctx = document.getElementById("myChart").getContext('2d');
	var theChart = new Chart(ctx, {
		type: 'bubble',
		data: popData,
		options: popOptions
	});
	
	simplemaps_congressmap.hooks.complete=function() {
		resizechart();
		viewboxcds = simplemaps_congressmap.calibrate();
		setUpViewBoxes();
		
		$.each( viewboxcds, function( i, cd ) {
			if (i == 'IA04') {
				console.log(cd);
			}
			chartdata.push({x: cd['cx'], y: initY2-cd['cy'], r: 2});
		});

		var newpopData = {
		  datasets: [{
			label: ['Districts'],
			data: chartdata,
			backgroundColor: "#6699FF"
		  }]
		};
	
		setchartBounds(theChart, 0, initX2, 0, initY2);
		theChart.data = newpopData;
		theChart.update();
	}

	var resizeTimer;
	$(window).on('resize', function(e) {
	  clearTimeout(resizeTimer);
	  resizeTimer = setTimeout(function() {
		setTimeout(function() {
			resizechart();	
	  	}, 250);	
	  }, 250);
	});
	
	$("#state").change(function(){
    	var id = this.value;
    	//console.log("[BUBBLE] state change id: ", id);
    	if (id == undefined) {return;}
    	if (!id) {
    		setchartBounds(theChart, 0, initX2, 0, initY2);
    	} else {
			//console.log("zoomable click region: ", id);
			newbbx = viewboxstates[id];
			var x = newbbx['x'];
			var y = initY2 - newbbx['y2'];
			var x2 = newbbx['x2'];
			var y2 = initY2 - newbbx['y'];
			//console.log("new bb: ", x, x2, y, y2);
			setchartBounds(theChart, x, x2, y, y2);
		}
		theChart.update();
	});
	
	$("#district").change(function(){
    	var state = $('form').find('select[name="state"]').val();
    	if (!state) {return;}
    	var cd = parseInt(this.value);
    	console.log(cd);
		if (cd <= state_cd_count[state]) {
			if (cd < 10) {
				cd = state + "0" + cd;
			} else {
				cd = state + cd.toString();
			}
			newbbx = viewboxcds[cd];
			var x = newbbx['x'];
			var y = initY2 - newbbx['y2'];
			var x2 = newbbx['x2'];
			var y2 = initY2 - newbbx['y'];
			setchartBounds(theChart, x, x2, y, y2);
		} else if (isNaN(cd)) {
			newbbx = viewboxstates[state];
			var x = newbbx['x'];
			var y = initY2 - newbbx['y2'];
			var x2 = newbbx['x2'];
			var y2 = initY2 - newbbx['y'];
			setchartBounds(theChart, x, x2, y, y2);
		}
		theChart.update();
	});
	
	$('#btnSignUp').click(function() {
		
		//to update chart bounds when zooming
		//theChart.config.options.scales.yAxes[0].ticks.max = y2;
		//theChart.config.options.scales.xAxes[0].ticks.max = x2;
		
		thedata = theChart.data.datasets[0].data;
		
		$.each( thedata, function( i, d ) {
			d.r = Math.floor((Math.random() * 8)+1);
		});
						
		theChart.update();
	});
		
});

function setUpViewBoxes() {
	//console.log("setupchart");
	var bbxcds = simplemaps_congressmap.mapinfo.state_bbox_array;
	//console.log(bbxcds);
	//console.log("Iowa bb: ", bbxcds["IA01"]);
	//var bbxs = simplemaps_congressmap.calibrate();
	
	$.each( bbxcds, function( i, bbcd ) {
		st = i.slice(0, 2);
		if (viewboxstates[st] == undefined) {
			viewboxstates[st] = bbcd;
		} else {
			var bbst = viewboxstates[st];
			if (bbcd['x'] < bbst['x']) {
				bbst['x'] = bbcd['x'];
			}
			if (bbcd['y'] < bbst['y']) {
				bbst['y'] = bbcd['y'];
			}
			if (bbcd['x2'] > bbst['x2']) {
				bbst['x2'] = bbcd['x2'];
			}
			if (bbcd['y2'] > bbst['y2']) {
				bbst['y2'] = bbcd['y2'];
			}
		}
	});
	
	scalingfactor = Math.sqrt(1.11);
	//console.log("sf: ", scalingfactor)
	for (var key in viewboxstates) {
		//console.log(key);
		adjustViewBox(viewboxstates[key], true);
	}
	for (var key in viewboxcds) {
		//console.log(key);
		adjustViewBox(viewboxcds[key], false);
	}
	//console.log(viewboxstates);
}

function adjustViewBox(vbst, add_center) {
	if (add_center) {
		vbst['cx'] = (vbst['x'] + vbst['x2'])/2;
		vbst['cy'] = (vbst['y'] + vbst['y2'])/2;
	}
	
	vbw = (vbst['x2'] - vbst['x']);
	vbh = (vbst['y2'] - vbst['y']);
		
	var deltax = vbw*(scalingfactor - 1)/2;
	vbst['x2'] += deltax;
	vbst['x'] -= deltax;
	
	var deltay = vbh*(scalingfactor - 1)/2;
	vbst['y2'] += deltay;
	vbst['y'] -= deltay;

	vbw = (vbst['x2'] - vbst['x']);
	vbh = (vbst['y2'] - vbst['y']);
	var whratio = vbw/vbh;
	if (whratio < canvaswoverh) {
		//console.log("skinny");
		//console.log("old width: ", vbw);
		var deltax = ((vbh*canvaswoverh) - vbw)/2;
		vbst['x2'] += deltax;
		vbst['x'] -= deltax;
		//console.log("new width :", (vbst['x2'] - vbst['x']));
	} else if (whratio > canvaswoverh) {
		//console.log("fat");
		var deltay = ((vbw/canvaswoverh) - vbh)/2;
		vbst['y2'] += deltay;
		vbst['y'] -= deltay;
	}
}
	

function setchartBounds(chart, minx, maxx, miny, maxy) {
	chart.config.options.scales.yAxes[0].ticks.max = maxy;
	chart.config.options.scales.xAxes[0].ticks.max = maxx;
	chart.config.options.scales.yAxes[0].ticks.min = miny;
	chart.config.options.scales.xAxes[0].ticks.min = minx;
}

function resizechart() {
	var mapheight = $('#map').height();
	var mapwidth = $('#map').width();
	$('#doughnutchart').height(mapheight);
	$('#doughnutchart').width(mapwidth);
}

var popData = {
  datasets: [{
    label: ['Deer Population'],
    data: [
    {
      x: 1724,
      y: initY2 - 609,
      r: 5
    }, {
      x: 1839,
      y: initY2 - 689,
      r: 5
    }
    ],
    backgroundColor: "#FF9966"
  }]
};

var popOptions = {
  	maintainAspectRatio: false,
  	legend: {
            display: false
    },
  	scales: {
		yAxes: [{
			display: false
		}],
		xAxes: [{
			display: false
		}]
	},
  	layout: {
		padding: {
			left: 0,
			right: 0,
			top: 0,
			bottom: 0
		}
	}
};