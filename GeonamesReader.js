// Reader taken from feature name information
// from geonames.org USA data
import { readCSV } from "https://deno.land/x/csv/mod.ts";
import { readline } from "https://deno.land/x/readline@v1.1.0/mod.ts";
import { resolve } from "https://deno.land/std@0.210.0/path/mod.ts";

const sourcePath = resolve("./cities500.txt");

const GOOD_FEATURE_CODES = [
  "PPL"
];

export class GeonamesReader {
  async loadCSVData(){
    this._fp = await Deno.open(sourcePath);
    this._data = [];

    for await (const row of readCSV(this._fp, {columnSeparator: "\t", quote: "$"})){
      let cells = [];
      for await (const cell of row){
        cells.push(cell);
      }

      if(cells.length && cells[7].startsWith("PPL")){
        this._data.push(cells);
      }
    }

    // We need to clean up the data, so that lat
    // lon columns are represented as floats
    // lat is at [5] lon is at [6]
    this._data = this._data.map(row => {
      return row.map((cell, index) => {
        if(index == 4 || index == 5){
          return parseFloat(cell);
        }
        return cell;
      });
    });

    // Filter out rows whose feature code does not start with PPL
    // which are popualted places
    // this._data = this._data.filter(row => {
    //   const featureCode = row[7];
    //   return GOOD_FEATURE_CODES.includes(featureCode);
    //   // return featureCode == "P";
    // });

    this._fp.close();
  }

  lookup(lat, lon){
    let closest;
    let minDistance = Infinity;

    this._data.forEach(row => {
      const compLat = row[4];
      const compLon = row[5];
      const a = (compLat - lat);
      const b = (compLon - lon);
      const distance = Math.hypot(a, b);
      if(distance < minDistance){
        minDistance = distance;
        closest = row;
      }
    });
    return closest;
  }
};
