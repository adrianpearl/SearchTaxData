from flask import Flask, render_template, json, request, jsonify
import queries
import numpy as np

one_district = ['AK', 'DE', 'DC', 'MT', 'ND', 'SD', 'VT', 'WY']
categories = ['under $25 thousand', '$25 to $50 thousand', '$50 to $75 thousand', '$75 to $100 thousand', '$100 to $200 thousand', 'over $200 thousand']

app = Flask(__name__)

@app.route("/")
def main():
    return render_template('index.html')

@app.route('/ziptoCD',methods=['GET'])
def ziptoCD():
	a = request.args.get('zc', 0)
	output = queries.state_from_zip((a,))
	output = [i for i in output]
	output = output[0]
	st = output[0]
	cd = output[1]
	return jsonify(state=st, district=cd)


@app.route('/signUp',methods=['POST'])
def signUp():

    print(request.form)

    # read the posted values from the UI
    _taxreturnline = request.form.get('returnline', '')
    _state = request.form.get('state', '')
    _district = request.form.get('district', '')
    _cdstatenation = request.form['cdstatenation']

    if _cdstatenation == "cdonly" and _state in one_district:
    	_cdstatenation = "stateonly"

    print(_taxreturnline, _state, _district, _cdstatenation)
    # validate the received values
    if (not _taxreturnline) or ( (not _state) and _cdstatenation != "nation") or ( (not _district) and _cdstatenation == "cdonly"):
    	return json.dumps({'html':'<span>Invalid query</span>'})
    else:

        if _cdstatenation == "cdonly":
        	_district = int(_district)

        _taxreturnline = "_".join(_taxreturnline.split(" "))

        output = queries.get_summary_data(_state, _district, _cdstatenation)
        summary = [ix for ix in output]
        taxdata = queries.tax_data_every_state(_taxreturnline, _state, _district, _cdstatenation)

        for line in summary:
        	print(line)

        npoutput = np.array(taxdata)

        zips = npoutput[:,0]
        agigroup = npoutput[:,1]
        vals = npoutput[:,2:].astype(float)

        sumoutput = [[key] + np.sum(vals[agigroup == key], axis=0).tolist() for key in categories]

        dolpercap = np.divide(vals[:,1], vals[:,0]+1)

        chartdata = {}
        chartdata["zipcodes"] = zips[agigroup == categories[0]].tolist()

        zoneleveldata = {}

        for cat in categories:
            catdata = dolpercap[agigroup == cat]
            #catdata = np.log(catdata + 1)
            catdata = 71*(catdata - np.amin(catdata))/max(np.amax(catdata) - np.amin(catdata), 1)
            zoneleveldata[cat] = catdata.tolist()

        chartdata["zonedata"] = zoneleveldata

        """
        for i in range(0, zips.shape[0], 6):
            zipcode = zips[i]
            zipdata = dolpercap[i:i+6]
            zoneleveldata[zipcode] = dict(zip(categories, zipdata))
        """
        """
        under25 = dolpercap[agigroup == "under $25 thousand"].tolist()
        agi25to50 = dolpercap[agigroup == "$25 to $50 thousand"].tolist()
        agi50to75 = dolpercap[agigroup == "$50 to $75 thousand"].tolist()
        agi75to100 = dolpercap[agigroup == "$75 to $100 thousand"].tolist()
        agi100to200 = dolpercap[agigroup == "$100 to $200 thousand"].tolist()
        over200 = dolpercap[agigroup == "over $200 thousand"].tolist()

        print("50 to 75:")
        for line in agi50to75:
        	print(line)

        samplezipdata = zoneleveldata[zips[0]]
        for line in samplezipdata:
            print(line)
        """

        return jsonify(r_summary=summary, r_taxdata=sumoutput, r_chartdata=chartdata)

if __name__ == "__main__":
    app.run()
