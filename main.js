import { resolve } from "https://deno.land/std@0.210.0/path/mod.ts";
import { GeonamesReader } from "./GeonamesReader.js";

const geonamesReader = new GeonamesReader();
await geonamesReader.loadCSVData();

const getInputLocations = async () => {
  const path = resolve("./locations.txt");
  const text = await Deno.readTextFile(path);
  const locations = text.split("\n")
        .map(line => {
          return line.split(" ")
            .filter(chunk => chunk != "");
        }).filter(line => line != "");
  return locations;
};

const getGridLocationForPoint = async (lat, lon) => {
  const url = `https://api.weather.gov/points/${lat},${lon}`;
  const response = await fetch(url, {headers: {"User-Agent":"18F-testing" }});
  const data = await response.json();
  return {
    wfo: data.properties.gridId,
    x: data.properties.gridX,
    y: data.properties.gridY
  };
};

const getGeometryForGrid = async (gridInfo) => {
  const {wfo, x, y} = gridInfo;
  const url = `https://api.weather.gov/gridpoints/${wfo}/${x},${y}`;
  const response = await fetch(url, {headers: {"User-Agent": "18F-testing"}});
  const data = await response.json();

  // Assuming we want the first point (top left)
  // return {
  //   lat: data.geometry.coordinates[0][0][1],
  //   lon: data.geometry.coordinates[0][0][0]
  // };

  // Assuming midpoint for geometry
  if(!data){
    throw new Error(`Could not get data for ${wfo} response: ${response.status}`);
    Deno.exit(-1);
  }
  return getMidpointForGeometry(data.geometry);
};

const getMidpointForGeometry = (geometry) => {
  const minLat = Math.min(...geometry.coordinates[0].map(coord => coord[1]));
  const maxLat = Math.max(...geometry.coordinates[0].map(coord => coord[1]));
  const minLon = Math.min(...geometry.coordinates[0].map(coord => coord[0]));
  const maxLon = Math.max(...geometry.coordinates[0].map(coord => coord[0]));

  const lat = minLat + ((maxLat - minLat) / 2);
  const lon = minLon + ((maxLon - minLon) / 2);
  return {lat, lon};
};

const getAPILocationNameForPoint = async (lat, lon) => {
  const url = `https://api.weather.gov/points/${lat},${lon}`;
  const response = await fetch(url, {headers: {"User-Agent":"18F-testing" }});
  const data = await response.json();
  return {
    city: data.properties.relativeLocation.properties.city,
    state: data.properties.relativeLocation.properties.state
  };
};

const getArcLocationNameForPoint = async (lat, lon) => {
  const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=${lon},${lat}&f=json&featureTypes=POI`;
  const response = await fetch(url);
  const data = await response.json();
  return {
    city: data.address.City,
    state: data.address.RegionAbbr
  };
};

const computeLocations = async (inputCoords) => {
  const grid = await getGridLocationForPoint(...inputCoords.slice(1));
  const gridPoint = await getGeometryForGrid(grid);
  const apiLocation = await getAPILocationNameForPoint(gridPoint.lat, gridPoint.lon);
  const arcLocation = await getArcLocationNameForPoint(gridPoint.lat, gridPoint.lon);
  const geonamesResult = await geonamesReader.lookup(gridPoint.lat, gridPoint.lon);
  return {
    input: inputCoords[0],
    inputCoords: inputCoords.slice(1),
    api: `${apiLocation.city}, ${apiLocation.state}`,
    arc: `${arcLocation.city}, ${arcLocation.state}`,
    geonames: `${geonamesResult[1]}, ${geonamesResult[10]}`,
    rawGeonames: geonamesResult
  };
};

let locations = await getInputLocations();
const result = [];
for(let i = 0; i < locations.length; i++){
  const locationsInfo = await computeLocations(locations[i]);
  result.push(locationsInfo);
};

console.log(JSON.stringify(result, null));
