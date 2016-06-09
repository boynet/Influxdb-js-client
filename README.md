# Influxdb-js-client
Lightweight library for sending metrics to influxdb in javascirpt

## Why another libray?
----------
the other influxdb js libaries are intented to use with node.js, so they are big in size and just to complicated for this simple job.

this libary just taking simple data and transform it to [influxdb line protocol](https://docs.influxdata.com/influxdb/v0.13/write_protocols/line/)

## What's the difference between this libary and sending simple xhr?

 1. this library transform plain objects into valid line protocol
 2. give you easy way to send points in batch
 3. "lose as less points as possible" by using navigator.sendBeacon when the user leave the page and there is some unsend data(OFF by default)
 4. only 2.82 KB minified size

#How to use?
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


#Api

    Influxdb.constructor(host, sendPointsOnClose)

 - host - should get url to send the points to like: `http://127.0.0.1:8086/write?db=DBNAME`
  - if your db has auth enabled(which should be) apped the username and password according to the docs like `http://127.0.0.1:8086/write?db=DBNAME&u=username&p=password`
  - if you sending custom time with your point append the precision like:
 `http://127.0.0.1:8086/write?db=DBNAME&u=username&p=password&precision=ms` possible values are `precision=[n,u,ms,s,m,h]` for nanoseconds, microseconds, milliseconds, seconds, minutes, and hours, respectively. if you use Date.now() as time than use `&precision=ms`
 - for full list option please see the docs for [http write synax](https://docs.influxdata.com/influxdb/v0.13/write_protocols/write_syntax/#http)
 - sendPointsOnClose (default: false) - if set to true than if for some reason there is a points that added to the batch but was no sent yet to the server it will send the points using the new api `navigator.sendBeacon` if you want to use it in old browser please include the polyfill https://github.com/miguelmota/Navigator.sendBeacon 
 


````.point(key, fields, tags, time)````

each point must have at least key and one fields look here for more info: [influxdb line protocol](https://docs.influxdata.com/influxdb/v0.13/write_protocols/line/)

 - key - string the measurement name
 - fields -object { alert=true,reason="value above maximum threshold"2}
 - tags - null|object { url : "/index", user_id : 1234 }
 - time - the time in which the data happend (if you use custom time than dont forget to add the precision to influxdb constructor)

#Security
always use this libary with [Authentication and Authorization](https://docs.influxdata.com/influxdb/v0.13/administration/authentication_and_authorization/) .
create a new database for public data for example named `website_public`.

create a new user with only `WRITE` privilege for the `website_public` DB.

now connect to the influxdb server and append the above created user and password to the url like:
`http://127.0.0.1:8086/write?db=website_public&u=username&p=password`

**pay attention!** always monitor your influxdb server for memory usage as this libary allow anyone to flood your server with unwanted tags [according to the docs](https://docs.influxdata.com/influxdb/v0.13/guides/hardware_sizing/) low hardware server can handle only 100,000 tags.
and never trust the data you get

 
#Example
gather some statics about the page loading time and sending it to influxdb:
````
influxdb = new Influxdb('http://127.0.0.1:8086/write?db=website',true);
routeName = "index.html"
$(window).load(function () {
        if (typeof window.performance != "undefined") {

            var page_latency = window.performance.timing.responseStart - window.performance.timing.connectStart;
            var load_time = window.performance.timing.loadEventStart - window.performance.timing.navigationStart;

            influxdb.point("page_latency", {value: page_latency}, {'routeName': routeName});
            influxdb.point("load_time", {value: load_time}, {'routeName': routeName});
            influxdb.send();
            
        }
    });
````

#TODO list:
- [ ] supporting esacped space in key name
- [ ] supporting for resend faild xhr reuquest
