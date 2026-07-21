// ======================================
// HiveMQ Cloud Configuration
// ======================================

const broker = "wss://0c9f54b8cca94ea59f8084125bdf6929.s1.eu.hivemq.cloud:8884/mqtt";

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

    document.getElementById("wifiStatus").innerHTML = "ONLINE";
    document.getElementById("wifiDot").style.background = "#00ff00";

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

    document.getElementById("wifiStatus").innerHTML = "OFFLINE";
    document.getElementById("wifiDot").style.background = "red";

});

// ======================================
// Error
// ======================================

client.on("error", (err) => {

    console.log("MQTT Error");

    console.log(err);

});

// ======================================
// Receive MQTT Data
// ======================================

client.on("message", (topic, message) => {

    let data;

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

    // Temperature
    document.getElementById("temp").innerHTML =
        data.temperature ?? "--";

    // Humidity
    document.getElementById("humidity").innerHTML =
        data.humidity ?? "--";

    // Pump Status
    document.getElementById("pumpText").innerHTML =
        data.pump ?? "OFF";

    // Pump Indicator
    if (data.pump === "ON") {

        document.getElementById("pumpIndicator").style.background = "#00ff00";
        document.getElementById("pumpIndicator").style.boxShadow =
            "0px 0px 15px #00ff00";

    }
    else {

        document.getElementById("pumpIndicator").style.background = "red";
        document.getElementById("pumpIndicator").style.boxShadow =
            "0px 0px 15px red";

    }

    // Timer
    document.getElementById("timer").innerHTML =
        (data.pumpRuntime ?? 0) + " sec";

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

function updateClock() {

    const now = new Date();

    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    document.getElementById("currentTime").innerHTML =
        now.toLocaleTimeString();

    document.getElementById("currentDate").innerHTML =
        now.toLocaleDateString('en-IN', options);
}

setInterval(updateClock, 1000);

updateClock();
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
