// HiveMQ Cloud Details
const broker = "0c9f54b8cca94ea59f8084125bdf6929.s1.eu.hivemq.cloud:8884/mqtt";

const options = {

    username: "Soil_2026",

    password: "Soil_2026",

    reconnectPeriod: 2000

};

const client = mqtt.connect(broker, options);

// Connected
client.on("connect", () => {

    console.log("Connected");

    client.subscribe("smartirrigation/data");

});

// Receive Data
client.on("message", (topic, message) => {

    const data = JSON.parse(message.toString());

    document.getElementById("soilValue").innerHTML =
        data.soil + "%";

    document.getElementById("soilBar").style.width =
        data.soil + "%";

    document.getElementById("temp").innerHTML =
        data.temperature;

    document.getElementById("humidity").innerHTML =
        data.humidity;

    document.getElementById("soilStatus").innerHTML =
        data.soilStatus;

    document.getElementById("pumpText").innerHTML =
        data.pump;

    document.getElementById("timer").innerHTML =
        data.pumpRuntime + " sec";

    document.getElementById("todayWater").innerHTML =
        data.waterUsage.toFixed(2) + " L";

    document.getElementById("waterLevel").style.height =
        data.soil + "%";

    if(data.pump=="ON")
    {
        document.getElementById("pumpIndicator").style.background="#00ff00";
    }
    else
    {
        document.getElementById("pumpIndicator").style.background="red";
    }

});

// Pump ON
document.getElementById("onBtn").onclick=function(){

    client.publish("smartirrigation/pump","ON");

}

// Pump OFF
document.getElementById("offBtn").onclick=function(){

    client.publish("smartirrigation/pump","OFF");

}

// AUTO MODE
document.getElementById("autoSwitch").onchange=function(){

    if(this.checked)
    {
        client.publish("smartirrigation/mode","AUTO");
    }
    else
    {
        client.publish("smartirrigation/mode","MANUAL");
    }

}
