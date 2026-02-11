process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
import './config.js';
import { createRequire } from "module";
import path, { join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import * as ws from 'ws';
import { readdirSync, statSync, unlinkSync, existsSync, readFileSync, watch, rmSync } from 'fs';
import yargs from 'yargs';
import { spawn } from 'child_process';
import lodash from 'lodash';
import chalk from 'chalk'
import syntaxerror from 'syntax-error';
import { tmpdir } from 'os';
import { format } from 'util';
import { makeWASocket, protoType, serialize } from './lib/simple.js';
import { Low, JSONFile } from 'lowdb';
import P from 'pino'
import pino from 'pino'
import Pino from 'pino'
import { mongoDB, mongoDBV2 } from './lib/mongoDB.js';
import store from './lib/store.js'
import { Boom } from '@hapi/boom'
import pkg from 'google-libphonenumber'
const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, MessageRetryMap, makeCacheableSignalKeyStore, jidNormalizedUser, PHONENUMBER_MCC } = await import('@whiskeysockets/baileys')
import moment from 'moment-timezone'
import NodeCache from 'node-cache'
import readline from 'readline'
import fs from 'fs'
import qrcode from 'qrcode-terminal'

const { CONNECTING } = ws
const { chain } = lodash
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

protoType()
serialize()

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') { return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString() };
global.__dirname = function dirname(pathURL) { return path.dirname(global.__filename(pathURL, true)) };
global.__require = function require(dir = import.meta.url) { return createRequire(dir) }

global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({ ...query, ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {}) })) : '')

global.timestamp = {
  start: new Date
}

const __dirname = global.__dirname(import.meta.url)

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[' + (opts['prefix'] || '‎z/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.,\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')

global.db = new Low(/https?:\/\//.test(opts['db'] || '') ?
  new cloudDBAdapter(opts['db']) : /mongodb(\+srv)?:\/\//i.test(opts['db']) ? (opts['mongodbv2'] ? new mongoDBV2(opts['db']) : new mongoDB(opts['db'])) :
    new JSONFile(`${opts._[0] ? opts._[0] + '_' : ''}database.json`)
)

global.DATABASE = global.db
global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return new Promise((resolve) => setInterval(async function () {
    if (!global.db.READ) {
      clearInterval(this)
      resolve(global.db.data == null ? global.loadDatabase() : global.db.data)
    }
  }, 1 * 1000))
  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read().catch(console.error)
  global.db.READ = null
  global.db.data = {
    users: {},
    chats: {},
    settings: {},
    ...(global.db.data || {})
  }
  global.db.chain = chain(global.db.data)
}
loadDatabase()

global.authFile = `BotSession`
const { state, saveState, saveCreds } = await useMultiFileAuthState(global.authFile)
const msgRetryCounterMap = (MessageRetryMap) => { }
const msgRetryCounterCache = new NodeCache()
const { version } = await fetchLatestBaileysVersion()
let phoneNumber = global.botNumberCode
const methodCodeQR = process.argv.includes("qr")
const methodCode = !!phoneNumber || process.argv.includes("code")
const MethodMobile = process.argv.includes("mobile")

const filterStrings = [
  "Q2xvc2luZyBzdGFsZSBvcGVu",
  "Q2xvc2luZyBvcGVuIHNlc3Npb24=",
  "RmFpbGVkIHRvIGRlY3J5cHQ=",
  "U2Vzc2lvbiBlcnJvcg==",
  "RXJyb3I6IEJhZCBNQUM=",
  "RGVjcnlwdGVkIG1lc3NhZ2U="
]
console.info = () => { }
console.debug = () => { }
['log', 'warn', 'error'].forEach(methodName => redefineConsoleMethod(methodName, filterStrings))

process.setMaxListeners(0)

let opcion
if (methodCodeQR) {
  opcion = '1'
}

const credsExist = fs.existsSync(`./${authFile}/creds.json`)

