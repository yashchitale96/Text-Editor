// ---------------------------------------------- Global Variables starts here--------------------------------------------- //
const canvas = document.getElementById('canvas');
const fontFamilySelector = document.getElementById('font-family-selector');
const fontSizeInput = document.getElementById('font_size');
const colorPicker = document.getElementById('color-picker');

let activeTextElement = null;
let offsetX, offsetY, isDragging = false;

// Text element-specific history
let textElementHistories = {};
let textElementHistoryIndices = {};

// ------------------------------------------------- Global Variables ends here ---------------------------------------------- //



// --------------------------------------------- Event handlers starts here ------------------------------------------------- //
// Event Listeners
// canvas.addEventListener('click', handleCanvasClick);
fontFamilySelector.addEventListener('change', applyFontFamily);
fontSizeInput.addEventListener('input', applyFontSize);
colorPicker.addEventListener('input', applyFontColor);

// --------------------------------------------- Event handlers ends here  ------------------------------------------------- //



// --------------------------------------------- Text Element property starts here ------------------------------------------------- //
function handleCanvasClick(e) {
    const clickedElement = e.target;
    if (clickedElement.classList.contains('textElement')) {
        setActiveTextElement(clickedElement);
        applyFontFamily();
    }
}

function applyFontFamily() {
    if (activeTextElement) {
        activeTextElement.style.fontFamily = fontFamilySelector.value;
        handleTextElementInput();
    }
}

function applyFontSize() {
    if (activeTextElement) {
        activeTextElement.style.fontSize = `${fontSizeInput.value}px`;
        handleTextElementInput();
    }
}

function applyFontColor() {
    if (activeTextElement) {
        activeTextElement.style.color = colorPicker.value;
        handleTextElementInput();
    }
}

// --------------------------------------------- Text Element property ends here ----------------------------------------------------//


// --------------------------------------------- Text element functions starts here  ----------------------------------------------------//

document.getElementById('btn-delete').disabled = true;
document.getElementById('btn-delete').style.backgroundColor = 'gray';
document.getElementById('btn-delete').style.cursor = 'not-allowed';

let textElementId = 0;
function addText() {
    const textElement = createTextElement();
    setupTextElementEvents(textElement);
    textElement.setAttribute('data-image-index', slideIndex); // Associate the text element with the current slide
    // canvas.appendChild(textElement);

    // Get the current slide
    const slides = document.getElementsByClassName("mySlides");
    const currentSlide = slides[slideIndex - 1];

    // Append the text element to the current slide
    currentSlide.appendChild(textElement);

    // Increment the counter
    textElementId++;

    saveTextElementToFirebase(textElement, slideIndex);

    setActiveTextElement(textElement);
    updateDeleteButton();
    // Initialize history and historyIndex for the new text element
    history = [textElement.innerHTML];
    historyIndex = 0;
    updateUndoRedoButtons();
}

function createTextElement(textElementData) {
    const textElement = document.createElement('p');
    textElement.id = textElementData ? textElementData.id : 'textElement ' + textElementId; // Assign a unique ID to the text element
    textElement.className = 'textElement';
    textElement.contentEditable = true;
    textElement.innerText = textElementData ? textElementData.innerText : 'Add Text';
    textElement.style.fontSize = textElementData ? textElementData.fontSize : `${fontSizeInput.value}px`;
    textElement.style.color = textElementData ? textElementData.color : colorPicker.value;
    textElement.style.fontFamily = textElementData ? textElementData.fontFamily : fontFamilySelector.value;
    textElement.style.left = textElementData ? textElementData.left : '150px';
    textElement.style.top = textElementData ? textElementData.top : '200px';
    textElement.spellcheck = false;
    textElement.style.background = 'transparent'
    return textElement;
}

function setupTextElementEvents(textElement) {
    textElement.addEventListener('input', handleTextElementInput);
    textElement.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);
    textElement.addEventListener('focus', handleTextFocus);
    textElement.style.cursor = 'move';  // Change the cursor to a move cursor

    // Add an event listener for the 'input' event, which is triggered when the user types in the text element
    textElement.addEventListener('input', function() {
        saveTextElementToFirebase(textElement);
    });

    // Add an event listener for the 'blur' event, which is triggered when the text element loses focus
    textElement.addEventListener('blur', function() {
        saveTextElementToFirebase(textElement);
    });
}

