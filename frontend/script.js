/* Screen Management */
const screens = document.querySelectorAll(".screen");
function showScreen(screenId) {
    screens.forEach(function(screen) {
        screen.classList.remove("active");
    });

    const targetScreen =
        document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add("active");
    }
}


/* DOM elements */
// Camera
const cameraButton =
    document.getElementById("camera-button");

const captureButton =
    document.getElementById("capture-button");

const closeCameraButton =
    document.getElementById("close-camera-button");

const cameraModal =
    document.getElementById("camera-modal");

const cameraVideo =
    document.getElementById("camera-video");

const cameraCanvas =
    document.getElementById("camera-canvas");

// Upload
const uploadButton =
    document.getElementById("upload-button");

const imageInput =
    document.getElementById("image-input");

// Preview
const capturedPreview =
    document.getElementById("captured-preview");

// Navigation
const continueButton =
    document.getElementById("continue-button");

const disposalButton =
    document.getElementById("disposal-button");

const recommendationButton =
    document.getElementById("recommendation-button");

const scanAgainButton =
    document.getElementById("scan-again-button");

/* Variables */
let cameraStream = null;
let currentResult = null;
let currentImageURL = null;

/*
   Keeps track of which recommendation should be shown
   next for each waste item.
   Example:banana_peel → 0, plastic_bottle → 1,battery → 0
*/

let recommendationIndexes = {};
/* Camera */
if (cameraButton) {
    cameraButton.addEventListener(
        "click",
        openCamera
    );
}

async function openCamera() {
    try {
        cameraStream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment"
                },
                audio: false
            });

        cameraVideo.srcObject =
            cameraStream;

        cameraModal.classList.add(
            "active"
        );

    } catch (error) {
        console.error(
            "Camera error:",
            error
        );

        alert(
            "Unable to access the camera. Please allow camera permission."
        );
    }
}

/* Close Camera */
if (closeCameraButton) {
    closeCameraButton.addEventListener(
        "click",
        closeCamera
    );
}

function closeCamera() {
    if (cameraModal) {
        cameraModal.classList.remove(
            "active"
        );
    }

    if (cameraStream) {
        cameraStream
            .getTracks()
            .forEach(function(track) {
                track.stop();
            });
        cameraStream = null;
    }

    if (cameraVideo) {
        cameraVideo.srcObject = null;

    }
}

/* Capture Photo */
if (captureButton) {
    captureButton.addEventListener(
        "click",
        capturePhoto
    );
}

function capturePhoto() {
    if (
        !cameraVideo ||
        !cameraVideo.videoWidth ||
        !cameraVideo.videoHeight
    ) {
        alert(
            "Camera is not ready yet."
        );
        return;
    }

    cameraCanvas.width = cameraVideo.videoWidth;
    cameraCanvas.height = cameraVideo.videoHeight;

    const context = cameraCanvas.getContext("2d");

    context.drawImage(
        cameraVideo,
        0,
        0,
        cameraCanvas.width,
        cameraCanvas.height
    );

    cameraCanvas.toBlob(
        function(blob) {
            closeCamera();
            setImagePreview(blob);
            analyzeImage(blob);
        },
        "image/jpeg",
        0.9
    );
}


/*Image Upload */
if (uploadButton) {
    uploadButton.addEventListener(
        "click",
        function() {
            imageInput.click();
        }
    );
}

if (imageInput) {
    imageInput.addEventListener(
        "change",
        handleImageUpload
    );
}

function handleImageUpload(event) {
    const file =
        event.target.files[0];
    if (!file) {
        return;
    }

    if (
        !file.type.startsWith("image/")
    ) {
        alert(
            "Please select an image file."
        );
        imageInput.value = "";
        return;
    }

    setImagePreview(file);
    analyzeImage(file);
}

/* Image Preview */
function setImagePreview(imageFile) {
    if (currentImageURL) {
        URL.revokeObjectURL(
            currentImageURL
        );
    }

    currentImageURL =
        URL.createObjectURL(
            imageFile
        );

    if (capturedPreview) {
        capturedPreview.src =
            currentImageURL;
    }
}
/* Send Image to Flask */
async function analyzeImage(imageFile) {
    showScreen(
        "analyzing-screen"
    );

    const formData =
        new FormData();

    formData.append(
        "image",
        imageFile,
        "waste.jpg"
    );

    try {
        console.log(
            "Sending image to Flask..."
        );

        const response =
            await fetch(
                "/analyze",
                {
                    method: "POST",
                    body: formData
                }
            );

        console.log(
            "Flask response status:",
            response.status
        );

        const data =
            await response.json();

        console.log(
            "EcoSense result:",
            data
        );

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Image analysis failed."
            );

        }

        currentResult =
            data;

        displayIdentification(
            data
        );

    } catch (error) {
        console.error(
            "Analysis error:",
            error
        );

        alert(
            "EcoSense could not analyze this image.\n\n" +
            "Please check the Flask terminal for the error."
        );

        showScreen(
            "scan-screen"
        );
    }
}

