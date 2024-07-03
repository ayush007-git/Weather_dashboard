$(document).ready(function() {
  var cities = [];
  var currentCity;
  var now = dayjs();
  var currentDate = now.format("dddd MMM. D, YYYY");
  var baseURL = "https://api.openweathermap.org/data/2.5/";
  var APIKey = "f4d6848eb3a488816cecbd2392d8a108";
  var units = "imperial";
  var icons = [
    {
      code: "01",
      day: "fas fa-sun",
      night: "fas fa-moon"
    },
    {code: "02",
      day: "fas fa-cloud-sun",
      night: "fas fa-cloud-moon"
    },
    {code: "03",
      day: "fas fa-cloud",
      night: "fas fa-cloud"
    },
    {code: "04",
      day: "fas fa-cloud-sun",
      night: "fas fa-cloud-moon"
    },
    {code: "09",
      day: "fas fa-cloud-rain",
      night: "fas fa-cloud-rain"
    },
    {code: "10",
      day: "fas fa-cloud-showers-heavy",
      night: "fas fa-cloud-showers-heavy"
    },
    {code: "11",
      day: "fas fa-bolt",
      night: "fas fa-bolt"
    },
    {code: "13",
      day: "fas fa-snowflake",
      night: "fas fa-snowflake"
    },
    {code: "50",
      day: "fas fa-smog",
      night: "fas fa-smog"
    }
  ];
  init();
  function init() {
    $("#today").text(currentDate);
    if (window.innerWidth >= 578) {
      $("#search-history").addClass("show");
      $("#collapse-search-history").hide();
    }
    getSearchHistory();
    if (cities.length === 0) {
      getWeather("New York");
    } else {
      var lastCityIndex = cities.length - 1;
      getWeather(cities[lastCityIndex]);
      $.each(cities, function(index, city) {
        displayCity(city);
      });
    }
  }
  function getWeather(city) {
    var responseData = {};
    $.ajax({
      url: baseURL + "weather",
      method: "GET",
      data: {
        q: city,
        units: units,
        appid: APIKey,
      }
    }).then(function(response) {
      responseData.current = response;
      var coordinates = {
        lat: responseData.current.coord.lat,
        lon: responseData.current.coord.lon
      }
      getUVindex(coordinates);
      displayCurrentWeather(responseData);
    });
    $.ajax({
      url: baseURL + "forecast",
      method: "GET",
      data: {
        q: city,
        units: units,
        appid: APIKey
      }
    }).then(function(response) {
      responseData.forecast = response;
      displayForecast(responseData);
    });
  }
  function getUVindex(coordinates) {
    $.ajax({
      url: baseURL + "uvi",
      method: "GET",
      data: {
        lat: coordinates.lat,
        lon: coordinates.lon,
        appid: APIKey
      }
    }).then(function(response) {
      displayUV(response);
    }); 
  }
  function replaceIcon(iconCode) {
    var number = iconCode.slice(0, 2);
    var dayOrNight = iconCode.slice(2);
    var currentHour = dayjs().hour();
    var index = icons.findIndex(function(icon, index) {
      return icon.code === number;
    });
    if (currentHour >= 06 && currentHour < 18) {
      return icons[index].day;

    } else {
      return icons[index].night;
    }
  }
  function displayCurrentWeather(data) {
    $("#city").text(data.current.name);
    $("#conditions").text(data.current.weather[0].main);
    $("#temperature").text(`${parseInt(data.current.main.temp)}\u00B0 F`);
    $("#humidity").text(`${data.current.main.humidity}%`);
    $("#wind-speed").text(`${data.current.wind.speed} mph`);
    var newIcon = replaceIcon(data.current.weather[0].icon);
    $("#icon").removeClass().addClass(`h2 ${newIcon}`);
  }
  function displayUV(data) {
    $("#uv-index").text(data.value);
    $("#uv-index").removeClass("bg-success bg-warning bg-danger")
    if (data.value < 3) {
      $("#uv-index").addClass("bg-success");
    } else if (data.value >= 3 && data.value < 6) {
      $("#uv-index").addClass("bg-warning");
    } else if (data.value >= 6) {
      $("#uv-index").addClass("bg-danger");
    } else {
      console.log("Invalid UV index value.");
    }
  }
  function displayForecast(data) {
        var forecast = createForecast(data);
    $.each(forecast, function(i, day) {
      var date = dayjs(day.dt_txt).format("MMM. D");
      var year = dayjs(day.dt_txt).format("YYYY");
      var iconClasses = replaceIcon(day.weather[0].icon);
      $(`#day-${i + 1}-icon`).removeClass().addClass(`h2 text-info ${iconClasses}`);
      $(`#day-${i + 1}-date`).text(date);
      $(`#day-${i + 1}-year`).text(year);
      $(`#day-${i + 1}-conditions`).text(day.weather[0].main);
      $(`#day-${i + 1}-temp`).text(`${parseInt(day.main.temp)}\u00B0 F`);
      $(`#day-${i + 1}-humidity`).text(`${day.main.humidity}% Humidity`);
    });
  }
  function createForecast(data) {
    var forecastData = data.forecast.list;
    var fiveDayForecast = [];
    var firstResult = {
      date: dayjs(data.forecast.list[0].dt_txt).date(),
      hour: dayjs(data.forecast.list[0].dt_txt).hour()
    };
    if (firstResult.hour === 6) {
      for (var i = 10; i < forecastData.length; i += 8) {
        fiveDayForecast.push(forecastData[i]);
      }

      fiveDayForecast.push(forecastData[38]);

    } else if (firstResult.hour <= 09 && firstResult.hour >= 12) {
      for (var i = 9; i < forecastData.length; i +=8) {
        fiveDayForecast.push(forecastData[i]);
      }

      fiveDayForecast.push(forecastData[39]);

    } else {
      var firstNoonIndex = forecastData.findIndex(function(forecast) {
        var isTomorrow = dayjs().isBefore(forecast.dt_txt);
        var hour = dayjs(forecast.dt_txt).hour();

        if (isTomorrow && hour === 12) {
          return true;
        }
      });

      for (var i = firstNoonIndex; i < forecastData.length; i += 8) {
        fiveDayForecast.push(forecastData[i]);
      }
    }
    return fiveDayForecast;}
  function displayCity(city) {
    var li = $("<li>");
    li.addClass("list-group-item search-item");
    li.text(city);
    $("#search-history").prepend(li);
  }
  function saveToHistory(city) {
    getSearchHistory();
    cities.push(city);
    setSearchHistory();
  }
  function getSearchHistory() {
    if (localStorage.getItem("cities") === null) {
      cities = [];
    } else {
      cities = JSON.parse(localStorage.getItem("cities"));
    }
  }
  function setSearchHistory() {
    localStorage.setItem("cities", JSON.stringify(cities));
  }
  $("#delete-history").on("click", function() {
    $(".search-item").remove();
    cities.splice(0, cities.length - 1);
    setSearchHistory();
  });
  $("#search-history").on("click", ".search-item", function() {
    getWeather($(this).text());
  });
  $("#search-form").on("submit", function(event) {
    event.preventDefault();

    var city = $("#search").val();
    if (city === "") {
      console.log("Invalid City");
      return;
    }
    getWeather(city);
    displayCity(city);
    saveToHistory(city);
    $("#search").val("");
  });
});
$(window).resize(function() {
  var w = $(window).width();
  if (w >= 578) {
    $("#search-history").addClass("show");
    $("#collapse-search-history").hide();
  } else {
    $("#search-history").removeClass("show");
    $("#collapse-search-history").show();
  }
});

