To create a reference exome, a .gff3 annotation file must be downloaded from NCBI Genome Viewer.
It must be present a list of preferred transcripts to get the codon numeration of just the desired isoforms. This list must present two columns:
  - the gene symbol
  - the RefSeq accession number.

The annotation file must be filtered and turned into objects by the intermediate script getCDS.js.
The preferred transcript list is turned into objects by getTranscript.js.

Both outputs (.json files) are run with referenceExome.js to get a new file with genomic coordinates, gene symbol, strand sense and transcript RefSeq ID:
a custom track for UCSC Genome Browser can be obtained by deleting the last two columns.

The cDNA coordinates of the exome are obtained by running this file in cDNAexome.js

Correction: if there is any name in the transcript ID list that is not present in the gff3 file, it won't be transfered to the preferred exome file. It is recommended to check this on IGV.
