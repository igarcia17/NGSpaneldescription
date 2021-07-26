/**
 * @author Inés García Ortiz
 * 
 * This script calculates the cDNA coordinates and the codon numeration of a certain set of 
 * amplicons based on a list of exons and returns the amplicon ID, gene symbol, accession number, exon number
 * (in which the amplicon aligns), chromosome, startDNA, endDNA, strand, startcDNA, endcDNA, first codon and
 * last codon.
 * 
 * One of the input, the one with amplicon's info, must be a .bed or .csv file that necessarily 
 * contains gene symbol, amplicon name, chromosome, startDNA and endDNA.
 * 
 * It has to be semicolon separated between data on the same amplicon and new line separated between amplicons.
 * The headers must be 'chromosome', 'start', 'end' (regarding to genomic coordinates), 'amplicon_name',
 * 'gene_symbol'.
 * 
 * Another input file containing the exon data must be provided: it has to contain gene (not gene symbol), 
 * chromosome, exon (not exon number), startDNA, endDNA, strand, startcDNA, endcDNA. 
 * 
 * It has to be separated by tabulation between data of the same exon and new line separated between exons.
 * The headers should not present any empty space between words: end DNA is wrong, endDNA is correct.
 * 
 */

//import data package
const fs = require( 'fs' );
const path = require( 'path' );

//input: read synchronised -> amplicon info. Transform data in characters and separate items by enter key
let ampliconsRawData = fs.readFileSync( path.resolve( __dirname, 'exonicOCA.bed' ) );
let amplicons = ampliconsRawData.toString().replace( /\t/g, ';' ).split( '\n' );
const currentAmpliconHeaders = amplicons[0].toLowerCase().trim().replace( /\s/g, '_' ).replace( /\./g, '_' ).split( ';' );

//input: read synchronised -> exon information. Transform data in characters and separate items by enter key to separate in lines
let exonRawData = fs.readFileSync( path.resolve( __dirname, 'cdscoordinatesPreferredExome.bed' ) );
let exons = exonRawData.toString().replace( /\t/g, ';' ).split( '\n' );
const exonsCurrentHeaders = exons[0].toLowerCase().split( ';' );
exons.shift();
//eliminate last element if it is empty

//declare headers of output
const headers = 'amplicon.name;gene.symbol;accession.number;exon.number;chromosome;startDNA;endDNA;strand;startcDNA;endcDNA;startcodon;endcodon';

//editing amplicons info
//eliminate headers of input
amplicons.shift();

//create genes as objects: assign positions to the value of the header
//every object acquires the pair key value as the positions of an array with those data, separated by ;

amplicons = popLastElement( amplicons );
amplicons = amplicons.map( amplicon => convertIntoObject( currentAmpliconHeaders, amplicon.split( ';' ) ) );

exons = exons.map( exon => convertIntoObject( exonsCurrentHeaders, exon.split( ';' ) ) );

//group every exon depending on the gene for quicker search, to compare amplicons just with exons of the same gene
let groupByExon = [];
//list existing gene names from previous array to prevent repetitions
let existingGenes = [];
//group amplicons by gene

amplicons.map( amplicon => {
    //if gene name exist in gene list, continue
    if ( existingGenes.includes( amplicon.gene_symbol ) ) return;
    //if gene name doesnt exist, search out of the list
    let newGene = exons.filter( exon => exon.gene === amplicon.gene_symbol );
    //if that gene has more than 0 exons, add the exons to groupByExons and its name to existingGenes
    if ( newGene.length > 0 )
    {
        groupByExon.push( newGene );
        existingGenes.push( newGene[0].gene );
    }
} );
//create output array
let finalData = [];
//iterate amplicon array
amplicons.map( amplicon => {
    //take gene with same name as amplicon
    let gen = groupByExon.filter( gene => amplicon.gene_symbol === gene[0].gene ) || [];
    //take only the exon that is containing the amplicon
    let exon = gen[0]?.filter( gen => gen.startdna <= amplicon.start && gen.enddna >= amplicon.end );

    //if last position is empty, eliminate it
    //isolate exon of interest
    //if the exon is undefined or is smaller than 0 dont do anything

    if ( exon === undefined || !exon.length > 0 ) return;

    exon = exon[0];
    exon = popLastElement( exon );

    //calculation of start cDNA, end cDNA, first codon and last codon of amplicon
    let startCDna;
    let endCDna;
    /*if the amplicon comes from a gene in the negative strand, 
    the calculations are different as for the positive strand]*/
    if ( exon.strand === '+' )
    {
        startCDna = amplicon.start - exon.startdna + exon.startcdna;
        endCDna = amplicon.end - exon.enddna + exon.endcdna;
    } else
    {
        startCDna = exon.startcdna + ( exon.enddna - amplicon.end );
        endCDna = exon.endcdna - ( amplicon.start - exon.startdna );
    }
    //obtain amino acid number at start and end of cDNA, if it is decimal, round up
    let firstAA = Math.ceil( startCDna / 3 );
    let lastAA = Math.ceil( endCDna / 3 );

    //ordered features of output
    finalAmplicon = [amplicon.amplicon_name, exon.gene, exon.transcriptid, exon.exon, exon.chromosome, amplicon.start, amplicon.end, exon.strand, startCDna, endCDna, firstAA, lastAA];
    //include those features to output array, each one separated by ';'
    const ampliconJoin = finalAmplicon.join( ';' );
    //exclude the duplicates from the final data: if the amplicon is not included, add it to final data
    if ( !finalData.includes( ampliconJoin ) )
    {
        finalData.push( ampliconJoin );
    }
} );

//add headers
finalData.unshift( headers );
//join all the data as one text separated by new lines
finalData = finalData.join( '\n' );
//save output file and show possible errors
fs.writeFile( 'OCA_codons.bed', finalData, function ( e ) { console.log( e ); } );

//eliminate las element if it is an empty space
function popLastElement ( array ) {
    if ( array[array.length - 1] === '\s' || array[array.length - 1] === '' )
    {
        array.pop();

        return array;
    }

    return array;
}

function convertIntoObject ( headerArray, dataArray ) {
    let object = new Object();
    //iterate the current headers
    for ( let position = 0; position < headerArray.length; position++ )
    {
        //assign to an object with headers as property names the corresponding gene values of the array
        object[headerArray[position]] = dataArray[position].replace( /\s/g, '' );
        //if the data is a number, use it as a number

        if ( !isNaN( parseInt( dataArray[position] ) ) && ( dataArray[position].match( /,/g ) || [] ).length < 2 )
        {
            object[headerArray[position]] = parseInt( dataArray[position] );
        }
    }

    return object;
}