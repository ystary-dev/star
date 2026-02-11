import { smsg } from './lib/simple.js'
import { format } from 'util'
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'
import fetch from 'node-fetch'
import ws from 'ws';

// -----  Modo Admin ---
const settings = {
    global: {
        modoadmin: false
    },
    groups: {
        // '1234567890@g.us': {
        //   modoadmin: true
        // }
    }
}

function getModoAdmin(chatId) {
    try {
        if (!chatId?.endsWith('@g.us')) {
            return settings.global?.modoadmin ?? false
        }

        if (settings.groups?.[chatId]?.modoadmin !== undefined) {
            return settings.groups[chatId].modoadmin
        }
        return settings.global?.modoadmin ?? false

    } catch (e) {
        console.error('[SETTINGS] Error en modoadmin:', e)
        return false
    }
}

/*
const settingsPath = './database/settings.json'

function getModoAdmin(chatId) {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))

    if (!chatId?.endsWith('@g.us')) {
      return settings.global?.modoadmin ?? false
    }

    if (settings.groups?.[chatId]?.modoadmin !== undefined) {
      return settings.groups[chatId].modoadmin
    }

    return settings.global?.modoadmin ?? false

  } catch (e) {
    console.error('[SETTINGS] Error leyendo modoadmin:', e)
    return false
  }
}
*/
//----------------
const { proto } = (await import('@whiskeysockets/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
    clearTimeout(this)
    resolve()
}, ms))

