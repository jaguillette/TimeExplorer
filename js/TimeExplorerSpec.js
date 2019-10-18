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
    const num = 6;
    const negativeNum = -6;
    const digits = 3;
    expect(padToNDigit(num, digits)).toEqual("0006");
    expect(padToNDigit(negativeNum, digits)).toEqual("-0006");
  })

  it('plainId should return id string without preceding #', ()=> {
    const ids = ["m1id1sgreat", "#m1id1sgreat"];
    ids.forEach( id => expect(plainId(id)).toEqual("m1id1sgreat"));
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
  let div;
  const api_key = "AIzaSyCA8GIsjw-QL-CC1v6fgDWmDyyhRM_ZESE";
  const new_explorer = () => {
    return new TimeExplorer(api_key);
  }

  beforeEach( ()=> {
    div = document.createElement('div');
    div.setAttribute("id", "timeline");
    document.body.appendChild(div);
  });

  afterEach( ()=> {
    div.remove();
    div = null;
  });

  it('TimeExplorer should have options after initialization', ()=> {
    explorer = new_explorer()
    expect(explorer.options.timelineOptions.height).toEqual(window.innerHeight);
  })

  it('TimeExplorer.get_tag_col() should return "Tags"', ()=> {
    explorer = new_explorer()
    const tags = explorer.get_tag_col();
    expect(tags).toEqual('Tags');
  })

  it('TimeExplorer.set_options() should extend options', ()=> {
    explorer = new_explorer()
    const r = explorer.set_options(["Joe"])
    expect(r.timelineOptions['0']).toEqual("Joe");
  })

  it('TimeExplorer.slugify() should return a valid slug', ()=> {
    explorer = new_explorer()
    const slug = explorer.slugify("Let's make a slug");
    expect(slug).toEqual("Let_s_make_a_slug");
  })


})
