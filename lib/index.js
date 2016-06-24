'use strict';

var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');

module.exports = function () {

//var url = 'http://references.modernisation.gouv.fr/referentiel-technique-0';
var url = 'http://references.modernisation.gouv.fr/rgaa/criteres.html';

var reqOpts = {
    url: url,
    method: "GET",
    headers: {"Cache-Control" : "no-cache"}
    ,proxy: "http://127.0.0.1:3128"
};

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

var rg = {chapters: []};
var rulePattern = /(\d.*\d) (\[.*\]) (.*)/;
var h3 = 0;

request(reqOpts, function (error, response, html) {
  if (!error && response.statusCode == 200) {
    // Charge la page RGAA
    var nbH1=0, $ = cheerio.load(html);

    // Récupère les différents chapitres
    $('h2, h3').each(function(i, element){

      // Si on vient de trouver un chapitre
      if ($(element)[0].name == 'h2')  {
        rg.chapters.push({"title": $(this).text().trim(), "rules":[]});
      }

      // Si on vient de trouver une règle
      if ($(element)[0].name == 'h3')  {
        h3++;

        if (h3>3) {                   
          var oneRule = rulePattern.exec($(this).text());

          if (oneRule) {
            var rule = {};
            rule.id = oneRule[1];
            rule.level = oneRule[2];
            rule.text = oneRule[3].trim();
            rule.description =  $(element).parent().find("ul").html();

            rg.chapters[rg.chapters.length-1].rules.push(rule);                        
          }          
        }                    
      }
    });

    // Suppression des chapitres sommaire, mode d'emploi et licence
    rg.chapters = rg.chapters.slice(1,-1);

    // Ecriture du fichier JSON
    var outputFilename = './dist/RGAA3.json';

    fs.writeFile(outputFilename, JSON.stringify(rg, null, 4), function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("Règles enregistrées dans " + outputFilename);
        }
    });

  } else {
    console.log(error);
  }
});

};
