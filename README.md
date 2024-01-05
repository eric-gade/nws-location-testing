# NWS Location Testing #
A quick and dirty tool for testing various location service / place name resolving options for weather.gov.
  
## Installation ##
The only requirement is that you have [Deno v1.34.x](https://deno.land) installed. Dependencies will be installed the first time you run the program
  
## Usage ##
From the project folder, simply run `deno run -A main.js`.
  
## Sources ##
Included are source files that map zip codes to lat/lon pairs. The initial CSV is taken from [Geonames](http://download.geonames.org/export/zip/).
