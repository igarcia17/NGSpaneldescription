# NGSpaneldescription
## NGS gene panel description from .bed file into PALGA style table
###### Inés García Ortiz, Ronald van Eijk Department of Pathology, Leiden University Medical Centre, P.O. Box 9600 L1-Q2300 RC, Leiden, the Netherlands

To describe a gene panel form a .bed file to a description table with gene symbol, RefSeq accession number, coding exon, cDNA coordinates and covered codons, it is necessary to:
- Obtain a reference exome (see folder).
- Get the exonic regions of the gene panel and associate to gene symbol
- Run exonic panel and cDNA exome with **codons.js** to obtain the coding exon, cDNA coordinates and covered codons.
- Run codons.js output with **PALGAtable.js**.

Input specifications of each script are described in themselves.
