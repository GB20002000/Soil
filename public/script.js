// =======================================================
// Smart Drip Irrigation Dashboard
// Part 1 - Configuration & MQTT
// =======================================================


// =======================================================
// OpenWeather Configuration
// =======================================================

const WEATHER_API_KEY = "1a75e1f696cd42bb37ecc614bb268ac3";
const WEATHER_CITY = "Coimbatore";
const WEATHER_COUNTRY = "IN";


// =======================================================
// HiveMQ Cloud Configuration
// =======================================================

const broker =
"wss://0c9f54b8cca94ea59f8084125bdf6929.s1.eu.hivemq.cloud:8884/mqtt";

const options = {

    clientId: "Web_" + Math.random().toString(16).substring(2,8),

    username: "Soil_2026",

    password: "Soil_2026",

    clean: true,

    reconnectPeriod: 5000,

    connectTimeout: 30000

};


// =======================================================
// MQTT Client
// =======================================================

const client = mqtt.connect(broker, options);


// =======================================================
// Global Variables
// =======================================================

let previousPumpState = "OFF";

let lastWateringTime = "00:00:00";

let lastMessageTime = Date.now();

const MESSAGE_TIMEOUT = 10000;


// Current sensor values

let soilMoisture = 0;

let temperature = 0;

let humidity = 0;

let pumpStatus = "OFF";

let pumpRuntime = 0;

let autoMode = false;

let rainProbability = 0;

let windSpeed = 0;

let windDirection = "";


// =======================================================
// Helper Function
// Convert Seconds to HH:MM:SS
// =======================================================

function formatTime(totalSeconds)
{

    totalSeconds = Number(totalSeconds) || 0;

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const seconds = totalSeconds % 60;

    return (
        String(hours).padStart(2,"0") + ":" +
        String(minutes).padStart(2,"0") + ":" +
        String(seconds).padStart(2,"0")
    );

}


// =======================================================
// Convert Wind Degree to Direction
// =======================================================

function getWindDirection(deg)
{

    if(deg >=337.5 || deg <22.5) return "N";

    if(deg <67.5) return "NE";

    if(deg <112.5) return "E";

    if(deg <157.5) return "SE";

    if(deg <202.5) return "S";

    if(deg <247.5) return "SW";

    if(deg <292.5) return "W";

    return "NW";

}


// =======================================================
// Update WiFi Status
// =======================================================

function updateConnectionStatus(online)
{

    const dot = document.getElementById("wifiDot");

    const text = document.getElementById("wifiStatus");

    if(online)
    {

        text.innerHTML = "ONLINE";

        dot.style.background = "#00ff55";

        dot.style.boxShadow = "0 0 15px #00ff55";

    }
    else
    {

        text.innerHTML = "OFFLINE";

        dot.style.background = "red";

        dot.style.boxShadow = "0 0 15px red";

    }

}


// =======================================================
// MQTT Connected
// =======================================================

client.on("connect",()=>{

    console.log("✅ Connected to HiveMQ");

    updateConnectionStatus(true);

    client.subscribe("smartirrigation/data",(err)=>{

        if(err)
        {

            console.log(err);

        }
        else
        {

            console.log("Subscribed : smartirrigation/data");

        }

    });

});


// =======================================================
// MQTT Reconnecting
// =======================================================

client.on("reconnect",()=>{

    console.log("Reconnecting MQTT...");

});


// =======================================================
// MQTT Offline
// =======================================================

client.on("offline",()=>{

    console.log("MQTT Offline");

    updateConnectionStatus(false);

});


// =======================================================
// MQTT Error
// =======================================================

client.on("error",(err)=>{

    console.log(err);

});
// =======================================================
// Part 2 - MQTT Message Handler
// =======================================================

