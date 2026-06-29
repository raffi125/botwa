import fs from 'fs'
import path from 'path'
import config from '../../config.js'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const assetsPath = path.join(__dirname, '../../assets/images')

const gameThumbPath = path.join(assetsPath, 'ourin-games.jpg')
const rpgThumbPath = path.join(assetsPath, 'ourin-rpg.jpg')
const winnerThumbPath = path.join(assetsPath, 'ourin-winner.jpg')

let gameThumbBuffer = null
let rpgThumbBuffer = null
let winnerThumbBuffer = null

try {
    if (fs.existsSync(gameThumbPath)) {
        gameThumbBuffer = fs.readFileSync(gameThumbPath)
    }
} catch (e) {}

try {
    if (fs.existsSync(rpgThumbPath)) {
        rpgThumbBuffer = fs.readFileSync(rpgThumbPath)
    }
} catch (e) {}

try {
    if (fs.existsSync(winnerThumbPath)) {
        winnerThumbBuffer = fs.readFileSync(winnerThumbPath)
    }
} catch (e) {}

const FAST_ANSWER_PRAISES = [
    '? Kilat banget! Kamu jenius!',
    '?? Super cepat! Otak encer!',
    '?? Wuih monster! Jawab secepat kilat!',
    '?? Luar biasa! Kamu the flash!',
    '?? Precision tinggi! Langsung tepat!',
    '? Bintang! Refleks dewa!',
    '?? Legend! Kecepatan maximal!',
    '?? Premium player! Gak ada lawan!',
    '?? Tajam seperti elang!',
    '?? Big brain! IQ tinggi detected!'
]

const FAST_ANSWER_THRESHOLD = 4000
const FAST_ANSWER_BONUS = {
    exp: 50,
    balance: 500,
    limit: 1
}

function getRandomPraise() {
    return FAST_ANSWER_PRAISES[Math.floor(Math.random() * FAST_ANSWER_PRAISES.length)]
}

function getGameContextInfo(title = '?? ScravBot GAMES', body = 'Have fun playing!') {
    
    const contextInfo = {
    }
    
    if (gameThumbBuffer) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: gameThumbBuffer,
            mediaType: 1,
            renderLargerThumbnail: false,
        }
    }
    
    return contextInfo
}

function getWinnerContextInfo(title = '?? WINNER!', body = 'Selamat kamu menang!') {
    
    const contextInfo = {
    }
    
    const thumbBuffer = winnerThumbBuffer || gameThumbBuffer
    if (thumbBuffer) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: thumbBuffer,
            mediaType: 1,
            renderLargerThumbnail: false,
        }
    }
    
    return contextInfo
}

function getRpgContextInfo(title = '?? ScravBot RPG', body = 'Adventure awaits!') {
    
    const contextInfo = {
    }
    
    if (rpgThumbBuffer) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: rpgThumbBuffer,
            mediaType: 1,
            renderLargerThumbnail: true,
        }
    }
    
    return contextInfo
}

function checkFastAnswer(session) {
    if (!session?.startTime) return { isFast: false }
    
    const elapsed = Date.now() - session.startTime
    
    if (elapsed <= FAST_ANSWER_THRESHOLD) {
        return {
            isFast: true,
            elapsed: elapsed,
            praise: getRandomPraise(),
            bonus: FAST_ANSWER_BONUS
        }
    }
    
    return { isFast: false, elapsed: elapsed }
}

function createFakeQuoted(botName = 'SCRAVBOT', verified = true) {
    return {
        key: {
            fromMe: false,
            participant: '0@s.whatsapp.net',
            remoteJid: 'status@broadcast'
        },
    }
}

export { getGameContextInfo, getWinnerContextInfo, getRpgContextInfo, createFakeQuoted, checkFastAnswer, getRandomPraise, gameThumbBuffer, rpgThumbBuffer, winnerThumbBuffer, FAST_ANSWER_THRESHOLD, FAST_ANSWER_BONUS, FAST_ANSWER_PRAISES }
