describe('Testing the functions of the TimeExplorer file', ()=> {

  it('zip_arrays should zip two arrays of equal length', ()=> {
    const arr1 = ["Joan", "Bill", "Bob"];
    const arr2 = [1,2,3];
    expect(zip_arrays(arr1,arr2)).toEqual({"Joan": 1, "Bill": 2, "Bob": 3});
  })

  it('timeParse should parse AM time', ()=> {
    const times = [
      "10:20",
      "10:20am",
      "10:20AM",
      "10:20aM"
    ];
    times.forEach( time => expect(timeParse(time)).toEqual([10,20]));
  })

  it('timeParse should parse PM time', ()=> {
    const times = [
      "10:20pm",
      "10:20PM",
      "10:20pM"
    ];
    times.forEach( time => expect(timeParse(time)).toEqual([22,20]));
  })

  it('padToNDigit should pad a given number by given digits', ()=> {
    const digits = 4;
    expect(padToNDigit(6, digits)).toEqual("0006");
    expect(padToNDigit(-6, digits)).toEqual("-0006");
    expect(padToNDigit(1987, digits)).toEqual("1987");
    expect(padToNDigit(-1987, digits)).toEqual("-1987");
  })

  it('plainId should return id string without preceding #', ()=> {
    const ids = ["m1id1sgreat", "#m1id1sgreat"];
    ids.forEach( id => expect(plainId(id)).toEqual("m1id1sgreat"));
  })

  it('GetDisplayTitle should return html with title', ()=> {
    const row1 = {
      'Headline': "HEADLINE",
    }
    const displayDate = "July 6th";
    expect(GetDisplayTitle(row1, displayDate)).toBe('<div class="ft-item-tooltip"><h1>HEADLINE</h1><p>July 6th</p></div>');
  })

  it('GetDisplayDate should return a formated timeframe', ()=> {
    const row1 = {
      'Month': 11,
      'Day': 10,
      'Year': 1987,
      'Time': "10:30am",
      'End Month': 11,
      'End Day': 10,
      'End Year': 2001,
      'End Time': "10:30am"
    }
    const row2 = {
      'Month': 11,
      'Day': 10,
      'Year': 1987,
      'Time': "10:30am"
    }
    let end = new Date("June 6 2019 2:30");
    let start = new Date("September 9 1987 12:30");
    expect(GetDisplayDate(row1, start, end)).toEqual("September 9, 1987 at 12:30 - June 6, 2019 at 2:30");
    expect(GetDisplayDate(row2, start, end)).toEqual("September 9, 1987 at 12:30 - ");
    expect(GetDisplayDate(row1, start)).toEqual("September 9, 1987 at 12:30");
    expect(GetDisplayDate(row2, start)).toEqual("September 9, 1987 at 12:30");
  })

})

describe('Testing the TimeExplorer class', () => {
  let el;
  let div;
  let explorer;
  const api_key = "AIzaSyCA8GIsjw-QL-CC1v6fgDWmDyyhRM_ZESE";
  const new_explorer = () => {
    return new TimeExplorer(api_key);
  }

  beforeEach( ()=> {
    el = document.createElement('html');
    div = document.createElement('div');
    div.setAttribute("id", "timeline");
    document.body.appendChild(el);
    el.appendChild(div);
    explorer = new_explorer()
  });

  afterEach( ()=> {
    div.remove();
    div = null;
    el.remove();
    el = null;
  });

  it('TimeExplorer should have options after initialization', ()=> {
    expect(explorer.options.timelineOptions.height).toEqual(window.innerHeight);
  })

  it('TimeExplorer.get_tag_col() should return "Tags"', ()=> {
    const tags = explorer.get_tag_col();
    expect(tags).toEqual('Tags');
  })

  it('TimeExplorer.create_timeline() should create a timeline', ()=> {
    const timeline = explorer.create_timeline(explorer.options);
    expect(Object.keys(timeline)).toContain('itemsData');
  })

  it('TimeExplorer.get_sheet_data() should return a promise', ()=> {
    const sheetData = explorer.get_sheet_data(api_key);
    expect(Object.keys(sheetData)).toContain("promise");
  })

  it('TimeExplorer.set_options() should extend options', ()=> {
    const r = explorer.set_options(["Joe"])
    expect(r.timelineOptions['0']).toEqual("Joe");
  })

  it('TimeExplorer.slugify() should return a valid slug', ()=> {
    const slug = explorer.slugify("Let's make a slug");
    expect(slug).toEqual("Let_s_make_a_slug");
  })

  it('TimeExplorer.set_tags() return all tags', ()=> {
    explorer.items = [{'tags': ["Joe"]}, {'tags': ["Mary", "Liam"]}];
    const tag_return = explorer.set_tags(explorer)
    expect(tag_return).toEqual([ 'Joe', 'Liam', 'Mary' ]);
  })

  it('TimeExplorer.set_groups() return all groups', ()=> {
    explorer.items = [{'sheet_group': 1}, {'sheet_group': 2}];
    const group_return = explorer.set_groups(explorer)
    expect(group_return).toEqual([1,2]);
  })

  it('TimeExplorer.set_filters() set filters some things checked', ()=> {
    // groups
    group = addTestElement('div', {'class':'Groups'});
    inp1 = addTestElement('input', {'class':'filter-checkbox', 'value':'Event', 'checked':true});
    inp2 = addTestElement('input', {'class':'filter-checkbox', 'value':'Thing', 'checked':true});
    group.appendChild(inp1);
    group.appendChild(inp2);

    //tags
    tag = addTestElement('div', {'class':'Tags'});
    inp3 = addTestElement('input', {'class':'filter-checkbox', 'value':'TAG', 'checked':true});
    inp4 = addTestElement('input', {'class':'filter-checkbox', 'value':'Another', 'checked':true});
    tag.appendChild(inp3);
    tag.appendChild(inp4);

    // attach them to the html
    el.appendChild(group);
    el.appendChild(tag);

    explorer.set_filters('none', explorer)
    expect(explorer.filters.tagOptions).toBe('any');
    expect(explorer.filters.activeGroups).toEqual([ 'Event', 'Thing' ]);
    expect(explorer.filters.activeTags).toEqual([ 'TAG', 'Another' ]);

    // remove it all
    inp1.remove();
    inp2.remove();
    inp3.remove();
    inp4.remove();
    group.remove();
    tag.remove();
  })

  it('TimeExplorer.constructDate() constructs a date.', () =>{
    let constructedDate = explorer.constructDate();
    expect(constructedDate).toEqual(null);
    constructedDate = explorer.constructDate(year=6);
    let date = new Date("0006-01-01T00:00");
    expect(constructedDate).toEqual(date);
    constructedDate = explorer.constructDate(year=-6);
    date = new Date("0000-01-01T00:00");
    date.setFullYear(-6);
    expect(constructedDate).toEqual(date);
    constructedDate = explorer.constructDate(year=1987);
    date = new Date("1987-01-01T00:00");
    expect(constructedDate).toEqual(date);
  })


})


// Helper function to set up an element to add for testing
const addTestElement = (elem, attrs) => {
  item = document.createElement(elem);
  Object.keys(attrs).forEach( (attribute) => {
    item.setAttribute(attribute, attrs[attribute]);
  });
  return item;
}
