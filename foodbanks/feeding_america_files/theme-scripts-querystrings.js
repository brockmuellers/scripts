// This function gives you the value of the various querystrings as an array
function getUrlVars() {
  var vars = [], hash;
  var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
  for(var i = 0; i < hashes.length; i++) {
    hash = hashes[i].split('='); vars.push(hash[0]); vars[hash[0]] = hash[1];
  }
  return vars;
}

// Setting the necesary variables for later reuse (here, and also in the alterPost)
marketSourceValue = "";
keywordValue = "";
onsitePromoValue = "";
variationValue = "";
visitIdValue = "";
memberIdValue = "";
isFoodBankVisitor = "";
referrerValue = "";
sourceCodeValue = "";

// General logic for these querystring cookies: First, check and see if a cookie is set. If it is, great! We're done. If it's not, try and set it based on a querystring. Either way, make it available to the alterPost for later consumption

// Marketsource Logic
var hasMarketSource = Cookies.get("faHasMarketSource"); // Retrieve the value of the faHasMarketSource cookie, if it exists  
if (hasMarketSource == undefined || hasMarketSource == null) { // if it's not set from the cookie
  var urlMarketSource = getUrlVars()["ms"]; var urlOldMarketSource = getUrlVars()["s_subsrc"]; // create variables for the relevant values from the querystring
  if (urlMarketSource || urlOldMarketSource) { // Check to see if either querystring has a value
	if (urlMarketSource) { marketSourceValue = urlMarketSource; } // If there's a value for the ms querystring, set the marketSourceValue variable to that value
    else { marketSourceValue = urlOldMarketSource; } // otherwise, there's a value for the s_subsrc querystring, so set the marketSourceValue variable to that value instead
    console.log("marketsource value:", marketSourceValue);
    Cookies.set("faHasMarketSource", marketSourceValue, {domain:".feedingamerica.org"}); // and set a session cookie for faHasMarketSource with the querystring's value	    
  } else { console.log("No marketsource set"); } // If there's nothing matching in the querystring, there's no marketsource, so we're done here
} else { marketSourceValue = hasMarketSource; console.log("marketsource value:", marketSourceValue); } // otherwise the cookie is set, so set the marketSourceValue variable to the value of the cookie

// Keyword Logic
var hasKeyword = Cookies.get("faHasKeyword"); // Retrieve the value of the faHasKeyword cookie, if it exists  
if (hasKeyword == undefined || hasKeyword == null) { // if it's not set from the cookie
  var urlKeyword = getUrlVars()["oa_keyword"]; // create a variable for the relevant value from the querystring
  if (urlKeyword) { // If there's a value for the oa_keyword querystring, use that
    keywordValue = urlKeyword; // and set the keywordValue variable to the value of the querystring
    console.log("keyword value:", keywordValue);
    Cookies.set("faHasKeyword", keywordValue, {domain:".feedingamerica.org"}); // and set a session cookie for faHasKeyword with the querystring's value
  } else { console.log("No keyword set"); } // If there's nothing matching in the querystring, there's no keyword, so we're done here
} else { keywordValue = hasKeyword; console.log("keyword value:", keywordValue); } // otherwise the cookie is set, so set the keywordValue variable to the value of the cookie

// Onsite Promo Logic
var hasOnsitePromo = Cookies.get("faHasOnsitePromo"); // Retrieve the value of the faHasOnsitePromo cookie, if it exists  
if (hasOnsitePromo == undefined || hasOnsitePromo == null) { // if it's not set from the cookie
  var urlOnsitePromo = getUrlVars()["oa_onsite_promo"]; // create a variable for the relevant value from the querystring
  if (urlOnsitePromo) { // If there's a value for the oa_onsite_promo querystring, use that
    onsitePromoValue = urlOnsitePromo; // and set the onsitePromoValue variable to the value of the querystring
    console.log("onsite promo value:", onsitePromoValue);
    Cookies.set("faHasOnsitePromo", onsitePromoValue, {domain:".feedingamerica.org"}); // and set a session cookie for faHasOnsitePromo with the querystring's value
  } else { console.log("No onsite promo set"); } // If there's nothing matching in the querystring, there's no onsite promo, so we're done here
} else { onsitePromoValue = hasOnsitePromo; console.log("onsite promo value:", onsitePromoValue); } // if the cookie is set, then set the onsitePromoValue variable to the value of the cookie

