 /* ----------------------------------------------------------------------
  *                              Foundation 
  * ---------------------------------------------------------------------- */

// Const Functionalities
const Shelf = {
    session: { 
        
    },
    local: {
        0: { screen: 1, time: 1693755750000, type: 1, url: 'https://google.com', name:'Google', icon:'https://www.google.com/favicon.ico' },
        1: { screen: 1, time: 1693755870000, type: 1, url: 'https://google.com', name:'Google 2', icon:'https://www.google.com/favicon.ico'  },
        2: { screen: 2, time: 1693755930000, type: 2, name: 'Subfolder With Google 3,4', data: [ 
            { type: 1, url: 'https://google.com', name:'Google 3', icon:'https://www.google.com/favicon.ico'  },
            { type: 1, url: 'https://google.com', name:'Google 4', icon:'https://www.google.com/favicon.ico'  }
        ]},
        3: { screen: 1, time: 1693756110000, type: 1, url: 'https://google.com', name:'Google 5', icon:'https://www.google.com/favicon.ico'  },
        4: { screen: 2, time: 1693756110000, type: 1, url: 'https://google.com', name:'Google 6', icon:'https://www.google.com/favicon.ico'  },
        5: { screen: 1, time: 1693756110000, type: 1, url: 'https://bing.com', name:'Some Extremely Long Name Blah Blah Fitness Gram Pacer Test ', icon:'https://www.bing.com/favicon.ico' },
        6: { screen: 1, time: 1693756110000, type: 1, url: 'https://bing.com', name:'Some Extremely Long Name Blah Blah Fitness Gram Pacer Test Is A Multi Stage Aerobic Capacity Test That Gets Harder As The Test Progresses ', icon:'https://www.bing.com/favicon.ico'  },
        7: { screen: 1, time: 1694756110000, type: 1, url: 'https://bing.com', name:'Some Extremely Long Name Blah Blah Fitness Gram Pacer Test Is A Multi Stage Aerobic Capacity Test That Gets Harder As The Test Progresses My Name Is Saul Ebony Raven Isabella Garcia Way Goodman Shapiro', icon:'https://www.bing.com/favicon.ico'  },
        8: { screen: 2, time: 1693756110000, type: 1, url: 'https://bing.com', name:'Some Extremely Long Name Blah Blah Fitness Gram Pacer Test Is A Multi Stage Aerobic Capacity Test That Gets Harder As The Test Progresses My Name Is Saul Ebony Raven Isabella Garcia Way Goodman Shapiro', icon:'https://www.bing.com/favicon.ico'  },
        9: { screen: 2, time: 1693756110000, type: 2, name:'Empty Subfolder', data: [] },
    },
    //local: {},

    async set(storage, items) { // Dictionary<String, any>
        for (const key in items) {
            Shelf[storage][key] = items[key]
        }
    },
    async get(storage, items) { // [String]
        var t = {}
        switch (typeof items) {
            case 'object':
                items.forEach((key) => {
                    t[key] = Shelf[storage][key]
                })
                break;
            case 'string':
                t[items] = Shelf[storage][items]
                break;
            default:
                t = Shelf[storage]
                break;
        }
        return t
    },
    async remove(storage, items) { // [String]
        for (const key in items) {
            delete Shelf[storage][key]
        }
    },
    async clear(storage) {
        Shelf[storage] = { }
    },
    async getBytesInUse(storage) {
        return 1234543
    }
}

const Ico = { // REMOVE WHEN RELEASING
    get(asset) {
        return asset
    },
    getCSS(asset){
        return `url(${asset})`
    },
    setIcon(asset) {},
    setBadgeText(text) { 
        console.log(`Badge text set to ${text}`) 
    }
}

