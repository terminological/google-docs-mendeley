# google-docs-mendeley

Google docs app script to allow citations in google docs.

THIS IS AN UNOFFICIAL EXTENSION and has no support from Mendeley. (Mendeley, if you are reading this you are welcome to take this over)

It is provided as is and with no warranty. It is ALPHA QUALITY and whilst every effort been made, you use it at your own risk. You should always be able to undo changes this app makes to your document, or revert to earlier versions.

## FAQ

Non so far... update this document and send me a pull request.

## Known issues / limitations

* Rendering of the citations only works effectively for journal article metadata. Other 
types of citation will not produce ideal results.
* in text citation styling in terms of order and format is mot perfect
* Only a single non-standard citation style is supported and a raw latex style
* The plugin can only see citations within a mendeley folder.
* The citations are not sensible ordered in the sidebar
* The bibliography placement defaults to the end of the document. It sometimes duplicates the bibliography if it has been moved requiring manual intervention.
* It doesn't seem possible to deep link to a mendeley web page for the article.

## Future development

* Highest priority to add "export as Latex" function - will require google drive access and export document content plus image blobs to a google docs folder for import into e.g. overleaf
* See which references are cited in the sidebar, or more importantly which ones have not been

![example usage](/MendeleyCitation.png)

## Installation / Web store

You add this to google docs via the web store:

https://chrome.google.com/webstore/detail/mendeley-citation-plugin/pdgpkjbclanplbfncobpdppiapogjmej?authuser=0

You will have a menu option under add-ons

* login to mendeley using normal mendeley oauth workflow
* for a given document link a mendeley folder from the main menu
* open the mendeley library from the main menu. You should see your folder contents in a sidebar
* click on cite button in sidebar to insert a reference at the cursor
* insert a bibliography from the main menu to inser the bibliography at the end or (theoretically) update an existing bibliography