/* Identifiaction Screen */
function displayIdentification(data) {
    const itemName =
        document.getElementById(
            "item-name"
        );

    const itemCategory =
        document.getElementById(
            "item-category"
        );

    const itemIcon =
        document.getElementById(
            "item-icon"
        );

    if (!data.identified) {
        if (itemName) {
            itemName.textContent =
                "Item not confidently identified";
        }

        if (itemCategory) {
            itemCategory.textContent =
                "Manual verification recommended";
        }

        if (itemIcon) {
            itemIcon.textContent =
                "❓";
        }

        showScreen(
            "identified-screen"
        );

        return;
    }

    if (itemName) {
        itemName.textContent =
            data.item;
    }

    if (itemCategory) {
        itemCategory.textContent =
            data.category;
    }

    if (itemIcon) {
        itemIcon.textContent =
            getItemIcon(
                data.item
            );
    }

    showScreen(
        "identified-screen"
    );
}


/* Item Icons */
function getItemIcon(item) {
    const name =
        item.toLowerCase();

    if (
        name.includes("banana")
    ) {
        return "🍌";
    }

    if (
        name.includes("vegetable")
    ) {
        return "🥕";
    }

    if (
        name.includes("cardboard")
    ) {
        return "📦";
    }

    if (
        name.includes("paper")
    ) {
        return "📄";
    }

    if (
        name.includes("plastic bottle")
    ) {
        return "🧴";
    }

    if (
        name.includes("bread") ||
        name.includes("chips")
    ) {
        return "🍞";
    }

    if (
        name.includes("pen") ||
        name.includes("stationery")
    ) {
        return "✏️";
    }

    if (
        name.includes("wire")
    ) {
        return "🔌";
    }

    if (
        name.includes("battery")
    ) {
        return "🔋";
    }

    if (
        name.includes("medicine")
    ) {
        return "💊";
    }

    if (
        name.includes("syringe") ||
        name.includes("needle")
    ) {
        return "💉";
    }

    if (
        name.includes("sanitary")
    ) {
        return "🩸";
    }

    return "♻️";
}

/* Continue Pathway */
if (continueButton) {
    continueButton.addEventListener(
        "click",
        function() {

            if (!currentResult) {
                return;
            }

            displayPathway(
                currentResult
            );

            showScreen(
                "pathway-screen"
            );
        }
    );
}

/* Psthway Screen */
function displayPathway(data) {
    const pathwayItem =
        document.getElementById(
            "pathway-item"
        );

    const pathwayBin =
        document.getElementById(
            "pathway-bin"
        );

    const pathwayName =
        document.getElementById(
            "pathway-name"
        );

    const immediateAction =
        document.getElementById(
            "immediate-action"
        );

    if (pathwayItem) {
        pathwayItem.textContent =
            getItemIcon(
                data.item
            );
    }

    if (pathwayBin) {
        pathwayBin.textContent =
            getBinIcon(
                data.bin
            );
    }

    if (pathwayName) {
        pathwayName.textContent =
            data.bin;
    }

    if (immediateAction) {
        immediateAction.textContent =
            data.immediate_action;
    }
}

/* Bin Icons */
function getBinIcon(bin) {
    const name =
        bin.toLowerCase();

    if (
        name.includes("green")
    ) {
        return "🟢";
    }

    if (
        name.includes("blue")
    ) {
        return "🔵";
    }

    if (
        name.includes("e-waste")
    ) {
        return "🟣";
    }

    if (
        name.includes("medical") ||
        name.includes("sanitary")
    ) {
        return "🟠";

    }

    return "⚫";
}

/* Disposal Screens */
if (disposalButton) {
    disposalButton.addEventListener(
        "click",
        function() {

            if (!currentResult) {
                return;
            }

            displayDisposal(
                currentResult
            );

            showScreen(
                "disposal-screen"
            );

            startDisposalAnimation();
        }
    );
}
/* Display Disposal */
function displayDisposal(data) {

    const description =
        document.getElementById(
            "disposal-description"
        );

    const fallingItem =
        document.getElementById(
            "falling-item"
        );

    const binSymbol =
        document.getElementById(
            "bin-symbol"
        );

    const disposalPathwayLabel =
        document.getElementById(
            "disposal-pathway-label"
        );

    if (description) {
        description.textContent =
            data.immediate_action;
    }

    if (fallingItem) {
        fallingItem.textContent =
            getItemIcon(
                data.item
            );
    }

    if (binSymbol) {
        binSymbol.textContent =
            getBinIcon(
                data.bin
            );
    }

    if (disposalPathwayLabel) {
        disposalPathwayLabel.textContent =
            data.bin;
    }
}

/* Disposal Animation */
function startDisposalAnimation() {
    const item =
        document.getElementById(
            "falling-item"
        );

    const lid =
        document.getElementById(
            "bin-lid"
        );

    if (!item || !lid) {
        return;
    }

    item.classList.remove(
        "drop"
    );

    lid.classList.remove(
        "open"
    );

    lid.classList.remove(
        "close"
    );

    void item.offsetWidth;
    
    setTimeout(
        function() {
            lid.classList.add(
                "open"
            );
        },
        300
    );

    setTimeout(
        function() {
            item.classList.add(
                "drop"
            );
        },
        700
    );

    setTimeout(
        function() {
            lid.classList.remove(
                "open"
            );

            lid.classList.add(
                "close"
            );
        },
        2500
    );
}