client.on("message", (topic, message) => {

    lastMessageTime = Date.now();

    updateConnectionStatus(true);

    let data;

    try {

        data = JSON.parse(message.toString());

    }
    catch (e) {

        console.log("Invalid JSON");

        return;

    }

    console.log(data);

    // =====================================
    // Save Values
    // =====================================

    soilMoisture = Number(data.soil ?? 0);

    temperature = Number(data.temperature ?? 0);

    humidity = Number(data.humidity ?? 0);

    pumpStatus = data.pump ?? "OFF";

    pumpRuntime = Number(data.pumpRuntime ?? 0);

    autoMode = data.autoMode ?? false;


    // =====================================
    // Soil Moisture
    // =====================================

    document.getElementById("soilValue").innerHTML =
        soilMoisture + "%";

    document.getElementById("soilBar").style.width =
        soilMoisture + "%";

    document.getElementById("soilStatus").innerHTML =
        data.soilStatus ?? "--";


    // =====================================
    // Temperature
    // =====================================

    document.getElementById("temp").innerHTML =
        temperature.toFixed(1) + " °C";


    // =====================================
    // Humidity
    // =====================================

    document.getElementById("humidity").innerHTML =
        humidity.toFixed(1) + " %";


    // =====================================
    // Pump Status
    // =====================================

    document.getElementById("pumpText").innerHTML =
        pumpStatus;


    // =====================================
    // Pump Indicator
    // =====================================

    const indicator = document.getElementById("pumpIndicator");

    if (pumpStatus === "ON") {

        indicator.style.background = "#00ff55";

        indicator.style.boxShadow =
            "0 0 18px #00ff55";

    }
    else {

        indicator.style.background = "red";

        indicator.style.boxShadow =
            "0 0 18px red";

    }


    // =====================================
    // Pump Runtime
    // =====================================

    document.getElementById("timer").innerHTML =
        formatTime(pumpRuntime);


    // =====================================
    // Save Last Watering Time
    // =====================================

    if (previousPumpState === "ON" &&
        pumpStatus === "OFF") {

        lastWateringTime =
            new Date().toLocaleTimeString("en-IN");

        document.getElementById("lastWater").innerHTML =
            lastWateringTime;

    }

    previousPumpState = pumpStatus;


    // =====================================
    // Water Usage
    // =====================================

    document.getElementById("todayWater").innerHTML =
        Number(data.waterUsage ?? 0).toFixed(2) + " L";


    // =====================================
    // Auto / Manual Mode
    // =====================================

    document.getElementById("autoSwitch").checked =
        autoMode;

    document.getElementById("modeText").innerHTML =
        autoMode ? "AUTO MODE" : "MANUAL MODE";


    // =====================================
    // Update AI Recommendation
    // =====================================

    if (typeof updateAIRecommendation === "function") {

        updateAIRecommendation();

    }

});
// =======================================================
// Part 3 - Pump Control
// =======================================================

// ----------------------------
// Pump ON
// ----------------------------

document.getElementById("onBtn").addEventListener("click", () => {

    if (!client.connected) {

        alert("MQTT Not Connected");
        return;

    }

    client.publish("smartirrigation/pump", "ON");

});


// ----------------------------
// Pump OFF
// ----------------------------

document.getElementById("offBtn").addEventListener("click", () => {

    if (!client.connected) {

        alert("MQTT Not Connected");
        return;

    }

    client.publish("smartirrigation/pump", "OFF");

});



// =======================================================
// Auto / Manual Mode
// =======================================================

document.getElementById("autoSwitch").addEventListener("change", function () {

    if (!client.connected) {

        alert("MQTT Not Connected");

        this.checked = !this.checked;

        return;

    }

    if (this.checked) {

        client.publish("smartirrigation/mode", "AUTO");

    }
    else {

        client.publish("smartirrigation/mode", "MANUAL");

    }

});



// =======================================================
// Digital Clock
// =======================================================

function updateClock() {

    const now = new Date();

    let hour = now.getHours();

    let minute = now.getMinutes();

    let second = now.getSeconds();

    const ampm = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;

    hour = hour ? hour : 12;

    hour = String(hour).padStart(2, "0");

    minute = String(minute).padStart(2, "0");

    second = String(second).padStart(2, "0");

    document.getElementById("clock").innerHTML =
        `${hour}:${minute}:${second} ${ampm}`;

    document.getElementById("currentDate").innerHTML =
        now.toLocaleDateString("en-IN", {

            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"

        });

}

