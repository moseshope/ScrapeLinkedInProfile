// var background = chrome.extension.getBackgroundPage();

var tab;
var searchPage = "pub";
var scrapeProfileData = [];

//get current tab url



$(document).ready(function () {


    if (window.localStorage.getItem("email") && window.localStorage.getItem("password")) {
        $(".login-form").hide();
        $("#result").show();
        chrome.runtime.sendMessage({ text: "get-result" }, function (response) {
            if (response.status) {
                $("#send").html("Scrapping...");
                $("#send").prop("disabled", true);
            } else {
                scrapeProfileData = response.scrapeProfileData;
                $("#found_num").text(scrapeProfileData.length);
                $("#send").html("Start Scrapping");
                $("#send").prop("disabled", false);
            }
        });
    } else {
        $("#login").click(function () {
            var email = $("#email").val();
            var password = $("#password").val();

            if (!email || !password) {
                $('#status').text('Your credential is incorrect');
                return false;
            }

            $.post("https://api.convertlead.com/api/login", { email: email, password: password })
                .done(function (res) {
                    $(".login-form").hide();
                    $("#result").show();
                    console.log(res);
                    window.localStorage.setItem("email", email);
                    window.localStorage.setItem("password", password);
                    window.localStorage.setItem("token", res.access_token);
                    //chrome.storage.sync.clear();

                })
                .fail(function (xhr, status, error) {
                    $('#status').text('Your credential is incorrect');
                });;
        });
    }

    $("#clear").click(function () {
        chrome.storage.sync.clear();
        $("#found_num").text(0);
        // chrome.scripting.executeScript({ target: {tabId: tab.id }, files: ['scripts/content.js'], }, function() {
        //     chrome.tabs.sendMessage(tab.id, {text: 'next_search'}, function(response) {
        //         if (response) {
        //             scrapeProfile();
        //         }
        //     });
        // });
    });

    $("#send").click(async function () {
        $(this).html("Scrapping...");
        $(this).prop("disabled", true);
        $("#found_num").text(0);
        startScrapping();

        // var serverLink = "https://api.convertlead.com/api/v1/linkedin";
        // $.post(serverLink, scrapeProfileData).done(function(res) {
        //     alert("Profile data sent!!");
        // }).fail(function(xhr, status, error) {
        //     alert("Couldn't send the scrape data to your server...");
        // });
        // chrome.storage.sync.get(['linkedin_profiles'], function (result) {
        // if (result.linkedin_profiles != undefined) {
        //     var scrapeData = JSON.parse(result.linkedin_profiles);
        // }
        // });
    });

    async function startScrapping() {
        var queryInfo = { active: true, currentWindow: true };
        const tabs = await chrome.tabs.query(queryInfo);
        const url = tabs[0].url;
        chrome.runtime.sendMessage({ text: "start-scrapping", url: url });
    }


});

function sendDataToBackend(data) {
    // Get the token either from a variable or from local storage, depending on your implementation
    const token = window.localStorage.getItem("token");
  
    // Define the API endpoint
    const url = "https://api.convertlead.com/api/v1/linkedin";
    //let url = "https://webhook-test.com/37be147e461a46ae2cc1fb646e4c4048";
    // Construct the request headers with the token
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  
    // Create the fetch request with the appropriate headers and method
    fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    })
    .then(response => {
      // Handle the response from the backend
      if (response.ok) {
        // Request was successful
        console.error("Data sent");
        return response.json();

      } else {
        // Request failed
        console.error("Error sending data to backend");
        throw new Error('Error sending data to backend');

      }
    })
    .then(data => {
      // Handle the data returned from the backend
      console.log(data);
    })
    .catch(error => {
      // Handle any errors that occurred during the fetch request
      console.error(error);
    });
  }

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.text == 'end-scrapping') {
        scrapeProfileData = msg.scrapeProfileData;
        if (scrapeProfileData.length > 0) {
            let email = window.localStorage.getItem("email");
            let data = scrapeProfileData;
            sendDataToBackend(data);
        }
        $("#found_num").text(scrapeProfileData.length);
        $("#send").html("Start Scrapping");
        $("#send").prop("disabled", false);
        sendResponse("true");
    }
});