// Variation Logic
var hasVariation = Cookies.get("faHasVariation"); // Retrieve the value of the faHasVariation cookie, if it exists
if (hasVariation == undefined || hasVariation == null) { // if it's not set from the cookie
  var urlVariation = getUrlVars()["oa_variation"]; // create a variable for the relevant value from the querystring
  if (urlVariation) { // If there's a value for the oa_variation querystring, use that
    variationValue = urlVariation; // and set the variationValue variable to the value of the querystring
    console.log("variation value:", variationValue);
    Cookies.set("faHasVariation", variationValue, {domain:".feedingamerica.org"}); // and set a session cookie for faHasVariation with the querystring's value
  } else { console.log("No variation set"); } // If there's nothing matching in the querystring, there's no onsite promo, so we're done here
} else { variationValue = hasVariation; console.log("variation value:", variationValue); } // if the cookie is set, then set the variationValue variable to the value of the cookie

// Visit ID Logic
var hasVisitId = Cookies.get("faHasVisitId"); // Retrieve the value of the faHasVisitId cookie, if it exists  
if (hasVisitId == undefined || hasVisitId == null) { // if it's not set from the cookie
  var urlVisitId = getUrlVars()["oa_visit_id"]; // create a variable for the relevant value from the querystring
  if (urlVisitId) { // If there's a value for the oa_visit_id querystring, use that
    visitIdValue = urlVisitId; // and set the visitIdValue variable to the value of the querystring
    console.log("visit id value:", visitIdValue);
    Cookies.set("faHasVisitId", visitIdValue, {domain:".feedingamerica.org"}); // and set a session cookie for faHasVisitId with the querystring's value
  } else { console.log("No visit id set"); } // If there's nothing matching in the querystring, there's no visit id, so we're done here
} else { visitIdValue = hasVisitId; console.log("visit id value:", visitIdValue); } // if the cookie is set, then set the visitIdValue variable to the value of the cookie

// Member ID Logic
var hasMemberId = Cookies.get("faHasMemberId"); // Retrieve the value of the faHasMemberId cookie, if it exists  
if (hasMemberId == undefined || hasMemberId == null) { // if it's not set from the cookie
  var urlMemberId = getUrlVars()["oa_member_id"]; // create a variable for the relevant value from the querystring
  if (urlMemberId) { // If there's a value for the oa_member_id querystring, use that
    memberIdValue = urlMemberId; // and set the memberIdValue variable to the value of the querystring
    console.log("member id value:", memberIdValue);
    Cookies.set("faHasMemberId", memberIdValue, {domain:".feedingamerica.org"}); // and set a session cookie for faHasMemberId with the querystring's value
  } else { console.log("No member id set"); } // If there's nothing matching in the querystring, there's no member id, so we're done here
} else { memberIdValue = hasMemberId; console.log("member id value:", memberIdValue); } // if the cookie is set, then set the memberIdValue variable to the value of the cookie