if (!methodCodeQR && !methodCode && !credsExist) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  })

  const question = (texto) => {
    return new Promise((resolver) => {
      rl.question(texto, (respuesta) => {
        resolver(respuesta.trim())
      })
    })
  }

  do {
    let lineM = '⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ 〉'
    opcion = await question(`╭${lineM}  
┊ ${chalk.blueBright('╭─────────────')}
┊ ${chalk.blueBright('┊')} ${chalk.blue.bgBlue.bold.cyan('LINKING METHOD')}
┊ ${chalk.blueBright('╰─────────────')}   
┊ ${chalk.blueBright('╭─────────────')}     
┊ ${chalk.blueBright('┊')} ${chalk.green.bgMagenta.bold.yellow('HOW WOULD YOU LIKE TO CONNECT?')}
┊ ${chalk.blueBright('┊')} ${chalk.bold.redBright('⇢  Option 1:')} ${chalk.greenBright('QR Code.')}
┊ ${chalk.blueBright('┊')} ${chalk.bold.redBright('⇢  Option 2:')} ${chalk.greenBright('8-digit code.')}
┊ ${chalk.blueBright('╰─────────────')}
┊ ${chalk.blueBright('╭─────────────')}     
┊ ${chalk.blueBright('┊')} ${chalk.italic.magenta('Type only the number of')}
┊ ${chalk.blueBright('┊')} ${chalk.italic.magenta('the option to connect.')}
┊ ${chalk.blueBright('╰─────────────')} 
╰${lineM}\n${chalk.bold.magentaBright('---> ')}`)


    if (!/^[1-2]$/.test(opcion)) {
      console.log(chalk.bold.redBright(`Only these numbers are allowed ${chalk.bold.greenBright("1")} O ${chalk.bold.greenBright("2")}, Letters and special characters are also not allowed.`))
    }
  } while (!/^[1-2]$/.test(opcion))

  rl.close()
}

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  mobile: MethodMobile,
  browser: ['Ubuntu', 'Edge', '24.04.3'],
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
  },
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: true,
  getMessage: async (clave) => {
    let jid = jidNormalizedUser(clave.remoteJid)
    let msg = await store.loadMessage(jid, clave.id)
    return msg?.message || ""
  },
  msgRetryCounterCache,
  defaultQueryTimeoutMs: undefined,
}

global.conn = makeWASocket(connectionOptions)

if (!credsExist) {
  if (opcion === '2' || methodCode) {
    if (!conn.authState.creds.registered) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
      })

      const question = (texto) => {
        return new Promise((resolver) => {
          rl.question(texto, (respuesta) => {
            resolver(respuesta.trim())
          })
        })
      }

      let addNumber
      if (!!phoneNumber) {
        addNumber = phoneNumber.replace(/[^0-9]/g, '')
      } else {
        do {
          phoneNumber = await question(chalk.bgBlack(chalk.bold.greenBright("\n\n✳️ Enter your number\n\nExample: 201063720595\n\n")))
          phoneNumber = phoneNumber.replace(/\D/g, '')
          if (!phoneNumber.startsWith('+')) {
            phoneNumber = `+${phoneNumber}`
          }
        } while (!await isValidPhoneNumber(phoneNumber))

        addNumber = phoneNumber.replace(/\D/g, '')
      }

      rl.close()

      setTimeout(async () => {
        let codeBot = await conn.requestPairingCode(addNumber)
        codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot
        console.log(chalk.bold.white(chalk.bgMagenta(`LINKING CODE:`)), chalk.bold.white(chalk.white(codeBot)))
      }, 3000)
    }
  }
}

conn.isInit = false
conn.well = false

if (!opts['test']) {
  setInterval(async () => {
    if (global.db.data) await global.db.write().catch(console.error)
    if (opts['autocleartmp']) try {
      clearTmp()
    } catch (e) { console.error(e) }
  }, 60 * 1000)
}

if (opts['server']) (await import('./server.js')).default(global.conn, PORT)

async function clearTmp() {
  const tmp = [tmpdir(), join(__dirname, './tmp')]
  const filename = []
  tmp.forEach(dirname => readdirSync(dirname).forEach(file => filename.push(join(dirname, file))))

  return filename.map(file => {
    const stats = statSync(file)
    if (stats.isFile() && (Date.now() - stats.mtimeMs >= 1000 * 60 * 1)) return unlinkSync(file)
    return false
  })
}

