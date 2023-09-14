var profileData = [];
var trigger, sortTrigger;
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    (async () => {
        if (msg.text == "get_list") {
            try {
                let groupId = Date.now();
                //console.clear();
                if (msg.page == "search") {
                    const getUsers = async () => {
                        let users = document.querySelectorAll("li.reusable-search__result-container");
                        for (let i = 0; i < users.length; i++) {
                            let name = users[i].querySelector(".entity-result__title-text a.app-aware-link").innerHTML;
                            console.log("-----1-----", name);
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
                        console.log("-----2-----", name);
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
                console.log("==============after==========================");
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

                //console.clear();
                await triggerDelay(2);
                profile.profileLink = window.location.href;
                if (msg.loginUser) {
                    profile.name = document.querySelector("h1.break-words").innerText;
                    if (document.querySelector("#content_collections") && document.querySelector("#content_collections").closest("section")) {
                        let follower = document.querySelector("#content_collections").closest("section").querySelector(".pvs-header__subtitle.pvs-header__optional-link.text-body-small > span").innerText;
                        if (follower.indexOf("K") > -1) follower.replace("K", "000");
                        profile.follower = follower.split(" follower")[0];
                    }
                    profile.address = document.querySelector(".pv-text-details__left-panel.mt2").querySelector("span.text-body-small.inline.t-black--light.break-words").innerText;
                    if (document.querySelector("#about")) {
                        profile.about = document.querySelector("#about").closest("section").querySelector(".pv-shared-text-with-see-more.full-width.t-14.t-normal.t-black.display-flex.align-items-center").querySelector("span").innerText;
                    }
                    profile.job = document.querySelector(".text-body-medium.break-words").innerText;

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
                } else {
                    // profile.name = document.querySelector("h1.top-card-layout__title").innerText;
                    // profile.job = document.querySelector("h2.top-card-layout__headline").innerText;
                    // profile.address = document.querySelector("h3.top-card-layout__first-subline ").querySelector("div.top-card__subline-item").innerText;
                    // let follower = document.querySelector("h3.top-card-layout__first-subline ").querySelector("span.top-card__subline-item").innerText;
                    // if (follower.indexOf("K") > -1) follower = follower.replace("K", "000");
                    // profile.follower = follower.split(" follower")[0];

                    // let sectionTitle = document.querySelectorAll("h2.core-section-container__title.section-title");
                    // if (sectionTitle) {
                    //     sectionTitle.forEach(function (e) {
                    //         let title = e.innerText;
                    //         if (title.toLowerCase().indexOf("about") > -1) {
                    //             profile.about = e.closest("section").querySelector("div.core-section-container__content").querySelector("p").innerText;
                    //         }
                    //     })
                    // }

                    // let position = document.querySelector("div[data-section='currentPositionsDetails']");
                    // if (position) {
                    //     let companyName = position.querySelector("span.top-card-link__description").innerText;
                    //     let link = position.querySelector("a.top-card-link").getAttribute("href");
                    //     if (link.indexOf("linkedin.com/company/")) {
                    //         /**
                    //          * Should be open company profile
                    //          */
                    //         //link = await chrome.runtime.sendMessage({ text: "openCompanyProfile", url: link });
                    //         await chrome.runtime.sendMessage({ text: "openCompanyProfile", url: link });
                    //     }
                    //     let data = {};
                    //     if (res.profile) {
                    //         data = await getPostDate(link + '/posts?feedView=all');
                    //     }
                    //     console.log("=======data1========", data);
                    //     profile.companies.push({ name: companyName, url: link, lastPostDate: data.date, follower: data.follower });
                    // }
                    // let websites = document.querySelectorAll("dd.websites__list-item.websites__url");
                    // if (websites) {
                    //     websites.forEach(function (e) {
                    //         profile.website.push(e.querySelector("span.websites__url-text").innerText);
                    //     })
                    // }
                }

                /**
                * Check if the company the current user works for exists.
                */
                //pv-text-details__right-panel-item-link text-align-left
                const getPostDate = async (link) => {
                    let res = await chrome.runtime.sendMessage({ text: "companyPostDate", url: link });
                    console.log("----------------------in getPostdate-----", res);
                    profile.companyFollower = res.follower;
                    let data = { date: res.date, follower: res.follower };
                    return data;
                }

                const func = async () => {
                    let currCompanies = [];
                    // let companyLink = document.querySelector("ul.pv-text-details__right-panel");
                    // console.log("+++++++++++++++0000+++++++++++++++++", companyLink);
                    // if (companyLink) {
                    //     let list = companyLink.querySelectorAll(".pv-text-details__right-panel-item");
                    //     console.log("+++++++++++++++11111+++++++++++++++++", list);
                    //     list.forEach(function (e, i) {
                    //         let label = e.querySelector("button").getAttribute("aria-label");
                    //         if (label.indexOf("Current company") > -1) {

                    //             //pv-text-details__right-panel-item-text hoverable-link-text break-words text-body-small t-black
                    //             currCompanies.push(e.querySelector("button").querySelector(".pv-text-details__right-panel-item-text.hoverable-link-text.break-words.text-body-small.t-black").innerText);
                    //         }
                    //     });

                    /**
                     * Scrape the company links from their experience.
                     */
                    console.log("++++++++1+++++++++++", currCompanies);
                    // if (currCompanies) {
                    if (
                        document.querySelector("#experience") &&
                        document.querySelector("#experience").closest("section") &&
                        document.querySelector("#experience").closest("section").querySelectorAll("li.artdeco-list__item")
                    ) {

                        let experiences = document.querySelector("#experience").closest("section").querySelectorAll("li.artdeco-list__item");
                        for (let i = 0; i < experiences.length; i++) {
                            console.log("++++++++2+++++++++++", experiences);
                            let e = experiences[i];
                            //companyName = e.querySelector(".display-flex.flex-row.justify-space-between").querySelector("span.t-14.t-normal").querySelector("span").innerText;
                            
                            companyName = e.querySelector(".display-flex.flex-row.justify-space-between").querySelector(".display-flex.flex-wrap.align-items-center.full-height").querySelector("span").innerText;
                            // var companyName = "";
                            // if (e.querySelector("img.ivm-view-attr__img--centered")) {
                            //     companyName = e.querySelector("img.ivm-view-attr__img--centered").getAttribute("alt");
                            //     companyName = companyName.split(" logo")[0];
                            // } else {
                            //     companyName = e.querySelector(".display-flex.flex-row.justify-space-between").querySelector("span.t-14.t-normal").querySelector("span").innerText;
                            // }

                            console.log("++++++++3+++++++++++", companyName);
                            // for (let j = 0; j < currCompanies.length; j++) {
                            // let item = currCompanies[j]
                            // if (companyName.includes(item)) {
                            let companyLink = e.querySelector("a[data-field='experience_company_logo']").getAttribute("href");
                            console.log("+++++4++++++++++++", companyLink);
                            if (companyLink.indexOf("linkedin.com/company/") > -1) {
                                /**
                                 * Open company profile page.
                                 */
                                let res = await chrome.runtime.sendMessage({ text: "openCompanyProfile", url: companyLink });

                                // companyPostLink.push(res.profile + "/posts?feedView=all");
                                console.log('=-=-=-=-====+_+_+_+_+', res);
                                let data;
                                if (res.profile) {
                                    try {
                                         data = await getPostDate(res.profile + "/posts?feedView=all");
                                    } catch (err) {
                                        console.log("--------scrape_profile:getPostDate-------", err);
                                    }
                                }
                                console.log("=======data========", data);
                                if (data)
                                    profile.companies.push({ name: companyName, url: res.website, lastPostDate: data.date, follower: data.follower });
                                else
                                    profile.companies.push({ name: companyName, url: res.website, lastPostDate: "", follower: 0 });
                            }
                            // else {
                            //     profile.companies.push({ name: companyName, url: companyLink });
                            // }
                            // }
                        }
                    }
                    // }
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
                console.log("###############2################", website)
                if (website) {
                    link = website.querySelector("a.ember-view.org-top-card-primary-actions__action").getAttribute("href");
                    //link = website.getAttribute("href");
                    console.log("###############3################", link)
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
                        // clearInterval(websiteLink);
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
                console.log("1", Date.now());

                var triggerDropDown = function () {

                    console.log("5", document.body.innerHTML);
                    if (document.querySelector("ul.sort-dropdown__list")) {
                        console.log("6", Date.now());
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
                        //console.log("8", postDateToDays(postedDate));

                    }

                    if (document.querySelector(".org-top-card-summary-info-list") &&
                        document.querySelector(".org-top-card-summary-info-list").querySelector(".org-top-card-summary-info-list__info-item:nth-child(2)")) {
                        follower = (document.querySelector(".org-top-card-summary-info-list")
                            .querySelector(".org-top-card-summary-info-list__info-item:nth-child(2)").innerText).split(" follower")[0];
                        console.log("====companyFollower====", follower);
                    }
                    clearInterval(sortTrigger);
                    sendResponse({ date: postDateToDays(postedDate), follower: follower });
                }
                
                let checkCount = 0;
                var checkLoaded = function () {
                    checkCount++;
                    console.log("2", document.querySelector("ul.sort-dropdown__list"));
                    if (document.querySelector("ul.sort-dropdown__list") == null) {
                        if(checkCount > 5) {
                            clearInterval(isLoaded);
                            sendResponse({ date: "", follower: 0 });
                        }
                    }
                    if (document.querySelector("div.sort-dropdown__dropdown") && document.querySelector("div.sort-dropdown__dropdown").querySelector(".artdeco-dropdown__trigger")) {

                        console.log("3", Date.now());
                        document.querySelector("div.sort-dropdown__dropdown").querySelector(".artdeco-dropdown__trigger").click();
                        console.log("4", Date.now());
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

function postDateToDays(postedDate){
    let days = 1;
    if(postedDate) {
        let dateNum = parseInt(postedDate);
        if(postedDate.includes("yr")){
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