const Stylus = {
    // Loads and interprets data from chrome storage
    // and handles the writing of changes back into storage.
    shelf: null,
    edited: false,

    screensFrom (data) { return {
        History: new Mainfolder({ 
            name: 'History',   
            data: data.history },{
            name: (e) => between(now, e.time) + " : " + e.name,
            reverse: true,
            renamable: true},
            Ico.get('/popup/assets/empty_history.png')
        ),
        Bookmarks: new Mainfolder({ 
            name: 'Bookmarks', 
            data: data.bookmarks },{
            name: (e) => e.name,
            reverse: false,
            renamable: true},
            Ico.get('/popup/assets/empty_bookmarks.png')
        )
    }},

    async load() {
        const raw = await Shelf.get('local') // This approach works fine with small amounts of data, but doesn't scale. Switch to a which-bucket function later.
        // console.log(raw)

        // console.log(raw.history)
        const history = raw.history || []
        delete raw.history

        // console.log(raw.bookmarks)
        const bookmarks = raw.bookmarks || []
        delete raw.bookmarks

        const unsorted = Object.values(raw)
        // console.log(unsorted)
        if (unsorted.length > 0) {
            Stylus.registerEdit()
            unsorted.forEach(entry => {
                if (entry.screen == ScreenEnum.History) { history.push(entry) }
                else if (entry.screen == ScreenEnum.Bookmarks) { bookmarks.push(entry) }
                entry.isNew = true
                delete entry.screen
            })
        }

        const data = { history:history, bookmarks:bookmarks }
        // console.log(JSON.stringify(data))
        Stylus.screens = Stylus.screensFrom(data)
        return Stylus.screens
    },
    registerEdit() {
        Stylus.edited = true
        Shelf.clear('local')
    },
    add(datum) {},
    clear(type) {
        Stylus.registerEdit()
        const screen = Stylus.screens[type];
        screen.container.style.display = 'none'; // More obvious transition
        screen.compress();
        screen.data = []
        return screen.constructContainer(false);
    },
    commit() {
        if (!Stylus.edited) { return }
        Shelf.set('local', {
            history: Stylus.screens.History.compress().data,
            bookmarks: Stylus.screens.Bookmarks.compress().data,
        }).then(_ => Shelf.get('local')).then(v => console.log(JSON.stringify(v)))
    }
}

const RightButtons = {
    // Works closely with Stylus to handle the editing and moving of entries.
    openButton: null,
    renameButton: null,
    deleteButton: null,
    mouseoverObject: null,

    init() {
        const openButton = setAttributes(document.createElement('button'), { class: 'right-button', style: `right: 35px; background-image:${Ico.getCSS('assets/rb_open.png')};`  })
        openButton.textContent = ""
        openButton.addEventListener('click', (e) => {
            e.stopPropagation()
            RightButtons.open(e)
        })
        RightButtons.openButton = openButton

        const renameButton = setAttributes(document.createElement('button'), { class: 'right-button', style: `right: 18px; background-image:${Ico.getCSS('assets/rb_rename.png')};` })
        renameButton.textContent = ""
        renameButton.addEventListener('click', (e) => {
            e.stopPropagation()
            RightButtons.rename(e)
        })
        RightButtons.renameButton = renameButton

        const deleteButton = setAttributes(document.createElement('button'), { class: 'right-button', style: `right: 1px; background-image:${Ico.getCSS('assets/rb_delete.png')};` })
        deleteButton.textContent = ""
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation()
            RightButtons.delete(e)
        })
        RightButtons.deleteButton = deleteButton
    },
    open(e) {
        RightButtons.mouseoverObject.open()
    },
    rename(e) {
        Stylus.registerEdit()
        // console.log(this.mouseoverObject)
        RightButtons.mouseoverObject.rename()
    },
    delete(e) {
        Stylus.registerEdit()
        RightButtons.mouseoverObject.delete()
    },

    showEditButtons(object, element, event) {
        if (!object) { return }
        RightButtons.mouseoverObject = object
        // console.log(object.name + " in")

        if (object instanceof Folder) {
            element.appendChild(RightButtons.openButton)
            RightButtons.openButton.style.visibility = 'visible'
        }
        if (object.format.renamable) {
            element.appendChild(RightButtons.renameButton)
            RightButtons.renameButton.style.visibility = 'visible'
        }
        if (object instanceof Entry) { 
            element.appendChild(RightButtons.deleteButton)
            RightButtons.deleteButton.style.visibility = 'visible'
        }
    },
    hideEditButtons(object, element, event) {
        // console.log(object.name + " out")
        // console.log(event.relatedTarget)
        // if (event.relatedTarget.classList.contains('entry')) { return }
        RightButtons.openButton.style.visibility = 'hidden'
        RightButtons.renameButton.style.visibility = 'hidden'
        RightButtons.deleteButton.style.visibility = 'hidden'
    }
}