updateClock();

setInterval(updateClock, 1000);



// =======================================================
// Theme Toggle
// =======================================================

const themeBtn = document.getElementById("themeBtn");

// Restore Previous Theme

if (localStorage.getItem("theme") === "light") {

    document.body.classList.add("light");

    themeBtn.innerHTML =
        '<i class="fas fa-sun"></i>';

}
else {

    themeBtn.innerHTML =
        '<i class="fas fa-moon"></i>';

}



// Change Theme

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("light");

    if (document.body.classList.contains("light")) {

        localStorage.setItem("theme", "light");

        themeBtn.innerHTML =
            '<i class="fas fa-sun"></i>';

    }
    else {

        localStorage.setItem("theme", "dark");

        themeBtn.innerHTML =
            '<i class="fas fa-moon"></i>';

    }

});



// =======================================================
// Dashboard Initialization
// =======================================================

window.addEventListener("load", () => {

    updateClock();

    updateConnectionStatus(false);

});
// =======================================================
// Part 4 - Smart Weather Module
// =======================================================

async function loadWeather() {

    try {

        // =====================================
        // Current Weather
        // =====================================

        const currentURL =
            `https://api.openweathermap.org/data/2.5/weather?q=${WEATHER_CITY},${WEATHER_COUNTRY}&appid=${WEATHER_API_KEY}&units=metric`;

        const currentRes = await fetch(currentURL);

        const current = await currentRes.json();

        if (current.cod != 200) {

            document.getElementById("weather").innerHTML = "Weather Error";

            return;

        }

        // =====================================
        // Current Weather
        // =====================================

        document.getElementById("weather").innerHTML =
            `${Math.round(current.main.temp)}°C | ${current.weather[0].main}`;

        // =====================================
        // Feels Like
        // =====================================

        if(document.getElementById("feelsLike")){

            document.getElementById("feelsLike").innerHTML =
                current.main.feels_like.toFixed(1) + " °C";

        }

        // =====================================
        // Wind
        // =====================================

        windSpeed = current.wind.speed;

        windDirection =
            getWindDirection(current.wind.deg);

        if(document.getElementById("wind")){

            document.getElementById("wind").innerHTML =
                windSpeed.toFixed(1) + " m/s";

        }

        if(document.getElementById("windDirection")){

            document.getElementById("windDirection").innerHTML =
                windDirection;

        }

        // =====================================
        // Cloud %
        // =====================================

        if(document.getElementById("cloud")){

            document.getElementById("cloud").innerHTML =
                current.clouds.all + "%";

        }

        // =====================================
        // Pressure
        // =====================================

        if(document.getElementById("pressure")){

            document.getElementById("pressure").innerHTML =
                current.main.pressure + " hPa";

        }

        // =====================================
        // Visibility
        // =====================================

        if(document.getElementById("visibility")){

            document.getElementById("visibility").innerHTML =
                (current.visibility/1000).toFixed(1) + " km";

        }

        // =====================================
        // Sunrise
        // =====================================

        const sunrise =
            new Date(current.sys.sunrise * 1000);

        document.getElementById("sunrise").innerHTML =
            sunrise.toLocaleTimeString("en-IN",{

                hour:"2-digit",
                minute:"2-digit",
                hour12:true

            });

        // =====================================
        // Sunset
        // =====================================

        const sunset =
            new Date(current.sys.sunset * 1000);

        document.getElementById("sunset").innerHTML =
            sunset.toLocaleTimeString("en-IN",{

                hour:"2-digit",
                minute:"2-digit",
                hour12:true

            });

        // =====================================
        // 3 Hour Forecast
        // =====================================

        const forecastURL =
        `https://api.openweathermap.org/data/2.5/forecast?q=${WEATHER_CITY},${WEATHER_COUNTRY}&appid=${WEATHER_API_KEY}&units=metric`;

        const forecastRes =
            await fetch(forecastURL);

        const forecast =
            await forecastRes.json();

        if(forecast.list && forecast.list.length>0){

            const next =
                forecast.list[0];

            // Temperature

            if(document.getElementById("nextWeather")){

                document.getElementById("nextWeather").innerHTML =
                `${Math.round(next.main.temp)}°C | ${next.weather[0].main}`;

            }

            // Rain Probability

            rainProbability =
                Math.round((next.pop || 0) * 100);

            if(document.getElementById("rainPercent")){

                document.getElementById("rainPercent").innerHTML =
                    rainProbability + "%";

            }

            if(document.getElementById("rainBar")){

                document.getElementById("rainBar").style.width =
                    rainProbability + "%";

            }

        }

        // =====================================
        // Update AI
        // =====================================

        if(typeof updateAIRecommendation==="function"){

            updateAIRecommendation();

        }

    }
    catch(err){

        console.log(err);

        document.getElementById("weather").innerHTML =
            "Weather Offline";

    }

}

