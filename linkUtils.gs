/*************************************************************************
* Utility functions
*************************************************************************/

function testGetAllLinks() {
  getAllLinks().forEach(function(link) {Logger.log(link.url)});
}

/**
 * Get an array of all LinkUrls in the document. The function is
 * recursive, and if no element is provided, it will default to
 * the active document's Body element.
 *
 * @param {Element} element The document element to operate on. 
 * .
 * @returns {Array}         Array of objects, vis
 *                              {element,
 *                               startOffset,
 *                               endOffsetInclusive, 
 *                               url}
 */
function getAllLinks() {
  var links = [];
  var body = DocumentApp.getActiveDocument().getBody();
  var rangeElement = body.findElement(DocumentApp.ElementType.TEXT);
  while (rangeElement != null) {
    links = links.concat(getLinks(rangeElement.getElement()));
    rangeElement = body.findElement(DocumentApp.ElementType.TEXT, rangeElement);
  }
  return links;
}

/**
* Scans the text for the position of links relative to 
* the text element.
*/
function getLinks(element) {
  var result = [];
  var out = {};
  var docLength = element.getText().length;
  out.element = element;
  out.start = null;
  out.endInclusive = null;
  out.url = null;
  var pos = 0;
  var positions = element.getTextAttributeIndices();
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
          pos += 1;
        } else {
          //there are two urls touching each other
          //we need to finish the last one, and start another
          out.endInclusive=pos-1;
          result.push(out);
          out = {};
          out.start = pos;
          out.url = tmp;
          out.endInclusive = null;
          pos += 1;
        }
      } else {
        //it is the same url as previously found
        //continue in the main loop as we haven't found the end yet
        pos += 1;
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
        pos += 1;
      } else {
        //we are nowhere near a URL.
        //skip to the next time the text changes nature
        var tmpInt = 0;
        while (tmpInt <= pos) {
          tmpInt = positions.shift();
          if (tmpInt == undefined) tmpInt = docLength;
        };
        pos = tmpInt;
      }
    }
  }
  if (out.url != null) {
    // the element ends with a link.
    out.endInclusive = docLength-1;
    result.push(out);
  }
  return result;
}
