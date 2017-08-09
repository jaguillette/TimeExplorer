Fabulous Time
=====

Fabulous Time is a timeline creation tool that combines the ease of use and
multimedia focus of [Timeline JS](https://timeline.knightlab.com/) with the
navigability of a timeline created by [vis.js](http://visjs.org/). It uses code
from both of these excellent projects to create a timeline tool that can handle
larger numbers of events.

This software is an alpha release, and as such it is subject to change and
instability.

If you just want to use the timeline, you can use the version hosted through
GitHub Pages, which you can set up here: https://jaguillette.github.io/fabulousTime/.
That page is intended to help you get started using the timeline.

If you want to host your own instance of this timeline, you'll need to download
the repo and do some [minimal tweaking and configuration](https://www.xkcd.com/1742/).

First, you need a Google Sheets API key, which you can get
from the [Google API Console](https://console.developers.google.com/apis/dashboard).

You will have to enter you API key in index.html, on the line
starting with `var api_key =`. Remember to protect your API key, especially if
you've allowed it to be used anywhere.

When you've added your own API key, you'll be able to use the tool. However,
you'll have to add the ID of the Google sheet that you want to use manually. You
can either use the `tl_sheet` GET parameter (e.g. ...?tl_sheet=your_sheet_id),
or you can hard code the sheet ID in when creating the timeline with
`new FabulousTime(api_key,sheet_ids=['your_sheet_id']);`. Using the GET
parameter will allow you to use multiple timelines from the same setup, so
that's what I recommend, but you do you.

In either case, you need to get the Google Sheet ID out of the URL from the
edit page. If the URL of the Google Sheet is
"https://docs.google.com/spreadsheets/d/1pHBvXN7nmGkiG8uQSUB82eNlnL8xHu6kydzH_-eguHQ/edit",
then the ID would be "1pHBvXN7nmGkiG8uQSUB82eNlnL8xHu6kydzH_-eguHQ". That ID is
actually the Timeline JS Template, so you can use it for testing, and make your
own copy to edit and fill with your own content.

With your own API key and Sheet ID specified, you should see the timeline
rendered when you load the page. 

Licenses
-----

This software uses code from [Timeline JS](https://timeline.knightlab.com/), which is licensed under a [Mozilla Public License](https://timeline.knightlab.com/docs/license.html)

It also uses code from [vis.js](http://visjs.org/), which is dual licensed under both Apache 2.0 and MIT.

This software is licensed under an MIT license, which means that you can use the code however you like, as long as you provide attribution and include the original license (although that statement is not legal advice).
