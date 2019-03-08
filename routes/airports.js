var express = require('express');
var router = express.Router();
var Amadeus = require('amadeus');

router.get('/', function(req, res, next) {
    const searchKeyword = req.query.searchKeyword;
        var amadeus = new Amadeus({
          clientId: process.env.REACT_APP_NEW_AIRPORT_API_KEY,
          clientSecret: process.env.REACT_APP_NEW_AIRPORT_API_SECRET,
            hostname: 'production',
            host: "api.amadeus.com"
        });
        amadeus.referenceData.locations.get({
            keyword : searchKeyword,
            subType : 'AIRPORT'
        }).then(function(response){
            siteList = response.data;
            res.json({
                siteList: siteList
                });  
        }).catch(function(error){
            console.log(error.code);
        });
    });

module.exports = router;