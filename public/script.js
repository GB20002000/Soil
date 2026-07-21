// ======================================
// HiveMQ Cloud Configuration
// ======================================
// ======================================
// OpenWeatherMap Configuration
// ======================================

const WEATHER_API_KEY = "1a75e1f696cd42bb37ecc614bb268ac3";
const WEATHER_CITY = "Coimbatore";
// const WEATHER_CITY = "Chennai";
const WEATHER_COUNTRY = "IN";
const broker = "wss://0c9f54b8cca94ea59f8084125bdf6929.s1.eu.hivemq.cloud:8884/mqtt";

let previousPumpState = "OFF";
let lastWateringTime = "00:00:00";

const options = {
    clientId: "webclient_" + Math.random().toString(16).substring(2, 8),
    username: "Soil_2026",
    password: "Soil_2026",
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 30000
};

// ======================================
// Connect MQTT
// ======================================

const client = mqtt.connect(broker, options);

// ======================================
// Connected
// ======================================

client.on("connect", () => {

    console.log("✅ Connected to HiveMQ");

   updateConnectionStatus(true);

    client.subscribe("smartirrigation/data", (err) => {

        if (err) {
            console.log("Subscribe Error :", err);
        } else {
            console.log("Subscribed to smartirrigation/data");
        }

    });

});

// ======================================
// Reconnecting
// ======================================

client.on("reconnect", () => {

    console.log("Reconnecting...");

});

// ======================================
// Offline
// ======================================

client.on("offline", () => {

    console.log("MQTT Offline");

updateConnectionStatus(false);

});

// ======================================
// Error
// ======================================

client.on("error", (err) => {

    console.log("MQTT Error");

    console.log(err);

});


// ======================================
// MQTT Message Watchdog
// ======================================

let lastMessageTime = Date.now();
const MESSAGE_TIMEOUT = 10000; // 10 seconds

// ======================================
// Convert Seconds to HH:MM:SS
// ======================================

function formatTime(totalSeconds) {

    totalSeconds = Number(totalSeconds) || 0;

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return (
        String(hours).padStart(2, "0") + ":" +
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0")
    );

}
// ======================================
// Receive MQTT Data
// ======================================

client.on("message", (topic, message) => {

    let data;
    lastMessageTime = Date.now();
updateConnectionStatus(true);

    try {

        data = JSON.parse(message.toString());

    }
    catch (e) {

        console.log("Invalid JSON");

        console.log(message.toString());

        return;

    }

    console.log(data);

    // Soil Moisture
    document.getElementById("soilValue").innerHTML =
        (data.soil ?? 0) + "%";

    document.getElementById("soilBar").style.width =
        (data.soil ?? 0) + "%";

    // Water Tank
    // document.getElementById("waterLevel").style.height =
    //     (data.soil ?? 0) + "%";

    // Soil Status
    document.getElementById("soilStatus").innerHTML =
        data.soilStatus ?? "--";

document.getElementById("temp").innerHTML =
    data.temperature + " °C";

document.getElementById("humidity").innerHTML =
    data.humidity + " %";

    // ======================================
// Pump Status
// ======================================

// Display Pump Status
document.getElementById("pumpText").innerHTML =
    data.pump ?? "OFF";

// Save Last Watering Time when Pump changes from ON -> OFF
if (previousPumpState === "ON" && data.pump === "OFF") {

    lastWateringTime = formatTime(data.pumpRuntime ?? 0);

    document.getElementById("lastWater").innerHTML =
        lastWateringTime;

}

// Remember current pump state
previousPumpState = data.pump ?? "OFF";

// Pump Indicator
if (data.pump === "ON") {

    document.getElementById("pumpIndicator").style.background = "#00ff00";
    document.getElementById("pumpIndicator").style.boxShadow =
        "0px 0px 15px #00ff00";

} else {

    document.getElementById("pumpIndicator").style.background = "red";
    document.getElementById("pumpIndicator").style.boxShadow =
        "0px 0px 15px red";

}

// Current Pump Timer
document.getElementById("timer").innerHTML =
    formatTime(data.pumpRuntime ?? 0);

    // Water Usage
    document.getElementById("todayWater").innerHTML =
        Number(data.waterUsage ?? 0).toFixed(2) + " L";

    // Auto Mode
    if (typeof data.autoMode !== "undefined") {

        document.getElementById("autoSwitch").checked = data.autoMode;

        document.getElementById("modeText").innerHTML =
            data.autoMode ? "AUTO MODE" : "MANUAL MODE";
    }

});