/* Recommendation Screen */
if (recommendationButton) {
    recommendationButton.addEventListener(
        "click",
        function() {
            if (!currentResult) {
                return;
            }

            displayRecommendation(
                currentResult
            );

            showScreen(
                "recommendation-screen"
            );
        }
    );
}

/* Display Rotating Recommendation */
function displayRecommendation(data) {
    const introduction =
        document.getElementById(
            "recommendation-introduction"
        );

    const icon =
        document.getElementById(
            "recommendation-icon"
        );

    const name =
        document.getElementById(
            "recommendation-name"
        );

    const type =
        document.getElementById(
            "recommendation-type"
        );

    const procedure =
        document.getElementById(
            "procedure"
        );

    const benefit =
        document.getElementById(
            "benefit"
        );

    const safetyLevel =
        document.getElementById(
            "safety-level"
        );

    const safetyNote =
        document.getElementById(
            "safety-note"
        );

    /* Safety Information */
    if (safetyLevel) {
        safetyLevel.textContent =
            data.safety_level ||
            "Not specified";
    }

    if (safetyNote) {
        safetyNote.textContent =
            data.safety_note ||
            "Follow appropriate local waste-management guidance.";
    }

    /* No alternative */
    if (
        !data.alternatives ||
        data.alternatives.length === 0
    ) {
        if (introduction) {
            introduction.textContent =
                "No additional reuse option is recommended. Follow the safe disposal guidance.";
        }

        if (icon) {
            icon.textContent =
                "⚠️";
        }

        if (name) {
            name.textContent =
                "Safe Disposal";
        }

        if (type) {
            type.textContent =
                "Disposal";
        }

        if (procedure) {
            procedure.innerHTML =
                "<p>Follow the recommended disposal pathway.</p>";
        }

        if (benefit) {
            benefit.textContent =
                data.safety_note ||
                "Follow appropriate local waste-management guidance.";
        }
        return;
    }

    /* Create Unique Key for Current Item*/
    const itemKey =
        data.item
            .toLowerCase()
            .replace(
                /[^a-z0-9]+/g,
                "_"
            );

    /* Get current recomendation Index */
    if (
        recommendationIndexes[itemKey] === undefined
    ) {
        recommendationIndexes[itemKey] = 0;
    }

    const currentIndex =
        recommendationIndexes[itemKey];

    const alternative =
        data.alternatives[
            currentIndex
        ];

    /* Move to Recomendation */
    recommendationIndexes[itemKey] =
        (
            currentIndex + 1
        ) %
        data.alternatives.length;

    console.log(
        "Recommendation:",
        alternative.name
    );

    /* Dispaly Recommendation */
    if (introduction) {
        introduction.textContent =
            "Here is a verified option you can consider before disposal.";
    }

    if (icon) {
        icon.textContent =
            getAlternativeIcon(
                alternative.type
            );
    }

    if (name) {
        name.textContent =
            alternative.name;
    }

    if (type) {
        type.textContent =
            alternative.type;
    }

    /* Display Procedure */
    if (procedure) {
        procedure.innerHTML = "";

        const list =
            document.createElement(
                "ol"
            );

        alternative.procedure.forEach(
            function(step) {
                const li =
                    document.createElement(
                        "li"
                    );

                li.textContent =
                    step;

                list.appendChild(
                    li
                );
            }
        );

        procedure.appendChild(
            list
        );
    }

    /* Disposal Benefit */
    if (benefit) {
        benefit.textContent =
            alternative.benefit;
    }

    /*Safety Information */
    if (safetyLevel) {
        safetyLevel.textContent =
            data.safety_level ||
            "Not specified";
    }

    if (safetyNote) {
        safetyNote.textContent =
            data.safety_note ||
            "Follow appropriate local waste-management guidance.";
    }
}

/* Alternative Icons */

function getAlternativeIcon(type) {
    const name =
        type.toLowerCase();

    if (
        name.includes("compost")
    ) {
        return "🌱";
    }

    if (
        name.includes("reuse")
    ) {
        return "♻️";
    }

    if (
        name.includes("repurpose")
    ) {
        return "🔄";
    }

    if (
        name.includes("recovery")
    ) {
        return "♻️";
    }

    if (
        name.includes("disposal")
    ) {
        return "🗑️";
    }
    return "💡";
}

/* Scan Again */

if (scanAgainButton) {
    scanAgainButton.addEventListener(
        "click",
        function() {
            currentResult = null;

            if (imageInput) {
                imageInput.value = "";
            }

            if (capturedPreview) {
                capturedPreview.src = "";

            }

            if (currentImageURL) {
                URL.revokeObjectURL(
                    currentImageURL
                );
                currentImageURL = null;
            }

            showScreen(
                "scan-screen"
            );
        }
    );
}
/* Inital Load */
console.log(
    "EcoSense JavaScript loaded successfully."
);