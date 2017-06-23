$ = require('jquery');
//var yrno = require('yr.no-forecast');
var request = require('request');

var config = {
    "widgets": {
        "vasttrafik": {
            "lastUpdate": null,
            "updateInterval": 3000,
            "apiSecret": "{{vasttrafik.secret}}",
            "apiTokenUrl": "https://api.vasttrafik.se:443/token",
            "apiBaseUrl": "https://api.vasttrafik.se/bin/rest.exe/v2",
            "stopId": "9021014007370000",
            "bigDirections" : ["Östra Sjukhuset"]
        },
        "weather": {
            "url": "https://www.yr.no/place/Sweden/V%C3%A4stra_G%C3%B6taland/Gothenburg/forecast_hour_by_hour.xml"
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

        var d = new Date();
        d.setYear(+Object.date.substr(0,4));
        d.setMonth(+Object.date.substr(5,2) - 1);
        d.setDate(+Object.date.substr(8,2));
        d.setHours(+Object.time.substr(0,2), +Object.time.substr(3.2));

        this.departureIn = Math.floor((d.getTime() - Date.now()) / (1000 * 60));
    };

    function padTen(i) {return i < 10 ? "0" + i : i;}

   function updateVasttrafik(){
        console.log("Updating Västtrafik widget");
        var widgetConfig = config.widgets.vasttrafik;
        var widgetState = state.widgets.vasttrafik;

        if(widgetState.apiToken == null || (Date.now() - widgetState.lastUpdate) > (widgetState.apiTokenTTL * 1000) ){
            fetchVasttrafikToken();
            return;
        }

        var apiToken = state.widgets.vasttrafik.apiToken;
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
                try{
                    var departures = result.DepartureBoard.Departure.map(function(dep){return new Departure(dep)});
                }
                catch(e)
                {
                    console.log("Couldn't parse DepartureBoard");
                    console.log(e);
                }
            }

            state.widgets.vasttrafik.departures = departures;
            $('#widget-vasttrafik').html(renderDepartureBoard(departures));
        })
    }

    /***
     *
     * @param {Departure[]} departures
     * @returns {*|jQuery}
     */
    function renderDepartureBoard(departures)
    {
        var widgetConfig = config.widgets.vasttrafik;

        var start = 0;
        while(departures[start].departureIn <= 0){start++;}
        var end = 19;

        //while(departures[end].departureIn < 60){end++;}

        var bigDeparture = departures.find(function(departure){
            return widgetConfig.bigDirections.indexOf(departure.direction) != -1
                && departure.departureIn < 60
        });


        return $("<div class='departureboard'/>")
            .append(renderBigDeparture(bigDeparture))
            .append( $("<div class='departure-table-container'/>")
                .html($("<table class='departure-table' />")
                    .html(departures.slice(start, end).map(renderDepartureLine))));
    }

    function renderDepartureLine(departure)
    {
        return $("<tr class='departure-line'/>")
                .append($("<td/>").html(departure.name))
                .append($("<td/>").html(departure.direction))
                .append($("<td/>").html(formatMinutes(departure.departureIn)));
    }

    function formatMinutes(minutes)
    {
        var hours = Math.floor( minutes / 60 );
        return hours > 0 ? hours + ":" + padTen(minutes % 60): minutes;
    }

    function renderBigDeparture(departure)
    {
        return $("<div class='big-departure'/>").html(departure == null ? "<span class='light-muted'>?</span>" : departure.departureIn );
    }

    function getWeatherData()
    {
        var widgetConfig = config.widgets.weather;
        request({
            url: widgetConfig.url,
            method: "GET"
        }, function(error, response, body){
            console.log(response);
            console.log(body);
        })
    }

    function fetchVasttrafikToken()
    {
        console.log("Fetching token");
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
            var token = responseArray['access_token'];
            var ttl = responseArray['expires_in'];
            console.log("Setting token to: " + token);
            state.widgets.vasttrafik.apiToken = token;
            state.widgets.vasttrafik.apiTokenTTL = ttl;
            updateVasttrafik();
        });
    }

    updateVasttrafik();
    //setInterval(updateVasttrafik, 10000);
    getWeatherData();
    function updatePage(){
        updateVasttrafik();

    }

});