// Food Bank Logic
var isFoodBankVisitor = Cookies.get("faIsFoodBankVisitor"); // Retrieve the value of the faIsFoodBankVisitor cookie, if it exists
var urlSource = getUrlVars()["source"]; var urlOldFoodbankSource = getUrlVars()["s_foodbank"]; var urlOldestFoodbankSource = getUrlVars()["s_src"]; // run the getUrlVars function and look for source, s_foodbank and _src querystrings
if (isFoodBankVisitor == "true") { // If that cookie is set to true, they're already a Food Bank visitor and we don't need to run that logic
  isFoodBankVisitor = "true"; // and also set this variable, which we'll use for any front-end Food Bank manipulations
  console.log("Food bank visitor");
} else if (urlSource || urlOldFoodbankSource || urlOldestFoodbankSource) { // but if's not set to true, we need to see if the querystrings actually imply they're a Food Bank visitor. So if any of the three is set
  if (urlSource == "foodbank" || urlOldFoodbankSource == "true" || urlOldestFoodbankSource == "foodbank") { // and the values are correct for any of the three
    Cookies.set("faIsFoodBankVisitor", "true", { expires:3650, domain:".feedingamerica.org"}); // set the faIsFoodBankVisitor cookie to true, and have it expire in 10 years
    isFoodBankVisitor = "true"; // and also set this variable, which we'll use for any front-end Food Bank manipulations
    console.log("Food bank visitor");
  } else { console.log("Not a food bank visitor"); } // If neither have the values we want, don't do anything
} else { console.log("Not a food bank visitor"); } // and if neither are set, also nothing - there are no foodbank querystrings, so it's not a Food Bank user 

// Referrer Logic
var hasReferrer = Cookies.get("faHasReferrer"); // Retrieve the value of the faHasReferrer cookie, if it exists 
if (hasReferrer == undefined || hasReferrer == null) { // if the referrer isn't set from the cookie
  var referrerDetails = document.referrer; // looks for the details of the referrer
  if(!document.referrer) { // If there's no referrer
    referrerSourceCodePiece = "DIRCT"; // Store "DIRCT" as the value for the referrer piece of the constructed source code
    console.log("No referrer set. Referrer Source Code Piece is", referrerSourceCodePiece);
  } else { // but if there is one
    referrerValue = referrerDetails; // set the referrerValue to the value of the referrer
    if (referrerDetails.match(/google\.com/)) { // if Google is the referrer
      referrerValue = "google"; // set the referrerValue to google
      referrerSourceCodePiece = "ORGSC"; // and store "ORGSC" as the value for the referrer piece of the source code
    } else if (referrerDetails.match(/bing\.com/)) { // or if Bing is the referrer
      referrerValue = "bing"; // set the referrerValue to google
      referrerSourceCodePiece = "ORGSC"; // and store "OGSRC" here too
    } else if (referrerDetails.match(/search\.yahoo.*/)) { // or if Yahoo is the referrer
      referrerValue = "yahoo"; // set the referrerValue to yahoo
      referrerSourceCodePiece = "ORGSC"; // and store "OGSRC" here too
    } else if (referrerDetails.match(/duckduckgo\.com/)) { // or if DuckDuckGo is the referrer
      referrerValue = "duckduckgo"; // set the referrerValue to duckduckgo
      referrerSourceCodePiece = "ORGSC"; // and store "OGSRC" here too
    } else { referrerSourceCodePiece = "REFER"; } // If none of those is the referrer, store "REFER" as the value for the referrer piece of the source code
    Cookies.set("faHasReferrer", referrerValue, {domain:".feedingamerica.org"}); // and set a session cookie for faHasReferrer with the value of the referrer
    console.log("Referrer is", referrerValue);
    console.log("Referrer Source Code Piece is", referrerSourceCodePiece);
  }
} else { referrerValue = hasReferrer; console.log("Referrer is ", referrerValue); } // if the cookie is set, then set the referrerValue variable to the value of the cookie

