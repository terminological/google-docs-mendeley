/**
* @OnlyCurrentDoc

Copyright (c) 2017 Terminological ltd

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

// SCRIPT_ID = "18mPlo0gcCA7VY__MKfMsQrmymXdExt6a7uO4RY9dMrWv0Tsqix9YOhqo"
// Mendeley redirect url = "https://script.google.com/macros/d/18mPlo0gcCA7VY__MKfMsQrmymXdExt6a7uO4RY9dMrWv0Tsqix9YOhqo/usercallback"
// App secret is: XTEkTzk7EuPDuKL8

/******************************************************************************
* Apps script set up and utilites
******************************************************************************/

/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 */
function onOpen(e) {
  var ui = DocumentApp.getUi();
  ui.createMenu('Mendeley')
      .addItem('Login', 'mendeleyLogin')
      .addItem('Logout', 'mendeleyLogout')
      .addSeparator()
      .addItem('Set default folder', 'openFolderChooser')
      .addItem('Open library', 'openLibrary')
      .addSeparator()
      .addSubMenu(citationStylesMenu())
      .addToUi();
}

/**
 * Runs when the add-on is installed.
 */
function onInstall(e) {
  onOpen(e);
}

function debugLogProps() {
  Logger.log('User properties');
  var userProp = PropertiesService.getUserProperties();
  var data = userProp.getKeys();
  for (var key in data) {
    Logger.log('Key: %s, Value: %s', key, data[key]);
  }
  Logger.log('Document properties');
  var docProp = PropertiesService.getDocumentProperties();
  var data = docProp.getKeys();
  for (var key in data) {
    Logger.log('Key: %s, Value: %s', key, data[key]);
  }
}

// Helper function that puts external JS / CSS into the HTML file.
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Helper function (hack) that makes external JS available in GS code.
// see https://ctrlq.org/code/20380-load-external-javascript-with-eval
/*function loadJSFromHTMLFile(filename) {
  var javascript = HtmlService.createTemplateFromFile(filename).getRawContent();
  DocumentApp.getUi().alert(javascript);
  eval(javascript); //seems to be scoped to this function only
}*/

/******************************************************************************
* UI and workflow
******************************************************************************/



function openFolderChooser() {
  mendeleyLogin();
  var template = HtmlService.createTemplateFromFile("folderDialog.html");
  template.folders = getFolders();
  var page = template.evaluate();
  DocumentApp.getUi().showModalDialog(page, "Pick a default Mendeley folder for your document.");
  //When user has selected UI will be dismissed & openLibrary called from the UI.
}

function openLibrary() {
  mendeleyLogin();
  var docProperties = PropertiesService.getDocumentProperties();
  var linkedFolder = docProperties.getProperty('LINKED_FOLDER');
  if (linkedFolder == null) {
    openFolderChooser();
  } else {
    var mendeleyService = getMendeleyService();
    var template = HtmlService.createTemplateFromFile("citationsSidebar.html");
    //template.documents = getDocumentsInLinkedFolder(); 
    template.token = mendeleyService.getAccessToken()
    template.folders = getFolders();
    template.linkedFolder = linkedFolder;
    //template.folder = getJsonFromUrl('https://api.mendeley.com/folders/'+linkedFolder,'vnd.mendeley-folder.1');
    var page = template.evaluate();
    page.setSandboxMode(HtmlService.SandboxMode.IFRAME).setTitle('Citation library');
    DocumentApp.getUi().showSidebar(page);
  }
}

/******************************************************************************
* Async server functions
******************************************************************************/

/**
* Sets the citation style in response to UI event in the menu
*/ 
function setCitationStyle(citationStyle) {
  var docProperties = PropertiesService.getDocumentProperties();
  docProperties.setProperty('CITATION_STYLE', citationStyle);
}

