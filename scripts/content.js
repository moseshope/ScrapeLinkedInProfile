var profileData = [];
var trigger, sortTrigger;
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    (async () => {
        if (msg.text == "get_list") {
            console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxget-list")
            try {
                let groupId = Date.now();
                //console.clear();
                if (msg.page == "search") {
                    const getUsers = async () => {
                        let users = document.querySelectorAll("li.reusable-search__result-container");
                        for (let i = 0; i < users.length; i++) {
                            let name = users[i].querySelector(".entity-result__title-text a.app-aware-link").innerHTML;
                            if (!name.includes("LinkedIn")) {
                                let link = users[i].querySelector(".app-aware-link.scale-down").getAttribute("href");
                                await chrome.runtime.sendMessage({ text: "openUserProfile", url: link, loginUser: true, groupId: groupId }).then((res) => {
                                    profileData.push(res.list);
                                    console.log(JSON.stringify(profileData));
                                });
                            }

                        }
                    }
                    await getUsers();
                    sendResponse(profileData);
                } else if (msg.page == "pub") {
                    let users = document.querySelectorAll("li.pserp-layout__profile-result-list-item");
                    for (let i = 0; i < users.length; i++) {
                        let name = users[i].querySelector(".entity-result__title-text a.app-aware-link").innerHTML;
                        if (!name.includes("LinkedIn")) {
                            let link = users[i].querySelector("a.base-card").getAttribute("href");

                            await chrome.runtime.sendMessage({ text: "openUserProfile", url: link, loginUser: true, groupId: groupId }).then((res) => {
                                profileData.push(res.list);
                            });
                        }
                    }
                    sendResponse(profileData);
                }
            } catch (err) {
                console.log("--------get_list-------", err);
                sendResponse(false);
            }
        }

        if (msg.text == "scrape_profile") {
            try {
                if (msg.profile == 1) {
                    profileData = [];
                }

                var profile = {
                    name: "",
                    follower: 0,
                    companyFollower: 0,
                    address: "",
                    profileLink: "",
                    about: "",
                    job: "",
                    email: "",
                    phone: "",
                    website: [],
                    companies: [],
                    groupId: 0
                };
                await triggerDelay(2);
                profile.profileLink = window.location.href;
                if (msg.loginUser) {
                    profile.name = document.querySelector("h1.break-words").innerText;
                    console.log(profile.name);
                    if (document.querySelector("#content_collections") && document.querySelector("#content_collections").closest("section")) {
                        let follower = document.querySelector("#content_collections").closest("section").querySelector(".pvs-header__subtitle.pvs-header__optional-link.text-body-small > span").innerText;
                        if (follower.indexOf("K") > -1) follower.replace("K", "000");
                        profile.follower = follower.split(" follower")[0];
                        console.log(profile.follower);
                    }
                    //profile.address = document.querySelector(".JJpKzxvLQzUcDanWpUHzlRrOqPnfOIiv.mt2").querySelector("span.text-body-small.inline.t-black--light.break-words").innerText;
                    profile.address = document.querySelector(".mt2.relative > div > span.text-body-small.inline.t-black--light.break-words")?.innerText;
                    console.log(profile.address);
                    if (document.querySelector("#about")) {
                        profile.about = document.querySelector("#about").closest("section").querySelector(".pv-shared-text-with-see-more.full-width.t-14.t-normal.t-black.display-flex.align-items-center").querySelector("span").innerText;
                        console.log(profile.about);
                    }
                    profile.job = document.querySelector(".text-body-medium.break-words").innerText;
                    console.log(profile.job);
                    let contactBtn = document.querySelector("#top-card-text-details-contact-info");
                    if (contactBtn) {
                        contactBtn.click();
                        await triggerDelay(2);
                        let contactSection = document.querySelector("section.pv-contact-info__contact-type");
                        if (contactSection) {
                            let emailSection = document.querySelector("section.pv-contact-info__contact-type.ci-email");
                            if (emailSection) {
                                profile.email = emailSection.querySelector("a").innerText;
                            }
                            let websiteSection = document.querySelector("section.pv-contact-info__contact-type.ci-websites");
                            if (websiteSection) {
                                let personalWebsites = websiteSection.querySelectorAll("li.pv-contact-info__ci-container.link");
                                personalWebsites.forEach(function (e) {
                                    let link = e.querySelector("a").getAttribute("href");
                                    profile.website.push(link);
                                })
                            }
                        }
                    }
                }

                /**
                * Check if the company the current user works for exists.
                */
                //pv-text-details__right-panel-item-link text-align-left
                const getPostDate = async (link) => {
                    let res = await chrome.runtime.sendMessage({ text: "companyPostDate", url: link });
                    profile.companyFollower = res.follower;
                    let data = { date: res.date, follower: res.follower };
                    return data;
                }

                const func = async () => {
                    let currCompanies = [];
                    /**
                     * Scrape the company links from their experience.
                     */
                    if (
                        document.querySelector("#experience") &&
                        document.querySelector("#experience").closest("section") &&
                        document.querySelector("#experience").closest("section").querySelectorAll("li")
                    ) {

                        let experiences = document.querySelector("#experience").closest("section").querySelectorAll("li");
                        for (let i = 0; i < experiences.length; i++) {
                            console.log("++++++++2+++++++++++", experiences);
                            let e = experiences[i];

                            companyName = e.querySelector(".display-flex.flex-row.justify-space-between")?.querySelector(".display-flex.flex-wrap.align-items-center.full-height")?.querySelector("span")?.innerText;

                            let companyLink = e.querySelector("a[data-field='experience_company_logo']")?.getAttribute("href");
                            console.log("+++++4++++++++++++", companyLink);
                            if (companyLink && companyLink.indexOf("linkedin.com/company/") > -1) {
                                /**
                                 * Open company profile page.
                                 */
                                let res = await chrome.runtime.sendMessage({ text: "openCompanyProfile", url: companyLink });

                                let data;
                                if (res.profile) {
                                    try {
                                        data = await getPostDate(res.profile + "/posts?feedView=all");
                                    } catch (err) {
                                        console.log("--------scrape_profile:getPostDate-------", err);
                                    }
                                }
                                if (data)
                                    profile.companies.push({ name: companyName, url: res.website, lastPostDate: data.date, follower: data.follower });
                                else
                                    profile.companies.push({ name: companyName, url: res.website, lastPostDate: "", follower: 0 });
                            }

                        }
                    }
                }
                await func();
                sendResponse(profile);
            } catch (err) {
                console.log("--------scrape_profile-------", err);
                sendResponse(false);
            }
        }

        /**
         * Click the More button and get "Visit website" link
         */
        if (msg.text == "getCompanyLink") {
            try {
                let link = "";
                let website = document.querySelector("section.org-top-card.artdeco-card");
                if (website) {
                    link = website.querySelector("a.ember-view.org-top-card-primary-actions__action").getAttribute("href");
                    sendResponse({ website: link, profile: window.location.href });
                    window.close();
                } else {
                    let triggerItem = document.querySelector(".artdeco-dropdown__trigger.artdeco-dropdown__trigger--placement-bottom.ember-view.org-overflow-menu__dropdown-trigger.artdeco-button.artdeco-button--2.artdeco-button--secondary.artdeco-button--muted");
                    if (triggerItem) triggerItem.click();

                    function getWebsiteLink() {
                        let item = document.querySelector(".artdeco-dropdown__content-inner");
                        if (item) {
                            if (item.querySelector("a")) {
                                link = item.querySelector("a").getAttribute("href");
                            }
                        }
                        sendResponse({ website: link, profile: window.location.href });
                        window.close();
                        console.log("==========getWebsiteLink=================", item);
                    }
                    websiteLink = setTimeout(getWebsiteLink, 1500);
                }
            } catch (err) {
                console.log("--------getCompanyLink-------", err);
                sendResponse(false);
                window.close();
            }
        }

        if (msg.text == "lastPostDate") {
            try {

                var triggerDropDown = function () {

                    if (document.querySelector("ul.sort-dropdown__list")) {
                        clearInterval(trigger);
                        document.querySelector("ul.sort-dropdown__list").querySelector("li.sort-dropdown__list-item:nth-child(2)").querySelector("button").click();
                        sortTrigger = setInterval(sortPost, 2000);
                    }
                }
                var sortPost = function () {
                    console.log("7", Date.now());
                    let postedDate = 0;
                    let follower = 0;
                    if (document.querySelector(".update-components-text-view") &&
                        document.querySelector(".update-components-text-view").querySelector("span.visually-hidden")) {
                        postedDate = (document.querySelector(".update-components-text-view")
                            .querySelector("span.visually-hidden").innerText).split(" ")[0];

                    }

                    if (document.querySelector(".org-top-card-summary-info-list") &&
                        document.querySelector(".org-top-card-summary-info-list").querySelector(".org-top-card-summary-info-list__info-item:nth-child(2)")) {
                        follower = (document.querySelector(".org-top-card-summary-info-list")
                            .querySelector(".org-top-card-summary-info-list__info-item:nth-child(2)").innerText).split(" follower")[0];
                    }
                    clearInterval(sortTrigger);
                    sendResponse({ date: postDateToDays(postedDate), follower: follower });
                }

                let checkCount = 0;
                var checkLoaded = function () {
                    checkCount++;
                    if (document.querySelector("ul.sort-dropdown__list") == null) {
                        if (checkCount > 5) {
                            clearInterval(isLoaded);
                            sendResponse({ date: "", follower: 0 });
                        }
                    }
                    if (document.querySelector("div.sort-dropdown__dropdown") && document.querySelector("div.sort-dropdown__dropdown").querySelector(".artdeco-dropdown__trigger")) {

                        document.querySelector("div.sort-dropdown__dropdown").querySelector(".artdeco-dropdown__trigger").click();
                        clearInterval(isLoaded);
                        trigger = setInterval(triggerDropDown, 2000);
                    }
                }

                isLoaded = setInterval(checkLoaded, 1000);
            } catch (err) {
                console.log("--------lastPostDate-------", err);
                sendResponse(false);
            }
        }
        if (msg.text == "next_search") {
            try {
                document.querySelector("div.artdeco-pagination").querySelector("button.artdeco-pagination__button--next").click();
                sendResponse("next");
            } catch (err) {
                console.log("--------next_search-------", err);
                sendResponse(false);
            }
        }
    })();
    return true;
});

function timeOut(s) {
    return new Promise((resolve, reject) => {
        setTimeout(() => { resolve(); }, s * 1000);
    });
}

async function triggerDelay(s) {
    await timeOut(s);
}

function getCompanys(link) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ text: "openCompanyProfile", url: link }).then((res) => {
            resolve(res);
        }).catch(error => {
            reject(error)
        });
    })
}

function postDateToDays(postedDate) {
    let days = 1;
    if (postedDate) {
        let dateNum = parseInt(postedDate);
        if (postedDate.includes("yr")) {
            days = dateNum * 365;
        } else if (postedDate.includes("mo")) {
            days = dateNum * 30;
        } else if (postedDate.includes("w")) {
            days = dateNum * 7;
        } else if (postedDate.includes("d")) {
            days = dateNum;
        } else {
        }
        return days;
    }
    return 0;

}
