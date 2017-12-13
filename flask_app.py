from flask import Flask, render_template, json, request
import sqlite3
import string

conn = sqlite3.connect('cd_by_zip2.sqlite3')
cursor = conn.cursor()

state_abbrev = {}
state_cd_count = {}

state_abbrev['Alaska'] = 'AK'
state_abbrev['Alabama'] = 'AL'
state_abbrev['Arkansas'] = 'AR'
state_abbrev['American Samoa'] = 'AS'
state_abbrev['Arizona'] = 'AZ'
state_abbrev['California'] = 'CA'
state_abbrev['Colorado'] = 'CO'
state_abbrev['Connecticut'] = 'CT'
state_abbrev['District of Columbia'] = 'DC'
state_abbrev['Delaware'] = 'DE'
state_abbrev['Florida'] = 'FL'
state_abbrev['Georgia'] = 'GA'
state_abbrev['Guam'] = 'GU'
state_abbrev['Hawaii'] = 'HI'
state_abbrev['Iowa'] = 'IA'
state_abbrev['Idaho'] = 'ID'
state_abbrev['Illinois'] = 'IL'
state_abbrev['Indiana'] = 'IN'
state_abbrev['Kansas'] = 'KS'
state_abbrev['Kentucky'] = 'KY'
state_abbrev['Louisiana'] = 'LA'
state_abbrev['Massachusetts'] = 'MA'
state_abbrev['Maryland'] = 'MD'
state_abbrev['Maine'] = 'ME'
state_abbrev['Michigan'] = 'MI'
state_abbrev['Minnesota'] = 'MN'
state_abbrev['Missouri'] = 'MO'
state_abbrev['Northern Mariana Islands'] = 'MP'
state_abbrev['Mississippi'] = 'MS'
state_abbrev['Montana'] = 'MT'
state_abbrev['North Carolina'] = 'NC'
state_abbrev['North Dakota'] = 'ND'
state_abbrev['Nebraska'] = 'NE'
state_abbrev['New Hampshire'] = 'NH'
state_abbrev['New Jersey'] = 'NJ'
state_abbrev['New Mexico'] = 'NM'
state_abbrev['Nevada'] = 'NV'
state_abbrev['New York'] = 'NY'
state_abbrev['Ohio'] = 'OH'
state_abbrev['Oklahoma'] = 'OK'
state_abbrev['Oregon'] = 'OR'
state_abbrev['Pennsylvania'] = 'PA'
state_abbrev['Puerto Rico'] = 'PR'
state_abbrev['Rhode Island'] = 'RI'
state_abbrev['South Carolina'] = 'SC'
state_abbrev['South Dakota'] = 'SD'
state_abbrev['Tennessee'] = 'TN'
state_abbrev['Texas'] = 'TX'
state_abbrev['Utah'] = 'UT'
state_abbrev['Virginia'] = 'VA'
state_abbrev['Vermont'] = 'VT'
state_abbrev['Washington'] = 'WA'
state_abbrev['Wisconsin'] = 'WI'
state_abbrev['West Virginia'] = 'WV'
state_abbrev['Wyoming'] = 'WY'

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

def get_summary_data(state, district, whole_state):
	print(state, district, whole_state)
	if (whole_state):
		q = """
		select description as income_bracket,
		sum(total_count),sum(single_count),sum(joint_count),
		sum(head_household_count),sum(total_dependents), sum(agi) * 1000
		from agi_groups a, tax_info b, zips c
		where a.category = b.agi_category
		and b.zip = c.zip
		and c.state = ?
		group by agi_category
		order by category"""
		results = cursor.execute(q,(state,))
	else:
		q = """
		select description as income_bracket,
		sum(total_count),sum(single_count),sum(joint_count),
		sum(head_household_count),sum(total_dependents), sum(agi) * 1000
		from agi_groups a, tax_info b, zips c
		where a.category = b.agi_category
		and b.zip = c.zip
		and c.state = ?
		and b.state = c.state
		and c.cd = ?
		group by agi_category
		order by category"""
		results = cursor.execute(q,(state,district))

	return results

def get_field_data(irs_col, state, district, whole_state):
	print(irs_col, state, district, whole_state)
	if (whole_state):
		q = string.Template("""
		select description as income_bracket,
		sum($COUNT_FIELD) as tax_return_count,
		sum($FIELD) * 1000 as tax_return_dollars
		from agi_groups a, tax_info b, zips c
		where a.category = b.agi_category
		and b.zip = c.zip
		and c.state = ?
		group by agi_category
		order by category""")
		theresults = cursor.execute(q.substitute(COUNT_FIELD=irs_col+"_count",FIELD=irs_col),(state,))
	else:
		q = string.Template("""
		select description as income_bracket,
		sum($COUNT_FIELD) as tax_return_count,
		sum($FIELD) * 1000 as tax_return_dollars
		from agi_groups a, tax_info b, zips c
		where a.category = b.agi_category
		and b.zip = c.zip
		and c.state = ?
		and b.state = c.state
		and c.cd = ?
		group by agi_category
		order by category""")
		theresults = cursor.execute(q.substitute(COUNT_FIELD=irs_col+"_count",FIELD=irs_col),(state,district))
	return theresults

qres = get_summary_data("NY", "3", False)
print([i for i in qres])
app = Flask(__name__)

@app.route("/")
def main():
    return render_template('index.html')

@app.route('/showSignUp')
def showSignUp():
    return render_template('signup.html')

@app.route('/signUp',methods=['POST'])
def signUp():

	print(request.form)

	# read the posted values from the UI
	_taxreturnline = request.form['returnline']
	_state = request.form['state']
	_district = int(request.form['district'])
	if ('wholestate' in request.form.keys()) or (state_cd_count[_state] == 1):
		_wholestate = True
	else:
		_wholestate = False
	# validate the received values
	if _taxreturnline and _state and (_district or _wholestate):
		_taxreturnline = "_".join(_taxreturnline.split(" "))
		_state = state_abbrev[_state]
		if _wholestate:
			summary = get_summary_data(_state, _district, True)
			output = [ix for ix in summary]
			summary = get_field_data(_taxreturnline, _state, _district, True)
			output = output+[ix for ix in summary]
		else:
			summary = get_summary_data(_state, _district, False)
			output = [ix for ix in summary]
			summary = get_field_data(_taxreturnline, _state, _district, False)
			output = output+[ix for ix in summary]

		print([ix for ix in output])

		return json.dumps( [ix for ix in output] )
	else:
		return json.dumps({'html':'<span>Invalid query</span>'})

if __name__ == "__main__":
    app.run()