function updateDeleteButton() {
    const deleteButton = document.getElementById('btn-delete');
    if (activeTextElement) {
        deleteButton.disabled = false;
        deleteButton.style.backgroundColor = '#8A2BE2';
        deleteButton.style.cursor = 'pointer';
    } else {
        deleteButton.disabled = true;
        deleteButton.style.backgroundColor = 'gray';
        deleteButton.style.cursor = 'not-allowed';
    }
}

function handleCanvasClick(e) {
    const clickedElement = e.target;
    if (clickedElement.classList.contains('textElement')) {
        setActiveTextElement(clickedElement);
        applyFontFamily();
    } else {
        setActiveTextElement(null);
    }
    updateDeleteButton();
}

function deleteText() {
    if (activeTextElement) {
        // canvas.removeChild(activeTextElement);

        // Get the current slide
        const slides = document.getElementsByClassName("mySlides");
        const currentSlide = slides[slideIndex - 1];
 
        // Remove the active text element from the current slide
        currentSlide.removeChild(activeTextElement);

        setActiveTextElement(null);
        updateDeleteButton();
        updateUndoRedoButtons();
    }
}

function handleTextFocus() {
    if (activeTextElement && activeTextElement.innerText === 'Add Text') {
        activeTextElement.innerText = '';
        activeTextElement.removeEventListener('focus', handleTextFocus);
    }
}

// --------------------------------------------- Text element functions ends here  ----------------------------------------------------//



// -------------------------------------------- Text element drag and drop funtion starts here -----------------------------------------------------//

let dragStartState = null;

function startDragging(e) {
    if (activeTextElement) {
        isDragging = true;
        offsetX = e.clientX - activeTextElement.getBoundingClientRect().left;
        offsetY = e.clientY - activeTextElement.getBoundingClientRect().top;

        // Store the initial state before dragging starts
        dragStartState = {
            html: activeTextElement.innerHTML,
            fontSize: activeTextElement.style.fontSize,
            color: activeTextElement.style.color,
            fontFamily: activeTextElement.style.fontFamily,
            left: activeTextElement.style.left,
            top: activeTextElement.style.top
        };

         // Ensure that textElementHistories[activeTextElement.id] is an array
         if (!(activeTextElement.id in textElementHistories)) {
            textElementHistories[activeTextElement.id] = [];
            textElementHistoryIndices[activeTextElement.id] = -1;
        }

        // Push the initial state to the history
        textElementHistories[activeTextElement.id] = textElementHistories[activeTextElement.id].slice(0, textElementHistoryIndices[activeTextElement.id] + 1);
        textElementHistories[activeTextElement.id].push(dragStartState);
        textElementHistoryIndices[activeTextElement.id]++;
    }
}

function drag(e) {
    if (isDragging) {
        const textDiv = document.querySelector('.text');
        const textDivRect = textDiv.getBoundingClientRect();
        const textElementRect = activeTextElement.getBoundingClientRect();

        let newLeft = e.clientX - offsetX;
        let newTop = e.clientY - offsetY;

        // Check boundaries
        if (newLeft < textDivRect.left) {
            newLeft = textDivRect.left;
        } else if (newLeft + textElementRect.width > textDivRect.right) {
            newLeft = textDivRect.right - textElementRect.width;
        }

        if (newTop < textDivRect.top) {
            newTop = textDivRect.top;
        } else if (newTop + textElementRect.height > textDivRect.bottom) {
            newTop = textDivRect.bottom - textElementRect.height;
        }

        activeTextElement.style.left = `${newLeft - textDivRect.left}px`;
        activeTextElement.style.top = `${newTop - textDivRect.top}px`;
        handleTextElementInput();
    }
}

function stopDragging() {
    if (activeTextElement) {
        isDragging = false;

         // Get the final state
        const dragEndState = {
            html: activeTextElement.innerHTML,
            fontSize: activeTextElement.style.fontSize,
            color: activeTextElement.style.color,
            fontFamily: activeTextElement.style.fontFamily,
            left: activeTextElement.style.left,
            top: activeTextElement.style.top
        };

        // Only push the final state to the history if the position has changed
        if (activeTextElement.id in textElementHistories && activeTextElement.id in textElementHistoryIndices &&
            dragEndState.left !== textElementHistories[activeTextElement.id][textElementHistoryIndices[activeTextElement.id]].left || 
            dragEndState.top !== textElementHistories[activeTextElement.id][textElementHistoryIndices[activeTextElement.id]].top) {
            textElementHistories[activeTextElement.id].push(dragEndState);
            textElementHistoryIndices[activeTextElement.id]++;
        }

        updateUndoRedoButtons();
    }
}