// Utility Functions
const setAttributes = (node, attrs) => { 
    for (const [attr, value] of Object.entries(attrs)) { 
        switch (attr) {
            case "parent": value.appendChild(node);  break;
            default: node.setAttribute(attr, value); break;
        }
    }; 
    return node 
}
async function retrieveOrElse(storage, key, defaultValue, write = false) {
    const data = await Shelf.get(storage, key) 
    if (data[key] !== undefined) { return data[key] }
    if (write) { Shelf.set(storage, { [key]:defaultValue }) }
    return defaultValue
}
// function isValidHttpUrl(string) {
//     let url;
    
//     try {
//         url = new URL(string);
//     } catch (_) {
//         return false;  
//     }
  
//     return url.protocol === "http:" || url.protocol === "https:";
// }
function between(now, then) {
    var frame = Math.floor((now - then) / 1000)
    if (frame < 60) { return Math.floor(frame) + " seconds ago" }
    frame = frame / 60
    if (frame < 60) { return Math.floor(frame) + " minutes ago" }
    frame = frame / 60
    if (frame < 24) { return Math.floor(frame) + " hours ago" }
    frame = frame / 24
    if (frame < 14) { return Math.floor(frame) + " days ago" }
    frame = frame / 7
    if (frame <= 4) { return Math.floor(frame) + " weeks ago" }
    frame = frame / 4
    if (frame <= 6) { return Math.floor(frame) + " months ago" }
    return "Older"
}
function constructElement(object, color, isBold, iconURL, name, onclick) {
	const element = baseEntry.cloneNode(true)
	element.style.backgroundColor = color
	if (isBold) { element.classList.add('bold-text') }

	const [icon, label] = element.children
    if (object.isNew) {
        // alert('New entry: ' + name)
        delete object.isNew // object.registerChecked() // TODO: Might be replaceable with a simple 'delete object.isNew' (might not work) or 'delete object.sourceObject.isNew' (double dots, overstepping boundaries).
        icon.onerror = () => {
            // alert('ERROR')
            // Stylus.registerEdit() Duplicate; an edit is registered when the object is recognised as new.
            icon.onerror = null;
            // if (icon.src == icoDefault) { return }
            icon.src = icoDefault
            object.icon = icoDefault
        }
    }
	// if (iconURL) { icon.src = iconURL }
    icon.src = iconURL
	label.textContent = name

	label.addEventListener('click', onclick)
    element.addEventListener('mouseenter', (e) => { RightButtons.showEditButtons(object, element, e) })
    element.addEventListener('mouseleave', (e) => { RightButtons.hideEditButtons(object, element, e) })
    // element.addEventListener('contextmenu', async (e) => { e.preventDefault(); alert(await chrome.storage.local.getBytesInUse()) })
    // element.addEventListener('contextmenu', (e) => { e.preventDefault(); Stylus.commit() })
 	
	return element
}
function openURL(url, active) {
    console.log(url)
}


const baseEntry = function() {
    const entry = setAttributes(document.createElement("div"), { class: "entry" })
    setAttributes(document.createElement("img"),  { class: "entry-icon", parent: entry })
    setAttributes(document.createElement("label"),{ class: "entry-label", parent: entry })
    return entry
}()
const ScreenEnum = {
    History: 1,
    Bookmarks: 2
}
const TypeEnum = {
    Entry: 1,
    Subfolder: 2,
}

// Global variables
const now = Date.now()
const icoDefault = Ico.get('/popup/assets/ico_default.png')

// Structures
class Belt {
    constructor(items, initial = 0) {
        this.items = items
        this.index = initial
    }
    next() { this.index = (this.index + 1) % this.items.length; return this.items[this.index] }
    copy() { return new Belt(this.items, this.index) }
}
class Entry { // Wrapper around entry-format objects providing useful methods
    constructor(datum, format) { // Same as Subfolder
        this.sourceObject = datum
        this.format = format
    }       
    constructElement(color) {
        // console.log(this.icon)
        this.element = constructElement(this, color, false, this.icon, this.format.name(this), () => {
            // console.log('url: ' + this.url)
            this.open()
        })
        return this.element
    }
    compress() {
        return this.sourceObject
    }
    open() {
        openURL(this.url, false)
    }
    rename() { // Same as Subfolder
        const [_, label] = this.element.children
        label.style.display = 'none'

        const input = setAttributes(document.createElement('input'), { type: 'text' })
        input.value = this.name
        input.addEventListener("blur", () => { 
            const newValue = input.value || 'New ' + this.constructor.name
            input.remove()
            this.name = newValue
            label.textContent = this.format.name(this) // TODO: use bind instead of passing self?
            label.style.display = 'initial'
        })
        this.element.appendChild(input)
    }
    delete() { // Same as Subfolder
        this.sourceObject = undefined
        this.element.remove()
    }
}
Object.defineProperties(Entry.prototype, { // WTF IS THIS SYNTAX?
    time: { get() { return this.sourceObject.time }, set(value) { this.sourceObject.time = value } }, 
    name: { get() { return this.sourceObject.name }, set(value) { this.sourceObject.name = value } }, 
    url:  { get() { return this.sourceObject.url  }, set(value) { this.sourceObject.url  = value } }, 
    icon: { get() { return this.sourceObject.icon }, set(value) { this.sourceObject.icon = value } },
    isNew: { get() { return this.sourceObject.isNew }, set(value) { this.sourceObject.isNew = value } },
})
class Folder extends Entry { // Wrapper around dir-format objects providing useful methods
    compress() {
        // console.log(this.data)
        // if (this.format.reverse) { this.data = this.data.reverse() }
        this.data = this.data.map(datum => datum.compress()).filter(datum => datum)
        return this.sourceObject
    }
    open() {
        this.data.map(v => {
            if (v.type == TypeEnum.Entry) { openURL(v.url, false) }
        })
    }

