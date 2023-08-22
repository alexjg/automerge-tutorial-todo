import * as Automerge from "@automerge/automerge"
import * as localforage from "localforage"
import "./app.css"

let docId = window.location.hash
let channel = new BroadcastChannel(docId)

// Initialize Document
let doc
let localCopy = await localforage.getItem(docId)
if (localCopy) {
    doc = Automerge.load(localCopy)
} else {
    doc = Automerge.init()
}

// DOM elements
let container = document.getElementById('todoapp')
let link = document.getElementById('title')
let itemsDiv = document.getElementById('todo-list')
let input = document.querySelector('input')
let form = document.getElementById('form')
render(doc)

function save (doc) {
    let bytes = Automerge.save(doc)
    localforage.setItem(docId, bytes).catch(err => console.error(err))
}

function render (newDoc) {
    newDoc.items && newDoc.items.forEach((item, index) => {
        let objId = Automerge.getObjectId(item)
        let itemEl = document.getElementById(objId) 
        if (!itemEl) {
            itemEl = document.createElement('li')
            itemEl.setAttribute("id", objId)
            var label = document.createElement('label')
            label.innerHTML = item.value
            itemEl.appendChild(label)
            itemsDiv.appendChild(itemEl)
        }

        itemEl.className = item.done ? 'completed' : ''

        itemEl.onclick = (ev) => {
            doc = toggle(doc, index)
            save(doc)
            render(doc)
            updatePeers(doc)
        }
    })

    form.onsubmit = (ev) => {
        ev.preventDefault()
        doc = add(newDoc, input.value)
        save(doc)
        input.value = null
        render(doc)
        updatePeers(doc)
    }

}

channel.onmessage = function (ev) {
    let payload = ev.data

    // this message is from the same actor, ignore it
    if (payload.actorId === Automerge.getActorId(doc)) return 
    let [ newDoc, newSyncState,  ] = Automerge.receiveSyncMessage(doc, syncState, payload.msg)
    doc = newDoc
    syncState = newSyncState
    updatePeers(doc)
    save(doc)
    render(doc)
}

// typically, you'd have one sync state for each peer
let syncState = Automerge.initSyncState()

function updatePeers (doc) {
    let actorId = Automerge.getActorId(doc)
    let [nextSyncState, msg] = Automerge.generateSyncMessage(
        doc, 
        syncState
    )
    syncState = nextSyncState
    if (msg) {
        channel.postMessage({
            actorId,
            msg: msg
        })
    }
}

function toggle (doc, index) {
    return Automerge.change(doc, doc => {
        doc.items[index].done = !doc.items[index].done
    })
}

function add (doc, value) {
    return Automerge.change(doc, (doc) => {
        if (!doc.items) doc.items = []
        doc.items.push({
            value: value,
            done: false
        })
    })
}