/**
* Called when:
* LINKED_FOLDER is not set and a folder is selected in the sidebar UI to be linked
* inputs: 
* linkedFolder - a mendeleyId for a linked folder.
*/
function linkDocumentToFolder(linkedFolder) {
  var docProperties = PropertiesService.getDocumentProperties();
  Logger.log("linked folder changed to: "+linkedFolder);
  docProperties.setProperty('LINKED_FOLDER', linkedFolder);
}

/******************************************************************************
* Mendeley API related functions
******************************************************************************/

/**
* Check access - if not already logged in present login to mendeley flow
* see http://dev.mendeley.com/reference/topics/authorization_implicit.html
*/ 
function mendeleyLogin() {
  var mendeleyService = getMendeleyService();
  if (!mendeleyService.hasAccess()) {
    var authorizationUrl = mendeleyService.getAuthorizationUrl();
    var template = HtmlService.createTemplateFromFile("authPopup.html");
    template.authorizationUrl = authorizationUrl;
    var page = template.evaluate();
    DocumentApp.getUi().showModalDialog(page,"Mendeley authorisation");
  } else {
    // DocumentApp.getUi().alert("You are already logged in.");
  }
}

function mendeleyLogout(){
  var ui = DocumentApp.getUi();
  var response = ui.alert('Logging out of all documents', 'Do you want to continue?', ui.ButtonSet.YES_NO);
  // Process the user's response.
  if (response.getSelectedButton() == ui.Button.YES) {
    OAuth2.createService('mendeley')
      .setPropertyStore(PropertiesService.getUserProperties())
      .reset();
    DocumentApp.getUi().alert("Logged out of Mendeley");
   } else {
   // action cancelled
   }
}

/**
* A mendeley service OAUTH token holder.
* see http://dev.mendeley.com/reference/topics/authorization_implicit.html
*/
function getMendeleyService() {
  return OAuth2.createService('mendeley')
      .setAuthorizationBaseUrl('https://api.mendeley.com/oauth/authorize')
      .setTokenUrl('https://api.mendeley.com/oauth/token')
      .setClientId('4839')
      .setClientSecret('XTEkTzk7EuPDuKL8')
      .setCallbackFunction('authCallback')
      .setPropertyStore(PropertiesService.getUserProperties())
      .setScope('all');
}

function authCallback(request) {
  var mendeleyService = getMendeleyService();
  var isAuthorized = mendeleyService.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('<html><head></head><body><p>Success! Close this window to continue</p><!--<script type="text/javascript">google.script.host.close();</script>--></body></html>');
  } else {
    return HtmlService.createHtmlOutput('<html><head></head><body><p>Mendeley authorisation failed - '+mendeleyService.getLastError()+'.</p></body></html>');
  }
}

/*
* internal function simplifying getting content from mendeley, server side
*/
function getJsonFromUrl(url, type) {
  var mendeleyService = getMendeleyService();
  Logger.log("requested url: "+ url);
  var response = UrlFetchApp.fetch(url, {
    'headers': {
      'Authorization': 'Bearer ' + mendeleyService.getAccessToken(),
      'Accept': 'application/'+type+'+json'
    }
  });
  Logger.log(response);
  return JSON.parse(response);
}

/*
* clear and reload cached folder and group data.
*/ 
function refreshFolderAndGroupData() {
  var userProp = PropertiesService.getUserProperties();
  userProp.deleteProperty("LIBRARY_CONTENT");
  return mendeleySync();
}

/*
* get cached user and group content if available. Otherwise load from mendeley
*/
function getMendeleyContent() {
  var userProp = PropertiesService.getUserProperties();
  var content = userProp.getProperty("LIBRARY_CONTENT");
  var ts = userProp.getProperty("LIBRARY_TS");
  if (content == null) { // || ts < (new Date().getTime() + 7*24*60*60*1000)) {
    return mendeleySync();
  } else {
    return JSON.parse(content);
  }
}

