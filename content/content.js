function getGPSData(img) {
  return new Promise((resolve) => {
    EXIF.getData(img, function() {
      const lat = EXIF.getTag(this, "GPSLatitude");
      const latRef = EXIF.getTag(this, "GPSLatitudeRef");
      const long = EXIF.getTag(this, "GPSLongitude");
      const longRef = EXIF.getTag(this, "GPSLongitudeRef");
      
      if (lat && latRef && long && longRef) {
        const latitude = convertDMSToDD(lat[0], lat[1], lat[2], latRef);
        const longitude = convertDMSToDD(long[0], long[1], long[2], longRef);
        resolve({ latitude, longitude });
      } else {
        resolve(null);
      }
    });
  });
}

function convertDMSToDD(degrees, minutes, seconds, direction) {
  let dd = degrees + minutes/60 + seconds/(60*60);
  if (direction === "S" || direction === "W") {
    dd = dd * -1;
  }
  return dd;
}

function getLocationFromCoordinates(latitude, longitude) {
  return new Promise((resolve, reject) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
    
    fetch(url)
      .then(response => response.json())
      .then(data => {
        const city = data.address.city || data.address.town || data.address.village || 'Unknown';
        const country = data.address.country || 'Unknown';
        resolve({ city, country });
      })
      .catch(error => {
        console.error('Error fetching location:', error);
        resolve({ city: 'Unknown', country: 'Unknown' });
      });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getMetadata") {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = async () => {
      const gpsData = await getGPSData(img);
      
      let location = { city: "Not available", country: "Not available" };
      if (gpsData) {
        location = await getLocationFromCoordinates(gpsData.latitude, gpsData.longitude);
      }
      
      const metadata = {
        width: img.width,
        height: img.height,
        aspectRatio: (img.width / img.height).toFixed(2),
        src: request.imageUrl,
        fileType: request.imageUrl.split('.').pop().split('?')[0],
        dateExtracted: new Date().toLocaleString(),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        fileSize: `${(img.src.length * 0.75 / 1024).toFixed(2)} KB (estimated)`,
        gpsLatitude: gpsData ? gpsData.latitude.toFixed(6) : "Not available",
        gpsLongitude: gpsData ? gpsData.longitude.toFixed(6) : "Not available",
        location: `${location.city}, ${location.country}`
      };
      
      chrome.runtime.sendMessage({action: "showMetadata", metadata});
      sendResponse({ status: "Metadata processed" });
    };
    img.onerror = () => {
      img.onerror = () => chrome.runtime.sendMessage({action: "showMetadata", error: "Failed to load image"});
      sendResponse({ status: "Image failed to load" });
    };
    
    img.src = request.imageUrl;
    return true;
  }
  //return true;
});