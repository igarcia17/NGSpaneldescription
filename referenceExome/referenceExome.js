/**
 * @author Ines García Ortiz
 *
 * This script filters the cdaData.json generated by getCds.js according to the geneTranscripts.json 
 * done with getTranscriptID.js
 * 
 * The three scripts are not run together because the whole process together is very time-consuming, as the 
 * original annotation file is very big.
 *
 * The output of this script is a .gff3 tab separated
 *
 */

// require libraries
const fs = require( 'fs' );
const path = require( 'path' );

// reading our .json files and parsing them into objects
const dataTrans = JSON.parse(
	fs.readFileSync( path.resolve( __dirname, 'gff3Proces/geneTranscripts.json' ).toString() ),
);

let cdsData = JSON.parse(
	fs.readFileSync( path.resolve( __dirname, 'gff3Proces/cdsData.json' ) ).toString(),
);

//to verify the objects of each item, this two lines are optional
/*
console.log(cdsData[13])
process.exit()
*/

// fullPath is the cdsData length for logs
const fullPath = cdsData.length;
// create space to store final data
let finalData = [];

// iterate cdsData
cdsData = cdsData.map( ( object, index ) => {
	// getting geneName as we stored it into geneTranscripts.json
	const geneName = object.gene.trim().replace( /\-/g, '_' );
	// getting preferred transcript of gene
	// geneTranscripts.json stores data like this: { "ZUP1": "NM_145062" }
	// so if we search dataTrans.ZUP1 or dataTrans[ZUP1] we will get "NM_145062"
	const wantedTrans = dataTrans[geneName];

	// the CDS must include the preferred transcript in their 'Parent' property to be saved
	if ( !object.Parent.includes( wantedTrans ) )
	{
		return;
	}

	// here we are getting the number of chromosome, according to the number previous the point in the 'region'
	//field. chrX and chrY are chr23 and chr24, this has to be corrected
	// Example: region: NC_000001.10 ==> finalChromosome: 1
	const chromosomeData = object.region.split( '.' );
	const finalChromosome = chromosomeData[0].replace(
		/^NC[\-\_\.A-Za-z0]{1,}/,
		'',
	);

	// log to see how much time it takes in the console
	console.log( 'Step ' + index + ' completed out of ' + fullPath );

	// join the required data for each item
	finalData.push(
		[
			`chr${ finalChromosome }`,
			parseInt( object.startDNA ) - 1,
			object.endDNA,
			object.gene,
			object.strand,
			wantedTrans,
		].join( '\t' ),
	);
} );

// join the objects by new line
finalData = finalData.join( '\n' );

//save a new gff3 file with the preferred exome DNA coordinates; gff3 files usually have a different 
//startDNA position than bed files for the same coordiantes, but this was corrected by substracting 
//one to the startDNA present
fs.writeFile( 'gff3Proces/preferredExome.gff3', finalData, function ( err ) {
	if ( err ) return console.log( err );
} );
