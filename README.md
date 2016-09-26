Fabulous Time
=====

This is an implementation of the [vis.js](http://visjs.org/index.html) Timeline
system. It's built to show data from a simple Google Form on a timeline.
You can find a spreadsheet from that form input
[here](https://docs.google.com/spreadsheets/d/12HfDc-EUZrJc_QrdUfQh1vD6XZ0a93Czrgbp8qmCTfE/edit?usp=sharing),
just create a new Google Form from that setup, or by just making one with these
questions in this order (suggested question types are in parentheses):

* Title (short text)
* Link (short text)
* Start Date (short text)
* End Date (short text)
* Tags (checkboxes)
* Group (multiple choice)

Different groups will show up on different "tracks" on the timeline. Tags will
be used to color the timeline items, and are also usable as filters on the
timeline. The tag color palette will be generated from the [Google palette.js]
rainbow palette, because it allows for arbitrarily many colors to be generated.

To use this, you need to modify `js/sheet_vis.js` with your own Google Sheets
API key, and the ID of your spreadsheet. You can find out more about Google APIs
[here](https://console.developers.google.com), and you can get your Sheet ID
from the URL of the sheet. Take a look at this URL as an example, with the ID
highlighted:

docs.google.com/spreadsheets/d/**12HfDc-EUZrJc_QrdUfQh1vD6XZ0a93Czrgbp8qmCTfE**/edit#gid=179474476
