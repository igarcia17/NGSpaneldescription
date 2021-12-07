/**
 * @author Inés García Ortiz
 * 
 * This script creates a description table of a exonic gene panel based on the output of codons.js (.bed file).
 * By turning the data into objects, it takes the 'gene.symbol', 'accession.number', 'exon.number', 'startcDNA',
 * 'endcDNA', 'startcodon' and 'endcodon'.
 * The input has to be semicolon separated.  
 */

//import data packages
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  'Drag here the .bed file with amplicon data (exon number, cDNAcoordinates and codon numeration, from script codons.js) according to the requirements on the README file\n',
  (codonsPath) => {
    rl.question(
      'How do you want to name your new file? Attention! If there is a previous file with the same name in the amplicons data folder, it will be overwriten \n',
      (finalFileName) => {
        main(codonsPath, finalFileName);
      }
    );
  }
);

function main(codonsPath, finalFileName) {
  //place the input, read synchronised and split every different amplicon by enter key
  const rawData = fs
    .readFileSync(path.resolve(codonsPath.replace(/\"/g, '')))
    .toString()
    .split('\n');
  //change the input headers to an standard way, separating by '_', and separate each header by semicolon
  const currentHeaders = rawData[0]
    .toLowerCase()
    .replace(/-/g, '.')
    .replace(/\s/g, '.')
    .replace(/\./g, '_')
    .split(';');
  //declaration of headers of final output
  const updatedHeaders = [
    'gene_name',
    'accession_number',
    'exons_number',
    'cDNA_coordinates',
    'codons_covered',
  ];
  //remove input headers
  rawData.shift();

  //create genes as objects: assign positions to the value of the header
  //every object acquires the pair key value as the positions of an array with those data, separated by ;
  let geneObjects = rawData.map((gene) => {
    //separate value by semicolon
    let geneData = gene.split(';');
    //create new object
    let geneObject = new Object();
    //iterate the current headers
    for (let position = 0; position < currentHeaders.length; position++) {
      //assign to an object with headers as property names the corresponding gene values of the array
      geneObject[currentHeaders[position]] = geneData[position].replace(
        /\s/g,
        ''
      );
      //if the data is a number, use it as a number
      if (!isNaN(parseInt(geneData[position]))) {
        geneObject[currentHeaders[position]] = parseInt(geneData[position]);
      }
    }

    return geneObject;
  });

  //make an array of arrays: each array will have the amplicons grouped by gene
  let groupByGen = [];
  //make an array for the names of the genes with an existing collection in 'groupByGen'
  let existingGenes = [];

  //iterate the array with gene objects
  geneObjects.map((gene) => {
    //if there a collection with the exons on groupByGen of that gene, create it and add the name of it to existingGenes
    if (!existingGenes.includes(gene.gene_symbol)) {
      existingGenes.push(gene.gene_symbol);
      groupByGen.push([gene]);

      return;
    }
    //iterate groupByGene, looking for the gene of that amplicon, and add it to the collection of the same gene
    groupByGen.map((geneArray) => {
      if (geneArray[0].gene_symbol === gene.gene_symbol) {
        return geneArray.push(gene);
      }

      return geneArray;
    });
  });

  //make the amplicons to organised themselves based on the number of exon
  groupByGen.map((gene) => {
    return sortByExon(gene);
  });

  //collect final data in an array
  let finalData = [];
  //iterate groupByGen
  groupByGen.map((geneArray) => {
    //create an array that will be used as final data for each gene
    let finalGeneArray = [
      geneArray[0].gene_symbol,
      geneArray[0].accession_number,
    ];
    //create cDNAcoordinates, exonNumbers and codon numbers property
    let cDNAcoordinates = [];
    let exonNumbers = [];
    let codonsCovered = [];

    //iterate the gene array
    geneArray.map((exon) => {
      //save in codonNumbers the first and last codon of each amplicon
      cDNAcoordinates.push(`${exon.startcdna}-${exon.endcdna}`);
    });

    geneArray.map((exon) => {
      //save in codonNumbers the first and last codon of each amplicon
      exonNumbers.push(exon.exon_number);
    });

    geneArray.map((exon) => {
      codonsCovered.push(`${exon.startcodon}-${exon.endcodon}`);
    });
    //add to the final data the codon numbers processed by the function mergeCoordinates
    //finalGeneArray.push(mergeExonNumbers(exonNumbers))
    finalGeneArray.push(mergeExonNumbers(exonNumbers));
    finalGeneArray.push(mergeCoordinates(cDNAcoordinates));
    finalGeneArray.push(mergeCoordinates(codonsCovered));
    //add to final data everything as a single string, separating the data with semicolon
    finalData.push(finalGeneArray.join(';'));
  });
  //place in the final data the updated headers
  finalData.unshift(updatedHeaders.join(';'));
  //join all the genes by new lines
  finalData = finalData.join('\n');

  const finalPathArray = codonsPath.includes('/')
    ? codonsPath.replace(/\"/g, '').split('/')
    : codonsPath.replace(/\"/g, '').split('\\');
  finalPathArray.pop();
  finalPathArray.push(finalFileName + '.csv');

  //save a .csv file with the final data, if there is an error, notify
  fs.writeFile(finalPathArray.join('/'), finalData, function (err) {
    if (err) return console.log(err);
    process.exit();
  });
}

function mergeExonNumbers(exonNumberArray) {
  let prrocessedExonNumbers = exonNumberArray;
  let swaps = 0;

  for (let position = 0; position < exonNumberArray.length - 1; position++) {
    let firstExonNumberToCompare;
    let secondExonNumberToCompare;

    let firstExonNumberToReplace;
    let secondExonNumberToReplace;

    if (exonNumberArray[position].toString().includes('-')) {
      firstExonNumberToCompare = parseInt(
        prrocessedExonNumbers[position].split('-')[1]
      );
      firstExonNumberToReplace = parseInt(
        prrocessedExonNumbers[position].split('-')[0]
      );
    } else {
      firstExonNumberToCompare = prrocessedExonNumbers[position];
    }

    if (exonNumberArray[position + 1].toString().includes('-')) {
      secondExonNumberToCompare = parseInt(
        prrocessedExonNumbers[position + 1].split('-')[0]
      );
      secondExonNumberToReplace = parseInt(
        prrocessedExonNumbers[position + 1].split('-')[1]
      );
    } else {
      secondExonNumberToCompare = prrocessedExonNumbers[position + 1];
    }

    if (secondExonNumberToCompare - firstExonNumberToCompare <= 1) {
      const firstCoordinate = firstExonNumberToReplace
        ? firstExonNumberToReplace
        : firstExonNumberToCompare;
      const secondCoordinate = secondExonNumberToReplace
        ? secondExonNumberToReplace
        : secondExonNumberToCompare;
      const newCoordinates =
        firstCoordinate !== secondCoordinate
          ? `${firstCoordinate}-${secondCoordinate}`
          : firstCoordinate;

      //save the new data in the first codon positions and erase the next one
      prrocessedExonNumbers[position] = newCoordinates;
      prrocessedExonNumbers.splice(position + 1, 1);
      //note a change on the swaps variable
      swaps++;
    }
  }

  if (swaps != 0) {
    return mergeExonNumbers(prrocessedExonNumbers);
  }
  //if there wasn't any change, return the coordinates separated by coma
  return prrocessedExonNumbers.join(',');
}

//recursive function to merge the codon numbers for every gene in just one entry
function mergeCoordinates(coordinatesArray) {
  //save coordinatesArray as a local variable
  let processedCoordinates = coordinatesArray;
  //create a variable to save the number of changes done over that array
  let swaps = 0;
  //iterate processed coordinates
  for (
    let position = 0;
    position < processedCoordinates.length - 1;
    position++
  ) {
    //save the coordinates of the amplicon and the next mplicon coordinates
    const firstcDNA = processedCoordinates[position].split('-');
    const secondcDNA = processedCoordinates[position + 1].split('-');

    //save as number the data for evaluation
    const firstendcDNA = parseInt(firstcDNA[1]);
    const secondstartcDNA = parseInt(secondcDNA[0]);

    //if the amplicons are consecutive (substraction is = or < of 1), transform the coordinates as:
    //a-b and b-c => a-c
    if (secondstartcDNA - firstendcDNA <= 1) {
      const newCoordinates = `${firstcDNA[0]}-${secondcDNA[1]}`;

      //save the new data in the first codon positions and erase the next one
      processedCoordinates[position] = newCoordinates;
      processedCoordinates.splice(position + 1, 1);
      //note a change on the swaps variable
      swaps++;
    }
  }

  //if there has been a change, repeat the process to ensure that all consecutives are transformed
  if (swaps != 0) {
    return mergeCoordinates(processedCoordinates);
  }
  //if there wasn't any change, return the coordinates separated by coma
  return processedCoordinates.join(',');
}

function sortByExon(gene) {
  let swaps = 0;

  for (let position = 0; position < gene.length - 1; position++) {
    if (
      gene[position].exon_number > gene[position + 1].exon_number ||
      gene[position].startcodon > gene[position + 1].endcodon
    ) {
      const aux = gene[position];
      gene[position] = gene[position + 1];
      gene[position + 1] = aux;
      swaps++;
    }
  }

  if (swaps !== 0) {
    return sortByExon(gene);
  }

  return gene;
}