setInterval(async () => {
  await clearTmp()
  console.log(chalk.cyan(`┏━━━━━━━━━»♻️ AUTO-CLEAR 🗑️«━━━━━━━━•\n┃→ TMP FOLDER FILES DELETED\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━•`))
}, 60000)


function purgeSession() {
  try {
    let prekey = []
    if (!existsSync("./BotSession")) return
    let directorio = readdirSync("./BotSession")
    let filesFolderPreKeys = directorio.filter(file => {
      return file.startsWith('pre-key-')
    })
    prekey = [...prekey, ...filesFolderPreKeys]
    filesFolderPreKeys.forEach(files => {
      const filePath = `./BotSession/${files}`
      if (existsSync(filePath)) {
        unlinkSync(filePath)
      }
    })
  } catch (err) {
    console.error('Error in purgeSession:', err)
  }
}

function purgeOldFiles() {
  try {
    const directories = ['./BotSession/']
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    directories.forEach(dir => {
      if (!existsSync(dir)) return
      const files = readdirSync(dir)
      files.forEach(file => {
        const filePath = path.join(dir, file)
        try {
          const stats = statSync(filePath)
          if (stats.isFile() && stats.mtimeMs < oneHourAgo && file !== 'creds.json') {
            unlinkSync(filePath)
          }
        } catch (err) { }
      })
    })
  } catch (err) { }
}

setInterval(async () => {
  if (global.stopped === 'close' || !conn || !conn.user) return
  await purgeSession()
  console.log(chalk.bold.cyanBright(`\n╭» 🔵 ${global.authFile} 🔵\n│→ NON-ESSENTIAL SESSIONS DELETED\n╰─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ 🗑️♻️`))
  await purgeOldFiles()
  console.log(chalk.bold.cyanBright(`\n╭» 🟠 FILES 🟠\n│→ RESIDUAL FILES DELETED\n╰─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ 🗑️♻️`))
}, 1000 * 60 * 10)


let qrShown = false

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin, qr } = update;
  global.stopped = connection;
  if (isNewLogin) conn.isInit = true;

  if (qr && !qrShown) {
    qrShown = true
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.bold.greenBright('✅ SCAN THE QR CODE'))
    console.log(chalk.yellow('⏱️  Expires in 60 seconds'))
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))
    qrcode.generate(qr, { small: true })
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))
  }

  if (global.db.data == null) loadDatabase();

  if (connection == 'open') {
    qrShown = false
    console.log(chalk.bold.greenBright('\n▣─────────────────────────···\n│\n│§ SUCCESSFULLY CONNECTED TO WHATSAPP ✅\n│\n▣─────────────────────────···'))
  }


  if (connection === 'close') {
    qrShown = false
    const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
    let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

    if (reason === DisconnectReason.badSession) {
      console.log(chalk.bold.red(`\n[ ⚠ ] INVALID SESSION`))
      console.log(chalk.yellow(`Delete the ${global.authFile} folder manually and restart`))
    } else if (reason === DisconnectReason.connectionClosed) {
      console.log(chalk.yellow(`[ ⚠ ] Connection closed, reconnecting...`))
      await global.reloadHandler(true).catch(console.error);
    } else if (reason === DisconnectReason.connectionLost) {
      console.log(chalk.yellow(`[ ⚠ ] Connection lost, reconnecting...`))
      await global.reloadHandler(true).catch(console.error);
    } else if (reason === DisconnectReason.connectionReplaced) {
      console.log(chalk.bold.red(`\n[ ⚠ ] CONNECTION REPLACED`))
      console.log(chalk.yellow(`Another session is already active elsewhere`))
      console.log(chalk.cyan(`Deleting session...\n`))
      try {
        if (existsSync(`./${global.authFile}`)) {
          rmSync(`./${global.authFile}`, { recursive: true, force: true })
        }
      } catch (e) { }
      console.log(chalk.bold.magenta(`Session deleted, you can reconnect now\n`))
    } else if (reason === DisconnectReason.loggedOut) {
      console.log(chalk.bold.red(`\n[ ⚠ ] SESSION CLOSED`))
      console.log(chalk.yellow(`Delete the ${global.authFile} folder manually and reconnect\n`))
    } else if (reason === DisconnectReason.restartRequired) {
      console.log(chalk.yellow(`[ ⚠ ] Restart required, reconnecting...`))
      await global.reloadHandler(true).catch(console.error);
    } else if (reason === DisconnectReason.timedOut) {
      console.log(chalk.yellow(`[ ⚠ ] Timed out, reconnecting...`))
      await global.reloadHandler(true).catch(console.error);
    } else if (code === 405 || reason === 405) {
      console.log(chalk.bold.red(`\n[ ⚠ ] ERROR 405 - SESSION REPLACED`))
      console.log(chalk.cyan(`Deleting old session...\n`))
      try {
        if (existsSync(`./${global.authFile}`)) {
          rmSync(`./${global.authFile}`, { recursive: true, force: true })
        }
      } catch (e) { }
      console.log(chalk.bold.magenta(`Session deleted, you can reconnect now\n`))
    } else {
      console.log(chalk.yellow(`[ ⚠ ] Disconnection: ${reason || code || 'unknown'}`))
      await global.reloadHandler(true).catch(console.error);
    }
  }
}


