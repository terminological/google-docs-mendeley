# google-docs-mendeley

A Google docs add-on to allow citations in google docs from Mendeley.

THIS IS AN UNOFFICIAL EXTENSION and has no support from Mendeley. (Mendeley, if you are reading this you are welcome to take this over). It is the product of a few late nights.

It is provided as is and with no warranty. It is ALPHA QUALITY and whilst every effort been made, you use it at your own risk. You should always be able to undo changes this add-on makes to your document, or revert to earlier versions. If you find a bug (that is not already listed below) please [add it as an issue](https://goo.gl/rQNPji). This plugin has limitations. Please read the website carefully (see link below) before using. It is a hobby project and not commercially supported in any way.

In the light of poor star ratings, and absence of any bug reports or feedback about them on github, I am not updating the publically facing plugin. If you want a solid citation manager experience I can recommend you use the alternatives paperpile (paid for) or colwiz (free) which can both do the job of reference management more efficiently, and you can migrate your Mendeley library easily. 

This (final) release fixes a few issues:
1) I've increased the speed and reliability of creating a bibliography.
2) Searching for references when copy and pasted from a different document works better and should allow multiple people logged into multiple Mendeley libraries work together
3) a couple of small workflow bugs

The previous release fixed the following:
1) Folders should now synchronise better with Mendeley
2) You can now copy and past referenced text between documents.
3) The bibliography can be cut & pasted to move it to a new place.
4) Folder linking is now done via the sidebar.
5) Lots of other minor irritations fixed.

The goal is to be good enough to get some basic references in your google doc before exporting it to latex to format it properly. The latex export is a still a planned enhancement but I will not be releasing it into the public version.

![example usage](/MendeleyCitation.png)

## Installation / Web store

You need to have a Mendeley web account with a username and password. You need to sync your references to the web. This should be automatic if you are using Mendeley Desktop.

You install this add-on to google docs (or rate it) via [the web store](https://goo.gl/cqW9J1). Alternatively you can use the Add-ons > Get add ons... menu item in google docs and search for Mendeley.

After installation you will have a new menu option under Add-ons. The basic workflow is now simpler

* login to Mendeley using normal mendeley oauth workflow
* open the Mendeley library from the main menu. Pick a folder from the drop down. You should see your folder contents in a sidebar.
* click on a cite button in sidebar to insert a reference at the cursor
* insert a bibliography from the main menu to insert the bibliography at the end or update an existing bibliography
* if you add (or delete) new references or folders to Mendeley click on "Re-sync with Mendeley" to see the changes in the add-on sidebar.

## FAQ / Issues

### Help! everything has disappeared from the sidebar...

Don't panic! Close the sidebar and reopen it and it should come back. I'm not sure what causes it - seems to be transient if a document has never been used with the plugin before or there is a network error. Dunno.

### Insert Bibliography is slow

If your document contains references that were inserted in a different document and copy pasted to the new one then the plugin needs to fetch those from your mendeley library, if it can. Sometimes this is slow, and sometimes not possible.

### Folder sync

* The original release did not sync folders properly. This has been fixed in version 5.
* However sometimes (particularly if a folder has been deleted in Mendeley that the sidebar is trying to open) a folder can't be opened in the side bar. If this happens try and pick another folder and hit the "Re-sync with Mendeley" button. You should then be able to navigate back to where you were. 

### Copy and paste

You can now copy a block of text containing citations from one document to another and paste them into a new document. In most circumstances the new document will be able to find the references from your library and include them in the bibliography of the new document. Sometimes this is not possible - e.g. if the reference comes from a different Mendeley account when many people are citing in the same document, or if the underlying reference has changed in Mendeley. The plugin will do what it can but you may be able to help by viewing citations that you are using in the side bar or re-citing the article in the document. If it gets confused you may see a reference titled "<XYZ> not found in library". Some things will just need manual intervention.

### Bibliography placement

* The bibliography placement defaults to the end of the document. 
* The plugin used to sometimes duplicate the bibliography, if it had been moved. This is now fixed and the bibliography can be cut and pasted to a new location (e.g. if you have an appendix you want to come after the bibliography) and it should be able to update it in the new place. Manually deleting the bibliography is fine and the next time it is inserted it will be placed at the end of the document.

## Known issues / limitations

* Rendering of the citations only works effectively for journal article metadata. Other types of citation (e.g. book, report etc.) will not produce ideal results.
* In text citation styling is not perfect. Order and format of the citation is defined only on insertion order, and citation ranges are not supported.
* Only a single non-standard citation style is supported.
* The plugin can only see references within a mendeley folder. You must have at least one folder in your Mendeley library for the plugin to work.
* It doesn't seem possible to deep link to a mendeley web page for the reference.

## Future development

* Highest priority to add "export as Latex" function - will require google drive access and export document content, including tables, citations, plus image blobs to a google docs folder for import into e.g. overleaf where formatting can be done properly. Probably will not include equations.
* Be able to see which references are cited in the sidebar, or more importantly which ones have not been.



