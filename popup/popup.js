 /* ----------------------------------------------------------------------
  *                            Lantern 1.1.0
  *                           Created by Quoi3
  * Please send any concerns, errors, reviews, and feedback to Quixz#0033 
  * ---------------------------------------------------------------------- */ 

document.addEventListener('DOMContentLoaded', async function() { 
    // Shelf.set('session', { popupOpen: true })

    const screenSelect = document.querySelector('#screen-select')
    const screenContainer = document.querySelector('#screen-container')

    initHeader(document.body, screenContainer)
    createScreens(screenSelect, screenContainer)

    Ico.setBadgeText('')
})

// Global event handlers
window.addEventListener('blur', () => {
    // Shelf.set('session', { popupOpen: false })
    Stylus.commit()
    // window.close() // This is a lazy solution to avoid fiddling with live updates.
})

function initHeader(body, screenContainer) {
    const headerIconOn = Ico.get('/popup/assets/header_icon_on.png')
    const headerIconOff = Ico.get('/popup/assets/header_icon_off.png')
    const menuIconOn = Ico.get('/assets/menu_icons/menu_icon_on.png')
    const menuIconOff = Ico.get('/assets/menu_icons/menu_icon_off.png')

    const icon = document.querySelector('img#header-icon')
    const space = document.querySelector('label#space')
    const clearButton = document.querySelector('button#clear')

    var lanternEnabled = true

    retrieveOrElse('session', 'lanternEnabled', true, true).then(enabled => {
        lanternEnabled = enabled
        setStyle(enabled) // TODO: Extraneous call to chrome.action.setIcon involved here, add boolean argument?
    })

    Shelf.getBytesInUse('local').then(bytes => {
        space.textContent = `Storage used: ${ (bytes/1000).toFixed(1) }/10000 KB`
    })

    icon.addEventListener('click', () => { 
        lanternEnabled = !lanternEnabled
        setStyle(lanternEnabled) 
        Shelf.set('session', {'lanternEnabled': lanternEnabled})
    })
    clearButton.addEventListener("click", () => {
        // Shelf.clear('local')
        // also wipe the nodes
        const newContainer = RightButtons.clear(currentScreen.name)
        screenContainer.appendChild(newContainer)
    })

    function setStyle(active) {
        if (active) {
            icon.src = headerIconOn
            body.style.setProperty('--highlight-color', 'darkorange');
            Ico.setIcon(menuIconOn)
        } else {
            icon.src = headerIconOff
            body.style.setProperty('--highlight-color', 'mediumblue');
            Ico.setIcon(menuIconOff)
        }
    }
}

var currentScreen = null

async function createScreens(select, container) {
    const screens = Object.values(await Stylus.load())
    currentScreen = screens[0]
    // console.log(screens)
    // const colors = new Belt(['#353535', '252525'])

    var index = 0
    screens.forEach((screen) => { 
        screen.mainIndex = index

        const screenContainer = setAttributes(document.createElement('div'), { style: `left: ${100 * (index)}%`, class: 'screen', parent: container })
        screen.container = screenContainer
        // screen.decompress()

        screen.load(screenContainer)
        // console.log(screen.name)
        // console.log(screen.data)

        const screenSelect = setAttributes(document.createElement('button'), { parent: select })
        screenSelect.textContent = screen.name
        screenSelect.addEventListener('click', () => {
            screens.forEach((s) => { currentScreen = screen; s.container.style.left = `${100 * (s.mainIndex - screen.mainIndex)}%` }) // extract
        }) 
        // TODO: Move this moving logic into Stylus or Editor

        index += 1
    })
}

// chrome.runtime.onMessage.addListener(
//     function(message, sender, sendResponse) {
//         if (message.func === "live_update") {
//             // Stylus.add(message.datum)
//             console.log(message.datum)
//         }
//     }
// );