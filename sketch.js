// Global parameters
const EASING_SPEED = 0.07;
const CLICK_THRESHOLD = 200; // Time threshold in milliseconds for quick clicks
let lastClickTime = 0; // Time of the last click

// Current position of the line's moving endpoint
let pos = {
  x: 0,  // Starting x position
  y: 0   // Starting y position
};

// Target position for the line's moving endpoint
let target = {
  x: 0,
  y: 0
};

// List to store the positions for the lines' origins and targets
let lines = [];

// WebSocket setup
const serverAddress = 'wss://DS25.glitch.me/';
const serverConnection = new WebSocket(serverAddress);

serverConnection.onopen = function() {
  console.log("Connected to the server on " + serverAddress);
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);  // Set initial background color
  noFill();       // No fill for the shapes by default

  // Initialize the first line at the starting position
  lines.push({
    start: { x: pos.x, y: pos.y },  // Start point of the first line
    end: { x: pos.x, y: pos.y },    // End point of the first line
    color: color(255)               // Default color (white) for the first line
  });
}

function draw() {
  // Draw all previously stored lines
  for (let i = 0; i < lines.length; i++) {
    let lineData = lines[i];
    stroke(lineData.color); // Set the stroke color for each line
    line(lineData.start.x, lineData.start.y, lineData.end.x, lineData.end.y);
  }

  // Easing effect to smoothly move the last line's endpoint towards the target
  if (lines.length > 0) {
    let lastLine = lines[lines.length - 1]; // Get the last line
    lastLine.end.x += EASING_SPEED * (target.x - lastLine.end.x);
    lastLine.end.y += EASING_SPEED * (target.y - lastLine.end.y);
    
    // Make the last line less opaque (easing line)
    strokeWeight(0.3); // Optional: Adjust stroke weight for easing lines
    stroke(255, 20); // Set stroke to white with alpha for easing line
    line(lastLine.start.x, lastLine.start.y, lastLine.end.x, lastLine.end.y); // Draw easing line

    // Update the start of the new line to be the end of the last line
    if (dist(lastLine.end.x, lastLine.end.y, target.x, target.y) < 1) {
      // If the last line's end is close to the target, create a new line
      lines.push({
        start: { x: lastLine.end.x, y: lastLine.end.y }, // Start from the last endpoint
        end: { x: lastLine.end.x, y: lastLine.end.y },   // End will be updated
        color: color(random(255), random(255), random(255)) // Random color for the new line
      });
    }
  }
}

// Mouse click event
function mouseClicked() {
  let currentTime = millis(); // Get the current time in milliseconds
  if (currentTime - lastClickTime < CLICK_THRESHOLD) {
    console.log("Quick click detected! Easing lines should be created in Rhino."); // Log quick clicks
  }
  lastClickTime = currentTime; // Update the last click time
  setTarget(mouseX, mouseY);
}

// Touch event for mobile devices
function touchStarted() {
  // Use the first touch point for target setting
  if (touches.length > 0) {
    setTarget(touches[0].x, touches[0].y);
  }
  return false; // Prevent default behavior
}

// Update target position
function setTarget(tx, ty) {
  target.x = tx;
  target.y = ty;

  // Send normalized coordinates to the server
  sendCoordinatesToServer(tx, ty);
}

// Send normalized coordinates to the server
function sendCoordinatesToServer(x, y) {
  // Normalize the coordinates to [0, 1]
  const normalizedCoordinates = {
    x: x / width,  // Normalized x coordinate
    y: y / height   // Normalized y coordinate
  };

  // Check if the WebSocket is open before sending
  if (serverConnection.readyState === WebSocket.OPEN) {
    console.log("Sending coordinates to server:", normalizedCoordinates); // Log the normalized coordinates
    serverConnection.send(JSON.stringify(normalizedCoordinates)); // Send the normalized coordinates as a JSON string
  } else {
    console.error("WebSocket is not open. Cannot send data.");
  }
}

// Export line data with distance (Z height based on line length)
function exportLineDataWithDistance() {
  let lineData = lines.map(line => {
    let distance = dist(line.start.x, line.start.y, line.end.x, line.end.y); // Calculate distance
    return {
      start: { x: line.start.x, y: line.start.y, z: 0 },  // 2D point with zero Z
      end: { x: line.end.x, y: line.end.y, z: distance },  // Z value based on distance between points
      color: line.color.levels, // Export the color in RGB
      distance: distance  // Store distance for use as height
    };
  });

  saveJSON(lineData, 'lineDataWithHeight.json'); // Save the line data with height
}
