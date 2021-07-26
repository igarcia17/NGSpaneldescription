/**
 * @author Ines García Ortiz
 *
 * This scripts converts CDS items from GCF_000001405.25_GRCh37.p13_genomic.gff3 into objects and converts them into a .json
 *
 */
// call to the libraries
const fs = require('fs');
const path = require('path');

// read the file in a synchronised way
const rawData = fs.readFileSync(
	path.resolve(__dirname, 'gff3Proces/GCF_000001405.25_GRCh37.p13_genomic.gff3'),
);

// we are replacing semicolon by tab because there is data in a single string semicolon separated,
// and we need to split by new line
let data = rawData.toString().replace(/;/g, '\t').split('\n');
// these headers are necessary because they don't exist in the original file
const firstHeaders = [
	'region',
	'source',
	'type',
	'startDNA',
	'endDNA',
	'strand',
];

// converting all data into object
data = data.map((string) => {
	// count necessary because there are some bullets ( . ) that we don't want (columns bbeside the strand)
	let cont = 0;
	// creating object
	let object = new Object();
	// data of row is splitted by tab
	let dataArray = string.split('\t');

	// iterating data of row
	for (let position = 0; position < dataArray.length; position++) {
		// if the data is a dot, we are not considering it (columns beside the strand sense)
		if (dataArray[position] === '.') {
			continue;
		}

		// the specified headers are only related to the first data entries: 
		//the others will be assigned as object by the tag related to the info (line 53)
		if (cont <= firstHeaders.length - 1) {
			object[firstHeaders[cont]] = dataArray[position];
			cont++;
			continue;
		}

		// if the data includes an equal, we transform those values into a key value pair
		// 'ID=cds-NP_000375.3' ==> { ID: 'cds-NP_000375.3'}
		if (dataArray[position].includes('=')) {
			const keyValue = dataArray[position].split('=');
			object[keyValue[0]] = keyValue[1];
		}

		// adding 1 to count. We are not using position because of the dots, count and position may be desynchronized
		cont++;
	}

	// returning object
	return object;
});

// storing the amount of objects we have
const length = data.length;
// here we are storing the data we will save
let cdsData = data.filter((object, index) => {
	// only save the objects that are CDS type and the region has the format: NC_000001.10
	if (object.type === 'CDS' && /^NC[\-\_\.A-Za-z0-9]{1,}/.test(object.region)) {
		// this script takes time because there is a lot of data
		// here is only a log to know how much it remains to our script to finish
		console.log('Added ' + index + ' of ' + length);
		return true;
	}
	return false;
});

// saving into cdsData.json
fs.writeFile('gff3Proces/cdsData.json', JSON.stringify(cdsData), function (err) {
	if (err) return console.log(err);
});
