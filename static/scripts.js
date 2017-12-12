var state_cd_count = {};
var onscreendata = "";
var taxreturnline = "";

state_cd_count['Alaska'] = 1
state_cd_count['Alabama'] = 7
state_cd_count['Arkansas'] = 4
state_cd_count['American Samoa'] = 1
state_cd_count['Arizona'] = 9
state_cd_count['California'] = 53
state_cd_count['Colorado'] = 7
state_cd_count['Connecticut'] = 5
state_cd_count['District of Columbia'] = 1
state_cd_count['Delaware'] = 1
state_cd_count['Florida'] = 27
state_cd_count['Georgia'] = 14
state_cd_count['Guam'] = 1
state_cd_count['Hawaii'] = 2
state_cd_count['Iowa'] = 4
state_cd_count['Idaho'] = 2
state_cd_count['Illinois'] = 18
state_cd_count['Indiana'] = 9
state_cd_count['Kansas'] = 4
state_cd_count['Kentucky'] = 6
state_cd_count['Louisiana'] = 6
state_cd_count['Massachusetts'] = 9
state_cd_count['Maryland'] = 8
state_cd_count['Maine'] = 2
state_cd_count['Michigan'] = 14
state_cd_count['Minnesota'] = 8
state_cd_count['Missouri'] = 8
state_cd_count['Northern Mariana Islands'] = 1
state_cd_count['Mississippi'] = 4
state_cd_count['Montana'] = 1
state_cd_count['North Carolina'] = 13
state_cd_count['North Dakota'] = 1
state_cd_count['Nebraska'] = 3
state_cd_count['New Hampshire'] = 2
state_cd_count['New Jersey'] = 12
state_cd_count['New Mexico'] = 3
state_cd_count['Nevada'] = 4
state_cd_count['New York'] = 27
state_cd_count['Ohio'] = 16
state_cd_count['Oklahoma'] = 5
state_cd_count['Oregon'] = 5
state_cd_count['Pennsylvania'] = 18
state_cd_count['Puerto Rico'] = 1
state_cd_count['Rhode Island'] = 2
state_cd_count['South Carolina'] = 7
state_cd_count['South Dakota'] = 1
state_cd_count['Tennessee'] = 9
state_cd_count['Texas'] = 36
state_cd_count['Utah'] = 4
state_cd_count['Virginia'] = 11
state_cd_count['Vermont'] = 1
state_cd_count['Washington'] = 10
state_cd_count['Wisconsin'] = 8
state_cd_count['West Virginia'] = 3
state_cd_count['Wyoming'] = 1

headings = ["AGI Category", "Total", "Single", "Joint", "Head Household", "Total Dependents", "Adjusted Gross Income"]

$(function() {

	console.log('hello!');
	$('#returnline').select2({
		placeholder: "Tax provision",
    	allowClear: true,
    	width: 'resolve'
    });
    $('#state').select2({
		placeholder: "State",
    	allowClear: true,
    	width: 'resolve'
    });
	$("#loader").hide();
	$(".dnldcsv").hide();
	
	$("#fielddatadiv").slideUp();
	$("#summarydiv").slideUp();
	
	$('.getdata').click(function() {
		
		/* Any valid query must contain:
		   a tax provision,
		   a state, AND
		   (a district OR the whole state checked off)
		*/
		if ( !($('form').find('select[name="returnline"]').val() && $('form').find('select[name="state"]').val()) ) {
			/* INVALID QUERY */
			console.log("invalid query - please select a tax provision and a state");
			return;
		} else if ( !( $('form').find('input[name="district"]').val() || $('#wholestate').is(":checked") ) ) {
			console.log("invalid query - please select a district or query the whole state");
			return;
		}
		
		$("#fielddatadiv").slideUp();
		$("#summarydiv").slideUp();
		$(".dnldcsv").slideUp("fast");
		taxreturnline = $('form').find('select[name="returnline"]').val();
		console.log(taxreturnline);
		$("#summary tr").remove();
		$("#taxcreditdata tr").remove();
		$("#loader").show();
		$.ajax({
			url: '/signUp',
			data: $('form').serialize(),
			type: 'POST',
			success: function(response) {
				console.log(response);
				$("#summary").append("<tr><th>AGI Bracket</th><th>Total</th><th>Single</th><th>Joint</th><th>Head Household</th><th>Total Dependents</th><th>Adjusted Gross Income</th></tr>");
				$("#taxcreditdata").append("<tr><th>AGI Bracket</th><th>" + taxreturnline + ": Count</th><th>" + taxreturnline + ": Dollars</th>");
				var data = eval(response);
				onscreendata = data;
				$.each(data, function(i,r) {
					var row = $("<tr>");
					var numcols = 0;
					$.each(r, function(i, val) {
						if (parseInt(val)) {
							row.append($("<td>").text(parseInt(val).toLocaleString('en-US')));
						} else {
							row.append($("<td>").text(val));
						}
						row.append("</td>");
						numcols ++;
					});
					row.append("</tr>");
					if (numcols == 3) {
						$("#taxcreditdata").append(row);
					} else {
						$("#summary").append(row);
					}
					
        		});
        		$("#loader").hide();
        		$(".dnldcsv").slideDown();
        		$("#fielddatadiv").slideDown(function(){
            		$("#summarydiv").slideDown();
            	});
			},
			error: function(error) {
				console.log(error);
			}
		});
	});
	
	$("#state").on("change",function() {
		console.log('onchange');
    	var state = this.value;
    	console.log(state);
    	var cdcount = state_cd_count[state]

    	$("#district").attr({
       		"max" : cdcount
    	});
    	
    	if ($("#district").val() > cdcount)
    		$("#district").val(cdcount);
  	});
  	
  	$('.dnldcsv').click(function() {
  		var colDelimiter = ',';
  		var lineDelimiter = '\n';
  		var result = "";
  		var rowlength = headings.length;
		result += headings.join(colDelimiter);
		result += lineDelimiter;
  		$.each(onscreendata, function(i,r) {
  			if (r.length < rowlength) {
  				rowlength = r.length;
  				result += " \n";
  				result += "AGI Bracket," + taxreturnline + ": Count," + taxreturnline + ": Dollars\n";
  			}
			$.each(r, function(j, val) {
				if (j>0) result += colDelimiter;
				result += val;
			});
			result += lineDelimiter;
		});
		
		var filename = "taxdata.csv";
		result = "data:application/csv;charset=utf-8," + result;
		
        data = encodeURI(result);

        link = document.createElement('a');
        link.setAttribute('href', data);
        link.setAttribute('download', filename);
        link.click();
    });
});

