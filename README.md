# Progression-Atlas
This is an OpenLayers3 project created by Rich Burkmar for the FSC Tomorrow’s Biodiversity project. We created this in response to requests from local recorders in Shropshire who wanted an online atlas tool to help them target recording and chart the progression of local atlas projects.

To implement this project with minimum changes, you need to honour the file structure coded into the html and javascript files. So to do that, create a folder '/sites/maps/atlasv1’ under the root of your website and copy all the contents of the Progression-Atlas project in there (including the sub-folders).

The file 'demo/atlas-demo.html' can be used as a test page to fire the whole thing up. The project comes ‘pre-installed’ with atlas data for Shropshire earthworms (accurate in early 2016). The atlas-demo page will show these data.

The codebase has been structured so that atlases for different taxonomic groups and geographic areas can be implemented from the same source.

You can base any page you create - e.g. a Drupal page - on the ‘atlas-demo.html' file. You can see there is minimal HTML in it - that is mostly injected by the ‘atlas.js’ file from a file called 'atlas-import.html' - that is mainly to facilitate moving easily from the development to the live environment with minimum updating of HTML to main website content (e.g. Drupal). Mainly it's all about getting the includes right.

The ‘atlas-demo.html' file contains general HTML stuff that is relevant across many atlases – e.g. help instructions. The file contains a ‘div’ tag with the ID ‘tombioAtlasOverview’ into which the ‘overview.html’ file in the demo sub-folder is injected. Likewise the file also contains a ‘div’ tag with the ID ‘tombioUsingExtend’ into which the ‘datasources.html’ file is injected (if it exists). This allows the general ‘info dialog’ text to be tailored for each atlas whilst keeping a single copy of the general text that is shared across all.

The subfolder ‘jquery’ contains the jQuery and jQueryUI libraries referenced from ‘atlas-demo.html'.

The subfolder ‘resources’ just contains images – mostly referenced by the ‘atlas-demo.html' page.

The demo subfolder is where the stuff specific to the atlas – rather than the general code – sits. 

In there you will find a ‘basemapsVC40’ folder that contains the geojson files for the boundary of the area of interest (in the case of the demo – Shropshire) plus grid files for hectad, quadrant, tetrad and monad. The grid files where generated from QGIS using the Tom.bio OSGR tool. You can open them in QGIS to have a look at attributes etc. I created them with CRS of WGS84 so that they can be used with OpenLayers.

The ‘earthwormsVC40’ folder contains several files and folders. The file ‘species.txt’ is used to populate the species selection drop-down list. Each line in this file corresponds to one of the possible distribution maps – in these data each distribution map has the scientific name of the earthworm, so each line in this file also has scientific names. If you use parentheses in the names in this file, everything within (and including) the parentheses is stripped out before the remaining string is matched against the name of the geojson layers. So, for example, you could have ‘Lumbricus castaneus (Chestnut worm)’ in this file which would match, for example, ‘Lumbricus castaneus.geojson 10 km atlas.geojson’.

If there is no ‘datasources.txt’ file in the atlas folder (here ‘earthwormsVC40’) then under the species layer folder (here ‘earthwormsVC40/layers’) should be four folders with these names: hectad, quadrant, tetrad and monad. Each of these contains a geosjon file for each species with data aggregated at the appropriate resolution and named accordingly, e.g. ‘Aporrectodea caliginosa 5 km atlas.geojson’. The file displayed will depend on the combination of species *and* resolution selected by the user. However, if there is a file called ‘datasources.txt’ file in the atlas folder, it will name sub-folders of the ‘layers’ folder. For example the demo data has a ‘datasources.txt’ file containing the following:

All records, vc40all

ESB records, vc40esb

This tells the software to expect two sub-folders in the ‘layers’ folder – one called ‘vc40all’ and one called ‘vc40esb’. A drop-down appears to the user with the text (in this case) of ‘All records’ and ‘ESB records’ and the user selects which version of the atlas layers to use by making the appropriate choice here. In this earthworms example the facility has been used to allow the user to display atlas maps based on all earthworm data, or atlas maps based just on data from the Earthworm Society of Britain. But you can use this facility, if you so wish, in whatever way you like (but of course you have to prepare many more geojson layers).

The geojson layers are prepared using the Tom.bio QGIS plugin. You can open any of the geojson layers in QGIS if you like to examine their structure. Don't forget to export in WGS 84 (or WGS 84 / Pseudo Mercator) - either of which is okay for OpenLayers.

In the 'atlas-demo.html' file you will notice some setup of variables. Most you can work out by reference to the code, but one or two I will briefly explain...

tombioinitextent is the extent of the map view on startup. The coordinates are in 'WGS 84 / Pseudo mercator'. You can use QGIS to work out what your extents should be.

tombiomaprotation allows you to rotate the map. Depending on where you are in the UK, you might want to do this so that OS grid lines are closer to the horizontal/vertical (because OS Openlayers uses a WGS 84 / Pseudo Mercator CRS).

At the top of the 'atlas.js' file you will notice that a Bing key is set. You will need to get your own Bing key in order to use Bing layers via OpenLayers3. It's not difficult to do.

