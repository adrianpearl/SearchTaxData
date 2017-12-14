from flask import Flask, render_template, json, request
import sqlite3
import string

conn = sqlite3.connect('cd_by_zip.sqlite3')
cursor = conn.cursor()
one_district = ['AK', 'DE', 'DC', 'MT', 'ND', 'SD', 'VT', 'WY']

def get_zipcode_list(self, state, district):
        q = """
            select zip
            from zips
            where state = ?
            and cd = ?
            order by zip
            """
        results = self.cursor.execute(q,(state,district))
        return results

def get_summary_data(state, district, whole_state):
	print(state, district, whole_state)
	if (whole_state):
		q = """
		select description as income_bracket,
		sum(total_count),sum(single_count),sum(joint_count),
		sum(head_household_count),sum(total_dependents), sum(agi) * 1000
		from agi_groups a, tax_info b
		where a.category = b.agi_category
		and b.zip != "99999"
		and b.state = ?
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
		from agi_groups a, tax_info b
		where a.category = b.agi_category
		and b.zip != "99999"
		and b.state = ?
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
	print(_state)
	if ('wholestate' in request.form.keys()) or (_state in one_district):
		_wholestate = True
	else:
		_wholestate = False
	# validate the received values
	if _taxreturnline and _state and (_district or _wholestate):
		_taxreturnline = "_".join(_taxreturnline.split(" "))
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