// -------------------------------------------- Text element drag and drop funtion ends here -----------------------------------------------------//



function setActiveTextElement(element) {
    if (activeTextElement) {
        activeTextElement.classList.remove('active');
    }
    activeTextElement = element;
    if (activeTextElement) {
        activeTextElement.classList.add('active');
    }

    updateUndoRedoButtons();
}

    undoButton = document.getElementById('undo');
    redoButton = document.getElementById('redo');
    redoButton.disabled = true;
    undoButton.disabled = true;
    redoButton.style.backgroundColor = 'gray';
    undoButton.style.backgroundColor = 'gray';
    redoButton.style.cursor = 'not-allowed';
    undoButton.style.cursor = 'not-allowed';


// History Functions
let history = [];
let historyIndex = -1;

function handleTextElementInput() {
    const currentState = {
        html: activeTextElement.innerHTML,
        fontSize: activeTextElement.style.fontSize,
        color: activeTextElement.style.color,
        fontFamily: activeTextElement.style.fontFamily,
        left: activeTextElement.style.left,
        top: activeTextElement.style.top
    };

    if (!textElementHistories[activeTextElement.id]) {
        textElementHistories[activeTextElement.id] = [];
        textElementHistoryIndices[activeTextElement.id] = -1;
    }

    if (JSON.stringify(currentState) !== JSON.stringify(textElementHistories[activeTextElement.id][textElementHistoryIndices[activeTextElement.id]])) {
        textElementHistories[activeTextElement.id] = textElementHistories[activeTextElement.id].slice(0, textElementHistoryIndices[activeTextElement.id] + 1);
        textElementHistories[activeTextElement.id].push(currentState);
        textElementHistoryIndices[activeTextElement.id] = textElementHistories[activeTextElement.id].length - 1;
        updateUndoRedoButtons();

        // Save the history to Firebase
        const historyRef = firebase.database().ref('histories/' + activeTextElement.id);
        historyRef.set(textElementHistories[activeTextElement.id]);
    }
}


// ------------------------------------------------------- Undo Redo starts here -----------------------------------------------------------------------------------------------//

function undo() {
    if (textElementHistoryIndices[activeTextElement.id] > 0) {
        textElementHistoryIndices[activeTextElement.id]--;
        const state = textElementHistories[activeTextElement.id][textElementHistoryIndices[activeTextElement.id]];
        activeTextElement.innerHTML = state.html;
        activeTextElement.style.fontSize = state.fontSize;
        activeTextElement.style.color = state.color;
        activeTextElement.style.fontFamily = state.fontFamily;
        activeTextElement.style.left = parseFloat(state.left) + 'px';
        activeTextElement.style.top = parseFloat(state.top) + 'px';
        updateUndoRedoButtons();
        updateInputFields();
    }
}

function redo() {

    if (textElementHistoryIndices[activeTextElement.id] < textElementHistories[activeTextElement.id].length - 1) {
        textElementHistoryIndices[activeTextElement.id]++;
        const state = textElementHistories[activeTextElement.id][textElementHistoryIndices[activeTextElement.id]];
        activeTextElement.innerHTML = state.html;
        activeTextElement.style.fontSize = state.fontSize;
        activeTextElement.style.color = state.color;
        activeTextElement.style.fontFamily = state.fontFamily;
        activeTextElement.style.left = state.left;
        activeTextElement.style.top = state.top;
        updateUndoRedoButtons();
        updateInputFields();
    }
}

function updateUndoRedoButtons() {
    if (activeTextElement && textElementHistories[activeTextElement.id] && textElementHistories[activeTextElement.id].length > 0) {
        if (textElementHistoryIndices[activeTextElement.id] > 0) {
            undoButton.disabled = false;
            undoButton.style.backgroundColor = '#8A2BE2'; 
            undoButton.style.cursor = 'pointer';
        } else {
            undoButton.disabled = true;
            undoButton.style.backgroundColor = 'gray'; 
            undoButton.style.cursor = 'not-allowed';
        }

        if (textElementHistoryIndices[activeTextElement.id] < textElementHistories[activeTextElement.id].length - 1) {
            redoButton.disabled = false;
            redoButton.style.backgroundColor = '#8A2BE2';
            redoButton.style.cursor = 'pointer';
        } else {
            redoButton.disabled = true;
            redoButton.style.backgroundColor = 'gray';
            redoButton.style.cursor = 'not-allowed';
        }
    } else {
        undoButton.disabled = true;
        undoButton.style.backgroundColor = 'gray'; 
        undoButton.style.cursor = 'not-allowed';
        redoButton.disabled = true;
        redoButton.style.backgroundColor = 'gray';
        redoButton.style.cursor = 'not-allowed';
    }
}