// =====================================
// Start Weather Service
// =====================================

loadWeather();

setInterval(loadWeather,600000);
// =======================================================
// Part 5 - AI Recommendation Engine
// =======================================================

function updateAIRecommendation() {

    let title = "";
    let message = "";
    let color = "#00ff88";

    // =====================================
    // Heavy Rain
    // =====================================

    if (rainProbability >= 80) {

        title = "🌧 SKIP IRRIGATION";

        message =
        "Heavy rain is expected.\n" +
        "Artificial watering is not required.";

        color = "#2196F3";

    }

    // =====================================
    // Moderate Rain
    // =====================================

    else if (rainProbability >= 50) {

        title = "☁ DELAY WATERING";

        message =
        "Rain may occur soon.\n" +
        "Wait before turning ON the pump.";

        color = "#03A9F4";

    }

    // =====================================
    // Soil Too Wet
    // =====================================

    else if (soilMoisture >= 80) {

        title = "💧 SOIL IS WET";

        message =
        "Current soil moisture is high.\n" +
        "Pump should remain OFF.";

        color = "#00BCD4";

    }

    // =====================================
    // Soil Good
    // =====================================

    else if (soilMoisture >= 60) {

        title = "🌱 SOIL IS HEALTHY";

        message =
        "Moisture level is normal.\n" +
        "No watering required.";

        color = "#4CAF50";

    }

    // =====================================
    // Soil Moderate
    // =====================================

    else if (soilMoisture >= 40) {

        title = "⚠ WATER SOON";

        message =
        "Soil is starting to dry.\n" +
        "Watering is recommended soon.";

        color = "#FFC107";

    }

    // =====================================
    // Soil Dry
    // =====================================

    else {

        title = "🚰 WATER NOW";

        message =
        "Critical dry soil detected.\n" +
        "Immediate irrigation recommended.";

        color = "#F44336";

    }

    // =====================================
    // High Temperature
    // =====================================

    if (temperature >= 35) {

        message +=
        "\n\n☀ High Temperature (" +
        temperature.toFixed(1) +
        "°C)";

    }

    // =====================================
    // Low Humidity
    // =====================================

    if (humidity <= 30) {

        message +=
        "\n💨 Low Humidity";

    }

    // =====================================
    // Wind Speed
    // =====================================

    if (windSpeed >= 8) {

        message +=
        "\n🌬 Strong Wind (" +
        windSpeed.toFixed(1) +
        " m/s)";

    }

    // =====================================
    // Pump Status
    // =====================================

    if (pumpStatus === "ON") {

        message +=
        "\n\n🚿 Irrigation is currently running.";

    }

    // =====================================
    // Update Dashboard
    // =====================================

    const ai = document.getElementById("aiAdvice");

    if (ai) {

        ai.innerHTML =
            "<b>" +
            title +
            "</b><br><br>" +
            message.replace(/\n/g,"<br>");

        ai.style.borderLeft =
            "6px solid " + color;

        ai.style.padding = "15px";

        ai.style.borderRadius = "12px";

        ai.style.background =
            "rgba(255,255,255,0.08)";

    }

}
// =======================================================
// Part 6 - Dashboard Health & AI Services
// =======================================================


