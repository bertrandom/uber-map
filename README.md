uber-map
========

Generate a GeoJSON of your Uber trips for a year

## usage

Pull in the dependencies:
```
npm install
```

Open https://riders.uber.com/trips in Google Chrome. Sign-in as necessary.

Wait a few seconds.

Run

```
node index
```

and it will output GeoJSON to stdout.

Save it to a file:
```
node index > uber.geojson
```
You can open it as a source in [Mapbox Studio](https://www.mapbox.com/mapbox-studio/) to create an image like this:

![image](https://farm8.staticflickr.com/7582/16202979362_102925ff95_b.jpg)