function deleteTextElement() {
    if (activeTextElement) {
        const deletedElement = canvas.removeChild(activeTextElement);
        history.push({ action: 'delete', element: deletedElement });
        historyIndex++;
        activeTextElement = null;
        updateUndoRedoButtons();
    }
}

function updateInputFields() {
    if (activeTextElement) {
        fontSizeInput.value = parseInt(activeTextElement.style.fontSize);
        colorPicker.value = activeTextElement.style.color;
        fontFamilySelector.value = activeTextElement.style.fontFamily;
    }
}

// ------------------------------------------------------------ Undo Redo ends here -----------------------------------------------------------------------------------------------//



// -------------------------------------------------------------Slides Functions start here -------------------------------------------------------------//
let slideIndex = 1;
showSlides(slideIndex);

// Next/previous controls
function plusSlides(n) {
    showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("mySlides");
    let dots = document.getElementsByClassName("dot");
    if (n > slides.length) {slideIndex = 1}
    if (n < 1) {slideIndex = slides.length}
    for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
      // Remove the event listener from all slides
      slides[i].removeEventListener('click', handleCanvasClick);
    }
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }

    slides[slideIndex-1].style.display = "block";
    dots[slideIndex-1].className += " active";
    slides[slideIndex-1].addEventListener('click', handleCanvasClick);
}

function rgbToHex(rgb) {
    const result = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(rgb);
    return result ? "#" +
        ("0" + parseInt(result[1], 10).toString(16)).slice(-2) +
        ("0" + parseInt(result[2], 10).toString(16)).slice(-2) +
        ("0" + parseInt(result[3], 10).toString(16)).slice(-2) : null;
}

function updateInputFields() {
    if (activeTextElement) {
        fontSizeInput.value = parseInt(activeTextElement.style.fontSize);
        colorPicker.value = rgbToHex(activeTextElement.style.color);
        fontFamilySelector.value = activeTextElement.style.fontFamily;
    }
}

// -------------------------------------------------------------Slides Functions start here -------------------------------------------------------------//

// ------------------------------------------------------------- Reorder Slides starts here -------------------------------------------------------------//

function swapSlides(index1, index2) {
    const slides = document.getElementsByClassName("mySlides");
    if (index1 < 0 || index2 < 0 || index1 >= slides.length || index2 >= slides.length) {
      console.error('One or both indices are out of bounds');
      return;
    }
  
    const slide1 = slides[index1];
    const slide2 = slides[index2];
  
    const clone1 = slide1.cloneNode(true);
    const clone2 = slide2.cloneNode(true);
  
    slide1.parentNode.replaceChild(clone2, slide1);
    slide2.parentNode.replaceChild(clone1, slide2);

    // Re-attach event listeners to the text elements in the swapped slides
    const textElements1 = clone1.getElementsByClassName('textElement');
    for (let i = 0; i < textElements1.length; i++) {
        setupTextElementEvents(textElements1[i]);
    }

    const textElements2 = clone2.getElementsByClassName('textElement');
    for (let i = 0; i < textElements2.length; i++) {
        setupTextElementEvents(textElements2[i]);
    }

}

let draggedDotIndex = null;
const dots = document.getElementsByClassName("dot");

// Add event listeners for the drag events
for (let i = 0; i < dots.length; i++) {
  dots[i].addEventListener("dragstart", function(event) {
    draggedDotIndex = i;
    event.target.style.opacity = "0.5"; // Give user feedback that drag has started
  });

  dots[i].addEventListener("dragend", function(event) {
    event.target.style.opacity = ""; // Reset opacity after drag
  });

  dots[i].addEventListener("dragover", function(event) {
    event.preventDefault();
  });

  dots[i].addEventListener("drop", function(event) {
    if (draggedDotIndex !== null) {
      swapSlides(draggedDotIndex, i);
      draggedDotIndex = null;
    }
  });
}

// ------------------------------------------------------------- Reorder Slides ends here -------------------------------------------------------------//



// ------------------------------------------------------------- Firebase starts here -------------------------------------------------------------//

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCuCmc3ay-nHxS_vk29_l9laMbij6xySUA",
    authDomain: "text-editor-bdc53.firebaseapp.com",
    projectId: "text-editor-bdc53",
    storageBucket: "text-editor-bdc53.appspot.com",
    messagingSenderId: "289533383602",
    appId: "1:289533383602:web:80028f202736a96ea2caab",
    measurementId: "G-E9MB100VP4"
  };

  // Initialize Firebase

  firebase.initializeApp(firebaseConfig);

