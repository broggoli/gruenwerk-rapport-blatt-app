import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageHandlerService {

  images:any

  constructor() {
      //Files is an object which saves the resized image-files:
      // Exmpl: {"4.4.18": [File_Object, File_Object],
      //          "5.4.18": [File_Object]}
      this.images = {}
  }

  get getImages(){
      return this.images
  }
  addImage(file, date, thisElement) {

      let appendImage = (scaledFile, dataURL) => {
          if(date in this.images){
              console.log("key already exists!");
              this.images[date].push(scaledFile);
          }else{
              this.images[date] = [scaledFile];
          }
          this.displayImage(dataURL, thisElement, date);
      }
      //Check the filetype
      const filterType = /^(?:image\/bmp|image\/cis\-cod|image\/gif|image\/ief|image\/jpeg|image\/jpeg|image\/jpeg|image\/pipeg|image\/png|image\/svg\+xml|image\/tiff|image\/x\-cmu\-raster|image\/x\-cmx|image\/x\-icon|image\/x\-portable\-anymap|image\/x\-portable\-bitmap|image\/x\-portable\-graymap|image\/x\-portable\-pixmap|image\/x\-rgb|image\/x\-xbitmap|image\/x\-xpixmap|image\/x\-xwindowdump)$/i;

      if (!filterType.test(file.type)) {
        alert("Bitte wähle eine Bild-Datei aus.");
        return false;
      }

      this.scaleFile(file, appendImage);

  }
  deleteImage(event){
      const target = event.target
      const id = target.id
      const date = id.split("/")[0]
      const index = id.split("/")[1]

      this.images[date].splice(index);
      //check whether the object of this date is now empty
      if(this.images[date].length === 0){
          delete this.images[date];
      }
      return true;
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
  scaleFile(imageFile, callback, getDataURL=false){
      const fileReader = new FileReader();

      fileReader.onload = (event: any) => {
          let image: any = new Image();

          image.onload= () => {
            const canvas = this.getCanvas(image)
            const dataURL = canvas.toDataURL()
            if( !getDataURL ){
                const scaledImage = dataURLtoFile(dataURL, Date.now());
                // If the downscaledImage is still bigger in byte size than the
                // original just return the original
                if(scaledImage.size < imageFile.size){
                    callback(scaledImage, dataURL);
                }else{
                    callback(imageFile, dataURL);
                }
            }else{
                const scaledImage = dataURL
                const origImage = image.src
                // If the downscaledImage is still bigger in byte size than the
                // original just return the original
                if(scaledImage.length < origImage.length){
                    callback(scaledImage);
                }else{
                    callback(origImage);
                }
            }
          }
          image.src=event.target.result;
      };
      fileReader.readAsDataURL(imageFile);

      function dataURLtoFile(dataurl, filename) {
          let arr = dataurl.split(','),
              mime = arr[0].match(/:(.*?);/)[1],
              bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);

              while(n--){
                  u8arr[n] = bstr.charCodeAt(n);
              }
              return new File([u8arr], filename, {type:mime});
          }
  }

  displayImage(dataUrl, thisElement, date){
    
      const uploadTicketProof = thisElement.parentElement
      //display imageFile
      let imageElement: any = document.createElement("img");
      imageElement.src = dataUrl;
      imageElement.id = date+"/"+(this.images[date].length-1)
      imageElement.classList.add('imagePreview')
      imageElement.style = "height: 1.8em; right: 0.5em;"
      //imageElement.setAttribute("click", "deleteImage($event)")

      let previewImage = uploadTicketProof.append(imageElement)

  }
}
