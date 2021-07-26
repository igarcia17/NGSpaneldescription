/**
 * @author Ines García Ortiz
 *
 * This script converts a list of genes with their preferred transcripts id's into a .json
 *
 */
// call to the libraries
const fs = require('fs');
const path = require('path');

// read file in a synchronised way
const preferredList = fs.readFileSync(
	path.resolve(__dirname, 'gff3Proces/transcriptsID.txt'),
);

// transform the data into strings (words) and separate each by new line
let data = preferredList.toString().split('\n');
// split each row by tab to separate the info in the same item
data = data.map((string) => string.replace(/\r/g, '').split('\t'));
// remove the headers
data.shift();

// create the object where we are going to store the transcripts id
let dataOb = {};

/*
 * the properties of dataOb will be { `gene_name`: `transcript_id` }
 * convert the names with "-" to names with "_" so javascript doesn't give an error
 *
 * Example: { 'MEG3':	NR_002766, 'MEF2C_AS2':	'NR_146284'} || MEF2C-AS2 converted to MEF2C_AS2
 */

data = data.map((string) => {
	if (!string[1]) return;

	dataOb[string[0].trim().replace(/\-/g, '_')] = string[1];
});

// save the objects into a json file, give error message on console if there is an error
fs.writeFile('gff3Proces/geneTranscripts.json', JSON.stringify(dataOb), function (err) {
	if (err) return console.log(err);
});
