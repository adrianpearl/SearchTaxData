var state_cd_count = {};
var last_zoom;

state_cd_count['AK'] = 1
state_cd_count['AL'] = 7
state_cd_count['AR'] = 4
state_cd_count['AS'] = 1
state_cd_count['AZ'] = 9
state_cd_count['CA'] = 53
state_cd_count['CO'] = 7
state_cd_count['CT'] = 5
state_cd_count['DC'] = 1
state_cd_count['DE'] = 1
state_cd_count['FL'] = 27
state_cd_count['GA'] = 14
state_cd_count['GU'] = 1
state_cd_count['HI'] = 2
state_cd_count['IA'] = 4
state_cd_count['ID'] = 2
state_cd_count['IL'] = 18
state_cd_count['IN'] = 9
state_cd_count['KS'] = 4
state_cd_count['KY'] = 6
state_cd_count['LA'] = 6
state_cd_count['MA'] = 9
state_cd_count['MD'] = 8
state_cd_count['ME'] = 2
state_cd_count['MI'] = 14
state_cd_count['MN'] = 8
state_cd_count['MO'] = 8
state_cd_count['MP'] = 1
state_cd_count['MS'] = 4
state_cd_count['MT'] = 1
state_cd_count['NC'] = 13
state_cd_count['ND'] = 1
state_cd_count['NE'] = 3
state_cd_count['NH'] = 2
state_cd_count['NJ'] = 12
state_cd_count['NM'] = 3
state_cd_count['NV'] = 4
state_cd_count['NY'] = 27
state_cd_count['OH'] = 16
state_cd_count['OK'] = 5
state_cd_count['OR'] = 5
state_cd_count['PA'] = 18
state_cd_count['PR'] = 1
state_cd_count['RI'] = 2
state_cd_count['SC'] = 7
state_cd_count['SD'] = 1
state_cd_count['TN'] = 9
state_cd_count['TX'] = 36
state_cd_count['UT'] = 4
state_cd_count['VA'] = 11
state_cd_count['VT'] = 1
state_cd_count['WA'] = 10
state_cd_count['WI'] = 8
state_cd_count['WV'] = 3
state_cd_count['WY'] = 1

$(document).ready(function(){
	last_zoom = "out";
	
	for (var region in simplemaps_congressmap_mapdata.regions){
		var key=region;
		//console.log(key);
		var value=simplemaps_congressmap_mapdata.regions[region].name;
		//console.log(value);
		$("#state").append($("<option></option>").attr("value",key).text(value));
		$("#state").selectpicker("refresh");
	}	
    
	$("#state").change(function(){
		console.log('onchange');
    	var state = this.value;
    	var cdcount = state_cd_count[state]
    	console.log(cdcount);
    	
    	if (state) {
    		simplemaps_congressmap.region_zoom(state);
    	}

    	$("#district").attr({
       		"max" : cdcount
    	});
    	
    	if ($("#district").val() > cdcount)
    		$("#district").val(cdcount);
	});
	
	$("#district").change(function(){
    	var state = $('form').find('select[name="state"]').val();
    	var cd = parseInt(this.value);
		if (cd <= state_cd_count[state]) {
			console.log("cd zoom");
			if (cd < 10) {
				cd = state + "0" + cd;
			} else {
				cd = state + cd.toString();
			}
			console.log(cd);
			simplemaps_congressmap.state_zoom(cd);
		}
	});					
})

simplemaps_congressmap.hooks.zoomable_click_region=function(id){
	//console.log(id);
	$("#state").val(id);
	$("#state").trigger('change');
}

simplemaps_congressmap.hooks.zoomable_click_state=function(id){
	cd = parseInt(id.substring(2,5));
	//console.log(cd);
	$("#district").val(cd);
	$("#district").trigger('change');
}

simplemaps_congressmap.hooks.zooming_complete=function(){
	var zoom = simplemaps_congressmap.zoom_level;
	if (zoom == "out") {
		$("#state").val("");
		$("#state").trigger('change');
		$("#district").val("");
		$(".form-control").trigger('change');
		return;
	} else if (zoom == "region" && last_zoom == "state") {
		$("#district").val("");
		$("#district").trigger('change');
	}
	last_zoom = zoom;
}