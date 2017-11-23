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
* open the mendeley library from the main menu. Pick a folder from the drop down. You should see your folder contents in a sidebar
* click on cite button in sidebar to insert a reference at the cursor
* insert a bibliography from the main menu to insert the bibliography at the end or (theoretically) update an existing bibliography

## FAQ / Issues

### Folder sync issues

The folder sync issues have been fixed but are awaiting release. There is now no need to link a folder to a document, this will happen
automatically when you pick a folder in the sidebar. This has also fixed the ordering of items in the sidebar. This will be scheduled for release shortly.

IN the meantime follow these instructions:

It seems that the folder structure is not updating properly from the re-sync button on the sidebar. Re-syncing folder structure can also be done from the menu. Try the following:

* Make sure you have at least one folder in your Mendeley library
* Close the plug in side bar.
* Select menu option: Add-ons -> Mendeley citation plugin -> Clear default folder
* Select menu option: Add-ons -> Mendeley citation plugin -> Set default folder

Hopefully this will now show the full list of folders.

### Copy and paste

You can't copy a block of text containing citations from one document to another and paste them into a new document and include them in the bibliography of the new document. I'll work on this but it just isn't possible at the moment.

## Known issues / limitations

* Rendering of the citations only works effectively for journal article metadata. Other 
types of citation (e.g. book, report etc.) will not produce ideal results.
* in text citation styling is not perfect. Order and format of the citation is defined only on insertion order, and citation ranges are not supported.
* Only a single non-standard citation style is supported and a raw latex style for export.
* The plugin can only see references within a mendeley folder. You must have at least one folder in your Mendeley library for the plugin to work.
* The references are not sensibly ordered in the sidebar. << FIXED pending release
* The bibliography placement defaults to the end of the document. It sometimes duplicates the bibliography, if it has been moved. If this happens the spare one can be deleted manually.
* It doesn't seem possible to deep link to a mendeley web page for the reference.

## Future development

* Sort references in sidebar by author last name then date.
* Highest priority to add "export as Latex" function - will require google drive access and export document content, including tables, citations, plus image blobs to a google docs folder for import into e.g. overleaf where formatting can be done properly. Probably will not include equations.
* Be able to see which references are cited in the sidebar, or more importantly which ones have not been.



