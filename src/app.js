import "regenerator-runtime/runtime";
import Chart from "chart.js";

const countriesList = document.querySelector(".stats__choose-country");
const confirmedCases = document.querySelector(
  ".stats__total-cases .stats__value"
);
const confirmedNewCases = document.querySelector(
  ".stats__total-cases .stats__new-value"
);
const recoveredCases = document.querySelector(
  ".stats__recovered .stats__value"
);
const recoveredNewCases = document.querySelector(
  ".stats__recovered .stats__new-value"
);
const deathsCases = document.querySelector(".stats__deaths .stats__value");
const deathsNewCases = document.querySelector(
  ".stats__deaths .stats__new-value"
);
const countryName = document.querySelector(".stats__country-name");
const errorContent = document.querySelector(".stats__error-message");
const ctx = document.getElementById("chart__covid");
const footer = document.querySelector(".footer");
let covidDataChart;

document.addEventListener("DOMContentLoaded", async function setupInitial() {
  await createCountriesList().catch((err) => {
    displayErrorMessage(err.message);
  });
  getUserCountry().catch((err) => {
    displayErrorMessage(err.message);
  });
});

countriesList.addEventListener("change", getStats);

async function getUserCountry() {
  let response = await fetch("https://ipapi.co/json/");
  if (response.status == 200) {
    let json = await response.json();
    // select from the list country which data-code attribute matches country code from the response
    Array.prototype.forEach.call(countriesList.options, (option) => {
      if (option.dataset.code === json.country_code) {
        option.setAttribute("selected", true);
      }
    });
    // fire change event to get stats for user's country
    let event = new Event("change");
    countriesList.dispatchEvent(event);
  } else {
    throw new Error(
      "Unable to set country automatically. Please select country manually from the list."
    );
  }
}

async function createCountriesList() {
  const res = await fetch("https://api.covid19api.com/countries");
  if (!res.ok) {
    throw new Error(
      "Unable to load countries list. Refresh the page and try again."
    );
  }
  const response = await res.json();
  const countries = [...response];
  countries.sort(function sortCountriesAlphabetically(a, b) {
    return a["Country"].localeCompare(b["Country"]);
  });
  countries.forEach((elem) => {
    const country = document.createElement("option");
    country.setAttribute("value", elem["Country"]);
    country.dataset.slug = elem["Slug"];
    country.dataset.code = elem["ISO2"];
    country.textContent = elem["Country"];
    countriesList.appendChild(country);
  });
}

function getStats() {
  hideErrorMessage();
  // get country url slug
  const countrySlug =
    event.target.options[event.target.selectedIndex].dataset.slug;
  // set title attribute on country select element
  countriesList.setAttribute(
    "title",
    event.target.options[event.target.selectedIndex].value
  );
  // fetch data for the country
  fetch(`https://api.covid19api.com/total/dayone/country/${countrySlug}`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(
          "A problem occurred while getting data from the server. Refresh the page and try again."
        );
      } else {
        return res.json();
      }
    })
    .then((res) => {
      // if the first element in response array is null or undefined, that means there's no data for this country, throw an error
      if (res[0] == null) {
        throw new Error(
          "Unfortunately, data for this country is currently unavailable."
        );
      }
      countryName.textContent = res[0]["Country"];
      const {
        Confirmed: confirmed,
        Recovered: recovered,
        Deaths: deaths,
        Date: date,
      } = res[res.length - 1];
      const {
        Confirmed: confirmedYesterday,
        Recovered: recoveredYesterday,
        Deaths: deathsYesterday,
      } = res[res.length - 2];
      confirmedCases.textContent = confirmed;
      recoveredCases.textContent = recovered;
      deathsCases.textContent = deaths;
      confirmedNewCases.textContent = `+${confirmed - confirmedYesterday}`;
      recoveredNewCases.textContent = `+${recovered - recoveredYesterday}`;
      deathsNewCases.textContent = `+${deaths - deathsYesterday}`;
      footer.textContent = `* Coronavirus data as of ${new Date(
        date
      ).toLocaleDateString()}`;
      // draw chart
      drawChart(res);
    })
    .catch((err) => {
      displayErrorMessage(err.message);
    });
}

function displayErrorMessage(errorMessage) {
  errorContent.classList.add("stats__error-message--display");
  errorContent.textContent = errorMessage;
}

function hideErrorMessage() {
  errorContent.classList.remove("stats__error-message--display");
}

function drawChart(records) {
  if (covidDataChart) {
    covidDataChart.destroy();
  }
  let dates = [],
    cases_list = [],
    recovered_list = [],
    deaths_list = [];
  records.forEach((record) => {
    dates.push(record["Date"].substring(0, 10));
    cases_list.push(record["Confirmed"]);
    recovered_list.push(record["Recovered"]);
    deaths_list.push(record["Deaths"]);
  });
  covidDataChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: "Cases",
          data: cases_list,
          fill: false,
          borderColor: "#f1f7ed",
          backgroundColor: "#f1f7ed",
          borderWidth: 1,
        },
        {
          label: "Recovered",
          data: recovered_list,
          fill: false,
          borderColor: "#91c7b1",
          backgroundColor: "#91c7b1",
          borderWidth: 1,
        },
        {
          label: "Deaths",
          data: deaths_list,
          fill: false,
          borderColor: "#b33951",
          backgroundColor: "#b33951",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

// increase spacing between legend and chart
Chart.Legend.prototype.afterFit = function () {
  this.height = this.height + 10;
};