export async function handler(chatUpdate) {
    this.msgqueque = this.msgqueque || [];
    this.uptime = this.uptime || Date.now();
    if (!chatUpdate)
        return
    this.pushMessage(chatUpdate.messages).catch(console.error)
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m)
        return
    if (global.db.data == null)
        await global.loadDatabase()
    try {
        m = smsg(this, m) || m
        if (!m)
            return
        m.exp = 0
        m.limit = false
        m.money = false

        try {
            let user = global.db.data.users[m.sender]
            if (typeof user !== 'object')
                global.db.data.users[m.sender] = {}
            if (user) {
                if (!isNumber(user.exp)) user.exp = 0;
                if (!isNumber(user.joincount)) user.joincount = 2;
                if (!isNumber(user.money)) user.money = 10
                if (!isNumber(user.limit)) user.limit = 8
                if (!isNumber(user.level)) user.level = 1;

                if (!user.job) user.job = '';
                if (!user.wife) user.wife = ''
                if (!user.gender) user.gender = 'لم يحدد';
                if (!user.partner) user.partner = ''
                if (!('premium' in user)) user.premium = false;
                if (!('autolevelup' in user)) user.autolevelup = false;
                if (!('role' in user)) user.role = 'مـواطـن';
                if (!('registered' in user)) user.registered = false;

                if (!user.registered) {
                    if (!('name' in user)) user.name = m.name;
                    if (!isNumber(user.age)) user.age = -1;
                }

            }
            let chat = global.db.data.chats[m.chat]
            if (typeof chat !== 'object')
                global.db.data.chats[m.chat] = {}
            if (chat) {

            }
        } catch (e) {
            console.error(e)
        }

        if (!m.fromMe && opts['self']) {
            return;
        }
        if (opts['pconly'] && m.chat.endsWith('g.us')) {
            return;
        }
        if (opts['gconly'] && !m.chat.endsWith('g.us')) {
            return;
        }
        if (opts['swonly'] && m.chat !== 'status@broadcast') {
            return;
        }
        if (typeof m.text !== 'string') {
            m.text = '';
        }

        let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]

        const isROwner = [
            conn.decodeJid(global.conn.user.id),
            ...global.owner.map(([n]) => n),
            ...global.lidOwners.map(([n]) => n)
        ]
            .map(v => v.replace(/[^0-9]/g, ''))
            .some(n => [`${n}@s.whatsapp.net`, `${n}@lid`].includes(m.sender))
        const isOwner = isROwner || m.fromMe
        const isMods = isOwner || global.mods.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender) || _user.prem == true

        // if (m.isBaileys) return 
        if (isBaileysFail && m?.sender === this?.user?.jid) {
            return;
        }

        let usedPrefix
        const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
        let _prefix = global.prefix
        let match = (_prefix instanceof RegExp ?
            [[_prefix.exec(m.text), _prefix]] :
            Array.isArray(_prefix) ?
                _prefix.map(p => {
                    let re = p instanceof RegExp ? p : new RegExp(str2Regex(p))
                    return [re.exec(m.text), re]
                }) :
                typeof _prefix === 'string' ?
                    [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
                    [[[], new RegExp]]
        ).find(p => p[1])
        
        if ((usedPrefix = (match ? (match[0] || '')[0] : ''))) {
            // It's a command, proceed even if fromMe
        } else if (m.key.fromMe) {
            return
        }

        m.exp += Math.ceil(Math.random() * 10)
        // let usedPrefix // Already declared above

        const groupMetadata = (m.isGroup ? ((conn.chats[m.chat] || {}).metadata || await this.groupMetadata(m.chat).catch(_ => null)) : {}) || {}
        const participants = (m.isGroup ? groupMetadata.participants : []) || []
        const user = (m.isGroup ? participants.find(u => conn.decodeJid(u.jid) === m.sender) : {}) || {}
        const bot = (m.isGroup ? participants.find(u => conn.decodeJid(u.jid) == this.user.jid) : {}) || {}
        const isRAdmin = user?.admin == 'superadmin' || false
        const isAdmin = isRAdmin || user?.admin == 'admin' || false
        const isBotAdmin = bot?.admin || false


        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')
        for (let name in global.plugins) {
            let plugin = global.plugins[name]
            if (!plugin)
                continue
            if (plugin.disabled)
                continue
            const __filename = join(___dirname, name)
            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all.call(this, m, {
                        chatUpdate,
                        __dirname: ___dirname,
                        __filename
                    })
                } catch (e) {
                    console.error(e)

                }
            }
            if (!opts['restrict'])
                if (plugin.tags && plugin.tags.includes('admin')) {
                    continue
                }
            const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
            let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
            let match = (_prefix instanceof RegExp ?
                [[_prefix.exec(m.text), _prefix]] :
                Array.isArray(_prefix) ?
                    _prefix.map(p => {
                        let re = p instanceof RegExp ?
                            p :
                            new RegExp(str2Regex(p))
                        return [re.exec(m.text), re]
                    }) :
                    typeof _prefix === 'string' ? // String?
                        [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
                        [[[], new RegExp]]
            ).find(p => p[1])
            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(this, m, {
                    match,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename
                }))
                    continue
            }
            if (typeof plugin !== 'function')
                continue
            if ((usedPrefix = (match[0] || '')[0])) {
                let noPrefix = m.text.replace(usedPrefix, '')
                let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
                args = args || []
                let _args = noPrefix.trim().split` `.slice(1)
                let text = _args.join` `
                command = (command || '').toLowerCase()
                let fail = plugin.fail || global.dfail
                let isAccept = plugin.command instanceof RegExp ?
                    plugin.command.test(command) :
                    Array.isArray(plugin.command) ?
                        plugin.command.some(cmd => cmd instanceof RegExp ?
                            cmd.test(command) :
                            cmd === command
                        ) :
                        typeof plugin.command === 'string' ?
                            plugin.command === command :
                            false

                if (!isAccept)
                    continue
                m.plugin = name
                if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
                    let chat = global.db.data.chats[m.chat]
                    let user = global.db.data.users[m.sender]
                    let botSpam = global.db.data.settings[this.user.jid]
                    if (!['owner-unbanchat.js', 'gc-link.js', 'gc-hidetag.js', 'info-creator.js'].includes(name) && chat && chat.isBanned && !isROwner) return
                    if (name != 'owner-unbanchat.js' && name != 'owner-exec.js' && name != 'owner-exec2.js' && name != 'tool-delete.js' && chat?.isBanned && !isROwner) return
                    if (m.text && user.banned && !isROwner) {
                        if (typeof user.bannedMessageCount === 'undefined') {
                            user.bannedMessageCount = 0;
                        }
                        if (user.bannedMessageCount < 3) {
                            const messageNumber = user.bannedMessageCount + 1;
                            const messageText = `(${messageNumber}/3)${user.bannedReason ? `\n *${user.bannedReason}*` : ''}


👉 wa.me/
👉 ${fb}
`.trim();
                            //m.reply(messageText);
                            user.bannedMessageCount++;
                        } else if (user.bannedMessageCount === 3) {
                            user.bannedMessageSent = true;
                        } else {
                            return;
                        }
                        return;
                    }

                    if (user.antispam2 && isROwner) return
                    let time = global.db.data.users[m.sender].spam + 3000
                    if (new Date - global.db.data.users[m.sender].spam < 3000) return console.log(`[ SPAM ]`)
                    global.db.data.users[m.sender].spam = new Date * 1
                }

                const hl = _prefix;
                const adminMode = getModoAdmin(m.chat)
                const mystica = `${plugin.botAdmin || plugin.admin || plugin.group || plugin || noPrefix || hl || m.text.slice(0, 1) == hl || plugin.command}`;
                if (adminMode && !isOwner && !isROwner && m.isGroup && !isAdmin && mystica) return;
                if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
                    fail('owner', m, this)
                    continue
                }
                if (plugin.rowner && !isROwner) { // Real Owner
                    fail('rowner', m, this)
                    continue
                }
                if (plugin.owner && !isOwner) { // Number Owner
                    fail('owner', m, this)
                    continue
                }
                if (plugin.mods && !isMods) { // Moderator
                    fail('mods', m, this)
                    continue
                }
                if (plugin.premium && !isPrems) { // Usuarios Premium
                    fail('premium', m, this)
                    continue
                }
                if (plugin.group && !m.isGroup) { // Group Only
                    fail('group', m, this)
                    continue
                } else if (plugin.botAdmin && !isBotAdmin) { // You Admin
                    fail('botAdmin', m, this)
                    continue
                } else if (plugin.admin && !isAdmin) { // User Admin
                    fail('admin', m, this)
                    continue
                }
                if (plugin.private && m.isGroup) {
                    fail('private', m, this)
                    continue
                }
                if (plugin.register == true && _user.registered == false) {
                    fail('unreg', m, this)
                    continue
                }
                m.isCommand = true
                let xp = 'exp' in plugin ? parseInt(plugin.exp) : 1 // Ganancia de XP por comando
                if (xp > 9000)
                    m.reply('chirrido -_-') // Hehehe
                else
                    m.exp += xp
                if (!isPrems && plugin.limit && global.db.data.users[m.sender].limit < plugin.limit * 1) {
                    conn.sendMessage(m.chat, { text: `يمكنك شراء المزيد باستخدام الأمر: #شراء`, contextInfo: { externalAdReply: { mediaUrl: null, mediaType: 1, description: null, "title": wm, body: '', previewType: 0, "thumbnail": img.getRandom(), sourceUrl: [nna, md, yt, nn, tiktok].getRandom() } } }, { quoted: m })
                    continue
                }
                if (plugin.level > _user.level) {
                    conn.sendMessage(m.chat, {
                        text: `⚠️ تحتاج إلى المستوى ${plugin.level} لاستخدام هذا الأمر،
مستواك الحالي هو: ${_user.level}`, contextInfo: { externalAdReply: { mediaUrl: null, mediaType: 1, description: null, "title": wm, body: '', previewType: 0, "thumbnail": img.getRandom(), sourceUrl: [nna, md, yt, nn, tiktok].getRandom() } }
                    }, { quoted: m })
                    continue
                }
                let extra = { match, usedPrefix, noPrefix, _args, args, command, text, conn: this, participants, groupMetadata, user, bot, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: ___dirname, __filename }
                try {
                    await plugin.call(this, m, extra)
                    if (!isPrems)
                        m.limit = m.limit || plugin.limit || false
                } catch (e) {
                    m.error = e
                    console.error(e)
                    if (e) {
                        let text = format(e)
                        for (let key of Object.values(global.APIKeys))
                            text = text.replace(new RegExp(key, 'g'), '#HIDDEN#')
                        m.reply(text)
                    }
                } finally {
                    if (typeof plugin.after === 'function') {
                        try {
                            await plugin.after.call(this, m, extra)
                        } catch (e) {
                            console.error(e)
                        }
                    }
                    if (m.limit) m.reply(`تم استخدام ${+m.limit} ماس`)
                    if (m.money) m.reply(+m.money + ' مستخدم')
                }
                break
            }
        }
    } catch (e) {
        console.error(e)
    } finally {
        if (opts['queque'] && m.text) {
            const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
            if (quequeIndex !== -1)
                this.msgqueque.splice(quequeIndex, 1)
        }


        try {
            if (!opts['noprint']) await (await import(`./lib/print.js`)).default(m, this)
        } catch (e) {
            console.log(m, m.quoted, e)
        }
        let settingsREAD = global.db.data.settings[this.user.jid] || {}
        if (opts['autoread']) await this.readMessages([m.key])
        if (settingsREAD.autoread2) await this.readMessages([m.key])
        //if (settingsREAD.autoread2 == 'true') await this.readMessages([m.key])    

        if (!m.fromMem && m.text.match(/(بابي|شادو|عبدالرحمن|عمك شادو)/gi)) {
            let emot = pickRandom(["😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "🤩", "😏", "😳", "🥵", "🤯", "😱", "😨", "🤫", "🥴", "🤧", "🤑", "🤠", "🤖", "🤝", "💪", "👑", "😚", "🐱", "🐈", "🐆", "🐅", "⚡️", "🌈", "☃️", "⛄️", "🌝", "🌛", "🌜", "🍓", "🍎", "🎈", "🪄", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💘", "💝", "💟", "🌝", "😎", "🔥", "🖕", "🐦"])
            this.sendMessage(m.chat, { react: { text: emot, key: m.key } })
        }
        function pickRandom(list) { return list[Math.floor(Math.random() * list.length)] }
    }
}


