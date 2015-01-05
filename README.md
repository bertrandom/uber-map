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