process.on('uncaughtException', console.error);

let isInit = true;
let handler = await import('./handler.js')
global.reloadHandler = async function (restatConn) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error)
    if (Object.keys(Handler || {}).length) handler = Handler
  } catch (e) {
    console.error(e)
  }
  if (restatConn) {
    const oldChats = global.conn.chats
    try { global.conn.ws.close() } catch { }
    conn.ev.removeAllListeners()
    global.conn = makeWASocket(connectionOptions, { chats: oldChats })
    isInit = true
  }
  if (!isInit) {
    conn.ev.off('messages.upsert', conn.handler)
    conn.ev.off('group-participants.update', conn.participantsUpdate)
    conn.ev.off('groups.update', conn.groupsUpdate)
    conn.ev.off('message.delete', conn.onDelete)
    conn.ev.off('connection.update', conn.connectionUpdate)
    conn.ev.off('creds.update', conn.credsUpdate)
  }

  conn.welcome = '❃━═━═✦•〘⚡〙•✦═━═━❃\n*♥︎•⇓﷽ رســـالة ترحـــيب⇓•♥︎*\n\n*~ يـــا أهـــلا وســـهلا بك في نقابة  يــشــرفـــنـا بـــمـن هـو ممـــيز ، تقبلـــ/ـي تحـــياتـــنا وتقـــديرنـا ومرحـــبا بڪ ضمـــن عائلـــتنا المتــواضـــعــہ♥︎*\n*~ نتـــمنى مشـــارڪـــتڪ °وتفـــاعـــلڪ وابداعـــڪ༺.*\n❃━═━═✦•〘⚡〙•✦═━═━❃\n*⊢❉ المـــنـشـن╎❯〖@user〗*\n*⊢❉ نقـــابة╎❯〖@subject〗*\n❃━═━═✦•〘⚡〙•✦═━═━❃\n*⊢❉ الـــوصف╎❯*\n@desc'
  conn.bye = '❃━═━═✦•〘⚡〙•✦═━═━❃\n*♥︎•⇓﷽ رســـالة مـغــادره ⇓•♥︎*\n*⊢❉〖@user〗*\n**⊢❉ اتــمــنــي ان تــكــون اســتــمـتـعـت مـعـنـا*\n❃━═━═✦•〘⚡〙•✦═━═━❃'
  conn.spromote = '[⚡]⌯ @user لــقــد اصــبــحــت زعــيــمــا'
  conn.sdemote = '[⚡]⌯ @user تــعــال يـالــعــضــو'
  conn.sDesc = '[⚡]⌯ تــم تـحـديـث وصــف الــجــروب\n\n⌯ الــوصــف الــجــديــد : @desc'
  conn.sSubject = '[⚡]⌯ تـــم تــغــيــر اســم الــجــروب\n⌯ الــاســم الــجــديــد : @subject'
  conn.sIcon = '[⚡]⌯ تـــم تــغــيــر صــوره الــمــجــمــوعـــه'
  conn.sRevoke = '[⚡]⌯ تــم تـغـيـر رابــط الـمـجـمــوعــه\n⌯ الــرابــط الـجـديـد : @revoke';
  conn.handler = handler.handler.bind(global.conn)
  conn.participantsUpdate = handler.participantsUpdate.bind(global.conn)
  conn.groupsUpdate = handler.groupsUpdate.bind(global.conn)
  conn.onDelete = handler.deleteUpdate.bind(global.conn)
  conn.connectionUpdate = connectionUpdate.bind(global.conn)
  conn.credsUpdate = saveCreds.bind(global.conn, true)

  conn.ev.on('messages.upsert', conn.handler)
  conn.ev.on('group-participants.update', conn.participantsUpdate)
  conn.ev.on('groups.update', conn.groupsUpdate)
  conn.ev.on('message.delete', conn.onDelete)
  conn.ev.on('connection.update', conn.connectionUpdate)
  conn.ev.on('creds.update', conn.credsUpdate)
  isInit = false
  return true
}

