$(document).ready(function() {
  // create a handlebars template
  var source = document.getElementById('item-template').innerHTML;
  var template = Handlebars.compile(source);

  // DOM element where the Timeline will be attached
  var container = document.getElementById('visualization');

  // Create a DataSet (allows two way data-binding)
  var dataSetItems = [];

  var sheet_id = "";
  var api_key = "";

  var tags = [];
  var theGroups = [];

  function slugify(text) {
    output = text.trim()
    output = output.replace(' ','_')
    return output
  }

  function get_tags(tagListString) {
    var tagArray = tagListString.split(',')
    return tagArray.map(slugify)
  }

  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

  function addFiltersFromTagArray(tagArray) {
    for (var i = 0; i < tagArray.length; i++) {
      var slug = slugify(tagArray[i]);
      var name = tagArray[i];
      var template = `<div class="filter ${slug}"><label for="${slug}">${name}</label>\
      <input id="${slug}" type="checkbox" class="tagFilter" value="${slug}" checked></input>`
      $("#filters").append(template);
    }
    var tagFilters = $('.tagFilter');
    tagFilters.on('click',function() {
      $('.vis-item').addClass('hidden')
      $('.tagFilter:checked').each(function(){
        console.log('.vis-item.'+this.value)
        $('.vis-item.'+this.value).removeClass('hidden');
      })
    });
  }

  $.getJSON("https://sheets.googleapis.com/v4/spreadsheets/"+sheet_id+"/values/A:ZZZ?key="+api_key, function(data) {
    for (var i = 1; i < data.values.length; i++) { // i = 1 because we're skipping the first row
      if (data.values[i][5]) {
        // remove whitespace, split on commas
        var itemTags = data.values[i][5].split(',');
        itemTags = itemTags.map(function(element){ return element.trim(); });
        tags = tags.concat(itemTags);
        tags = tags.filter( onlyUnique );
        itemTags = itemTags.map(slugify).join(' ');
      } else {
        var itemTags = data.values[i][5];
      }
      if (data.values[i][6]) {
        var itemGroup = slugify(data.values[i][6]);
        if (theGroups.indexOf(data.values[i][6])==-1){
          theGroups.push(data.values[i][6]);
        }
      } else {
        itemGroup = data.values[6];
      }
      var dataSetItem = {
        title:      data.values[i][1],
        link:       data.values[i][2],
        start:      data.values[i][3],
        end:        data.values[i][4],
        className:  itemTags,
        group:      itemGroup
      };
      for (var key in dataSetItem) {
        if (dataSetItem.hasOwnProperty(key)) {
          if (dataSetItem[key] == "") {
            delete dataSetItem[key];
          }
        }
      }
      dataSetItems.push(dataSetItem);
    }
    addFiltersFromTagArray(tags);
    //console.log(dataSetItems);
    scheme = palette.listSchemes('rainbow')[0];
    colors = scheme.apply(scheme, [tags.length, 0.3])
    darkColors = scheme.apply(scheme, [tags.length,1,0.8])
    theStyle = document.getElementById("docstyle");
    for (var i = 0; i < tags.length; i++) {
      var slug = slugify(tags[i]);
      newStyle = `.${slug}.vis-item, .filter.${slug} {\
        background-color: #${colors[i]};\
        border-color: #${darkColors[i]}\
      }\n`
      theStyle.textContent = theStyle.textContent + newStyle;
    }

    items = new vis.DataSet(dataSetItems);

    var groups = new vis.DataSet(theGroups.map(function(group){ return {id:slugify(group), content:group} }));

    // Configuration for the Timeline
    var options = {
      template: template
    };

    // Create a Timeline
    var timeline = new vis.Timeline(container, items, options);
    timeline.setOptions(options);
    timeline.setGroups(groups);
    timeline.setItems(items);
  });
});
