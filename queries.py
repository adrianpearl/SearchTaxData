import sqlite3
import string

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
	
"""	
output = get_zipcode_list("NY", 15)
print([i for i in output])

output = state_from_zip(("10032",))
output = [i for i in output]
print(output)
print(output[0][0])
"""


