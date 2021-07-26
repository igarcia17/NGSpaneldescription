/**
 * @author Inés García Ortiz
 * 
 * This script makes the required calculations to obtain the cDNA coordinates related to a set of exons 
 * that includes gene symbol, chromosome, exon number, startDNA, endDNA, strand,
 * startcDNA, endcDNA and last codon of the exons.
 * 
 * The input must be a .bed file that necessarily contains genomic coordinates of each exon 
 * (chr startDNA endDNA), gene symbol and strand sense. More data can be present but won't be considered.
 * 
 * The data must be tab separated between same rows data and new line separated between
 *  different rows.
 * 
 * Files coma separed would be not considerated
 * 
 * This script is prepared to specifically process the data from intersection between 
 * 'knownGene-> coding exons' and 'knownCanonical' UCSC tracks by bedtools. It doesn't contain headers, but
 * the data must be structured as chromosome, startDNA, endDNA, gene symbol, exonNumber and strand,
 * even if exonNumber input information won't be considered.
 * 
 */

// import usage packages
const fs = require('fs');
const path = require('path');
//input; read synchronised
const rawData = fs.readFileSync(path.resolve(__dirname, 'gff3Proces/preferredExome.gff3')); 
// pass input to string and split by Enter key + declare final headers
let gens = rawData.toString().split('\n');
const headers = 'gene;transcriptID;chromosome;exon;startDNA;endDNA;strand;startcDNA;endcDNA;aa';
const objectProps = ['chromosome', 'startExon', 'endExon', 'geneName','strand','transcriptID']
//eliminate last element if white space/empty string
if(gens[gens.length -1] === '\s' || gens[gens.length -1] === ''){
    gens.pop()
};
//split all the items on the genes by tab, and detect and transform all the numeric information into number
gens = gens.map(exon => {
    //separate value by semicolon
    let exonData = exon.split('\t')
    //create new object
    let exonObject = new Object()
    //iterate the current headers
    for (let position = 0 ; position < objectProps.length ; position++){
        //assign to an object with headers as property names the corresponding gene values of the array
        exonObject[objectProps[position]] = exonData[position].replace(/\s/g, '')
        //if the data is a number, use it as a number
        if(!isNaN(parseInt(exonData[position]))){
            exonObject[objectProps[position]] = parseInt(exonData[position])
        }
    }

    return exonObject

})

// save all unique genes, eliminate the doubles
let groupByGens = []
let addedNames = []
// iterate through all genes 
gens.forEach(element => {
    //if the gene is not in the list of added genes, create a gene collection and add the name to the existing ones
    if(!addedNames.includes(element.geneName)){
        groupByGens.push([element])
        addedNames.push(element.geneName)

        return;
    }

    //add the exon to the collection of corresponding gene
    for(let i = 0; i < groupByGens.length; i++){
        if(groupByGens[i][0].geneName === element.geneName){
            groupByGens[i].push(element)

            return
        }
    }
});

//iterate groupByGenes and order the exons by the start coordinates in each gene collection
groupByGens = groupByGens.map(gen => {
    return sortByStart(gen)
})

//iterate groupByGenes for adding the exon number
groupByGens = groupByGens.map(gen => {
    let gene = gen
    let acc = 0
    //if the strand is negative, the order of the exons must be reversed
    if(gen[0].strand === '-') {
        gene = gene.reverse()
    }

//add 1 and add the position to each exon by the array order
    for(let i = 0; i < gene.length; i++){
        acc++
        gene[i].exonNumber = acc
    }

    //if the gene is negative, the exon number order is reversed as well
    if(gen[0].strand === '-') {
        gene = gene.reverse()
    }
    
    return gene
})

//iterate groupByGenes to add the missing properties
groupByGens = groupByGens.map(gen => {
    let gene = gen

    //reverse the order of the exons again if the strand is negative
    if(gen[0].strand === '-') {
        gene = gene.reverse()
    }

    //declare an accumulator
    let acc = 0
    for(let j = 0; j < gene.length; j++){
        //add one to the accumulator as the startcDNA starts at 1 and the following startcDNA is going to be 1 more than the last endCDNA
        acc++
        //difference between start and end; substract one as in accumulator there is 1 added
        const difference = gene[j].endExon - gene[j].startExon -1
        //startCDNA of that exon has the value of the accumulator
        gene[j]['startCDNA'] = acc
        //add the difference to the accumulator
        acc += difference
        //endCDNA is the value of the accumulator
        gene[j]['endCDNA'] = acc
        //divide endCDNA by 3 to get number of last codon on exon
        const aaDiff = gene[j].endCDNA/3
        //add property 'aa' to object aaDiff
        gene[j]['aa'] = aaDiff
    }

    //reverse again if negative
    if(gen[0].strand === '-') {
        gene = gene.reverse()
    }

    return gene
})
const length = groupByGens.length
//iterate groupByGens
groupByGens = groupByGens.map((gen,index) => {
    //visualize process in console
	console.log('Paso ' + index + ' completado de ' + length);
    //take every object and transform them in a string separated by tab, ordering the data, to get the final file
    return gen.map(exon => {
        return [exon.geneName, exon.transcriptID, exon.chromosome, exon.exonNumber, exon.startExon, exon.endExon, exon.strand, exon.startCDNA, exon.endCDNA, exon.aa].join('\t')
    })
})

//join the exons of the same gene separated by new line
let finalGenesArray = groupByGens.map(gen => gen.join('\n'))
//add the final headers
finalGenesArray.unshift(headers.replace(/;/g, '\t'))
//join all the genes by new line
finalGenesArray = finalGenesArray.join('\n')

//function to order genes as the startExon, from the smallest to the biggest
function sortByStart(gen) {
    let swaps = 0

    //iterate the gene
    for(let i = 0; i < gen.length-1; i++){
        //if an startExon of current exon is bigger than startExon of the next exon, swap them
        if(gen[i].startExon > gen[i+1].startExon){
            let aux = gen[i]
            gen[i] = gen[i+1]
            gen[i+1] = aux

            swaps++
        }
    }

    //if there has been any swap, do it again
    if(swaps != 0) {
        return sortByStart(gen)
    }

    //return ordered gene by startExon number
    return gen
}

//save a .bed file from converted exons, if there is an error, notify
fs.writeFile('cdscoordinatesPreferredExome.bed', finalGenesArray, function (err) {
    if (err) return console.log(err);
});