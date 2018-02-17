build/cb_2015_us_zcta510_500k.zip:
	mkdir -p $(dir $@)
	curl -o $@ https://www2.census.gov/geo/tiger/GENZ2015/shp/cb_2015_us_zcta510_500k.zip
build/cb_2015_us_zcta510_500k.shp: build/cb_2015_us_zcta510_500k.zip
	unzip -od $(dir $@) $<
	touch $@
build/zips.json: build/cb_2015_us_zcta510_500k.shp
	node_modules/.bin/topojson \
		-o $@ \
		--id-property='ZCTA5CE10' \
		-- zips=$<

build/cb_2016_us_cd115_20m.zip:
	curl -o $@ https://www2.census.gov/geo/tiger/GENZ2016/shp/cb_2016_us_cd115_20m.zip
build/cb_2016_us_cd115_20m.shp: build/cb_2016_us_cd115_20m.zip
	unzip -od $(dir $@) $<
	touch $@
build/cds.json: build/cb_2016_us_cd115_20m.shp
	node_modules/.bin/topojson \
		-o $@ \
		--id-property='GEOID' \
		-- cds=$<
build/states.json: build/cds.json
	node_modules/.bin/topojson-merge \
		-o $@ \
		--in-object=cds \
		--out-object=states \
		--key='d.id.substring(0, 2)' \
		-- $<
build/us.json: build/states.json
	node_modules/.bin/topojson-merge \
		-o $@ \
		--in-object=states \
		--out-object=nation \
		-- $<