// ======================================
// Pump ON
// ======================================

document.getElementById("onBtn").addEventListener("click", () => {

    if (client.connected) {

        client.publish("smartirrigation/pump", "ON");

    } else {

        alert("MQTT Not Connected");

    }

});

// ======================================
// Pump OFF
// ======================================

document.getElementById("offBtn").addEventListener("click", () => {

    if (client.connected) {

        client.publish("smartirrigation/pump", "OFF");

    } else {

        alert("MQTT Not Connected");

    }

});

function updateClock()
{

    const now = new Date();

    let hour = now.getHours();

    let minute = now.getMinutes();

    let second = now.getSeconds();

    const ampm = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;

    hour = hour ? hour : 12;

    hour = String(hour).padStart(2,'0');

    minute = String(minute).padStart(2,'0');

    second = String(second).padStart(2,'0');

    document.getElementById("clock").innerHTML =
        `${hour}:${minute}:${second} ${ampm}`;

    document.getElementById("currentDate").innerHTML =
        now.toLocaleDateString('en-IN',
        {
            weekday:'long',
            day:'2-digit',
            month:'long',
            year:'numeric'
        });

}

updateClock();  

setInterval(updateClock,1000);


// ======================================
// Weather API
// ======================================

async function loadWeather() {

    try {

        const url =
            `https://api.openweathermap.org/data/2.5/weather?q=${WEATHER_CITY},${WEATHER_COUNTRY}&appid=${WEATHER_API_KEY}&units=metric`;

        const response = await fetch(url);

        const data = await response.json();

        if (data.cod != 200) {
            document.getElementById("weather").innerHTML = "Weather Error";
            return;
        }

        document.getElementById("weather").innerHTML =
            `${Math.round(data.main.temp)}°C | ${data.weather[0].main}`;

    }
    catch (err) {

        console.log(err);

        document.getElementById("weather").innerHTML =
            "Weather Offline";

    }

}

// Load once
loadWeather();

// Refresh every 10 minutes
setInterval(loadWeather, 600000);

//==============================
// Theme Toggle
//==============================

const themeBtn = document.getElementById("themeBtn");

if(localStorage.getItem("theme") === "light"){

    document.body.classList.add("light");

    themeBtn.innerHTML='<i class="fas fa-sun"></i>';

}

themeBtn.addEventListener("click",()=>{

    document.body.classList.toggle("light");

    if(document.body.classList.contains("light")){

        localStorage.setItem("theme","light");

        themeBtn.innerHTML='<i class="fas fa-sun"></i>';

    }
    else{

        localStorage.setItem("theme","dark");

        themeBtn.innerHTML='<i class="fas fa-moon"></i>';

    }

});
// ======================================
// AUTO / MANUAL
// ======================================

document.getElementById("autoSwitch").addEventListener("change", function () {

    if (!client.connected) {

        alert("MQTT Not Connected");

        return;

    }

    if (this.checked) {

        client.publish("smartirrigation/mode", "AUTO");

    } else {

        client.publish("smartirrigation/mode", "MANUAL");

    }

});

function updateConnectionStatus(online) {

    if (online) {

        document.getElementById("wifiStatus").innerHTML = "ONLINE";
        document.getElementById("wifiDot").style.background = "#00ff00";
        document.getElementById("wifiDot").style.boxShadow =
            "0 0 15px #00ff00";

    } else {

        document.getElementById("wifiStatus").innerHTML = "OFFLINE";
        document.getElementById("wifiDot").style.background = "red";
        document.getElementById("wifiDot").style.boxShadow =
            "0 0 15px red";

    }

}

// ======================================
// Watch MQTT Message Timeout
// ======================================

setInterval(() => {

    if (!client.connected) {

        updateConnectionStatus(false);
        return;

    }

    const diff = Date.now() - lastMessageTime;

    if (diff > MESSAGE_TIMEOUT) {

        updateConnectionStatus(false);

    }

}, 1000);
