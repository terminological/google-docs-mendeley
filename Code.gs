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

// SCRIPT_ID = "1zmauW4WzNKGfjokSMgm6M_669Hnna5of_l-pfN0LDBPQc5u2XszXXRAZ"
// Mendeley redirect url = "https://script.google.com/macros/d/1zmauW4WzNKGfjokSMgm6M_669Hnna5of_l-pfN0LDBPQc5u2XszXXRAZ/usercallback"
// App secret is: nhyXkPKiFwaSpVLD

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
      .addItem('Open library', 'openLibrary')
      .addSeparator()
      .addItem('Update / Insert bibliography', 'doCitationStyleHarvard')
      // .addSeparator()
      // .addItem('Update / Insert bibliography', 'doCitationStyleHarvard')
      .addToUi();
}

/** 
* polyfill string.startsWith
*/
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
  };
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



function openLibrary() {
  mendeleyLogin();
  var docProperties = PropertiesService.getDocumentProperties();
  var linkedFolder = docProperties.getProperty('LINKED_FOLDER');
  var mendeleyService = getMendeleyService();
  var template = HtmlService.createTemplateFromFile("citationsSidebar.html");
  template.token = mendeleyService.getAccessToken();
  template.linkedFolder = linkedFolder || 'null';
  var page = template.evaluate();
  page.setSandboxMode(HtmlService.SandboxMode.IFRAME).setTitle('Citation library').setWidth(400);
  DocumentApp.getUi().showSidebar(page);
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
  docProperties.setProperty('LINKED_FOLDER', linkedFolder);
}

/**
* Called when:
* LINKED_FOLDER is not set and a folder is selected in the sidebar UI to be linked
* inputs: 
* linkedFolder - a mendeleyId for a linked folder.
*/
function unlinkDocument() {
  var docProperties = PropertiesService.getDocumentProperties();
  docProperties.deleteProperty('LINKED_FOLDER');
}

/**
* Any time a new bibtex document is downloaded we need to store a key to it so that if 
* we lose the context (e.g. after a copy and paste) we can find the reference again
*/
function storeCitationKeyMendeleyId(citationKey, mendeleyId) {
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('mendeley-'+citationKey,mendeleyId);
}


