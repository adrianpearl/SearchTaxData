var onscreendata = "";
var taxreturnline = "";

headings = ["AGI Category", "Total", "Single", "Joint", "Head Household", "Total Dependents", "Adjusted Gross Income"]

$(function() {

	console.log('hello!');
    
	$("#loader").hide();
	$(".dnldcsv").hide();
	$(".sub-header").hide();
	
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
		
		console.log($('form').find('select[name="returnline"]').val());
		console.log($('form').find('select[name="state"]').val());
		console.log($('form').find('input[name="district"]').val());
		console.log($('#wholestate').is(":checked"));
		
		$("#taxcreditdatadiv").slideUp();
		$("#summarydiv").slideUp();
		$(".sub-header").slideUp();
		$(".dnldcsv").slideUp("fast");
		console.log("slid up");
		taxreturnline = $('form').find('select[name="returnline"]').val();
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

