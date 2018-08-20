import { Injectable } from '@angular/core';
import { Row } from "../models/rapportblatt.model"

@Injectable({
  providedIn: 'root'
})
export class AutoCompleteService {

  standardOpts: string[]

  constructor() {
    this.initiateStandardOpts()
  }

  initiateStandardOpts() {
    this.standardOpts = [
      "Winterthur",
      "Zürich",
      "Seebach",
      "Hettlingen"
    ]
  }

  updateOptions(rows: Row[],
    thisRowIndex: number,
    fieldName: string,
    stdOpts: string[] = [],
    topFieldName = "") {
    
    if( stdOpts.length <= 0 ) {
      stdOpts = this.standardOpts
    }
    let options = removeDuplicates(
      sortIndividually(
        rows.map(row => {
          let field = row[fieldName]
          if (topFieldName !== "") {
            field = row[topFieldName][fieldName]
          }
          return field !== ""
            ? field
            : undefined
        })
          .concat(stdOpts)                // Adding the standard Options to the Array
          .filter(fieldHasText =>         // Only take the fields containing text
            fieldHasText
              ? true
              : false),
        thisRowIndex,
        fieldName,
        rows)
    )
    return options
  }
}
function removeDuplicates(arr) {
  let unique_array = []
  for (let i = 0; i < arr.length; i++) {
    if (unique_array.indexOf(arr[i]) == -1) {
      unique_array.push(arr[i])
    }
  }
  return unique_array
}

// This function see to it that the first element in the list will be the option that is above it
function sortIndividually(optionsArray: string[],
  thisRowIndex: number,
  fieldName: string,
  rows: Row[]) {

  const previousRowIndex = thisRowIndex - 1

  if (previousRowIndex > -1) {
    const previousRow = rows[previousRowIndex]
    const previousInput = previousRow[fieldName]

    if (previousInput && previousInput !== "") {

      const indexOfArrayItem = optionsArray.indexOf(previousInput);

      if (indexOfArrayItem >= 0) {
        let swap = optionsArray[indexOfArrayItem]
        optionsArray[indexOfArrayItem] = optionsArray[0]
        optionsArray[0] = swap
      }
    } else {
      return sortIndividually(optionsArray, previousRowIndex, fieldName, rows)
    }
  }
  return optionsArray
}