/*
* Fetch group and folder data from mendeley, so we can create the folder picker UI
* and the skeleton of the document library sidebar.
* stores group and folder content in the users properties
* saves retrieving this for different documents.
*/
function mendeleySync() {
  var out = {};
  out.documents = {};
  out.folders = getJsonFromUrl('https://api.mendeley.com/folders', 'vnd.mendeley-folder.1');
  out.folders = out.folders.sort(function(a,b) {return a.name.localeCompare(b.name);});
  out.folders.forEach(function(folder) {
    delete(folder.created);
  });
  out.groups = getJsonFromUrl('https://api.mendeley.com/groups', 'vnd.mendeley-group.1');
  out.groups = out.groups.sort(function(a,b) {return a.name.localeCompare(b.name);});
  out.groups.forEach(function(group) {
    var groupfolders = getJsonFromUrl('https://api.mendeley.com/folders?group_id='+group.id, 'vnd.mendeley-folder.1');
    groupfolders = groupfolders.sort(function(a,b) {return a.name.localeCompare(b.name);});
    groupfolders.forEach(function(folder) {delete(folder.created);});
    group.folders = groupfolders;
  });
  var userProp = PropertiesService.getUserProperties();
  userProp.setProperty("LIBRARY_CONTENT", JSON.stringify(out));
  userProp.setProperty("LIBRARY_TS", new Date().getTime());
  Logger.log(out);
  return out;
}

/* 
* get a list of folders
* see http://dev.mendeley.com/methods/#folders
*/
function getFolders() {
  var tmp = getMendeleyContent();
  var out = tmp.folders;
  var groups = tmp.groups;
  groups.forEach(function(group) {
    group.folders.forEach(function(folder) {
      folder.name = group.name+" > "+folder.name;
    });
    out = out.concat(group.folders);
  });
  out = out.sort(function(a,b) {return a.name.localeCompare(b.name);});
  Logger.log(out);
  return out;
}

/*************************************************************************
* Document manipulation functions
*************************************************************************/

/**
* Called by the sidebar in response to the selection of a reference
* bibtexKey is a id from mendeley 
* stores bibtex for that key in the document property store and 
* creates or updates a link at the point of the cursor.
* TODO: figure out how to format citation(s) as we go.
* TODO: figure out how to insert a reference into the bibliography if it is
* not already there.
*/
function insertCitationAtCursor(bibtexKey, citationId, bibtex) {
  var docProperties = PropertiesService.getDocumentProperties();
  var citationIndex = parseInt(docProperties.getProperty('CITATION_INDEX')) || 1;
  var doc = DocumentApp.getActiveDocument();
  // store the bibtex from mendeley in the document, so we don;t have to retrieve it when
  // building the bibliography
  docProperties.setProperty(bibtexKey, bibtex);
  // is the cursor on or just after a link? If so it might be already on a reference
  // this is harder than it should be I think.
  var currentEl = doc.getCursor().getSurroundingText();
  var offset = doc.getCursor().getSurroundingTextOffset();
  var linkUrl = null;
  if (currentEl.editAsText().getText().length > 0) {
    if (offset < currentEl.editAsText().getText().length) {
      linkUrl = currentEl.editAsText().getLinkUrl(offset);
    }
    if (linkUrl == null && offset > 0) {
      offset -= 1;
      linkUrl = currentEl.editAsText().getLinkUrl(offset);
    }
  };
  if (linkUrl != null && linkUrl.indexOf("http://bibtex?") == 0) {
    // the cursor is on a link and that link is of the form that we are expecting.
    // i.e. we need to update existing citation
    // step one find the named ranges for this URL and remove them. 
    // The URL contains an index for a named range name.
    var currentIndex = parseInt(linkUrl.substring(linkUrl.indexOf("=")+1,linkUrl.indexOf("&")));
    var namedRanges = doc.getNamedRanges('mendeley-cite-'+currentIndex);
    // this removes the range (but not the content)
    namedRanges.forEach(function(namedRange) {namedRange.remove();});
    // we are in a URL. find the start and end of this URL in the text
    var start = offset;
    do {
      start -= 1;
    } while (start>-1 && linkUrl == currentEl.editAsText().getLinkUrl(start));
    var end = offset;
    do {
      end +=1;
    } while (end < currentEl.getText().length && linkUrl == currentEl.editAsText().getLinkUrl(end));
    // that was painful but the LinkURL is not an element in HTML sense it is sort of metadata at an 
    // individual character level. Makes HTML look like a walk in the park. Come back JQuery all is forgiven.
    // generate the new text. Could in theory do this according to citation style...
    var c = linkUrl.split("\|").length+1;
    var txt = "["+c+" refs]";
    // delete the text span containing the url and create a new one.
    currentEl.editAsText().deleteText(start+1,end-1);
    var newEl = doc.newPosition(currentEl, start+1).insertText(txt);
    // append the new citation onto the existing URL
    newEl.setLinkUrl(linkUrl+"|"+bibtexKey);
    // recreate the named range so we can find it again when we come to build the bibliography
    var rangeBuilder = doc.newRange();
    rangeBuilder.addElement(newEl);
    doc.addNamedRange('mendeley-cite-'+currentIndex, rangeBuilder.build());
    // tidy up and move cursor to end of the inserted citation
    insertSpaceMaybe(doc.getCursor());
    doc.setCursor(doc.newPosition(newEl,newEl.getText().length));
    newEl.setForegroundColor('#404040');
  } else {
    //insert new reference with a unique citation index
    var textEl = doc.getCursor().insertText("[1 ref]");
    textEl.setLinkUrl("http://bibtex?index="+(citationIndex+1)+"&cite="+bibtexKey);
    docProperties.setProperty('CITATION_INDEX', citationIndex+1);
    // create a named range for the citation
    var rangeBuilder = doc.newRange();
    rangeBuilder.addElement(textEl);
    doc.addNamedRange('mendeley-cite-'+(citationIndex+1), rangeBuilder.build());
    //tidy up and move cursor to end
    insertSpaceMaybe(doc.getCursor());
    doc.setCursor(doc.newPosition(textEl,textEl.getText().length));
    textEl.setForegroundColor('#404040');
  }
}

