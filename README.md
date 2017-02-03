Fabulous Time
=====

Fabulous Time is a timeline creation tool that combines the ease of use and
multimedia focus of [Timeline JS](https://timeline.knightlab.com/) with the
navigability of a timeline created by [vis.js](http://visjs.org/). It uses code
from both of these excellent projects to create a timeline tool that can handle
larger numbers of events.

To use this tool, all you need is a Google Sheets API key, which you can get
from the [Google API Console](https://console.developers.google.com/apis/dashboard).
You may want to host your timeline online, in which case you'll need a server
to put it on, but you can run this locally with no server setup as well.

In either case, you will have to enter you API key in index.html, on line 98.
Remember to protect your API key, especially if you've allowed it to be used
anywhere.

When you've added your own API key, load index.html in your browser (either from
your server or by dragging the file into your browser).

The simplest usage of this tool is to use it to re-visualize a single Timeline
JS timeline. You can select "Single Timeline Sheet", and provide the sharing link
for your timeline in the next window.

Alternatively, you can use this tool to aggregate many timeline JS timelines, by
entering the urls for all of them into the first column of a Google Sheet. If
you select "Multiple Timeline Sheets", then paste the sharing link to that
aggregating spreadsheet into the next window, all of the entries from those
timelines will be added to the visualization for you to browse.

Once you've set up your spreadsheet, you can bookmark it like you would any
other website. If you're loading from a file, that bookmark will only work on
your computer, but if you're serving this tool from a web server, you can link
to your timeline from anywhere.