// Source Code Creation Logic
var currentDate = new Date(); // this section constructs the date part of the Source Code using the longstanding FA pattern
var dateSourceCode = "W" + currentDate.getFullYear().toString().substr(2,3);
var dateSourceCodeMonth = parseInt(currentDate.getMonth()+1, 10);
switch(dateSourceCodeMonth) {
  case 10: dateSourceCodeMonth = "A"; break;
  case 11: dateSourceCodeMonth = "B"; break;
  case 12: dateSourceCodeMonth = "C"; break;
}
dateSourceCode = dateSourceCode + dateSourceCodeMonth;
foodBankSourceCode = dateSourceCode + "XFBNK";
var urlOldSource = getUrlVars()["s_src"]; // run the getUrlVars function and look for the s_src querystring (since we already grabbed the source one in the Food Bank logic above)
if (urlSource == "foodbank" || urlOldFoodbankSource == "true" || urlOldestFoodbankSource == "foodbank") { // if the querystring values are foodbank values
  sourceCodeValue = foodBankSourceCode; // set the Source Code to the Food Bank Source Code
  Cookies.set("faHasSourceCode", sourceCodeValue, {domain:".feedingamerica.org"}); // and set a session cookie for faHasSourceCode with the Food Bank Source Code
  console.log("Source Code value:", sourceCodeValue);
} else if (urlSource || urlOldSource) { // Otherwise, if either the source or s_src querystring are set
  if (urlSource) { // and it's the source querystring
    sourceCodeValue = urlSource; // set the sourceCodeValue variable to the value of the source querystring
  } else { // otherwise it's the s_src querystring that's set 
    sourceCodeValue = urlOldSource; // so set the sourceCodeValue variable to that value instead
  }
  Cookies.set("faHasSourceCode", sourceCodeValue, {domain:".feedingamerica.org"}); // and set a session cookie for faHasSourceCode with the value of that querystring
  console.log("Source Code value:", sourceCodeValue);
} else { // but if there's no querystring source
  var hasSourceCode = Cookies.get("faHasSourceCode"); // Retrieve the value of the faHasSourceCode cookie, if it exists  
  if (hasSourceCode == undefined || hasSourceCode == null) { // if it's not set from the cookie either, then we need to create it from the details we have.
    sourceCodeValue = dateSourceCode + referrerSourceCodePiece; // so join the date piece and the referrer piece
    Cookies.set("faHasSourceCode", sourceCodeValue, {domain:".feedingamerica.org"}); // and set a session cookie for faHasSourceCode with this constructed Source Code
    console.log("Source Code value:", sourceCodeValue);
  } else { // if the cookie is set, we just grab that same Source Code and make it available to the submission
    sourceCodeValue = hasSourceCode;
    console.log("Source Code value:", sourceCodeValue);
  }
}


/* AlterPost */

var postUpdate = function (values) {
  (function ($) {

    // This is where we pass in the Source, Marketsource and the necessary HMFs
    var postData = values.data; // Make variable of the posted data
    console.log("Post data: ", postData)
    values.data.SourceCodeName = sourceCodeValue; // set the Source Code to the value created above
    values.data.MarketSource = marketSourceValue; // Set the value of the marketsource to the value on the stored faHasMarketSource cookie, if it exists
    values.data.oa_browser = navigator.userAgent; // Set the value of the browser details HMF to the value of the userAgent string
    values.data.oa_keyword = keywordValue; // Set the value of the keyword HMF to the value on the stored faHasKeyword cookie, if it exists
    values.data.oa_onsite_promo = onsitePromoValue; // Set the value of the onsite promo HMF to the value on the stored faHasOnsitePromo cookie, if it exists
    values.data.oa_variation = variationValue; // Set the value of the variation HMF to the value on the stored faHasVariation cookie, if it exists
    values.data.oa_visit_id = visitIdValue; // Set the value of the visit id HMF to the value on the stored faHasVistId cookie, if it exists
    values.data.oa_member_id = memberIdValue; // Set the value of the member id HMF to the value on the stored faHasMemberId cookie, if it exists   
    values.data.oa_referrer = referrerValue; // Set the value of the referrer HMF to the value created above, in the Referrer Logic section

  }(jQuery));
  return values;
};

var nvtag_callbacks = nvtag_callbacks || {};
nvtag_callbacks.alterPost = nvtag_callbacks.alterPost || [];
nvtag_callbacks.alterPost.push(postUpdate);