/*
* if a position where we are inserting a reference is a letter or number then
* insert a space so that the reference is not butting against the text. 
* in superscript / subscript citation styles this might not be desirable. User can 
* delete the additional space though.
* TODO: factor in citation styles.
*/
function insertSpaceMaybe(pos) {
  var text = pos.getSurroundingText();
  var off = pos.getSurroundingTextOffset();
  if (off == 0) return false;
  else {
    var prev = text.getText().substring(off-1,off);
    if (prev.match(/^[a-zA-Z0-9]$/))
      pos.insertText(" ");
  }
}

/**
* Called by the sidebar in response to insert bibliography user command
* Looks for named ranges startign with "mendeley-cite-" as the citations
* Updates the text of those to match citation style (Not yet implemented)
* Inserts bibliography into a table at the named range "mendeley-biliography" or
* at current cursor position - currently inserts raw bibtex - proof of concept.
* TODO: figure out how to format citation(s) / bibliography
*/
function insertOrUpdateBibliography() {
  var docProperties = PropertiesService.getDocumentProperties();
  // create the bibtexToObject() function from BibtexParser.
  // loadJSFromHTMLFile('bibtexParse.js.html');
  var doc = DocumentApp.getActiveDocument();
  // find somewhere to stick bibliography
  // if it has been run befor there shoudl be one named range called mendeley-bibliography
  var bibliographyRanges = doc.getNamedRanges("mendeley-bibliography");
  // otherwise our initial position is the last container.
  var container = null;
  var containerIndex = null;
  // delete all existing content of named range 
  // (should be zero or one unless some careless copy pasting has happened)
  bibliographyRanges.forEach(function(range) {
    // delete the content - wonder if this will change the indexes of later sections? 
    // in theory this shoudln't matter as we will check those late.
    range.getRange().getRangeElements().forEach(function(rangeElement) {
      // find container that is child of body element for each range in our named range.
      // containerIndex will be the first of these (hopefully only one anyway)
      if (container == null) {
        container = rangeElement.getElement();
        while (container.getParent().getType() != DocumentApp.ElementType.BODY_SECTION) container = container.getParent();
        containerIndex = doc.getBody().getChildIndex(container);
      }
      //not handling partial elements here. 
      //If there is a partial it is not my fault - it must have been edited. It will be deleted
      rangeElement.getElement().removeFromParent();
    });
    range.remove();
  });
  // we have a location for our bibliography in terms of a containerIndex within the document.
  // or containerIndex is null - in whcih case let's append the bibliography at the end
  // create new table at that index
  // create a single row, and single cell
  var citeTable = null;
  if (containerIndex != null) {
    citeTable = doc.getBody().insertTable(containerIndex);
  } else {
    citeTable = doc.getBody().appendTable(); //N.B. This method will also append an empty paragraph after the table, since Google Docs documents cannot end with a table.
  }
  citeTable.setBorderWidth(0);
  var citeCell = citeTable.appendTableRow().appendTableCell();
  citeCell.setPaddingLeft(0).setPaddingRight(0).setPaddingTop(0).setPaddingBottom(0);
  doc.addNamedRange("mendeley-bibliography", doc.newRange().addElement(citeTable).build());
  //?scan document to figure out order of citations in document creating a numeric map of citations
  // use document.getNamedRanges() and filter on range.getName()
  var citeMap = [];
  doc.getNamedRanges()
    //pick out named ranges which are citations
    .filter(function(namedRange) {return (namedRange.getName().indexOf('mendeley-cite-') == 0);})
    .forEach(function(citationRange) {
      var rangeName = citationRange.getName();
      var linkUrl = "";
      var citeElPos = null;
      //delete current citation in text. OMG this is weird.
      citationRange.getRange().getRangeElements().forEach(function(rangeElement) {
        var element = rangeElement.getElement();
        var start = rangeElement.getStartOffset();
        var end = rangeElement.getEndOffsetInclusive();
        if (citeElPos == null) citeElPos = doc.newPosition(element, start);
        if (element.editAsText) {
          linkUrl = element.editAsText().getLinkUrl(start); 
          //this could in theory go wrong if reference has been edited and now has mulitple URLs, 
          //but user can delete if so so OK to fail. linkUrl will be empty and not get further processed
          element.editAsText().deleteText(start,end);
        }
      });
      //identify the references in the URL
      var citesRefs = linkUrl.substring(linkUrl.indexOf('&cite=')+6).split("\|");
      var citeText = "";
      //pick the bibtex from Document storage
      citesRefs.forEach(function(citeRef) {
        // the bibtex for a citation is in the document store.
        // placed there by the citation sidebar when cite button is clicked.
        var bibtex = docProperties.getProperty(citeRef);
        if (citeMap.indexOf(citeRef) == -1) {
          // this citation has not been seen so far. we need to track it.
          citeMap.push(citeRef);
          // we can also take this opportunity to put it in the bibliography/
          // insert the reference into a bibliography as a numbered list item
          // this is where the formatting needs to happen. at the moment it is raw bibtex
          insertBibliographyItem(citeCell, citeRef, citeMap.indexOf(citeRef)+1, bibtex);
          
        }
        // construct the text for the citation in the text. Should be something like [1,2,5-6]
        // but that is too hard for now.
        var index = citeMap.indexOf(citeRef)+1;
        citeText = citeText.length > 0 ? citeText+","+index : ""+index;
        // for latex: citeText = citeText.length > 0 ? ","+citeRef : citeRef;
      });
      //Create the citation with the newly formatted text, add the link, and rename the range so we can find it again
      //this is where different formatting is required.
      var tmpEl = citeElPos.insertText("["+citeText+"]");
      // for latex: var tmpEl = citeElPos.insertText("/cite{"+citeText+"}");
      tmpEl.setLinkUrl(linkUrl);
      tmpEl.setForegroundColor('#404040');
      doc.addNamedRange(rangeName, doc.newRange().addElement(tmpEl).build());
    });
  // retire victorious, covered in glory.
  // could maybe do something with citemap here if needs be.
  // could store citemap and use it when inserting a new reference to create a correctly
  // formatted citation to begin with. 
  // could be using citemap when we insert a reference to add additional items to the bibliography
  // as we go along inserting citations.
}