const pluginFolder = global.__dirname(join(__dirname, './plugins/index'))
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}
async function filesInit() {
  for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      const file = global.__filename(join(pluginFolder, filename))
      const module = await import(file)
      global.plugins[filename] = module.default || module;
    } catch (e) {
      conn.logger.error(e)
      delete global.plugins[filename]
    }
  }
}
filesInit().then((_) => Object.keys(global.plugins)).catch(console.error)

global.reload = async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true)
    if (filename in global.plugins) {
      if (existsSync(dir)) conn.logger.info(`Plugin updated: '${filename}'`)
      else {
        conn.logger.warn(`delete plugin: '${filename}'`)
        return delete global.plugins[filename]
      }
    } else conn.logger.info(`New plugin:  '${filename}'`)
    const err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    });
    if (err) conn.logger.error(`❌ syntax error while loading '${filename}'\n${format(err)}`)
    else {
      try {
        const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`))
        global.plugins[filename] = module.default || module
      } catch (e) {
        conn.logger.error(`❌ Error requiring plugin: '${filename}\n${format(e)}'`);
      } finally {
        global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)))
      }

    }
  }
}

Object.freeze(global.reload)
watch(pluginFolder, global.reload)
await global.reloadHandler()

async function _quickTest() {
  let test = await Promise.all([
    spawn('ffmpeg'),
    spawn('ffprobe'),
    spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
    spawn('convert'),
    spawn('magick'),
    spawn('gm'),
    spawn('find', ['--version'])].map(p => {
      return Promise.race([
        new Promise(resolve => {
          p.on('close', code => {
            resolve(code !== 127)
          })
        }),
        new Promise(resolve => {
          p.on('error', _ => resolve(false))
        })
      ])
    }))

  let [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test
  console.log(test)
  let s = global.support = { ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find }
  Object.freeze(global.support)
}

_quickTest()
  .then(() => conn.logger.info('．．.\n'))
  .catch(console.error)

function redefineConsoleMethod(methodName, filterStrings) {
  const originalConsoleMethod = console[methodName]
  console[methodName] = function () {
    const message = arguments[0]
    if (typeof message === 'string' && filterStrings.some(filterString => message.includes(atob(filterString)))) {
      arguments[0] = ""
    }
    originalConsoleMethod.apply(console, arguments)
  }
}

async function isValidPhoneNumber(number) {
  try {
    number = number.replace(/\s+/g, '')
    if (number.startsWith('+521')) {
      number = number.replace('+521', '+52');
    } else if (number.startsWith('+52') && number[4] === '1') {
      number = number.replace('+52 1', '+52');
    }
    const parsedNumber = phoneUtil.parseAndKeepRawInput(number)
    return phoneUtil.isValidNumber(parsedNumber)
  } catch (error) {
    return false
  }
}