var db = firebase.database();


function saveCurrentSlideToFirebase() {
    // Get the current slide
    const slides = Array.from(document.getElementsByClassName("mySlides"));
    const currentSlide = slides[slideIndex - 1];

    // Get the index of the current slide
    const currentSlideIndex = slides.indexOf(currentSlide) + 1;

    // Get the img element in the current slide
    const imgElement = currentSlide.getElementsByTagName('img')[0];

    // Save the current slide to Firebase
    const slideRef = db.ref('slides/' + currentSlideIndex);
    slideRef.set({
        imgSrc: imgElement ? imgElement.src : null, // Save the src of the img element
    });

    // Get the text elements in the current slide
    const textElements = currentSlide.getElementsByClassName("textElement");

    // Loop over the text elements
    for (let j = 0; j < textElements.length; j++) {
        const textElement = textElements[j];

        // Save the text element to Firebase
        saveTextElementToFirebase(textElement, currentSlideIndex);
    }
}

function saveTextElementToFirebase(textElement) {
    // Get the current slide
    const slides = Array.from(document.getElementsByClassName("mySlides"));
    const currentSlide = slides[slideIndex - 1];

    // Get the index of the current slide
    const currentSlideIndex = slides.indexOf(currentSlide) + 1;

    // Save the text element to Firebase
    const textElementRef = firebase.database().ref('slides/' + currentSlideIndex + '/textElements/' + textElement.id);
    textElementRef.set({
        id: textElement.id,
        innerText: textElement.innerText,
        fontSize: textElement.style.fontSize,
        color: textElement.style.color,
        fontFamily: textElement.style.fontFamily,
        left: textElement.style.left,
        top: textElement.style.top
    });
}

// Get the save button
const saveButton = document.getElementById('saveButton');

// Add an event listener to the save button
saveButton.addEventListener('click', saveCurrentSlideToFirebase);


window.onload = function() {
    // Get a reference to the slides in your Firebase database
    var slidesRef = firebase.database().ref('slides');
    // Retrieve slides data from Firebase when the webpage loads
    slidesRef.once('value', (snapshot) => {
        const data = snapshot.val();
        console.log('Data from Firebase:', data); // Log the data from Firebase
        if (data) {
            // Get all the slide elements on the webpage
            const slideElements = document.getElementsByClassName('mySlides');

            // Loop through the slides data
            for (let slideIndex in data) {
                // Get the slide data
                const slideData = data[slideIndex];

                // Get the current slide element on the webpage
                const slideElement = slideElements[slideIndex - 1];

                // If the slide element exists, update its data
                if (slideElement) {
                    // If there is an imgSrc, create an img element and append it to the slide
                    if (slideData.imgSrc) {
                        // Get the existing img element if it exists
                        const existingImgElement = slideElement.getElementsByTagName('img')[0];
                        if (existingImgElement) {
                            // If the existing image source is not the same as the new source, update it
                            if (existingImgElement.src !== slideData.imgSrc) {
                                existingImgElement.src = slideData.imgSrc;
                            }
                        } else {
                            // Create a new img element and append it to the slide
                            const imgElement = document.createElement('img');
                            imgElement.src = slideData.imgSrc;
                            slideElement.appendChild(imgElement);
                        }
                    }

                    // If there are text elements, create them and append them to the slide
                    if (slideData.textElements) {
                        for (let textElementId in slideData.textElements) {
                            const textElementData = slideData.textElements[textElementId];
                            const textElement = createTextElement(textElementData);
                            slideElement.appendChild(textElement);
                            setupTextElementEvents(textElement);
                        }
                    }
                }
            }
        }
    });

    // Get a reference to the histories in your Firebase database
    var historiesRef = firebase.database().ref('histories');
    // Retrieve histories data from Firebase when the webpage loads
    historiesRef.once('value', (snapshot) => {
        const data = snapshot.val();
        console.log('Histories from Firebase:', data); // Log the histories from Firebase
        if (data) {
            // Loop through the histories data
            for (let textElementId in data) {
                // Get the history data
                const historyData = data[textElementId];

                // Update the history and history index for the text element
                textElementHistories[textElementId] = historyData;
                textElementHistoryIndices[textElementId] = historyData.length - 1;
            }
        }
    });

}

// ------------------------------------------------------------- Firebase ends here -------------------------------------------------------------//


