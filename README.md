# google-docs-mendeley

Google docs app script to allow citations in google docs.

THIS IS AN UNOFFICIAL EXTENSION and has no support from Mendeley. (Mendeley, if you are reading this you are welcome to take this over)

It is provided as is and with no warranty. It is ALPHA QUALITY and whilst every effort been made, you use it at your own risk. You should always be able to undo changes this app makes to your document, or revert to earlier versions.

The goal is to be good enough to get some basic references in your google doc before exporting it to latex to format it properly.

![example usage](/MendeleyCitation.png)

## Installation / Web store

You add this to google docs via the web store:

https://chrome.google.com/webstore/detail/mendeley-citation-plugin/pdgpkjbclanplbfncobpdppiapogjmej?authuser=0

You will have a menu option under add-ons

* login to mendeley using normal mendeley oauth workflow
* for a given document link a mendeley folder from the main menu
* open the mendeley library from the main menu. You should see your folder contents in a sidebar
* click on cite button in sidebar to insert a reference at the cursor
* insert a bibliography from the main menu to insert the bibliography at the end or (theoretically) update an existing bibliography

## FAQ

None so far... update this document and send me a pull request.

## Known issues / limitations

* Rendering of the citations only works effectively for journal article metadata. Other 
types of citation (e.g. book, report etc.) will not produce ideal results.
* in text citation styling is not perfect. Order and format of the citation is defined only on insertion order, and citation ranges are not supported.
* Only a single non-standard citation style is supported and a raw latex style for export.
* The plugin can only see references within a mendeley folder.
* The references are not sensibly ordered in the sidebar.
* The bibliography placement defaults to the end of the document. It sometimes duplicates the bibliography, if it has been moved. If this happens the spare one can be deleted manually.
* It doesn't seem possible to deep link to a mendeley web page for the reference.

## Future development

* Sort references in sidebar by author last name then date.
* Highest priority to add "export as Latex" function - will require google drive access and export document content, including tables, citations, plus image blobs to a google docs folder for import into e.g. overleaf where formatting can be done properly. Probably will not include equations.
* Be able to see which references are cited in the sidebar, or more importantly which ones have not been.



