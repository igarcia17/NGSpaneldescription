/**
 * @author Inés García Ortiz
 * 
 * This script calculates the average number of reads of a certain set of 
 * amplicons based on a table with the amplicon name, the run identifier and the number of reads of it in that run.
 * It has to be a .txt, tab separated.
 * It shouldn't contain any headers.
 */

 const fs = require('fs');
 const path = require('path');
 const readline = require('readline');
 
 const rl = readline.createInterface({
   input: process.stdin,
   output: process.stdout,
 });
 
 rl.question(
   'Drag here the coverage information of multiple runs of the panel (in columns, amplicon name, sample, number of reads) described in the README file \n',
   (ampliconPath) => {
     rl.question(
       'How do you want to name your new file? Attention! If there is a previous file with the same name in the amplicons data folder, it will be overwriten \n',
       (finalFileName) => {
         main(ampliconPath, finalFileName);
       }
     );
   }
 );
 
 function main(ampliconPath, finalFileName) {
   let ampliconsRawData = fs.readFileSync(
     path.resolve(ampliconPath.replace(/\"/g, ''))
   );
   let ampliconsArray = ampliconsRawData
     .toString()
     .replace(/;/g, /\t/)
     .split('\n');
   ampliconsArray = ampliconsArray.map((string) => string.split('\t'));
 
   const finalHeaders = 'amplicon\tn_data\tdata\taverage';
   if (
     ampliconsArray[ampliconsArray.length - 1][0] === undefined ||
     ampliconsArray[ampliconsArray.length - 1][0] === ''
   ) {
     ampliconsArray.pop();
   }
 
   const existingAmpliconNames = [];
   let sortedByAmplicon = [];
 
   ampliconsArray.map((amplicon) => {
     if (existingAmpliconNames.includes(amplicon[0])) {
       sortedByAmplicon = sortedByAmplicon.map((existingAmplicon) => {
         if (existingAmplicon[0] && existingAmplicon[0][0] === amplicon[0]) {
           return [...existingAmplicon, amplicon];
         }
 
         return existingAmplicon;
       });
 
       return;
     }
 
     existingAmpliconNames.push(amplicon[0]);
     sortedByAmplicon.push([amplicon]);
   });
 
   let finalData = [];
 
   sortedByAmplicon.map((ampliconArray) => {
     let numbers = [];
 
     ampliconArray.map((amplicon) => {
       numbers.push(parseFloat(amplicon[2]));
     });
 
     const ampliconData = [
       ampliconArray[0][0],
       numbers.length,
       numbers.join(','),
       numbers.reduce((a, b) => a + b, 0) / (numbers.length + 1),
     ];
     finalData.push(ampliconData.join('\t'));
   });
   finalData.unshift(finalHeaders);
   finalData = finalData.join('\n');
 
   const finalPathArray = ampliconPath.includes('/')
     ? ampliconPath.replace(/\"/g, '').split('/')
     : ampliconPath.replace(/\"/g, '').split('\\');
   finalPathArray.pop();
   finalPathArray.push(finalFileName + '.bed');
 
   fs.writeFile(finalPathArray.join('/'), finalData, function (e) {
     process.exit();
   });
 }
 