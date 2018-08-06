import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterStrings'
})
export class FilterStringsPipe implements PipeTransform {

  transform(array: string[], search: string): any {
    if(!search){ return array}

    let filtered = array.filter( value => {
      if(!value) { return }
      // Dont add the string if it's the same as the search term
      if(value.toLowerCase() === search.toLowerCase()) 
      { return }
      return value
              .toLowerCase()
              .indexOf( search.toLowerCase())
              !== -1
    })
    return filtered;
  }
}
