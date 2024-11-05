function displayMetadata(metadata) {
    const container = document.getElementById('metadata-container');
    container.innerHTML = '';
    
    if (!metadata) {
      container.textContent = 'No metadata available.';
      return;
    }
  
    const groups = {
      'Basic Info': ['width', 'height', 'aspectRatio', 'fileType', 'fileSize'],
      'GPS Information': ['gpsLatitude', 'gpsLongitude', 'location'],
      'Source Details': ['src', 'dateExtracted']
    };
  
    Object.entries(groups).forEach(([groupName, keys]) => {
      const groupDiv = document.createElement('div');
      groupDiv.innerHTML = `<h2>${groupName}</h2>`;
      const table = document.createElement('table');
      
      keys.forEach(key => {
        if (key in metadata) {
          const row = table.insertRow();
          row.insertCell(0).textContent = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          row.insertCell(1).textContent = metadata[key];
        }
      });
  
      groupDiv.appendChild(table);
      container.appendChild(groupDiv);
    });
  
    if (metadata.gpsLatitude !== "Not available" && metadata.gpsLongitude !== "Not available") {
      const mapLink = document.createElement('a');
      mapLink.href = `https://www.google.com/maps/search/?api=1&query=${metadata.gpsLatitude},${metadata.gpsLongitude}`;
      mapLink.target = "_blank";
      mapLink.textContent = "View on Map";
      mapLink.style.display = "inline-block";
      mapLink.style.marginTop = "10px";
      container.appendChild(mapLink);
    }
  }
  
  // chrome.runtime.onMessage.addListener((request) => {
  //   if (request.action === "displayMetadata") {
  //     displayMetadata(request.metadata);
  //   }
  // });
  
  window.addEventListener('load', () => {
    chrome.runtime.sendMessage({action: "getMetadataForPopup"}, (response) => {
      if (response && response.metadata) {
        displayMetadata(response.metadata);
      } else {
        console.error("no metadata");
      }
    });
  });