/*
* Sanitises the output of bibtexParser so that it is less
[{"citationKey":"Caliskan-islam2016SemanticsBiases","entryType":"article","entryTags":{"title":"{Semantics derived automatically from language corpora necessarily contain human biases}","year":"2016","journal":"arXiv:1608.07187v2 [cs.AI] 30 Aug 2016","author":"Caliskan-islam, Aylin and Bryson, Joanna J and Narayanan, Arvind","pages":"1--14","url":"http://science.sciencemag.org/content/sci/356/6334/183.full.pdf http://arxiv.org/pdf/1608.07187v2.pdf","doi":"10.1126/science.aal4230","issn":"0036-8075","arxivId":"1608.07187"}}]
*/
function sanitiseBibtex(bib) {
    var out = []
    var tmpDocs = bibtexToObject(bib);
    //DocumentApp.getUi().alert(JSON.stringify(tmpDocs));
    tmpDocs.forEach(function(tmpDoc) {
      var docCopy = {};
      docCopy.title = tmpDoc.entryTags.title.substring(1,tmpDoc.entryTags.title.length-1) || 'Unknown title';
      docCopy.source = tmpDoc.entryTags.journal || 'Unknown source';
      docCopy.year = tmpDoc.entryTags.year || 'Unknown year';
      docCopy.author = tmpDoc.entryTags.author.substring(0,50)+(tmpDoc.entryTags.author.length>50 ? "..." : "") || 'Unknown author';
      docCopy.citation_key = tmpDoc.citationKey;
      if (tmpDoc.entryTags.url != null) {
        if (tmpDoc.entryTags.url.indexOf(" ") != -1)
          docCopy.url = tmpDoc.entryTags.url.substring(0,tmpDoc.entryTags.url.indexOf(" "));
        else 
          docCopy.url = tmpDoc.entryTags.url;
      }
      out.push(docCopy);
    });
    return out;
}