export async function participantsUpdate({ id, participants, action }) {
    if (opts['self'])
        return
    if (this.isInit)
        return
    if (global.db.data == null)
        await loadDatabase()
    let chat = global.db.data.chats[id] || {}
    let text = ''
    switch (action) {
        case 'add':
            if (chat.welcome) {
                let groupMetadata = await this.groupMetadata(id) || (conn.chats[id] || {}).metadata

                for (let user of participants) {
                    let pp = './assest/pp.jpg'
                    try {
                        pp = await this.profilePictureUrl(user, 'image')
                    } catch (e) {
                    } finally {
                        let apii = await this.getFile(pp)

                        const botData = groupMetadata.participants.find(
                            u => this.decodeJid(u.id) == this.user.jid
                        ) || {}

                        const isBotAdmin = botData?.admin === "admin" || false

                        text = (chat.sWelcome || this.welcome || conn.welcome || 'أهلًا بك @user!')
                            .replace('@subject', await this.getName(id))
                            .replace(
                                '@desc',
                                groupMetadata.desc?.toString() || '👋 مرحبًا بك في المجموعة'
                            )
                            .replace('@user', '@' + user.split('@')[0])

                        if (chat.antifake && isBotAdmin && action === 'add') {
                            const numerosPermitidos = [
                                "2121", "265", "92", "91", "90", "210", "60",
                                "61", "62", "40", "48", "49", "93", "94",
                                "98", "258"
                            ]

                            if (numerosPermitidos.some(num => user.startsWith(num))) {
                                await this.sendMessage(
                                    id,
                                    {
                                        text: `@${user.split("@")[0]} ❌ الأرقام الوهمية غير مسموح بها في هذه المجموعة`,
                                        mentions: [user]
                                    },
                                    { quoted: null }
                                )

                                let response = await this.groupParticipantsUpdate(
                                    id,
                                    [user],
                                    'remove'
                                )

                                if (response[0]?.status === "404") return
                                return
                            }
                        }

                        let fkontak2 = {
                            key: {
                                participants: "0@s.whatsapp.net",
                                remoteJid: "status@broadcast",
                                fromMe: false,
                                id: "Halo"
                            },
                            message: {
                                contactMessage: {
                                    vcard:
                                        `BEGIN:VCARD
VERSION:3.0
N:Bot;Welcome;;;
FN:Welcome Bot
item1.TEL;waid=${user.split('@')[0]}:${user.split('@')[0]}
item1.X-ABLabel:Mobile
END:VCARD`
                                }
                            },
                            participant: "0@s.whatsapp.net"
                        }

                        let vn = 'https://qu.ax/cUYg.mp3'
                        let modes = ['texto', 'audio']
                        let media = modes[Math.floor(Math.random() * modes.length)]

                        if (media === 'texto') {
                            await this.sendMessage(
                                id,
                                {
                                    text,
                                    contextInfo: {
                                        forwardingScore: 9999999,
                                        isForwarded: true,
                                        mentionedJid: [user],
                                        externalAdReply: {
                                            showAdAttribution: true,
                                            renderLargerThumbnail: true,
                                            thumbnail: apii.data,
                                            title: [wm, `${wm} 😊`, '🌟'].getRandom(),
                                            containsAutoReply: true,
                                            mediaType: 1,
                                            sourceUrl: [md, nna, yt, nnn, nn, tiktok].getRandom()
                                        }
                                    }
                                },
                                { quoted: fkontak2 }
                            )
                        }

                        if (media === 'audio') {
                            await this.sendMessage(
                                id,
                                {
                                    audio: { url: vn },
                                    ptt: true,
                                    mimetype: 'audio/mpeg',
                                    fileName: 'welcome.mp3',
                                    contextInfo: {
                                        mentionedJid: [user],
                                        externalAdReply: {
                                            thumbnail: apii.data,
                                            title: '🎉 مرحبًا بك',
                                            body: [wm, `${wm} 😊`, '🌟'].getRandom(),
                                            previewType: 'PHOTO',
                                            showAdAttribution: true,
                                            sourceUrl: [md, nna, yt, nn, tiktok].getRandom()
                                        }
                                    }
                                },
                                { quoted: fkontak2 }
                            )
                        }
                    }
                }
            }
            break

        case 'promote':
        case 'daradmin':
        case 'darpoder':
            text = (chat.sPromote || this.spromote || conn.spromote || '@user ```is now Admin```')
        case 'demote':
        case 'quitarpoder':
        case 'quitaradmin':
            if (!text)
                text = (chat.sDemote || this.sdemote || conn.sdemote || '@user ```is no longer Admin```')
            text = text.replace('@user', '@' + participants[0].split('@')[0])
            if (chat.detect)
                //this.sendMessage(id, { text, mentions: this.parseMention(text) })
                break
    }
}


