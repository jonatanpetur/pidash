$ = require('jquery');
//var yrno = require('yr.no-forecast');
var request = require('request');

var config = {
    "widgets": {
        "vasttrafik": {
            "updateInterval": 3000,
            "apiSecret": "d2J1Q184cXQzSlJxWGVnanhCSzBRenVuUmZnYTpwZnNMWkJab0dCNkNYSERqRGJ2enB2cFowVDhh",
            "apiTokenUrl": "https://api.vasttrafik.se:443/token",
            "apiBaseUrl": "https://api.vasttrafik.se/bin/rest.exe/v2",
            "stopId": "9021014007370000"
        },
        "weather": {
            "updateInterval": 3000,
            "latitude": 57.70716,
            "longtitude": 11.96679
        }
    }
};

var state = {
    "widgets" : {
        "vasttrafik": {
            "apiToken"   : undefined,
            "apiTokenTTL": undefined,
            "departures" : []
        }
    }
}

$(function(){
    var iconCssClasses = {
        "Sun":"sunny",
        "LightCloud":"cloudy",
        "PartlyCloud": "cloudy",
        "Cloud": "cloudy",
        "LightRainSun": "cloudy",
        "LightRainThunderSun": "thunder-storm",
        "SleetSun": "flurry",
        "SnowSun": "flurry",
        "LightRain": "rainy",
        "Rain": "rainy",
        "RainThunder":"thunder-storm",
        "Sleet":"flurry",
        "Snow": "flurry",
        "SnowThunder": "thunder-storm",
        "Fog": "cloudy",
        "SleetSunThunder": "thunder-storm",
        "SnowSunThunder": "thunder-storm",
        "LightRainThunder": "thunder-storm",
        "SleetThunder": "thunder-storm",
        "DrizzleThunderSun": "thunder-storm",
        "RainThunderSun": "thunder-storm",
        "LightSleetThunderSun": "thunder-storm",
        "HeavySleetThunderSun": "thunder-storm",
        "LightSnowThunderSun": "thunder-storm",
        "HeavySnowThunderSun": "thunder-storm",
        "DrizzleThunder": "thunder-storm",
        "LightSleetThunder": "thunder-storm",
        "HeavySleetThunder": "thunder-storm",
        "LightSnowThunder": "thunder-storm",
        "HeavySnowThunder": "thunder-storm",
        "DrizzleSun": "rainy",
        "RainSun": "rainy",
        "LightSleetSun": "flurry",
        "HeavySleetSun": "flurry",
        "LightSnowSun": "flurry",
        "HeavysnowSun": "flurry",
        "Drizzle": "rainy",
        "LightSleet": "flurry",
        "HeavySleet": "flurry",
        "LightSnow": "flurry",
        "HeavySnow": "flurry"};

    //function updateWeather()
    //{
    //    yrno.getWeather({
    //        lat: 57.70715,
    //        lon: 11.96679
    //    }, function(err, location){
    //        location.getCurrentSummary(function(data, res){
    //            $('.weather-icon.' + iconCssClasses[res.icon]).show();
    //            $('#widget-weather').find('.temperature').html(res.temperature.split(" ")[0]);
    //        })
    //    });
    //}
    //updateWeather();
    //weatherUpdate = setInterval(updateWeather, 60000);

    var Departure = function(Object){
        this.bgColor = Object.bgColor;
        this.date = Object.date;
        this.direction = Object.direction;
        this.fgColor = Object.fgColor;
        this.journeyid =  Object.journeyid;
        this.name =  Object.name;
        this.sname = Object.sname;
        this.stop = Object.stop;
        this.stopid = Object.stopid;
        this.stroke = Object.stroke;
        this.time = Object.time;
        this.track = Object.track;
        this.type = Object.types;
    };

    function padTen(i) {return i < 10 ? "0" + i : i;}

    function updateVasttrafik(){
        console.log("Updating Västtrafik");
        var widgetConfig = config.widgets.vasttrafik;
        var apiToken = state.widgets.vasttrafik.apiToken;
        console.log("apitoken: " + apiToken);

        // Get current date and time
        var d = new Date();
        var curDate = [ d.getFullYear(), padTen(d.getMonth()+1), padTen(d.getDate())].join("-");
        var curTime = d.toTimeString().substr(0,5);

        // Set up request params
        var params ={
            "id" :      widgetConfig.stopId,
            "date":     curDate,
            "time":     curTime,
            "format":   "json"
        };

        request({
            url: widgetConfig.apiBaseUrl + "/departureBoard" + "?" + $.param(params),
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Accept-Charset': 'utf-8',
                'Authorization':'Bearer ' + apiToken
            }
        }, function(error, response, body){
            if(error)
            {
                console.log(error);
            }
            else
            {
                var result = JSON.parse(body);
                console.log(result);
                var departure = new Departure(result.DepartureBoard.Departure[0]);
            }

            state.widgets.vasttrafik.departures = [ departure ];
            $('#widget-vasttrafik').append(renderDepartureLine(departure));
        })
    }

    /**
     *
     * @param Departure departure
     */
    function renderDepartureLine(departure)
    {
        var d = new Date();

        d.setHours(departure.time.substr(0,2));
        d.setMinutes(departure.time.substr(3.2));

        return $("<div/>").html(departure.name + " leaving at: " + d);
    }

    function fetchVasttrafikToken()
    {
        var apiUrl = config.widgets.vasttrafik.apiTokenUrl;
        request({
            url: apiUrl,
            method : "POST",
            headers : {
                "Authorization" : "Basic " + config.widgets.vasttrafik.apiSecret
            },
            body: "grant_type=client_credentials"
        }, function(error, response, body){
            if(error){
                console.log(error);
            }

            var responseArray = JSON.parse(body);
            console.log(responseArray['access_token']);

            var token = responseArray['access_token'];
            var ttl = responseArray['expires_in'];
            console.log("Setting token to: " + token);
            state.widgets.vasttrafik.apiToken = token;
            state.widgets.vasttrafik.apiTokenTTL = ttl;
            updateVasttrafik();
        });
    }

    fetchVasttrafikToken();
});