
var tab;
var searchPage = "pub";
var scrapeProfileData = [];
var oldUrl = "";
var flag = false;
var closed = [];
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log(msg.text)
    /**
     * Open user profile link and send request to get basic information
     */
    if (msg.text == "openUserProfile") {
        console.log("xxxxxxx");
        chrome.tabs.create({ url: msg.url, active: false }).then((profileTab) => {

            var status = true;
            chrome.tabs.onUpdated.addListener(function (tabId, info) {
                if (info.status === 'complete' && tabId == profileTab.id && status) {
                    // chrome.scripting.executeScript({ target: { tabId: profileTab.id, allFrames: false }, files: ['scripts/content.js'], }).then(() => {
                    status = false;

                    chrome.tabs.sendMessage(profileTab.id, { text: 'scrape_profile', loginUser: msg.loginUser }).then((data) => {
                        if (data) {
                            chrome.tabs.remove(profileTab.id);
                            data.groupId = msg.groupId;
                            console.log('openUserProfile: ', data)
                            sendResponse({ list: data });
                        } else {
                            sendResponse({ list: {} });
                        }
                    });
                    // })
                }
            });

        });
        return true;
    }

    /**
     * Open company profile link and send request to get website link
     */
    var i = 0;
    if (msg.text == "openCompanyProfile") {
        let flag = false;
        chrome.tabs.create({ url: msg.url, active: false }).then((companyTab) => {
            chrome.tabs.onUpdated.addListener(function (tabId, info) {
                if (info.status === 'complete' && tabId == companyTab.id && !flag) {
                    flag = true;
                    setTimeout(() => {
                        chrome.tabs.get(parseInt(companyTab.id)).then((tab) => {
                            if (tab) {
                                // chrome.scripting.executeScript({ target: { tabId: companyTab.id, allFrames: false }, files: ['scripts/content.js'], }).then(() => {
                                chrome.tabs.sendMessage(companyTab.id, { text: 'getCompanyLink' }).then((data) => {
                                    sendResponse({ ...data, tabId });
                                });
                                // });
                            }
                        });
                    }, 2000);
                }
            });
        });
        return true;
    }

    /**
     * Scrape the posts and return latest post date
     */
    if (msg.text == "companyPostDate") {
        let flag = false;
        chrome.tabs.create({ url: msg.url, active: true }).then((postTab) => {
            console.log("postTab", postTab);
            chrome.tabs.onUpdated.addListener(function (tabId, info) {
                if (info.status === 'complete' && tabId == postTab.id) {

                    // chrome.scripting.executeScript({ target: { tabId: postTab.id, allFrames: false }, files: ['scripts/jquery.min.js', 'scripts/content.js'], }).then(() => {
                    chrome.tabs.sendMessage(postTab.id, { text: "lastPostDate" }).then((data) => {
                        chrome.tabs.remove(postTab.id);
                        sendResponse(data);
                    });
                    // })
                }
            });
        });
        return true;
    }

    if (msg.text == "start-scrapping") {
        scrapeProfileData = [];
        flag = true;
        checkIsLinkedin()
        sendResponse(scrapeProfileData);
        return true;
    }

    if (msg.text == "get-result") {
        if (flag) {
            sendResponse({ status: flag });
        } else {
            sendResponse({ status: flag, scrapeProfileData: scrapeProfileData })
        }
        return true;
    }

    return true;
});

function checkIsLinkedin() {
    var queryInfo = { active: true, currentWindow: true };

    chrome.tabs.query(queryInfo, function (tabs) {
        tab = tabs[0];
        console.log("checkIsLinkedIn", tabs);
        let oldUrl = tab.url;

        // Check the opened tab is linkedin.com
        if (oldUrl.indexOf("linkedin.com") > -1) {
            // ------------------ Should be check which page is user on -------------------------------
            if (oldUrl.indexOf("linkedin.com/in") > -1) {
                scrapeProfile();
            } else {
                if (oldUrl.indexOf("linkedin.com/search/results/people") > -1) {
                    searchPage = "search";
                }
                getProfileLinks();

            }
        } else {
            document.getElementById("result").innerHTML = "<div class='h6 text-justify'>You can't run this extension.</div><div class='h6 text-justify'>Please check the website URL.</div>";
            return false;
        }
    });
}

function getProfileLinks() {
    // chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['scripts/jquery.min.js', 'scripts/content.js'], }, function () {
    chrome.tabs.sendMessage(tab.id, { text: 'get_list', page: searchPage }, function (response) {
        if (response) {
            draftProfiles(response);
        }
    });

    // });
}

function scrapeProfile() {
    // chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['scripts/jquery.min.js', 'scripts/content.js'], }, function () {
    chrome.tabs.sendMessage(tab.id, { text: 'scrape_profile', profile: 1 }, function (response) {
        if (response) {
            draftProfiles(response);
        }
    });
    // });
}

async function sendDataToBackend(data) {
    // Get the token either from a variable or from local storage, depending on your implementation
    let token = "";
    console.log("========", token, "====");
    await chrome.storage.local.get(["token"]).then(function (result) {
        console.log(result.token);
        token = result.token;
    });
    console.log(token);
    // Define the API endpoint
    const url = "https://api.convertlead.com/api/v1/linkedin";
    // Construct the request headers with the token
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    console.log(data);
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
                console.log("Data sent");
                return response.json();

            } else {
                // Request failed
                throw new Error('Error sending data to backend', response);

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

function draftProfiles(list) {
    scrapeProfileData = list;
    flag = false;
    sendDataToBackend(scrapeProfileData);
    chrome.runtime.sendMessage({ text: "end-scrapping", scrapeProfileData: scrapeProfileData });
}
