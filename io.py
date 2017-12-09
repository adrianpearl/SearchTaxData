rd = open("states.txt", "r")
wr = open("output.txt", "w")

for line in rd:
	part_we_want = line.split("\"")[1]
	words = " ".join(part_we_want.split("_"))
	wr.write("<option value=\"")
	wr.write(words)
	wr.write("\">")
	wr.write(words)
	wr.write("</option> \n")