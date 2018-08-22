import { Injectable } from '@angular/core';
import { Row } from '../models/rapportblatt.model';

interface ImagesForUpload {
    medicalCertificates: File[];
    ticketProofs: File[];
}

@Injectable({
  providedIn: 'root'
})
export class ImageHandlerService {


  constructor() {
      //Files is an object which saves the resized image-files:
      // Exmpl: {"4.4.18": [File_Object, File_Object],
      //          "5.4.18": [File_Object]}
  }

  getImages( rows: Row[] ): ImagesForUpload {
		
		let images: ImagesForUpload = {
            medicalCertificates: [],
            ticketProofs: []
        }
		for(const row of rows) {
			for(const dataURL of row.ticketProof) {
				
				const imageFile = this.dataURLtoFile(dataURL,  Date.now())
				if(row.date in images) {
					images["ticketProofs"][row.date].push(imageFile)
				} else {
					images["ticketProofs"][row.date] = [imageFile]
				}
			}
			for(const dataURL of row.medicalCertificate) {
				const imageFile = this.dataURLtoFile(dataURL,  Date.now())
				if(row.date in images) {
					images["medicalCertificates"][row.date].push(imageFile)
				} else {
					images["medicalCertificates"][row.date] = [imageFile]
				}
			}
		}
    return images
  }
  getCanvas( image ){  
    const max_size = 720;
    let canvas = document.createElement("canvas"),
    context = canvas.getContext("2d"),
    width = image.width,
    height = image.height;

    if (width > height) {
        if (width > max_size) {
            height *= max_size / width;
            width = max_size;
        }
    } else if (height > max_size) {
            width *= max_size / height;
            height = max_size;
    }
        
    canvas.width = width;
    canvas.height = height;
    context.drawImage(image,
        0,
        0,
        image.width,
        image.height,
        0,
        0,
        canvas.width,
        canvas.height
    );
    return canvas
  }
  scaleFile(imageFile, callback){
			const fileReader = new FileReader();

			const filterType = /^(?:image\/bmp|image\/cis\-cod|image\/gif|image\/ief|image\/jpeg|image\/jpeg|image\/jpeg|image\/pipeg|image\/png|image\/svg\+xml|image\/tiff|image\/x\-cmu\-raster|image\/x\-cmx|image\/x\-icon|image\/x\-portable\-anymap|image\/x\-portable\-bitmap|image\/x\-portable\-graymap|image\/x\-portable\-pixmap|image\/x\-rgb|image\/x\-xbitmap|image\/x\-xpixmap|image\/x\-xwindowdump)$/i;

      if (!filterType.test(imageFile.type)) {
        alert("Bitte wähle eine Bild-Datei aus.");
        return false;
      }

      fileReader.onload = (event: any) => {
          let image: any = new Image();

          image.onload= () => {
            const canvas = this.getCanvas(image)
            const scaledImage = canvas.toDataURL()
						const origImage = image.src
						// If the downscaledImage is still bigger in byte size than the
						// original just return the original
						if(scaledImage.length < origImage.length){
								callback(scaledImage);
						}else{
								callback(origImage);
						}
          }
          image.src=event.target.result;
      };
      fileReader.readAsDataURL(imageFile);

    
  }
  dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);

    while(n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
	}
}
