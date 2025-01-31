let db;
let currentPosition = 0; // Track current position for scrolling
let totalImages = 0; // Track the total number of images

// Open IndexedDB and create an object store if it doesn't exist
const request = indexedDB.open('ImageGalleryDB', 1);

// Create an object store when the database is upgraded (first time or version change)
request.onupgradeneeded = function(event) {
  db = event.target.result;
  const objectStore = db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
  objectStore.createIndex('name', 'name', { unique: false });
};

// Successfully opened the database
request.onsuccess = function(event) {
  db = event.target.result;
  console.log('Database opened successfully');
  loadImagesFromDB(); // Load images from DB when the page is ready
};

// Error opening the database
request.onerror = function(event) {
  console.error('Database failed to open', event);
};

// Save image to IndexedDB
function saveImageToDB(imageData, imageName) {
  const transaction = db.transaction('images', 'readwrite');
  const objectStore = transaction.objectStore('images');
  
  const image = {
    name: imageName,
    data: imageData,
  };

  const request = objectStore.add(image);
  
  request.onsuccess = function() {
    console.log('Image saved to DB');
    loadImagesFromDB(); // Reload the images after saving
  };
  
  request.onerror = function(event) {
    console.error('Failed to save image', event);
  };
}

// Load images from IndexedDB and display them
function loadImagesFromDB() {
  const galleryRow = document.getElementById('galleryRow');
  galleryRow.innerHTML = ''; // Clear the gallery
  totalImages = 0; // Reset total image count

  const transaction = db.transaction('images', 'readonly');
  const objectStore = transaction.objectStore('images');
  const request = objectStore.getAll();
  
  request.onsuccess = function(event) {
    const images = event.target.result;
    console.log('Loaded images from DB:', images);

    // Display all the images in the gallery
    images.forEach(image => {
      addImageToGallery(image.data);
    });
  };
  
  request.onerror = function(event) {
    console.error('Failed to load images from DB', event);
  };
}

// Add image to gallery (after retrieving from IndexedDB)
function addImageToGallery(imageData) {
  const galleryRow = document.getElementById('galleryRow');
  const img = new Image();
  img.src = imageData;
  img.classList.add('moving-image');

  const removeBtn = document.createElement('button');
  removeBtn.innerHTML = '&times;';
  removeBtn.classList.add('remove-btn');

  const imgContainer = document.createElement('div');
  imgContainer.style.position = 'relative';
  imgContainer.appendChild(img);
  imgContainer.appendChild(removeBtn);

  galleryRow.appendChild(imgContainer);
  totalImages++;

  // Remove image from IndexedDB on button click
  removeBtn.addEventListener('click', function() {
    removeImageFromDB(img.src);
    galleryRow.removeChild(imgContainer); // Remove from UI as well
    totalImages--; // Decrement total image count
  });
}

// Remove image from IndexedDB
function removeImageFromDB(imageData) {
  const transaction = db.transaction('images', 'readwrite');
  const objectStore = transaction.objectStore('images');

  const request = objectStore.getAll();

  request.onsuccess = function(event) {
    const images = event.target.result;
    const imageToDelete = images.find(image => image.data === imageData);
    if (imageToDelete) {
      const deleteRequest = objectStore.delete(imageToDelete.id);
      deleteRequest.onsuccess = function() {
        console.log('Image removed from DB');
      };
    }
  };

  request.onerror = function(event) {
    console.error('Failed to find image to remove', event);
  };
}

// Handling file input to add images to the gallery
const imageBox = document.getElementById('imageBox');
const imageInput = document.getElementById('imageInput');

imageBox.addEventListener('click', function() {
  imageInput.click(); // Trigger file input click when the image box is clicked
});

imageInput.addEventListener('change', function(event) {
  const files = event.target.files;
  if (!files.length) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();

    reader.onload = function(e) {
      const imageName = file.name;
      const imageData = e.target.result;
      saveImageToDB(imageData, imageName); // Save the image to IndexedDB
    };

    reader.readAsDataURL(file); // Read the image file as a Data URL
  }
});

// Arrow button functionality to scroll left and right (reversed functionality)
const galleryRow = document.getElementById('galleryRow');
const leftArrow = document.getElementById('leftArrow');
const rightArrow = document.getElementById('rightArrow');

// Move images to the right (by removing the last image and adding it to the front)
rightArrow.addEventListener('click', function() {
  if (totalImages > 0) {
    const lastImage = galleryRow.lastElementChild;
    galleryRow.insertBefore(lastImage, galleryRow.firstElementChild); // Move the last image to the front
  }
});

// Move images to the left (by removing the first image and adding it to the end)
leftArrow.addEventListener('click', function() {
  if (totalImages > 0) {
    const firstImage = galleryRow.firstElementChild;
    galleryRow.appendChild(firstImage); // Move the first image to the end
  }
});

// --------------------------------------------------------------------------

const calendarGrid = document.getElementById('calendarGrid');
const calendarMonth = document.getElementById('calendarMonth');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Function to create and display the calendar
function displayCalendar(month, year) {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  const monthName = firstDayOfMonth.toLocaleString('default', { month: 'long' });
  calendarMonth.textContent = `${monthName} ${year}`;

  calendarGrid.innerHTML = '';

  // Adding empty days before the first day of the month
  for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
    const emptyCell = document.createElement('div');
    calendarGrid.appendChild(emptyCell);
  }

  // Creating the days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement('div');
    dayCell.classList.add('calendar-day');
    
    const dateElement = document.createElement('div');
    dateElement.classList.add('date');
    dateElement.textContent = day;

    dayCell.appendChild(dateElement);

    // Check for events or important notes
    const importantText = localStorage.getItem(`${year}-${month}-${day}`);
    if (importantText) {
      const importantLabel = document.createElement('div');
      importantLabel.classList.add('important-text');
      importantLabel.textContent = importantText;
      dayCell.appendChild(importantLabel);
    }

    // Event dot
    if (localStorage.getItem(`${year}-${month}-${day}-event`)) {
      const eventDot = document.createElement('div');
      eventDot.classList.add('event-dot');
      dayCell.appendChild(eventDot);
    }

    // Click event to add important text
    dayCell.addEventListener('click', () => {
      const userInput = prompt('Enter an important note for this day:');
      if (userInput) {
        localStorage.setItem(`${year}-${month}-${day}`, userInput);
        displayCalendar(currentMonth, currentYear); // Re-render the calendar
      }
    });

    // Click event to add an event (represented by a dot)
    dayCell.addEventListener('dblclick', () => {
      const eventInput = prompt('Enter an event for this day:');
      if (eventInput) {
        localStorage.setItem(`${year}-${month}-${day}-event`, eventInput);
        displayCalendar(currentMonth, currentYear); // Re-render the calendar
      }
    });

    calendarGrid.appendChild(dayCell);
  }
}

// Event listeners for month navigation buttons
prevMonthBtn.addEventListener('click', () => {
  currentMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  if (currentMonth === 11) currentYear--;
  displayCalendar(currentMonth, currentYear);
});

nextMonthBtn.addEventListener('click', () => {
  currentMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  if (currentMonth === 0) currentYear++;
  displayCalendar(currentMonth, currentYear);
});

// Initial display of the calendar
displayCalendar(currentMonth, currentYear);