    constructContainer() {
        const container = document.createElement("div");
        container.classList.add("screen");
        container.classList.add("darkgrey");

        this.container = container
        return container
    }
    load(container) {
        if (this.data.length == 0) {
            container.style.backgroundImage = 'url(' + this.emptyIcon + ')'
            return
        }
        this.data = this.data.map((datum) => {
            var constructor;
            if (datum.type == TypeEnum.Entry) {
                constructor = Entry
            } else if (datum.type == TypeEnum.Subfolder) {
                constructor = Subfolder
            }
            const add = new constructor(datum, this.format)
            return add
        })
        if (this.format.reverse) {
            var j = this.data.length - 1
            while (j >= 0) {
                container.appendChild(this.data[j].constructElement(this.colors.next(), this.container))
                j -= 1
            }
        } else {
            this.data.forEach(add => container.appendChild(add.constructElement(this.colors.next(), this.container)))
        }
    }
}
Object.defineProperties(Folder.prototype, {
    name: { get() { return this.sourceObject.name }, set(value) { this.sourceObject.name = value } }, 
    data: { get() { return this.sourceObject.data }, set(value) { this.sourceObject.data = value } },
    emptyIcon: { value:Ico.get('/popup/assets/empty_proto.png'), writable: true }
})
class Mainfolder extends Folder { // Specialized main folders
    colors = new Belt(['#353535', '#202020'])

    // Using the fact that Mainfolders only call load() once, we pull some reversal shenanigans in load and compress.
    compress() {
        // const td = this.format.reverse ? this.data.reverse() : this.data
        return { data: this.data.map(datum => datum.compress()).filter(datum => datum) }
    }
    constructor(datum, format, emptyIcon) {
        super(datum, format)
        this.emptyIcon = emptyIcon
    }
    load(container) {
        // if (this.format.reverse) { this.data = this.data.reverse() }
        super.load(container)
    }
}
class Subfolder extends Folder { // Specialized subfolders
    static dirIcon = Ico.get('/popup/assets/dir_icon.png')
    static backEntryFauxObject = {format: {}}
    colors = new Belt(['#202020', '#353535'])

    constructElement(color, container) {
        this.element = constructElement(this, color, true, Subfolder.dirIcon, this.format.name(this), () => {
            if (this.container) { console.log('Double click detected and resolved'); return }
            // alert(JSON.stringify(datum.data))
            const subcontainer = this.constructContainer(true)
            subcontainer.appendChild(
                constructElement(Subfolder.backEntryFauxObject, '202020', true, Subfolder.dirIcon, '. .', () => { this.compress() })
            )
            this.load(subcontainer)
            container.appendChild(subcontainer); // All this does is ensure the subfolder moves with its main folder when changing between MainFolders. TODO Try to remove it!
        })
        return this.element
    }

    compress() {
        if (!this.container) { return this.sourceObject }

        this.container.style.transform = 'translateX(100%)'
        setTimeout((x) => { x.remove() }, 400, this.container) 
        delete this.container

        return super.compress()
    }
    constructContainer() {
        const container = super.constructContainer()
        container.style.left = '100%';
        setTimeout(() => { container.style.transform = 'translateX(-100%)' }, 0)
        return container
    }
}


RightButtons.init()