from flask import Flask, render_template, json, request, jsonify
import numpy as np
import sqlite3
import string

one_district = ['AK', 'DE', 'DC', 'MT', 'ND', 'SD', 'VT', 'WY']
categories = ['under $25 thousand', '$25 to $50 thousand', '$50 to $75 thousand', '$75 to $100 thousand', '$100 to $200 thousand', 'over $200 thousand']

conn = sqlite3.connect('cd_by_zip.sqlite3')
cursor = conn.cursor()

def tax_data_every_zip(irs_col):
	q = string.Template("""
	select a.description, b.zip,
	$COUNT_FIELD as tax_return_count,
    $FIELD * 1000 as tax_return_dollars
	from agi_groups a, tax_info b
	where a.category = b.agi_category
	and b.zip != "99999"
    and b.zip != "00000"
	order by a.description
	""")
	cursor.execute(q.substitute(COUNT_FIELD=irs_col+"_count",FIELD=irs_col))
	return cursor.fetchall()

app = Flask(__name__)

@app.route("/")
def main():
    return render_template('index.html')

@app.route('/getTaxData',methods=['POST'])
def getTaxData():

    provision = request.form.get('taxprovision', '')
    print(provision)
    provision = "_".join(provision.split(" "))

    output = np.array(tax_data_every_zip(provision))
    categories = output[:,0]
    zips = output[:,1]
    count_dollars = output[:,2:].astype(int)

    taxData = {}

    for cat in np.unique(categories):
        print(cat)
        catzips = zips[categories == cat]
        catdata = count_dollars[categories == cat]
        taxData[cat] = dict(zip(catzips, catdata.tolist()))

    return jsonify(taxdata=taxData)

if __name__ == "__main__":
    app.run()
