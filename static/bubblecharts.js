var initX2 = 3028.0;
var initY2 = 1825.09;
var canvaswoverh = initX2/initY2;

// The bounding box of the map canvas for every state.
// Used whenever a state is viewed to adjust the charts bounding box to match the map
var viewboxstates = [];
var viewboxcds = [];

var theChart;

var vidiris = ['#440154', '#440558', '#450a5c', '#450e60', '#451465', '#461969', '#461d6d', '#462372', '#472775', '#472c7a', '#46307c', '#45337d', '#433880', '#423c81', '#404184', '#3f4686', '#3d4a88', '#3c4f8a', '#3b518b', '#39558b', '#37598c', '#365c8c', '#34608c', '#33638d', '#31678d', '#2f6b8d', '#2d6e8e', '#2c718e', '#2b748e', '#29788e', '#287c8e', '#277f8e', '#25848d', '#24878d', '#238b8d', '#218f8d', '#21918d', '#22958b', '#23988a', '#239b89', '#249f87', '#25a186', '#25a584', '#26a883', '#27ab82', '#29ae80', '#2eb17d', '#35b479', '#3cb875', '#42bb72', '#49be6e', '#4ec16b', '#55c467', '#5cc863', '#61c960', '#6bcc5a', '#72ce55', '#7cd04f', '#85d349', '#8dd544', '#97d73e', '#9ed93a', '#a8db34', '#b0dd31', '#b8de30', '#c3df2e', '#cbe02d', '#d6e22b', '#e1e329', '#eae428', '#f5e626', '#fde725'];

$(function() {
	console.log("bubble charts!");

	var ctx = document.getElementById("myChart").getContext('2d');
	theChart = new Chart(ctx, {
		type: 'bubble',
		data: popData,
		options: popOptions
	});

	var chartdata = [];

	simplemaps_congressmap.hooks.complete=function() {
		resizechart();
		viewboxcds = simplemaps_congressmap.calibrate();
		setUpViewBoxes();

		$.each( viewboxcds, function( i, cd ) {
			chartdata.push({x: cd['cx'], y: initY2-cd['cy'], r: 2});
		});

		var newpopData = {
		  datasets:
		  [
		  	{
				label: ['under $25 thousand'],
				data: chartdata,
				hidden: true,
				borderWidth: 0,
				backgroundColor: ["#6699FF", "#FF9966"]
		  	},
		  	{
				label: ['$25 to $50 thousand'],
				data: chartdata,
				hidden: true,
				borderWidth: 0,
				backgroundColor: "#6699FF"
		  	},
		  	{
				label: ['$50 to $75 thousand'],
				data: chartdata,
				hidden: true,
				borderWidth: 0,
				backgroundColor: "#6699FF"
		  	},
		  	{
				label: ['$75 to $100 thousand'],
				data: chartdata,
				hidden: false,
				borderWidth: 0,
				backgroundColor: "#6699FF"
		  	},
		  	{
				label: ['$100 to $200 thousand'],
				data: chartdata,
				hidden: true,
				borderWidth: 0,
				backgroundColor: "#6699FF"
		  	},
		  	{
				label: ['over $200 thousand'],
				data: chartdata,
				hidden: true,
				borderWidth: 0,
				backgroundColor: "#6699FF"
		  	}
		  ]
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

	/*$('#btnSignUp').click(function() {

		//to update chart bounds when zooming
		//theChart.config.options.scales.yAxes[0].ticks.max = y2;
		//theChart.config.options.scales.xAxes[0].ticks.max = x2;

		thedata = theChart.data.datasets[0].data;

		$.each( thedata, function( i, d ) {
			d.r = Math.floor((Math.random() * 8)+1);
		});

		theChart.update();
	});*/

	$('input[type=radio][name=chartagi]').change(function() {
		var agi = getchartAGIgroup();
		//console.log(agi);
		$.each( theChart.data.datasets, function( i, ds ) {
			if (ds.label[0] == agi) {
				ds.hidden = false;
			} else {
				ds.hidden = true;
			}
		});
		theChart.update();
	});

});

function newChartData(newData) {
	//console.log(newData);
	newdataset = [];
	newcolors = {
		"under $25 thousand" : [],
		"$25 to $50 thousand" : [],
		"$50 to $75 thousand" : [],
		"$75 to $100 thousand" : [],
		"$100 to $200 thousand" : [],
		"over $200 thousand" : []
	}

	zips = newData.zipcodes;
	zonedata = newData.zonedata;

	$.each( zips, function( i, zip ) {
		geo = zipcodes[zip];
		coords = simplemaps_congressmap.proj(geo.latitude, geo.longitude);
		newdataset.push({x: coords.x, y: initY2 - coords.y, r: 4});
	});

	$.each( zonedata, function( category, catdata ) {
		$.each( catdata, function( i, value ) {
			intval = parseInt(value);
			color = vidiris[parseInt(value)];
			newcolors[category].push(color);
		});
	});

	$.each( theChart.data.datasets, function( i, ds ) {
		ds.data = newdataset;
		ds.backgroundColor = newcolors[ds.label[0]];
	});
	theChart.update();
}


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

function getchartAGIgroup() {
	/* Querying a district, state, or the nation? */
	var radios = document.getElementsByName('chartagi');
	for (var i = 0, length = radios.length; i < length; i++)
	{
	 if (radios[i].checked)
	 {
		return(radios[i].value);
		break;
	 }
	}
}