// ===========================================
// Plant Health Score
// ===========================================

function updatePlantHealth() {

    let score = 100;

    if (soilMoisture < 40) score -= 30;
    if (temperature > 35) score -= 20;
    if (humidity < 35) score -= 15;
    if (rainProbability > 80) score -= 10;

    if (score < 0)
        score = 0;

    if (document.getElementById("plantHealth")) {

        document.getElementById("plantHealth").innerHTML =
            score + "%";

    }

}


// ===========================================
// Heat Stress
// ===========================================

function updateHeatStress() {

    let stress = "";
    let color = "";

    if (temperature >= 40) {

        stress = "HIGH";
        color = "#ff1744";

    }

    else if (temperature >= 32) {

        stress = "MEDIUM";
        color = "#ff9800";

    }

    else {

        stress = "LOW";
        color = "#00c853";

    }

    if (document.getElementById("heatStress")) {

        document.getElementById("heatStress").innerHTML = stress;
        document.getElementById("heatStress").style.color = color;

    }

}


// ===========================================
// Disease Risk
// ===========================================

function updateDiseaseRisk() {

    let risk = "";
    let color = "";

    if (humidity > 85 && temperature > 28) {

        risk = "HIGH";
        color = "#ff1744";

    }

    else if (humidity > 65) {

        risk = "MEDIUM";
        color = "#ff9800";

    }

    else {

        risk = "LOW";
        color = "#00c853";

    }

    if (document.getElementById("diseaseRisk")) {

        document.getElementById("diseaseRisk").innerHTML = risk;
        document.getElementById("diseaseRisk").style.color = color;

    }

}


// ===========================================
// Water Saving
// ===========================================

function updateWaterSaving() {

    let usage = 0;

    const txt = document.getElementById("todayWater");

    if (txt) {

        usage = parseFloat(txt.innerText);

    }

    let saved = Math.max(0, (50 - usage));

    if (document.getElementById("waterSaved")) {

        document.getElementById("waterSaved").innerHTML =
            saved.toFixed(1) + " L";

    }

}


// ===========================================
// System Health
// ===========================================

function updateSystemHealth() {

    let status = "";

    if (!client.connected) {

        status = "🔴 OFFLINE";

    }

    else if (pumpStatus === "ON") {

        status = "🟢 RUNNING";

    }

    else {

        status = "🟢 NORMAL";

    }

    if (document.getElementById("systemHealth")) {

        document.getElementById("systemHealth").innerHTML =
            status;

    }

}


// ===========================================
// Smart Alert
// ===========================================

function updateAlert() {

    let alert = "";

    if (soilMoisture < 30) {

        alert =
            "🚨 Soil is extremely dry.";

    }

    else if (rainProbability > 80) {

        alert =
            "🌧 Heavy rain expected.";

    }

    else if (temperature > 38) {

        alert =
            "☀ High temperature detected.";

    }

    else {

        alert =
            "✅ System operating normally.";

    }

    if (document.getElementById("alertBox")) {

        document.getElementById("alertBox").innerHTML =
            alert;

    }

}


// ===========================================
// Update AI Dashboard
// ===========================================

function updateDashboardAI() {

    updatePlantHealth();

    updateHeatStress();

    updateDiseaseRisk();

    updateWaterSaving();

    updateSystemHealth();

    updateAlert();

}


// ===========================================
// MQTT Watchdog
// ===========================================

setInterval(() => {

    if (!client.connected) {

        updateConnectionStatus(false);

        return;

    }

    const diff =
        Date.now() - lastMessageTime;

    if (diff > MESSAGE_TIMEOUT) {

        updateConnectionStatus(false);

    }

    else {

        updateConnectionStatus(true);

    }

},1000);


// ===========================================
// Update AI Every 5 Seconds
// ===========================================

setInterval(updateDashboardAI,5000);


// ===========================================
// Initialize
// ===========================================

window.onload = () => {

    updateClock();

    loadWeather();

    updateDashboardAI();

};
