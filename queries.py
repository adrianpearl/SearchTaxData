import sqlite3
import string
import csv
#only include for testing
import numpy as np
import random
import json
import heapq

def randpointinbounds(bounds):
	return [random.uniform(bounds[0][0], bounds[0][1]), 		random.uniform(bounds[1][0], bounds[1][1])]

conn = sqlite3.connect('cd_by_zip.sqlite3')
cursor = conn.cursor()

'''
q = """
	select zip, sum(total_count) as total
	from tax_info
	group by zip
	order by total
	"""
cursor.execute(q)
results = np.array(cursor.fetchall())
filers = results[:,-1].astype(int)
unique, counts = np.unique(filers, return_counts=True)
for i in range(unique.shape[0]):
	print(unique[i], ": ", counts[i])
'''
zipcounts = {}

q = """
	select  zip, total_count, sales_tax_count
	from tax_info
	where agi_category = 1
	and state = 'HI'
	"""
q = """
	select description as income_bracket, zip,
	total_count, single_count, joint_count,
	head_household_count, total_dependents, agi * 1000
	from agi_groups a, tax_info b
	where a.category = b.agi_category
	order by category, zip
	"""
cursor.execute(q)
results = cursor.fetchall()

i = 0
for row in results:
	if i%1000 == 0:
		print(row)
	if row[0] not in zipcounts:
		zipcounts[row[0]] = {}
	zipcounts[row[0]][row[1]] = [row[2], row[3], row[4], row[5], row[6], row[7]]
	i = i + 1
print(i)

with open('zipcounts.json', 'w') as f:
	json.dump(zipcounts, f)

'''
zipstates = {}
zipsgeo = {}
xheaps = {}
yheaps = {}
d = 0.0000000000001

q = """
	select zip, state
	from tax_info
	where agi_category = 1
	order by state
	"""
cursor.execute(q)
results = cursor.fetchall()

for row in results:
	#print(row)
	zipstates[row[0]] = row[1]
	zipsgeo[row[1]] = []
	xheaps[row[1]] = []
	yheaps[row[1]] = []

with open('zipgeo.csv', newline='\n') as csvfile:
	filereader = csv.reader(csvfile, delimiter=',')
	next(filereader)
	i = 0
	for row in filereader:
		i = i + 1
		if i%1000 == 0:
			print("row: ", i)
		if "zip" in row[0] or "Infinity" in row[1]:
			continue
		zipcode = row[0]
		state = zipstates.get(zipcode, 'none')
		if state == 'none':
			continue
		minx = float(row[1])
		maxx = float(row[2])
		miny = float(row[3])
		maxy = float(row[4])
		cx = (minx+maxx)/2.0
		cy = (miny+maxy)/2.0

		j = 0
		while cx in xheaps[state]:
			j = j + 1
			if j%2 == 1:
				cx = cx + (j*d)
			else:
				cx = cx - (j*d)
		heapq.heappush(xheaps[state], cx)
		if j > 10:
			print(j/2)
		j = 0
		while cy in yheaps[state]:
			j = j + 1
			if j%2 == 1:
				cy = cy + (j*d)
			else:
				cy = cy - (j*d)
		heapq.heappush(yheaps[state], cy)
		if j > 10:
			print(j/2)

		zipsgeo[state].append({'zipcode':zipcode, 'minx':minx, 'maxx':maxx, 'miny':miny, 'maxy':maxy, 'cx':cx, 'cy':cy})

with open('zipsgeo.json', 'w') as f:
	json.dump(zipsgeo, f)
'''

'''
q = """
	select zip, natzip
	from newtable
	group by zip
	"""
cursor.execute(q)
results2 = cursor.fetchall()

for row in results2:
	if row[0] not in natziptotals.keys():
		natziptotals[row[0]] = 0

with open('natziptotals.csv', 'w') as csv_file:
	writer = csv.writer(csv_file)
	for row in results2:
		zipcode = row[0]
		natzip = row[1]
		writer.writerow([zipcode, natzip, natziptotals[zipcode]])
'''

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
		sum(b.total_count) as total_count,
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

output = tax_data_every_state("capital_gains", "OK", 1, "nation")
#output = tax_data_every_state("capital_gains")
for row in output[0:100]:
	print(row)
"""
