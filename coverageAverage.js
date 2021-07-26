const fs = require( 'fs' );
const path = require( 'path' );

const rawData = fs.readFileSync( path.resolve( __dirname, 'raw_data/CoverageOCAnoSNPs.txt' ) ).toString().split( '\n' );
const finalHeaders = 'amplicon\tn_data\tdata\taverage';

let ampliconsArray = rawData.toString().split( ',' );
ampliconsArray = ampliconsArray.map( string => string.split( '\t' ) );

if ( ampliconsArray[ampliconsArray.length - 1][0] === undefined || ampliconsArray[ampliconsArray.length - 1][0] === '' )
{
    ampliconsArray.pop();
}

const existingAmpliconNames = [];
let sortedByAmplicon = [];

ampliconsArray.map( amplicon => {
    if ( existingAmpliconNames.includes( amplicon[0] ) )
    {
        sortedByAmplicon = sortedByAmplicon.map( existingAmplicon => {
            if ( existingAmplicon[0] && existingAmplicon[0][0] === amplicon[0] )
            {
                return [...existingAmplicon, amplicon];
            }

            return existingAmplicon;
        } );

        return;
    }

    existingAmpliconNames.push( amplicon[0] );
    sortedByAmplicon.push( [amplicon] );
} );

let finalData = [];

sortedByAmplicon.map( ampliconArray => {
    let numbers = [];

    ampliconArray.map( amplicon => {
        numbers.push( parseFloat( amplicon[2] ) );
    } );

    const ampliconData = [ampliconArray[0][0], numbers.length, numbers.join( ',' ), ( numbers.reduce( ( a, b ) => a + b, 0 ) ) / ( numbers.length + 1 )];
    finalData.push( ampliconData.join( '\t' ) );
} );
finalData.unshift( finalHeaders );
finalData = finalData.join( '\n' );

fs.writeFile( 'average_coverage/average_OCA_noSNPS.bed', finalData, function ( err ) {
    if ( err ) return console.log( err );
} );