const ScreenEnum = {
    History: 1,
    Bookmarks: 2
}
const TypeEnum = {
    Entry: 1,
    Dir: 2,
}

async function retrieveOrElse(storage, key, defaultValue, write = false) {
    const data = await chrome.storage[storage].get(key)
    if (data[key] !== undefined) { return data[key] }
    if (write) { chrome.storage[storage].set({ [key]:defaultValue }) }
    return defaultValue
}

chrome.tabs.onUpdated.addListener(async (_, changeInfo, tab) => {
    const enabled = await retrieveOrElse('session', 'lanternEnabled', true, true)
    if (!tab.incognito || !enabled || changeInfo.status != 'complete' || tab.url.slice(0,9) == 'chrome://') { return }
    const timestamp = Date.now(); const curl = new URL(tab.url)
    chrome.storage.local.set({ [timestamp]: { screen: ScreenEnum.History, time:timestamp, type:TypeEnum.Entry, url:tab.url, name:tab.title, icon:curl.protocol + curl.hostname + "/favicon.ico" } }) // Bodged together a solution to prevent blank favicons 
})

// chrome.tabs.onRemoved.addListener(async (_, removeInfo) => {

// })

chrome.commands.onCommand.addListener(async (command) => {
    // const popupOpen = await retrieveOrElse('session', 'popupOpen', false, true)
    // console.log(popupOpen)
    commands[command]()
    // console.log(`Command: ${command}`);
}); // chrome.commands.getAll().then((commands) => console.log(commands))

const commands = {
    async bookmark() {
        console.log('bookmark')
        const tab = (await chrome.tabs.query({ currentWindow: true, active: true }))[0]
        const entryObject = { screen: ScreenEnum.Bookmarks, type:TypeEnum.Entry, url:tab.url, name: tab.title, icon: tab.favIconUrl }

        // if (popupOpen) { messagePopup(0, entryObject) }
        chrome.storage.local.set({ [Date.now()]: entryObject })
        chrome.action.setBadgeText({ text:'!' })
    },

    async bookmark_all() {
        console.log('bookmark_all')
        const tabs = await chrome.tabs.query({ currentWindow: true })
        const data = tabs.map((tab) => {
            return { type: TypeEnum.Entry, url: tab.url, name: tab.title, icon: tab.favIconUrl }
        })
        const dirObject = { screen: ScreenEnum.Bookmarks, type: TypeEnum.Dir, name: 'New Folder', data: data }
        
        // if (popupOpen) { messagePopup(0, dirObject) }
        chrome.storage.local.set({ [Date.now()]: dirObject })
        chrome.action.setBadgeText({ text:'!' })
    }
}

// function messagePopup(func, datum) {
//     chrome.runtime.sendMessage({
//         func: "live_update", 
//         datum: datum
//     });
// }