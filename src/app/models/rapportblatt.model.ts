export class RapportblattTable {
    month: string;
    rbData: Row[]
}

export class Row {
    date: string;
    dayName: string;
    dayType: string;
    price: string
    route: {
        start: string;
        destination: string
    }
    spesenChecked: boolean
    ticketProof: string[]           //Images saved as dataURLs
    medicalCertificate: string[]      //Images saved as dataURLs
    workPlace: string
}