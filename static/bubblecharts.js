$(function() {

	var initX2 = 3028.0;
	var initY2 = 1825.09;

	var resizeTimer;
	$(window).on('resize', function(e) {
	  clearTimeout(resizeTimer);
	  resizeTimer = setTimeout(function() {
		setTimeout(function() {
			resizechart();	
	  	}, 250);	
	  }, 250);
	});
	
	var ctx = document.getElementById("myChart").getContext('2d');
	var theChart = new Chart(ctx, {
		type: 'bubble',
		data: popData,
		options: popOptions
	});

	simplemaps_congressmap.hooks.complete=function(){
		//document.getElementById("btnSignUp").addEventListener("click", loadnewData());
		resizechart();
		initW = $('#map').width();
	}
   
	simplemaps_congressmap.hooks.click_xy=function(xy){
		console.log(xy);
	}   
	

	$('.getdata').click(function() {
	
		console.log("btn sign up click");
		
		//to update chart bounds when zooming
		//theChart.config.options.scales.yAxes[0].ticks.max = y2;
		//theChart.config.options.scales.xAxes[0].ticks.max = x2;
		
		newdata = [];
						
		//only update calibrate when zooming
		var bbxs = simplemaps_congressmap.calibrate();
		$.each( bbxs, function( i, cd ) {
			if (i == 'IA04') {
				console.log(i, cd);
			}
			newdata.push({x: cd['cx'], y: initY2-cd['cy'], r: 3});
		});
		
		//console.log(newdata);
		
		var newpopData = {
		  datasets: [{
			label: ['Districts'],
			data: newdata,
			backgroundColor: "#6699FF"
		  }]
		};
		
		theChart.data = newpopData;
		theChart.update();
	});
		
});

function resizechart() {
	var mapheight = $('#map').height();
	var mapwidth = $('#map').width();
	console.log(mapheight);
	console.log(mapwidth);
	$('#doughnutchart').height(mapheight);
	$('#doughnutchart').width(mapwidth);
}

var popData = {
  datasets: [{
    label: ['Deer Population'],
    data: [],
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
      		display: false,
      		ticks: {
				min: 0,
				max: 1825.09
			}
    	}],
    	xAxes: [{
    		display: false,
    		ticks: {
				min: 0,
				max: 3028.0
			}
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