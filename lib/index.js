'use strict';

var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');

module.exports = function () {

var url = 'http://references.modernisation.gouv.fr/referentiel-technique-0';

var reqOpts = {
    url: url,
    method: "GET",
    headers: {"Cache-Control" : "no-cache"}
    ,proxy: "http://127.0.0.1:8888"
};

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

var rg = {chapters: []};
var rulePattern = /(\d.*\d) (\[.*\]) (.*)/;

request(reqOpts, function (error, response, html) {
  if (!error && response.statusCode == 200) {
    // Charge la page RGAA
    var nbH1=0, $ = cheerio.load(html);

    // Récupère les différents chapitres
    $('h2, h4, h5').each(function(i, element){

      // Si on trouve un h1
      if ($(element)[0].name == 'h2') {
        if (nbH1 == 1) {
          return false;
        }
        nbH1 = nbH1 + 1;
      }
      // Si on vient de trouver un chapitre
      if ($(element)[0].name == 'h4')  {
        rg.chapters.push({"title": $(this).text().trim().slice(4), "rules":[]});
      }

      // Si on vient de trouver une règle
      if ($(element)[0].name == 'h5')  {
        var oneRule = rulePattern.exec($(this).text());
        if (oneRule) {
          var rule = {};
          rule.id = oneRule[1];
          rule.level = oneRule[2];
          rule.text = oneRule[3].trim();
          rule.description = $(element).parent().next().find(".rte").html();
        }

          rg.chapters[rg.chapters.length-1].rules.push(rule);
      }
    });

    // Suppression des chapitres sommaire, mode d'emploi et licence
    rg.chapters = rg.chapters.slice(2);

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
