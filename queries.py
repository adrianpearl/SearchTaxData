import sqlite3
import string

#only include for testing
import numpy as np

conn = sqlite3.connect('cd_by_zip.sqlite3')
cursor = conn.cursor()

def state_from_zip(zipcode):
	q = """
		select state, cd
		from zips
		where zip = ?
		"""
	results = cursor.execute(q,(zipcode))
	return results

def get_zipcode_list(state, district):
	q = """
		select zip
		from zips
		where state = ?
		and cd = ?
		order by zip
		"""
	results = cursor.execute(q,(state,district))
	return results

def tax_data_every_zip(irs_col):
	q = string.Template("""
	select b.state, b.zip, description as income_bracket,
	sum($COUNT_FIELD) as tax_return_count,
	sum($FIELD) * 1000 as tax_return_dollars
	from agi_groups a, tax_info b
	where a.category = b.agi_category
	and b.zip != "99999"
	group by b.state
	order by agi_category""")
	cursor.execute(q.substitute(COUNT_FIELD=irs_col+"_count",FIELD=irs_col))
	return cursor.fetchall()

def tax_data_every_state(irs_col, state, district, cd_state_nation):
	print("get field data every state: ", irs_col, state, district, cd_state_nation)
	if (cd_state_nation == "nation"):
		q = string.Template("""
		select b.natclusterzip, description as income_bracket,
		sum($COUNT_FIELD) as tax_return_count,
		sum($FIELD) * 1000 as tax_return_dollars
		from agi_groups a, tax_info b
		where a.category = b.agi_category
		and b.zip != "99999"
		and b.zip != "00000"
		group by b.natclusterzip, a.category
		order by b.natclusterzip, a.category""")
		cursor.execute(q.substitute(COUNT_FIELD=irs_col+"_count",FIELD=irs_col))
	elif (cd_state_nation == "stateonly"):
		q = string.Template("""
		select c.cd, description as income_bracket,
		sum($COUNT_FIELD) as tax_return_count,
		sum($FIELD) * 1000 as tax_return_dollars
		from agi_groups a, tax_info b, zips c
		where a.category = b.agi_category
		and b.zip != "99999"
		and b.state = ?
		and b.state = c.state
		and b.zip = c.zip
		group by c.cd, a.category
		order by agi_category""")
		cursor.execute(q.substitute(COUNT_FIELD=irs_col+"_count",FIELD=irs_col),(state,))
	elif (cd_state_nation == "cdonly"):
		q = string.Template("""
		select c.zip, description as income_bracket,
		sum($COUNT_FIELD) as tax_return_count,
		sum($FIELD) * 1000 as tax_return_dollars
		from agi_groups a, tax_info b, zips c
		where a.category = b.agi_category
		and b.zip = c.zip
		and c.state = ?
		and b.state = c.state
		and c.cd = ?
		group by c.zip, agi_category
		order by agi_category""")
		cursor.execute(q.substitute(COUNT_FIELD=irs_col+"_count",FIELD=irs_col),(state,district))
	return cursor.fetchall()

def get_summary_data(state, district, cd_state_nation):
	print("get summary: ", state, district, cd_state_nation)
	if (cd_state_nation == "nation"):
		q = """
		select description as income_bracket,
		sum(total_count),sum(single_count),sum(joint_count),
		sum(head_household_count),sum(total_dependents), sum(agi) * 1000
		from agi_groups a, tax_info b
		where a.category = b.agi_category
		group by agi_category
		order by category"""
		results = cursor.execute(q)
	elif (cd_state_nation == "stateonly"):
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

def get_field_data(irs_col, state, district, cd_state_nation):
	print("get field data: ", irs_col, state, district, cd_state_nation)
	if (cd_state_nation == "nation"):
		q = string.Template("""
		select description as income_bracket,
		sum($COUNT_FIELD) as tax_return_count,
		sum($FIELD) * 1000 as tax_return_dollars
		from agi_groups a, tax_info b
		where a.category = b.agi_category
		group by agi_category
		order by category""")
		theresults = cursor.execute(q.substitute(COUNT_FIELD=irs_col+"_count",FIELD=irs_col))
	elif (cd_state_nation == "stateonly"):
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

# new query testing:
"""
output = get_zipcode_list("NY", 15)
print([i for i in output])

output = state_from_zip(("10032",))
output = [i for i in output]

#output = get_field_data("amt", "WY", 1, "nation")
"""
"""
print()
output = tax_data_every_state("capital_gains", "OK", 1, "stateonly")
for row in output:
	print(row)
npoutput = np.array(output)
npoutput = np.delete(npoutput, 0, 1)
keys = npoutput[:,0]
vals = npoutput[:,1:].astype(int)
categories = ['under $25 thousand', '$25 to $50 thousand', '$50 to $75 thousand', '$75 to $100 thousand', '$100 to $200 thousand', 'over $200 thousand']

sumoutput = [[key] + np.sum(vals[keys == key], axis=0).tolist() for key in categories]
for i in sumoutput:
	print(i)

"""
output = tax_data_every_state("capital_gains", "OK", 1, "nation")
#output = tax_data_every_state("capital_gains")
for row in output[0:100]:
	print(row)
