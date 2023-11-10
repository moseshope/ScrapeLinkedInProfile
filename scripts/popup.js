// var background = chrome.extension.getBackgroundPage();

var tab;
var searchPage = "pub";
var scrapeProfileData = [];

//get current tab url



$(document).ready(async function () {

    console.log("document");
    let token = "";
    await chrome.storage.local.get(["token"]).then(function (result) {
        token = result.token
    });
    if (token) {
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
                    chrome.storage.local.set({ email: email });
                    chrome.storage.local.set({ password: password });
                    chrome.storage.local.set({ token: res.access_token });

                    // window.localStorage.setItem("email", email);
                    // window.localStorage.setItem("password", password);
                    // window.localStorage.setItem("token", res.access_token);
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
        console.log("================popup-start-scrapping-------------------");
    }

    function logStorageChange(changes, area) {
        console.log(`Change in storage area: ${area}`);

        const changedItems = Object.keys(changes);

        for (const item of changedItems) {
            console.log(`${item} has changed:`);
            console.log("Old value: ", changes[item].oldValue);
            console.log("New value: ", changes[item].newValue);
        }
    }

    //browser.storage.onChanged.addListener(logStorageChange);


});



chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.text == 'end-scrapping') {
        $("#found_num").text(scrapeProfileData.length);
        $("#send").html("Start Scrapping");
        $("#send").prop("disabled", false);
    }
});

