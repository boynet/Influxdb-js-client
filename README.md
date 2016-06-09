# Influxdb-js-client
Lightweight library for sending metrics to influxdb in javascirpt

## why another libray?
----------
the other influxdb js libaries are intented to use with node.js, so they are big in size and just to complicated for this simple job.

this libary just taking simple data and transform it to [influxdb line protocol](https://docs.influxdata.com/influxdb/v0.13/write_protocols/line/)

## what's the difference between this libary and sending simple xhr?

 1. this library transform plain objects into valid line protocol
 2. give you easy way to send points in batch
 3. "lose as less points as possible" by using navigator.sendBeacon when the user leave the page and there is some unsend data(OFF by default)
 4. only 2.82 KB minified size

#how to use?
include influxdb.min.js in your page:

*the unminifed version is in es6 if you want to use the unminifed version than you need to transform the code to es5 using [babel](https://babeljs.io/repl/)

    <script src="{{ asset('/js/influxdb.min.js') }}"></script>


connect to the server:

(its not sending anything just constructing the class)

      influxdb = new Influxdb('http://127.0.0.1:8086/write?db=DBNAME',true);
replace 12.0.0.1 with the ip/url of your influxdb server, change DBNAME with the name of the db you want send points to;

insert points:

     influxdb.point('key',{value:1},{tag:'tag_name'});
     influxdb.point('key',{value:2,other_value:3},{tag:'tag_name',othertag:'some_value'});

send the points:

    influxdb.send();


you can also use the short verse like:

    influxdb.point('key',{value:1},{tag:'tag_name'}).send();


#api

    Influxdb.constructor(host, sendPointsOnClose, sendOnInsert)

 - host - should get url to send the points to like: `http://127.0.0.1:8086/write?db=DBNAME`
 - sendPointsOnClose (default: false) - if set to true than if for some reason there is a points that added to the batch but was no sent yet to the server it will send the points using the new api `navigator.sendBeacon` if you want to use it in old browser please include the polyfill https://github.com/miguelmota/Navigator.sendBeacon 
 - sendOnInsert (default: false) - if set to true than it will automatically send point to the server after calling `.point()` so no need to use the `.send()` command after inserting point.
 


````.point(key, fields, tags)````

each point must have at least key and one fields look here for more info: [influxdb line protocol](https://docs.influxdata.com/influxdb/v0.13/write_protocols/line/)

 - key - string the measurement name
 - fields -object { alert=true,reason="value above maximum threshold"2}
 - tags - null|object { url : "/index", user_id : 1234 }
 - 
 
#example
gather some statics about the page loading time and sending it to influxdb:
````
influxdb = new Influxdb('http://127.0.0.1:8086/write?db=website',true);
routeName = "index.html"
$(window).load(function () {
        if (typeof window.performance != "undefined") {
            influxdb.point("page_latency", {value: window.performance.timing.responseStart - window.performance.timing.connectStart}, {'routeName': routeName});
            influxdb.point("load_time", {value: window.performance.timing.loadEventStart - window.performance.timing.navigationStart}, {'routeName': routeName});
            if (window.chrome && window.chrome.loadTimes && (Math.round((window.chrome.loadTimes().firstPaintTime * 1000) - (window.chrome.loadTimes().startLoadTime * 1000)) > 0)) {
                influxdb.point("paint_time", {value: Math.round((window.chrome.loadTimes().firstPaintTime * 1000) - (window.chrome.loadTimes().startLoadTime * 1000))}, {'routeName': routeName});
            }
            influxdb.send();
        }
    });
````

#todo list:
 - supporting esacped space in key name
 - supporting sending custom time
 - supporting for resend faild xhr reuquest
