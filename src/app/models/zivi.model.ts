export class ZiviData{
    name: {
      firstName: string;
      lastName: string;
    };
    email: string;
    abo: string;
    date: {
      startDate: string; //Date String
      endDate: string;    //Date String
    };
    savedRbs: SavedRb[];
  }
  
export class SavedRb {
    month: string;
    pointer: string;
    encrypted: boolean;
}