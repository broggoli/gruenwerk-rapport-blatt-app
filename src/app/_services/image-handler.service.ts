import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageHandlerService {

  constructor() {
      //Files is an object which saves the resized image-files:
      // Exmpl: {"4.4.18": [File_Object, File_Object],
      //          "5.4.18": [File_Object]}
      this.images = []
  }

  get getImages(){
      return this.images
  }
  addImage(file, date, thisElement) {

      let appendImage = (scaledFile) => {
          if(date in this.images){
              console.log("key already exists!");
              this.images[date].push(scaledFile);
          }else{
              this.images[date] = [scaledFile];
          }
      }

      //Check the filetype
      const filterType = /^(?:image\/bmp|image\/cis\-cod|image\/gif|image\/ief|image\/jpeg|image\/jpeg|image\/jpeg|image\/pipeg|image\/png|image\/svg\+xml|image\/tiff|image\/x\-cmu\-raster|image\/x\-cmx|image\/x\-icon|image\/x\-portable\-anymap|image\/x\-portable\-bitmap|image\/x\-portable\-graymap|image\/x\-portable\-pixmap|image\/x\-rgb|image\/x\-xbitmap|image\/x\-xpixmap|image\/x\-xwindowdump)$/i;

      if (!filterType.test(file.type)) {
        alert("Bitte wähle eine Bild-Datei aus.");
        return false;
      }

      this.scaleFile(file, appendImage, thisElement);

  }
  deleteImage(date, index=0){
      this.images[date].splice(index);
      //check whether the object of this date is now empty
      if(this.images[date].length == 0){
          delete this.images[date];
      }
      return true;
  }
  scaleFile(imageFile, callback, thisElement){
      const fileReader = new FileReader();
      const max_size = 720;

      fileReader.onload = (event) => {
          let image = new Image();
          let imageReturned = false;

          image.onload= () => {
              let canvas = document.createElement("canvas"),
                  context = canvas.getContext("2d"),
                  width = image.width,
                  height = image.height;

              if (width > height) {
                  if (width > max_size) {
                      height *= max_size / width;
                      width = max_size;
                  }else{
                      //return the image but still make a canvas element
                      //to return an dataURL
                      callback(imageFile);
                      imageReturned = true;
                  }
              } else {
                  if (height > max_size) {
                      width *= max_size / height;
                      height = max_size;
                  }else{
                      //return the image but still make a canvas element
                      //to return an dataURL
                      callback(imageFile);
                      imageReturned = true;
                  }
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

              if(!imageReturned){
                  const scaledImage = dataURLtoFile(canvas.toDataURL(), Date.now());
                  // If the downscaledImage is still bigger in byte size than the
                  // original just return the original
                  if(scaledImage.size < imageFile.size){
                      // console.log("scaled size: "+scaledImage.size);
                      // console.log("original size: "+imageFile.size);
                      callback(scaledImage);
                  }else{
                      callback(imageFile);
                      imageReturned = true;
                  }
              }
              this.displayImage(canvas.toDataURL(), thisElement);
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

  displayImage(dataUrl, thisElement){

      const uploadTicketProof = thisElement.parentElement.parentElement
      //display imageFile
      let imageElement = document.createElement("img");
      imageElement.src = dataUrl;
      imageElement.classList.add('imagePreview')
      imageElement.style = "height: 1.8em; right: 0.5em;"
      //imageElement.setAttribute("onClick", "this.openSlideshow()")

      let previewImage = uploadTicketProof.append(imageElement)

  }
}
