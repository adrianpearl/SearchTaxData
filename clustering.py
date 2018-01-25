
import sqlite3
import string
import matplotlib.pyplot as plt
import numpy as np
from ClusterEqualizer import CEqualizer
import csv

np.set_printoptions(precision=5, linewidth=120, suppress=True)

'''
Creating zipcode location and population database

ziplocations = np.genfromtxt("2017_Gaz_zcta_national.txt",
	dtype=[	('zip', np.unicode_, 5),
			('area1', 'i4'),
			('area2', 'i4'),
			('area3', 'f4'),
			('area4', 'f4'),
			('lat', 'f4'),
			('lon', 'f4')])

ziplocations = ziplocations[['zip', 'lat', 'lon']]

conn = sqlite3.connect('cd_by_zip.sqlite3')
cursor = conn.cursor()

def get_zipcode_list():
	q = """
		select zip, state, sum(total_count)
		from tax_info
		where zip != "99999"
		and zip != "00000"
		group by zip
		"""
	results = cursor.execute(q)
	return results.fetchall()

output = np.array(get_zipcode_list())[0:-1]
print(output[-1])

zipstate = dict(zip(output[:,0],output[:,1]))
zipfilers = dict(zip(output[:,0],output[:,2].astype(int)))

ziparray = []
for row in ziplocations:
	zip = row['zip']
	if zip in zipstate.keys():
		ziparray.append((zip, zipstate[zip], zipfilers[zip], row['lat'], row['lon']))

np.save('ziplatlonpop.npy', ziparray)
'''

zips = np.load('ziplatlonpop.npy')

zipcodes = zips[:,0]
locations = zips[:,[3,4]].astype(float)
filers = zips[:,2].astype(int)
states = zips[:,1]

natclusters = {}
maxcluster = 0

natnearest = {}

ce = CEqualizer(True, False, 5000, 0.05, 8)

"""
st = "FL"

mazips = zipcodes[states==st]
maloc = locations[states==st]
mafilers = filers[states==st]

labels, means, densities, nearest = ce.fit(maloc, mafilers, int(np.sum(mafilers)/250000))
plotsize = densities/np.sum(densities)

plt.figure(2)
plt.scatter(maloc[:, 1], maloc[:, 0], c=labels, s=20, cmap='viridis')
lat = means[:,1]
lon = means[:,0]
plt.scatter(lat, lon, c='black', s=3000*plotsize, alpha=0.5)

plt.show()

"""
start = 0
for state in np.unique(states):
	print(state)

	mazips = zipcodes[states==state]
	maloc = locations[states==state]
	mafilers = filers[states==state]
	length = maloc.shape[0]

	print("filers: ", np.sum(mafilers))

	n_clus = max(int(np.sum(mafilers)/250000), 1)
	print("clusters: ", n_clus)

	labels, means, densities, nearest = ce.fit(maloc, mafilers, n_clus)

	maxlabel = np.amax(labels)
	print("maxlabel: ", maxlabel)
	for i in range(labels.shape[0]):
		natclusters[mazips[i]] = labels[i] + maxcluster + 1
	for label in np.unique(labels):
		natnearest[label + maxcluster + 1] = mazips[nearest[label]]
	maxcluster = maxcluster + maxlabel + 1
	print("maxcluster: ", maxcluster)

	start = start + length

with open('nationalclusters.csv', 'w') as csv_file:
    writer = csv.writer(csv_file)
    for key, value in natclusters.items():
       writer.writerow([key, value])

with open('nationalnearest.csv', 'w') as csv_file2:
    writer = csv.writer(csv_file2)
    for key, value in natnearest.items():
       writer.writerow([key, value])

"""
plt.figure(1)
plt.scatter(locations[:, 1], locations[:, 0], c=natclusters, s=20, cmap='viridis')
plt.show()

for st in np.unique(states):
	wy = np.sum(filers[states==st])
	print(st, " ", wy)
"""
