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
    savedRbs: SavedRBs[];
  }
  
export class SavedRBs {
    month: string;
    pointer: string;
    encrypted: boolean;
    rb: string;
}