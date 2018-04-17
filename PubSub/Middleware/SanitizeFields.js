const _     = require('lodash/core'),
      lurl  = require('lurl');

function FormatStrings(data) {

  return LoopData(data, (str) => {

    // strip tags
    str = str.replace(/(<([^>]+)>)/ig, '');

    // strip off the closing tag at the begining of the string
    str = str.replace(/^["|']\s?([a-z='"]+)?\s?\/?\s?>\s?/ig, '');

    // smart single quotes and apostrophe
    str = str.replace(/[\u2018\u2019\u201A]/g, '\'');

    // smart double quotes
    str = str.replace(/[\u201C\u201D\u201E]/g, '"');

    // ellipsis
    str = str.replace(/\u2026/g, '...');

    // dashes
    str = str.replace(/[\u2013\u2014]/g, '-');

    // circumflex
    str = str.replace(/\u02C6/g, '^');

    // open angle bracket
    str = str.replace(/\u2039/g, '<');

    // close angle bracket
    str = str.replace(/\u203A/g, '>');

    // spaces
    str = str.replace(/[\u02DC\u00A0]/g, ' ');

    str = htmlspecialchars_encode(htmlspecialchars_decode(str));

    return str;

  });

}

// loop through an object or an array to find each string
// if the value is an object then we will call this function
// again and parse that data, otherwise if the value is a
// string then we will pass that value through the user
// supplied function and store that value in it's original
// key, once we have processed all the data we pass back
// the entire object just with updated values
function LoopData(data, func) {

  if (!_.isObject(data) && !_.isArray(data)) {

    return data;

  }

  // loopity loop
  for (let d in data) {

    // is this an object? loop that too
    if (_.isObject(data[d]) || _.isArray(data[d])) {

      data[d] = LoopData(data[d], func);

    }

    // otherwise is it a string?
    else if(_.isString(data[d])) {

      let ob;

      // is this json?
      try {

        ob = JSON.parse(data[d]);

      }

      catch(e) {

        ob = data[d];

      }

      // we can go through the json and encode the params
      if (_.isObject(ob)) {

        data[d] = JSON.stringify(LoopData(ob, func));

      }

      // just a plain old string not a url etc, carry on
      else if(!SkipString(data[d])) {

        // run the supplied function on the data
        data[d] = func(data[d]);

      }

    }

  }

  return data;

}

function SkipString(str) {

  if (!_.isString(str) || _.isEmpty(str)) {

    return true;

  }

  if (lurl(str)) {

    return true;

  }

  if (str.match(/www.youtube.com\/embed\/([a-z0-9-_]+)/gi)) {

    return true;

  }

  // html encoded str
  if (str.match(/^&[a-z]+;$/i)) {

    return true;

  }

  return false;

}

function htmlspecialchars_encode(val) {

  if (!_.isString(val)) {

    return val;

  }

  return val
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

}

function htmlspecialchars_decode(val) {

  if (!_.isString(val)) {

    return val;

  }

  return val
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>');

}

async function Sanitize(route, req) {

  if (!_.isObject(req.queryParams) || _.isEmpty(req.queryParams)) {

    return [null, req];

  }

  Object.entries(req.queryParams).forEach(([key, val]) => {

    req.queryParams[key] = FormatStrings(val);
    return;

  });

  return [null, req];

}

module.exports = Sanitize;