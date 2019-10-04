describe('Testing the functions of the TimeExplorer file', ()=>{

  it('zip_arrays should zip two arrays of equal length', ()=>{
    const arr1 = ["Joan", "Bill", "Bob"];
    const arr2 = [1,2,3];
    expect(zip_arrays(arr1,arr2)).toEqual({Joan: 1, Bill: 2, Bob: 3});
  })

  it('timeParse should parse AM time', ()=>{
    const times = [
      "10:20",
      "10:20am",
      "10:20AM",
      "10:20aM"
    ];
    times.forEach( time => expect(timeParse(time)).toEqual([10,20]));
  })

  it('timeParse should parse PM time', ()=>{
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

})