/*************************************************************************
* Citation sytling and menu options
*************************************************************************/

function citationStylesMenu() {
  return DocumentApp.getUi().createMenu('Insert / update bibliography')
    .addItem('Harvard', 'doCitationStyleHarvard')       
    .addItem('IEEE', 'doCitationStyleIEEE')
    .addItem('Raw latex', 'doCitationStyleLatex');
}

//set the formatting style for the different menus
function doCitationStyleHarvard() { setCitationStyle('HARVARD'); insertOrUpdateBibliography();}
function doCitationStyleIEEE() { setCitationStyle('IEEE'); insertOrUpdateBibliography();}
function doCitationStyleLatex() { setCitationStyle('LATEX'); insertOrUpdateBibliography();}

// actually do something with the formatting etc.
function insertBibliographyItem(citeCell, bibtexId, citationIndex, bibtex) {
  var docProperties = PropertiesService.getDocumentProperties();
  var citationStyle = docProperties.getProperty('CITATION_STYLE');
  var bibjson = sanitiseBibtex(bibtex)[0];
  if (citationStyle == 'LATEX') {
    citeCell.appendParagraph(bibtex);
  } else {
    var listItem = citeCell.appendParagraph("tmp");
    listItem.setText("["+citationIndex+".] ");
    listItem.appendText(bibjson.author+". ");
    listItem.appendText("("+bibjson.year+") ");
    listItem.appendText(bibjson.title+", ").setBold(true);
    listItem.appendText(bibjson.source).setBold(false).setItalic(true);
    if (bibjson.url != null) listItem.appendText(" ").appendText("[link]").setItalic(false).setLinkUrl(bibjson.url);
  }
}
