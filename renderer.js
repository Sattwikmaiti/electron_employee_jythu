let windowsUsage = {};
let currentApp = null;
let intervalId = null;

const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const resetBtn = document.getElementById("reset-btn");
const showChartBtn = document.getElementById("show-chart-btn");
const canvas = document.getElementById("windowUsageChart");
const ulElem = document.getElementById("list");

let chart;

startBtn.addEventListener("click", () => {
 
  window.api.startScreenshot();
  localStorage.setItem('Start-Time',new Date());
  startBtn.disabled = true;
  stopBtn.disabled = false;
  resetBtn.disabled = false;
  window.electronAPI.startTracking();

  intervalId = setInterval(updateCurrentAppTime, 1000); // Update every second
});

const logoutButton = document.getElementById("logout-button");
logoutButton.addEventListener("click", () => {
  localStorage.removeItem("accessToken");
  window.location.href = "login.html";

  startBtn.disabled = false;
  stopBtn.disabled = true;
  resetBtn.disabled = true;
  windowsUsage = {};
  currentApp = null;
  ulElem.innerHTML = "";
  if (chart) {
    chart.destroy();
    canvas.style.display = "none";
  }
  window.electronAPI.resetTracking();
  clearInterval(intervalId);
});

stopBtn.addEventListener("click", async () => {
  window.api.stopScreenshot();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  window.electronAPI.stopTracking();
  clearInterval(intervalId);
  if (currentApp) {
    windowsUsage[currentApp].lastSeen = Date.now(); // Set last seen to now without adding time
  }

  // Generate CSV data
  const csvContent =
    "Application,UsageTime(seconds),OpenCount\n" +
    Object.entries(windowsUsage)
      .map(([app, data]) => `${app},${data.usageTime.toFixed(2)},${data.count}`)
      .join("\n");
  console.log(csvContent);
 
  const username = localStorage.getItem("username");
  const today = new Date().toISOString().split("T")[0];
  const filename = `${username}-${today}.csv`;

  setTimeout(async () => {
    try {
   
      console.log(csvContent);
      console.log(filename)
      console.log(typeof csvContent);

      const id = localStorage.getItem("id");

      const response = await fetch(
        `https://jythu-admin.onrender.com/api/auth/update-dailyworking/${id}`,
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/json' // Set the correct Content-Type
          },
        
          body: JSON.stringify({
            filename: filename, //string
            fileDetails: csvContent, //string
            starttime:localStorage.getItem('Start-Time'),
            endtime:new Date()
          }),
        }
      );

      const data = await response.json();
      console.log(data);
      alert("Thank You For Working in Jythu Enterprise Pvt Ltd. You Can Now Close The App.")
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  }, 10000); // 10-second delay (adjust as necessary)
});

resetBtn.addEventListener("click", () => {
  window.api.stopScreenshot();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  resetBtn.disabled = true;
  windowsUsage = {};
  currentApp = null;
  ulElem.innerHTML = "";
  if (chart) {
    chart.destroy();
    canvas.style.display = "none";
  }
  window.electronAPI.resetTracking();
  clearInterval(intervalId);
});




showChartBtn.addEventListener("click", () => {
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  tabs.forEach((t) => t.classList.remove("active"));
  tabContents.forEach((tc) => tc.classList.remove("active"));

  document.getElementById("tab-chart").classList.add("active");
  document.getElementById("tab-content-chart").classList.add("active");

  // Display the canvas and update the chart
  const canvas = document.getElementById("windowUsageChart");
  /**/
  canvas.style.display = "block";
  updateChart();
});

window.electronAPI.onUpdateActiveWindow((winDetails) => {
  const appName = winDetails.owner.name;

  if (!windowsUsage[appName]) {
    windowsUsage[appName] = { usageTime: 0, count: 0, lastSeen: Date.now() };
  }

  if (currentApp && currentApp !== appName) {
    const now = Date.now();
    windowsUsage[currentApp].usageTime +=
      (now - windowsUsage[currentApp].lastSeen) / 1000;
    windowsUsage[currentApp].lastSeen = now;
  }

  if (currentApp !== appName) {
    if (currentApp) {
      windowsUsage[appName].count += 1;
    }
    currentApp = appName;
    windowsUsage[appName].lastSeen = Date.now();
    updateList();
  }
});

window.electronAPI.onResetActiveWindow(() => {
  windowsUsage = {};
  currentApp = null;
  ulElem.innerHTML = "";
  if (chart) {
    chart.destroy();
    canvas.style.display = "none";
  }
  clearInterval(intervalId);
});

function updateCurrentAppTime() {
  if (currentApp) {
    const now = Date.now();
    windowsUsage[currentApp].usageTime +=
      (now - windowsUsage[currentApp].lastSeen) / 1000;
    windowsUsage[currentApp].lastSeen = now;
    updateList(); // Update the list to reflect the latest time
  }
}

function updateList() {
  ulElem.innerHTML = "";
  for (const app in windowsUsage) {
    const usage = windowsUsage[app];
    const li = document.createElement("li");
    li.textContent = `${app}: ${usage.usageTime.toFixed(2)} seconds, opened ${
      usage.count
    } times`;
    ulElem.appendChild(li);
  }
}

function updateChart() {
  const ctx = canvas.getContext("2d");
  const windowNames = Object.keys(windowsUsage);
  const usageTimes = windowNames.map((name) =>
    windowsUsage[name].usageTime.toFixed(2)
  );

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: windowNames,
      datasets: [
        {
          label: "Usage Time (seconds)",
          data: usageTimes,
          backgroundColor: windowNames.map(
            (_, i) => `hsl(${(i * 360) / windowNames.length}, 70%, 50%)`
          ),
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) =>
              `${tooltipItem.label}: ${tooltipItem.raw} seconds`,
          },
        },
      },
    },
  });
}