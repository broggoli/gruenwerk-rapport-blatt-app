import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterStrings'
})
export class FilterStringsPipe implements PipeTransform {

  transform(array: string[], str: string): any {
    if(!str){ return array}

    let filtered = array.filter( value => {
      if(!value) { return }
      return value
              .toLowerCase()
              .indexOf( str.toLowerCase())
              !== -1
    })
    return filtered;
  }
}
