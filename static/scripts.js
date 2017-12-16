var onscreendata = "";
var taxreturnline = "";

headings = ["AGI Category", "Total", "Single", "Joint", "Head Household", "Total Dependents", "Adjusted Gross Income"]

$(function() {

	console.log('hello!');
    
	$("#loader").hide();
	$(".dnldcsv").hide();
	$(".sub-header").hide();
	
	$('.getdata').click(function() {
	
		/* Querying a district, state, or the nation? */
		var cd_state_nation = "";
		var radios = document.getElementsByName('cdstatenation');
		for (var i = 0, length = radios.length; i < length; i++)
		{
		 if (radios[i].checked)
		 {
		 	cd_state_nation = radios[i].value;
		  	break;
		 }
		}
		
		var state = $("#state option:selected").html();
		
		var returnline = $('form').find('select[name="returnline"]').val();
		var cd = $('form').find('input[name="district"]').val();
		console.log(cd_state_nation, returnline, state, cd);
		
		/* Any valid query must contain:
		   a tax provision,
		   a state, AND
		   (a district OR the whole state checked off)
		*/
		if ( !returnline ) {
			/* INVALID QUERY */
			$('#invalid').text('Invalid query - please select a tax provision');
			console.log("invalid query - please select a tax provision");
			return;
		} 
		else if ( (!state) && cd_state_nation != "nation" ) {
			$('#invalid').text('Invalid query - please select a state or query the whole nation');
			console.log("invalid query - please select a state or query the whole nation");
			return;
		}
		else if ( (!cd) && cd_state_nation == "cdonly" ) {
			$('#invalid').text('Invalid query - please select a district or query a state or the nation');
			console.log("invalid query - please select a district or query a state or the nation");
			return;
		}
		
		$('#invalid').text('');
		$("#taxcreditdatadiv").slideUp();
		$("#summarydiv").slideUp();
		$(".sub-header").slideUp();
		$(".dnldcsv").slideUp("fast");
		console.log("slid up");
		
		taxreturnline = returnline;
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
				//var data = JSON.parse(response);
				//onscreendata = data;
				
				var summary = response.r_summary;
				var taxdata = response.r_taxdata;
				
				$.each(summary, function(i,r) {
					var row = $("<tr>");
					$.each(r, function(i, val) {
						if (parseInt(val)) {
							row.append($("<td>").text(parseInt(val).toLocaleString('en-US')));
						} else {
							row.append($("<td>").text(val));
						}
						row.append("</td>");
					});
					row.append("</tr>");
					$("#summary").append(row);
				});
				
				$.each(taxdata, function(i,r) {
					var row = $("<tr>");
					$.each(r, function(i, val) {
						if (parseInt(val)) {
							row.append($("<td>").text(parseInt(val).toLocaleString('en-US')));
						} else {
							row.append($("<td>").text(val));
						}
						row.append("</td>");
					});
					row.append("</tr>");
					$("#taxcreditdata").append(row);
				});
				
				var queriedarea = "";
				if (cd_state_nation == "nation") {
					queriedarea += "The United States";
				} else {
					queriedarea += state;
					if (cd_state_nation == "cdonly") {
						queriedarea += " District " + cd;
					}
				}
				console.log(queriedarea);
				
				var sumheader = "Summary of Taxpayers in " + queriedarea;
				document.getElementById("summary-header").innerHTML = sumheader;
				
				var taxheader = "Usage of " + returnline + " in " + queriedarea;
				document.getElementById("taxdata-header").innerHTML = taxheader;
					
        		console.log("new data loaded");
        		$("#loader").hide();
        		$(".dnldcsv").slideDown();
        		$(".sub-header").slideDown();
        		$("#taxcreditdatadiv").slideDown(function(){
            		$("#summarydiv").slideDown();
            	});
			},
			error: function(error) {
				console.log(error);
			}
		});
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