/**
* Any time a new bibtex document is downloaded we need to store a key to it so that if 
* we lose the context (e.g. after a copy and paste) we can find the reference again
*/
function getBibtexFromCitationKey(citationKey) {
    var userProperties = PropertiesService.getUserProperties();
    var docProperties = PropertiesService.getDocumentProperties();
    if (docProperties.getProperty(citationKey) != null) { 
        return docProperties.getProperty(citationKey);
    } else {
        var mendeleyId = userProperties.getProperty('mendeley-'+citationKey);
      if (mendeleyId == null) return "@article{"+citationKey+",\n\ttitle={"+citationKey+" not found in library}\n}";
        var mendeleyService = getMendeleyService();
        var response = UrlFetchApp.fetch("https://api.mendeley.com/documents/"+mendeleyId+"?view=bib", {
          muteHttpExceptions: true,
          headers: {
            'Authorization': 'Bearer ' + mendeleyService.getAccessToken(),
            'Accept': 'application/x-bibtex'
          }});
if (response.getResponseCode() != 200) return "@article{"+citationKey+",\n\ttitle={"+citationKey+" not found in library}\n}";
       docProperties.setProperty(citationKey,response.getContentText());
       return response.getContentText();
  }    
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
  var properties = PropertiesService.getScriptProperties();
  var clientName = properties.getProperty('client_name');
  // Process the user's response.
  if (response == ui.Button.YES) {
    OAuth2.createService(clientName)
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
  var properties = PropertiesService.getScriptProperties();
  var clientId = properties.getProperty('client_id');
  var clientSecret = properties.getProperty('client_secret');
  var clientName = properties.getProperty('client_name');
  return OAuth2.createService(""+clientName)
      .setAuthorizationBaseUrl('https://api.mendeley.com/oauth/authorize')
      .setTokenUrl('https://api.mendeley.com/oauth/token')
      .setClientId(""+clientId)
      .setClientSecret(""+clientSecret)
      .setCallbackFunction('authCallback')
      .setPropertyStore(PropertiesService.getUserProperties())
      .setScope('all');
}

function authCallback(request) {
  var mendeleyService = getMendeleyService();
  var isAuthorized = mendeleyService.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('<html><head><link rel="stylesheet" href="https://ssl.gstatic.com/docs/script/css/add-ons1.css"></head><body><p>Success! Close this window to continue</p><!--<script type="text/javascript">google.script.host.close();</script>--></body></html>');
  } else {
    return HtmlService.createHtmlOutput('<html><head><link rel="stylesheet" href="https://ssl.gstatic.com/docs/script/css/add-ons1.css"></head><body><p>Mendeley authorisation failed - '+mendeleyService.getLastError()+'.</p></body></html>');
  }
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
    //TODO: remove citation index. Adopt getLinks function
  var docProperties = PropertiesService.getDocumentProperties();
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
    // tidy up and move cursor to end of the inserted citation
    insertSpaceMaybe(doc.getCursor());
    doc.setCursor(doc.newPosition(newEl,newEl.getText().length));
    newEl.setForegroundColor('#404040');
  } else {
    //insert new reference with a unique citation index
    var textEl = doc.getCursor().insertText("[1 ref]");
    textEl.setLinkUrl("http://bibtex?cite="+bibtexKey);
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
  // find somewhere to stick bibliography
  // if it has been run before there should be a bookmark in a table.

  var docProperties = PropertiesService.getDocumentProperties();
  var citeTable = null;
  var citeCell = null;

  var tmpLinks = getLinks();
  var biblioLink = null;
  for (var i=0; i<tmpLinks.length; i++) {
    if (tmpLinks[i].url.startsWith('#mendeley-')) {
      biblioLink = tmpLinks[i];
      break;
    }
  }
  
  if (biblioLink != null) {
    var biblioPosition = DocumentApp.getActiveDocument().newPosition(DocumentApp.getActiveDocument().getBody().editAsText(), biblioLink.start);
    citeTable = biblioPosition.getElement();
    while (citeTable != null && citeTable.getType() !== DocumentApp.ElementType.TABLE) citeTable = citeTable.getParent();
    citeTable.clear();
  } else {
    //no bibliography table was found. create a new one at the end of the document
    citeTable = DocumentApp.getActiveDocument().getBody().appendTable();
    citeTable.setBorderWidth(0);
  }
  
  citeCell = citeTable.appendTableRow().appendTableCell();
  citeCell.setPaddingLeft(0).setPaddingRight(0).setPaddingTop(0).setPaddingBottom(0);
  
  //?scan document to figure out order of citations in document creating a numeric map of citations
  // use document.getNamedRanges() and filter on range.getName()
  var citeMap = [];
  var insOffset = 0;
  getLinks().forEach(function(link) {
      var linkUrl = link.url;
      if (linkUrl.startsWith('http://bibtex?')) {
        //identify the references in the URL
        var citesRefs = linkUrl.substring(linkUrl.indexOf('cite=')+5).split("\|");
        var citeText = "";
        //pick the bibtex from Document storage
        citesRefs.forEach(function(citeRef) {
          // the bibtex for a citation is in the document store.
          // placed there by the citation sidebar when cite button is clicked.
          // if that doesn;t exist it will look up the mapping
          if (citeMap.indexOf(citeRef) == -1) {
            // this citation has not been seen so far. we need to track it.
            citeMap.push(citeRef);
          }
          
          // construct the text for the citation in the text. Should be something like [1,2,5-6]
          // but that is too hard for now.
          var index = citeMap.indexOf(citeRef)+1;
          //TODO: get this list of indexes sorted ascending etc.
          citeText = citeText.length > 0 ? citeText+","+index : ""+index;
          //TODO: for latex: citeText = citeText.length > 0 ? ","+citeRef : citeRef;
          
        });
        
        //delete current citation in text and add new one.
        var text = DocumentApp.getActiveDocument().getBody().editAsText();
        var start = link.start+insOffset;
        var end = link.endInclusive+insOffset;
        citeText = "["+citeText+"]";
        text.insertText(end+1,citeText);
        text.setLinkUrl(end+1,end+citeText.length,linkUrl);
        text.setForegroundColor(end+1,end+citeText.length,'#404040');
        text.deleteText(start,end);
        //track difference in lengths as this will affect where subsequent links start
        insOffset = insOffset + citeText.length-(end+1-start);
      }
  });
  
  citeMap.forEach(function(citeRef) {
    var index = citeMap.indexOf(citeRef)+1;
    var bibtex = getBibtexFromCitationKey(citeRef);
    insertBibliographyItem(citeCell, citeRef, index, bibtex);
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
      docCopy.title = stripBraces(tmpDoc.entryTags.title || 'Unknown title');
      docCopy.source = stripBraces(tmpDoc.entryTags.journal || 'Unknown source');
      docCopy.year = stripBraces(tmpDoc.entryTags.year || 'Unknown year');
      if (tmpDoc.entryTags.author != null) {
        docCopy.author = stripBraces(tmpDoc.entryTags.author.substring(0,50)+(tmpDoc.entryTags.author.length>50 ? "..." : ""));
      } else {
        docCopy.author =  'Unknown author';
      }
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

function stripBraces(str) {
  if (str == null) return null;
  return str.replace("{","").replace("}","").replace("\\&","&");
}

/*************************************************************************
* Utility functions
*************************************************************************/

function testGetLinks() {
  getLinks().forEach(function(tmp) {
    Logger.log(tmp.url+","+tmp.start+","+tmp.endInclusive);
  });
}


/**
* Scans the document using Body.editAsText for the position of links relative to 
* the body element.
*/
function getLinks() {
  var result = [];
  var out = {};
  var element = DocumentApp.getActiveDocument().getBody().editAsText();
  var docLength = element.getText().length;
  out.start = null;
  out.endInclusive = null;
  out.url = null;
  var pos = 0;
  while (pos < docLength) {
    //move on a character
    var tmp = element.getLinkUrl(pos);
    if (tmp != null) {
      // we have found a url
      if (tmp != out.url) {
        //it is a different URL
        if (out.url == null) {
          //it is a new url
          //set the start point
          out.start = pos;
          out.url = tmp;
        } else {
          //there are two urls touching each other
          //we need to finish the last one, and start another
          out.endInclusive=pos-1;
          result.push(out);
          out = {};
          out.start = pos;
          out.url = tmp;
          out.endInclusive = null;
        }
      } else {
        //it is the same url as previously found
        //continue in the main loop as we haven't found the end yet
      }
    } else {
      //we have not found a url
      if (out.url != null) {
        //we have run off the end of a url
        //we must finish the last one and clear the start point
        out.endInclusive = pos-1;
        result.push(out);
        out = {};
        out.start = null;
        out.url = null;
        out.endInclusive = null;
      } else {
        //we are nowhere near a URL.
        //continue in the main loop until we find a url.
      }
    }
    pos += 1;
  }
  if (out.url != null) {
    // the document ends with a link.
    out.endInclusive = docLength;
    result.push(out);
  }
  return result;
}

/*************************************************************************
* Citation sytling and menu options
*************************************************************************/

/*function citationStylesMenu() {
  return DocumentApp.getUi().createMenu('Insert bibliography')
    .addItem('Formatted', 'doCitationStyleHarvard')       
    //.addItem('IEEE', 'doCitationStyleIEEE')
    .addItem('Latex', 'doCitationStyleLatex');
}*/

//set the formatting style for the different menus
function doCitationStyleHarvard() { setCitationStyle('HARVARD'); insertOrUpdateBibliography();}
// function doCitationStyleIEEE() { setCitationStyle('IEEE'); insertOrUpdateBibliography();}
// function doCitationStyleLatex() { setCitationStyle('LATEX'); insertOrUpdateBibliography();}

// actually do something with the formatting etc.
function insertBibliographyItem(citeCell, bibtexId, citationIndex, bibtex) {
  var docProperties = PropertiesService.getDocumentProperties();
  var userProperties = PropertiesService.getUserProperties();
  var mendeleyId = userProperties.getProperty('mendeley-'+bibtexId);
  var bibjson = sanitiseBibtex(bibtex)[0];
  var listItem = citeCell.appendParagraph("");
  listItem.appendText("["+citationIndex+".] ").setLinkUrl('#mendeley-'+mendeleyId).setUnderline(false).setForegroundColor('#000000');
  listItem.appendText(bibjson.author+". ");
  listItem.appendText("("+bibjson.year+") ");
  listItem.appendText(bibjson.title+", ").setBold(true);
  listItem.appendText(bibjson.source).setBold(false).setItalic(true);
  if (bibjson.url != null) {
    listItem.appendText(" ");
    listItem.appendText("[link]").setItalic(false).setLinkUrl(bibjson.url);
  }
}

