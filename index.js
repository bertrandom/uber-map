var request = require('request');
var chrome = require('chrome-cookies-secure');
var cheerio = require('cheerio');
var moment = require('moment');
var GeoJSON = require('geojson');
var async = require('async');
var spinner = require("char-spinner");

var libUrl = require('url');

var targetYear = 2014;

var getPage = function(jar, trips, page, callback) {

    var url = 'https://riders.uber.com/trips';

    if (typeof trips === 'function') {
        callback = trips;
        trips = [];
    } else {
        url += '?page=' + page;
    }

    request({url: url, followRedirect: false, jar: jar}, function (err, response, body) {

        if (response.statusCode === 302) {
            callback(new Error('Not logged in.'));
        }

        var $ = cheerio.load(body);

        var yearFinished = false;

        $('#trips-table tbody').find('tr.trip-expand__origin').each(function(index, el) {

            var className = $(el).attr('data-target');

            var tds = $(el).find('td');

            var div = $(tds[3]).find('div').first();
            if (div) {

                if (div.text() === 'Canceled') {
                    return;
                }

            }

            var rawDate = $(tds[1]).text();

            if (rawDate) {

                var tripDate = moment(rawDate, 'MM/DD/YY');

                var tripYear = tripDate.year();

                if (tripDate.year() === targetYear) {

                    var matches = className.match(/#trip-(.*)/);
                    if (matches) {
//                      console.log(tripDate.format('YYYY-MM-DD') + ' ' + matches[1]);
                        trips.push(matches[1]);
                    }

                } else if (tripYear < targetYear) {
                    yearFinished = true;
                }

            }

        });

        var nextPageHref = $('#trips-pagination a.pagination__next').attr('href');

        if (nextPageHref && !yearFinished) {

            var matches = nextPageHref.match(/\?page=([0-9]+)/);
            if (matches) {
                getPage(jar, trips, matches[1], callback);
            }

        } else {

            callback(null, trips);

        }

    });

};

var getPath = function(jar, tripId, callback) {

    var url = 'https://riders.uber.com/trips/map/' + tripId;

    request({url: url, jar: jar}, function (err, response, body) {

        var $ = cheerio.load(body);

        var image = $('img').first();

        if (image) {

            var imageUrl = $(image).attr('src');
            
            var parsedUrl = libUrl.parse(imageUrl, true);

            var path = parsedUrl.query.path;

            if (!path) {
                callback(null, {
                    tripId: tripId,
                    coords: []
                });
                return;
            }

            var splitPath = path.split('|');

            var rawCoords = splitPath.slice(2);

            var coords = [];
            rawCoords.forEach(function(rawCoord) {

                var splitRawCoord = rawCoord.split(',');
                coords.push([parseFloat(splitRawCoord[1]), parseFloat(splitRawCoord[0])]);

            });

            callback(null, {
                tripId: tripId,
                coords: coords
            });

        }

    });

};

var interval = spinner();

chrome.getCookies('https://riders.uber.com/trips', 'jar', function(err, jar) {  

    getPage(jar, function(err, tripIds) {

        if (err) {
            console.error('Please log into Uber in Chrome, wait a few seconds, and try again. https://riders.uber.com');
            process.exit();
        }

        var tasks = [];
        tripIds.forEach(function(tripId) {
            tasks.push(function(callback) {
                getPath(jar, tripId, callback);
            });
        });

        async.parallel(tasks, function(err, results) {

            var gj = GeoJSON.parse(results, {LineString: 'coords'});

            clearInterval(interval);
            console.log(JSON.stringify(gj));

        });

    });

});