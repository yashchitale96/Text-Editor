const canvas = document.getElementById('canvas');
const fontSizeInput = document.getElementById('font_size');
const fontColorInput = document.getElementById('color-picker');
const fontFamilySelect = document.getElementById('font-family-selector');
let activeTextElement = null;

canvas.addEventListener('click', (e) => {
    const clickedElement = e.target;
    if (clickedElement.classList.contains('textElement')) {
        setActiveTextElement(clickedElement);
    }
});
fontSizeInput.addEventListener('change', () => {
    if (activeTextElement) {                                 
        activeTextElement.style.fontSize = fontSizeInput.value + 'px';
    }
});
fontColorInput.addEventListener('change',()=> {
    if (activeTextElement) {
        activeTextElement.style.color = fontColorInput.value;
    }
});



function addText() {
    const textElement = document.createElement('div');
    textElement.className = 'textElement';
    textElement.contentEditable = true;
    textElement.innerText = 'Add Text';
    textElement.style.fontSize = fontSizeInput.value + 'px';
    textElement.style.color = fontColorInput.value;
    textElement.style.fontFamily = fontFamilySelect.value;
    textElement.style.left = '250px';
    textElement.style.top = '300px';

    makeDraggable(textElement);

    canvas.appendChild(textElement);
    setActiveTextElement(textElement);
}

function makeDraggable(element) {
    let offsetX, offsetY, isDragging = false;

    element.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - parseFloat(element.style.left);
        offsetY = e.clientY - parseFloat(element.style.top);
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            element.style.left = e.clientX - offsetX + 'px';
            element.style.top = e.clientY - offsetY + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

function setActiveTextElement(element) {
    if (activeTextElement) {
        activeTextElement.classList.remove('active');
    }
    activeTextElement = element;
    activeTextElement.classList.add('active');
}



function deleteText() {
    if (activeTextElement) {
        canvas.removeChild(activeTextElement);
        activeTextElement = null;
    }
}

function undo() {
    document.execCommand('undo', false, null);
}

function redo() {
    document.execCommand('redo', false, null);
}