export async function groupsUpdate(groupsUpdate) {
    if (opts['self'])
        return
    for (const groupUpdate of groupsUpdate) {
        const id = groupUpdate.id
        if (!id) continue
        let chats = global.db.data.chats[id], text = ''
        if (!chats?.detect) continue
        // if (groupUpdate.desc) text = (chats.sDesc || this.sDesc || conn.sDesc || '```Description has been changed to```\n@desc').replace('@desc', groupUpdate.desc)
        //if (groupUpdate.subject) text = (chats.sSubject || this.sSubject || conn.sSubject || '```Subject has been changed to```\n@subject').replace('@subject', groupUpdate.subject)
        //if (groupUpdate.icon) text = (chats.sIcon || this.sIcon || conn.sIcon || '```Icon has been changed to```').replace('@icon', groupUpdate.icon)
        if (groupUpdate.revoke) text = (chats.sRevoke || this.sRevoke || conn.sRevoke || '```Group link has been changed to```\n@revoke').replace('@revoke', groupUpdate.revoke)
        if (!text) continue
        await this.sendMessage(id, { text, mentions: this.parseMention(text) })
    }
}


export async function callUpdate(callUpdate) {
    const isAnticall = global.db.data.settings[mconn.conn.user.jid].antiCall;
    if (!isAnticall) return;
    for (const nk of callUpdate) {
        if (nk.isGroup == false) {
            if (nk.status == 'offer') {
                const callmsg = await mconn.conn.reply(nk.from, `⌯ @${nk.from.split('@')[0]}*, ${nk.isVideo ? 'مكالمات فيديو' : 'المكالمات'} ممنوعه يبدو سيتم تبليكك\n-\n⌯ لو اتصلت بالغلط كلم المطور عشان يفك البلوك`, false, { mentions: [nk.from] });
                const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:;Shadow✨🍷;;;\nFN:Shadow\nORG:Shadow✨🍷\nTITLE:\nitem1.TEL;waid=201063720595:+201063720595\nitem1.X-ABLabel:Shadow✨🍷\nX-WA-BIZ-DESCRIPTION:⌯ تواصل مع مطوري لالغاء الحظر\nX-WA-BIZ-NAME:Shadow✨🍷\nEND:VCARD`;
                await mconn.conn.sendMessage(nk.from, { contacts: { displayName: 'Shadow✨🍷', contacts: [{ vcard }] } }, { quoted: callmsg });
                await mconn.conn.updateBlockStatus(nk.from, 'block');
            }
        }
    }
}

export async function deleteUpdate(message) {
    try {
        const { fromMe, id, participant } = message
        if (fromMe) return
        let msg = this.serializeM(this.loadMessage(id))
        let chat = global.db.data.chats[msg?.chat] || {}
        if (!chat?.delete) return
        if (!msg) return
        if (!msg?.isGroup) return
        const antideleteMessage = `
✦•━━━━ ∘⊰⚡⊱∘ ━━━━•✦
⌯  الــاســـم : @${participant.split`@`[0]}
⌯ بــعــت الــرســالــه ↯
✦•━━━━ ∘⊰⚡⊱∘ ━━━━•✦`.trim();
        await this.sendMessage(msg.chat, { text: antideleteMessage, mentions: [participant] }, { quoted: msg })
        this.copyNForward(msg.chat, msg).catch(e => console.log(e, msg))
    } catch (e) {
        console.error(e)
    }
}

global.dfail = (type, m, conn, usedPrefix) => {
    let msg = {
        rowner: '⌯ الـمـيـزه دي لــلـمـطـور بــس',
        owner: '⌯ الـمـيـزه دي لــلـمـطـور بــس',
        mods: '⌯ الــمـيـزه دي لـلـمالـك بـس',
        premium: '⌯ الــمــيــزه دي لــلـنـخـبـه فـقـط',
        group: '⌯ الـمـيـزه دي فـي الــجـروبـات بـس',
        private: '⌯ الـمـيـزه دي فـي الـخـاص فـقـط',
        admin: '⌯ الــمــيــزه دي لــادمــن بــس',
        botAdmin: '⌯ ارفــعــنــي ادمــن وهــشــتــغــل لــوحــدي',
        unreg: '⌯ ســجــل فــي الــبــوت بــاســتــخـدام الــامــر الــتــالــي\n* تسجيل شادو.20',
        restrict: '⌯ تــم حــظـــر الــامــر مــن قــبــل الــمــطــور',
    }[type]
    if (msg) return conn.sendMessage(m.chat, {
        text: msg,
        contextInfo: {
            mentionedJid: null
        }
    }, { quoted: m })
}

const file = global.__filename(import.meta.url, true);
watchFile(file, async () => {
    unwatchFile(file);
    console.log(chalk.redBright('Update \'handler.js\''));
    if (global.reloadHandler) console.log(await global.reloadHandler());

    if (global.conns && global.conns.length > 0) {
        const users = [...new Set([...global.conns.filter((conn) => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED).map((conn) => conn)])];
        for (const userr of users) {
            userr.subreloadHandler(false)
        }
    }

});
