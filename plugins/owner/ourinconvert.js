import fs from 'fs'
import path from 'path'
import axios from 'axios'
import te from '../../src/lib/ourin-error.js'
const AI_SYSTEM_PROMPT = `Kamu adalah converter plugin WhatsApp Bot. Convert plugin format lama ke format ScravBot.

FORMAT OUTPUT YANG DIHARAPKAN:
\`\`\`javascript
const pluginConfig = {
    name: 'namacommand',
    alias: ['alias1', 'alias2'],
    category: 'category',
    description: 'deskripsi',
    usage: '.namacommand <args>',
    example: '.namacommand contoh',
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    // code here
    // gunakan m.args untuk arguments
    // gunakan m.text untuk full text
    // gunakan m.reply() untuk reply
    // gunakan await m.download() untuk download media
    // gunakan m.quoted?.download() untuk download quoted media
}

export { pluginConfig as config, handler }
\`\`\`

ATURAN KONVERSI:
1. conn → sock
2. args → m.args
3. text → m.text
4. quoted → m.quoted
5. m.reply() harus await
6. sock.sendMessage() harus await
7. throw 'error' → return m.reply('❌ error')
8. conn.downloadM(quoted) → await m.quoted?.download()
9. global.db.data.users[sender] → db.getUser(m.sender)
10. Styling pesan pakai emoji dan format boxes seperti:
    \`\`\`
    ╭┈┈⬡「 📋 *pake small caps* 」
    ┃ Content here
    ╰┈┈┈┈┈┈┈┈⬡
    \`\`\`

PENTING: Output HANYA code JavaScript, tanpa penjelasan!`

async function convertWithAI(code) {
    try {
        const { default: gpt52 } = await import('../../src/scraper/gpt52.js')
        const prompt = AI_SYSTEM_PROMPT + '\n\nConvert plugin ini ke format ScravBot:\n\n' + code
        
        const result = await gpt52(prompt)
        
        if (!result) {
            return null
        }
        
        const codeMatch = result.match(/```(?:javascript|js)?\s*([\s\S]*?)```/)
        if (codeMatch) {
            return codeMatch[1].trim()
        }
        
        if (result.includes('const pluginConfig') && result.includes('module.exports')) {
            return result
        }
        
        return null
    } catch (e) {
        console.error('[ScravBotConvert] AI Error:', e.message)
        return null
    }
}

const pluginConfig = {
    name: 'ScravBotconvert',
    alias: ['convertplugin', 'ScravBotplugin', 'convertScravBot'],
    category: 'owner',
    description: 'Convert format plugin external ke format ScravBot (Smart System V3)',
    usage: '.ScravBotconvert [namafile] [folder]',
    example: '.ScravBotconvert sticker sticker',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

// Parameter yang harus di-extract dari destructuring
const PARAM_MAPPING = {
    'conn': 'sock',
    'this': 'sock',
    'text': 'm.text',
    'args': 'm.args',
    'command': 'm.command',
    'usedPrefix': 'm.prefix',
    'prefix': 'm.prefix',
    'quoted': 'm.quoted',
    'isOwner': 'm.isOwner',
    'isAdmin': 'm.isAdmin',
    'isBotAdmin': 'm.isBotAdmin',
    'isGroup': 'm.isGroup',
    'isPremium': 'm.isPremium',
    'sender': 'm.sender',
    'chat': 'm.chat',
    'participants': 'groupMeta?.participants || []',
    'groupMetadata': 'groupMeta',
    'mentionedJid': 'm.mentionedJid || []',
    'mime': 'm.mimetype',
    'mimetype': 'm.mimetype',
    'body': 'm.body',
    'pushName': 'm.pushName',
    'isMedia': '!!m.mimetype',
    'isImage': 'm.type === "imageMessage"',
    'isVideo': 'm.type === "videoMessage"',
    'isSticker': 'm.type === "stickerMessage"',
    'isAudio': 'm.type === "audioMessage"',
    'isDocument': 'm.type === "documentMessage"'
}

// Property conversions
const PROPERTY_MAPPING = {
    // Message properties
    'm.msg.mimetype': 'm.mimetype',
    'm.msg': 'm.message',
    'm.mtype': 'm.type',
    'm.type': 'm.type',
    'm.messageType': 'm.type',
    'm.mediaMessage': 'm.message',
    'm.id': 'm.key.id',
    'm.key.id': 'm.key.id',
    'm.fromMe': 'm.fromMe',
    'm.isBot': 'm.fromMe',
    
    // Quoted message properties
    'q.msg.mimetype': 'm.quoted?.mimetype',
    'q.msg': 'm.quoted?.message',
    'q.mtype': 'm.quoted?.type',
    'q.type': 'm.quoted?.type',
    'q.text': 'm.quoted?.text || m.quoted?.body',
    'q.body': 'm.quoted?.body',
    'q.sender': 'm.quoted?.sender',
    'q.pushName': 'm.quoted?.pushName',
    'q.fromMe': 'm.quoted?.fromMe',
    'q.id': 'm.quoted?.key?.id',
    'quoted.text': 'm.quoted?.text || m.quoted?.body',
    'quoted.body': 'm.quoted?.body',
    'quoted.sender': 'm.quoted?.sender',
    'quoted.mimetype': 'm.quoted?.mimetype',
    'quoted.msg': 'm.quoted?.message',
    'quoted.mtype': 'm.quoted?.type',
    'quoted.type': 'm.quoted?.type',
    'quoted.id': 'm.quoted?.key?.id',
    
    // Connection methods
    'conn.sendMessage': 'sock.sendMessage',
    'conn.sendFile': 'sock.sendMessage',
    'conn.sendSticker': 'sock.sendMessage',
    'conn.sendImage': 'sock.sendMessage',
    'conn.sendVideo': 'sock.sendMessage',
    'conn.sendAudio': 'sock.sendMessage',
    'conn.sendDocument': 'sock.sendMessage',
    'conn.reply': 'm.reply',
    'conn.sendButton': 'sock.sendMessage',
    'conn.sendList': 'sock.sendMessage',
    'conn.sendContact': 'sock.sendMessage',
    'conn.sendPoll': 'sock.sendMessage',
    'conn.getName': '(jid) => jid?.split("@")[0]',
    'conn.parseMention': '(text) => [...text.matchAll(/@([0-9]{5,16})/g)].map(v => v[1] + "@s.whatsapp.net")',
    'conn.user.jid': 'sock.user?.id',
    'conn.user.id': 'sock.user?.id',
    'conn.user.name': 'sock.user?.name',
    
    // Download methods
    'conn.downloadM': 'm.quoted?.download || (() => null)',
    'conn.downloadMediaMessage': 'm.quoted?.download || (() => null)',
    'conn.getFile': 'm.download || m.quoted?.download',
    'm.download': 'm.download',
    'quoted.download': 'm.quoted?.download',
    'q.download': 'm.quoted?.download',
    
    // Group methods
    'conn.groupMetadata': 'sock.groupMetadata',
    'conn.groupCreate': 'sock.groupCreate',
    'conn.groupLeave': 'sock.groupLeave',
    'conn.groupInviteCode': 'sock.groupInviteCode',
    'conn.groupAcceptInvite': 'sock.groupAcceptInvite',
    'conn.groupParticipantsUpdate': 'sock.groupParticipantsUpdate',
    'conn.groupUpdateSubject': 'sock.groupUpdateSubject',
    'conn.groupUpdateDescription': 'sock.groupUpdateDescription',
    'conn.groupSettingUpdate': 'sock.groupSettingUpdate',
    
    // Profile methods
    'conn.profilePictureUrl': 'sock.profilePictureUrl',
    'conn.updateProfilePicture': 'sock.updateProfilePicture',
    'conn.updateProfileStatus': 'sock.updateProfileStatus',
    'conn.updateProfileName': 'sock.updateProfileName',
    
    // Other methods
    'conn.sendPresenceUpdate': 'sock.sendPresenceUpdate',
    'conn.presenceSubscribe': 'sock.presenceSubscribe',
    'conn.readMessages': 'sock.readMessages',
    
    // This references
    'this.sendMessage': 'sock.sendMessage',
    'this.reply': 'm.reply',
    'this.user': 'sock.user',
    'this.groupMetadata': 'sock.groupMetadata',
    
    // Common utilities
    'm.mentionedJid': 'm.mentionedJid || []',
    'global.db': 'db',
    'global.API': '"https://api.example.com"',
    'global.APIKeys': '{}',
    'global.owner': 'config.owner?.number || []',
    'global.mods': '[]',
    'global.prems': 'config.premiumUsers || []'
}

// Regex patterns untuk konversi kompleks
const COMPLEX_PATTERNS = [
    // await conn.sendMessage dengan format lama
    { 
        pattern: /conn\.sendMessage\s*\(\s*m\.chat\s*,\s*\{\s*image\s*:\s*\{\s*url\s*:\s*([^}]+)\s*\}\s*,\s*caption\s*:\s*([^}]+)\s*\}/g,
        replace: 'sock.sendMessage(m.chat, { image: { url: $1 }, caption: $2 }'
    },
    // m.reply dengan format buffer
    {
        pattern: /m\.reply\s*\(\s*\{\s*([^}]+)\s*\}\s*\)/g,
        replace: 'await sock.sendMessage(m.chat, { $1 }, { quoted: m })'
    },
    // throw string → return m.reply
    {
        pattern: /throw\s+['"`]([^'"`]+)['"`]/g,
        replace: "return m.reply('❌ $1')"
    },
    // if (!text) throw → if (!m.text) return m.reply
    {
        pattern: /if\s*\(\s*!text\s*\)\s*throw/g,
        replace: 'if (!m.text) return m.reply'
    },
    // if (!quoted) throw → if (!m.quoted) return m.reply
    {
        pattern: /if\s*\(\s*!quoted\s*\)\s*throw/g,
        replace: 'if (!m.quoted) return m.reply'
    },
    // await conn.downloadM(quoted) → await m.quoted?.download()
    {
        pattern: /await\s+conn\.downloadM\s*\(\s*quoted\s*\)/g,
        replace: 'await m.quoted?.download()'
    },
    {
        pattern: /await\s+conn\.downloadMediaMessage\s*\(\s*quoted\s*\)/g,
        replace: 'await m.quoted?.download()'
    },
    // conn.downloadM(m) → await m.download()
    {
        pattern: /await\s+conn\.downloadM\s*\(\s*m\s*\)/g,
        replace: 'await m.download()'
    },
    // Buffer.from(await ...) patterns
    {
        pattern: /Buffer\.from\s*\(\s*await\s+q\.download\s*\(\s*\)\s*\)/g,
        replace: 'await m.quoted?.download()'
    },
    // q = m.quoted patterns
    {
        pattern: /let\s+q\s*=\s*m\.quoted/g,
        replace: 'const q = m.quoted'
    },
    // conn.reply patterns
    {
        pattern: /conn\.reply\s*\(\s*m\.chat\s*,\s*([^,]+),\s*m\s*\)/g,
        replace: 'await m.reply($1)'
    },
    // sendFile patterns
    {
        pattern: /conn\.sendFile\s*\(\s*m\.chat\s*,\s*([^,]+),\s*['"`]([^'"`]+)['"`]\s*,\s*([^,]+),\s*m\s*\)/g,
        replace: 'await sock.sendMessage(m.chat, { image: $1, caption: $3 }, { quoted: m })'
    },
    // Sticker patterns
    {
        pattern: /conn\.sendSticker\s*\(\s*m\.chat\s*,\s*([^,]+),\s*m\s*,\s*\{([^}]*)\}\s*\)/g,
        replace: 'await sock.sendMessage(m.chat, { sticker: $1 }, { quoted: m })'
    },
    // global.db.data.users[m.sender]
    {
        pattern: /global\.db\.data\.users\[m\.sender\]/g,
        replace: 'db.getUser(m.sender)'
    },
    // global.db.data.users[sender]
    {
        pattern: /global\.db\.data\.users\[sender\]/g,
        replace: 'db.getUser(m.sender)'
    },
    // .chats[m.chat]
    {
        pattern: /global\.db\.data\.chats\[m\.chat\]/g,
        replace: 'db.getGroup(m.chat)'
    }
]

function convertEsmToCjs(code) {
    // import default
    code = code.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, "const $1 = await import('$2')")
    // import { named }
    code = code.replace(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g, (match, imports, module) => {
        const cleanImports = imports.split(',').map(i => i.trim()).join(', ')
        return `const { ${cleanImports} } = await import('${module}')`
    })
    // import * as
    code = code.replace(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, "const $1 = await import('$2')")
    // export default
    code = code.replace(/export\s+default\s+/g, 'export default  ')
    // export { named }
    code = code.replace(/export\s+\{([^}]+)\}/g, (match, exports) => {
        const items = exports.split(',').map(i => i.trim())
        return `export default  { ${items.join(', ')} }`
    })
    // export const/let/var/function/class
    code = code.replace(/export\s+(const|let|var|function|class)\s+/g, '$1 ')
    return code
}

function extractUtilityFunctions(code) {
    const handlerIndex = code.search(/(?:var|let|const)?\s*handler\s*=\s*async/)
    if (handlerIndex === -1) return { utilities: [], beforeHandler: '' }
    
    let beforeHandler = code.substring(0, handlerIndex)
    
    // Clean up imports that will be re-added
    beforeHandler = beforeHandler.replace(/^const\s+\w+\s*=\s*require\([^)]+\)\s*;?\s*$/gm, '')
    beforeHandler = beforeHandler.replace(/^import\s+.+$/gm, '')
    beforeHandler = beforeHandler.replace(/^\s*['"`]use strict['"`]\s*;?\s*$/gm, '')
    
    const funcRegex = /(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g
    const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g
    const arrowSimple = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\w+\s*=>/g
    
    let match
    const funcNames = []
    
    while ((match = funcRegex.exec(beforeHandler)) !== null) {
        funcNames.push(match[1])
    }
    while ((match = arrowRegex.exec(beforeHandler)) !== null) {
        funcNames.push(match[1])
    }
    while ((match = arrowSimple.exec(beforeHandler)) !== null) {
        if (!funcNames.includes(match[1])) funcNames.push(match[1])
    }
    
    return { utilities: funcNames, beforeHandler: beforeHandler.trim() }
}

function extractHandlerInfo(code) {
    const info = {
        commands: [],
        help: [],
        tags: '',
        limit: false,
        premium: false,
        group: false,
        private: false,
        owner: false,
        admin: false,
        description: ''
    }
    
    // Command patterns
    const cmdPatterns = [
        /handler\.command\s*=\s*\[([^\]]+)\]/i,
        /handler\.help\s*=\s*\[([^\]]+)\]/i,
        /command:\s*\[([^\]]+)\]/i,
        /alias:\s*\[([^\]]+)\]/i
    ]
    
    for (const pattern of cmdPatterns) {
        const match = code.match(pattern)
        if (match) {
            const cmds = match[1].match(/['"`]([^'"`]+)['"`]/g)
            if (cmds) {
                const parsed = cmds.map(c => c.replace(/['"`]/g, ''))
                if (info.commands.length === 0) {
                    info.commands = parsed
                } else {
                    info.commands = [...new Set([...info.commands, ...parsed])]
                }
            }
        }
    }
    
    // Tags/category patterns
    const tagsPatterns = [
        /handler\.tags\s*=\s*\[['"`]([^'"`]+)['"`]\]/i,
        /tags:\s*['"`]([^'"`]+)['"`]/i,
        /category:\s*['"`]([^'"`]+)['"`]/i,
        /handler\.category\s*=\s*['"`]([^'"`]+)['"`]/i
    ]
    
    for (const pattern of tagsPatterns) {
        const match = code.match(pattern)
        if (match) {
            info.tags = match[1]
            break
        }
    }
    
    // Description
    const descMatch = code.match(/handler\.help\s*=\s*\[['"`]([^'"`]+)['"`]\]/i) ||
                      code.match(/description:\s*['"`]([^'"`]+)['"`]/i)
    if (descMatch) info.description = descMatch[1]
    
    // Boolean flags
    const boolPatterns = {
        limit: [/handler\.limit\s*=\s*(true|\d+)/i, /limit:\s*(true|\d+)/i],
        premium: [/handler\.premium\s*=\s*true/i, /premium:\s*true/i, /handler\.prems\s*=\s*true/i],
        group: [/handler\.group\s*=\s*true/i, /group:\s*true/i],
        private: [/handler\.private\s*=\s*true/i, /private:\s*true/i],
        owner: [/handler\.owner\s*=\s*true/i, /owner:\s*true/i, /handler\.rowner\s*=\s*true/i],
        admin: [/handler\.admin\s*=\s*true/i, /admin:\s*true/i, /handler\.botAdmin\s*=\s*true/i]
    }
    
    for (const [key, patterns] of Object.entries(boolPatterns)) {
        for (const pattern of patterns) {
            if (pattern.test(code)) {
                info[key] = true
                break
            }
        }
    }
    
    return info
}

function extractHandlerBody(code) {
    const patterns = [
        /(?:var|let|const)?\s*handler\s*=\s*async\s*\(\s*m\s*,\s*\{([^}]*)\}\s*\)\s*=>\s*\{/,
        /(?:var|let|const)?\s*handler\s*=\s*async\s*\(\s*m\s*,\s*\{([^}]*)\}\s*,?\s*[^)]*\)\s*=>\s*\{/,
        /handler\s*=\s*async\s+function\s*\(\s*m\s*,\s*\{([^}]*)\}\s*\)\s*\{/,
        /(?:var|let|const)?\s*handler\s*=\s*async\s*\(\s*(\w+)\s*,\s*\{([^}]*)\}\s*\)\s*=>\s*\{/
    ]
    
    let params = ''
    let startIndex = -1
    
    for (const pattern of patterns) {
        const match = code.match(pattern)
        if (match) {
            params = match[1] || match[2] || ''
            startIndex = match.index + match[0].length
            break
        }
    }
    
    if (startIndex === -1) return null
    
    let braceCount = 1
    let endIndex = startIndex
    
    while (braceCount > 0 && endIndex < code.length) {
        if (code[endIndex] === '{') braceCount++
        if (code[endIndex] === '}') braceCount--
        endIndex++
    }
    
    const body = code.substring(startIndex, endIndex - 1)
    
    return { params: params.trim(), body: body.trim() }
}

function convertHandlerParams(params) {
    if (!params) return { neededParams: ['sock'], localVars: [] }
    
    const paramList = params.split(',').map(p => p.trim()).filter(Boolean)
    const neededParams = ['sock']
    const localVars = []
    
    for (const param of paramList) {
        const cleanParam = param.replace(/\s*=\s*.*/g, '').trim()
        
        if (PARAM_MAPPING[cleanParam]) {
            const mapped = PARAM_MAPPING[cleanParam]
            if (mapped.startsWith('m.') || mapped.startsWith('!!') || mapped.includes('===')) {
                localVars.push({ name: cleanParam, value: mapped })
            } else if (mapped === 'sock') {
                // Already included
            } else if (mapped === 'db' || mapped === 'config') {
                if (!neededParams.includes(mapped)) neededParams.push(mapped)
            } else {
                localVars.push({ name: cleanParam, value: mapped })
            }
        } else {
            // Unknown param - try to map to m.property
            localVars.push({ name: cleanParam, value: `m.${cleanParam} || null` })
        }
    }
    
    // Check if db is used in body
    return { neededParams, localVars }
}

function convertHandlerBody(body, needsDb = false) {
    if (!body || typeof body !== 'string') return ''
    
    let converted = body
    
    for (const [oldProp, newProp] of Object.entries(PROPERTY_MAPPING)) {
        try {
            const escapedOld = oldProp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            converted = converted.replace(new RegExp(escapedOld, 'g'), newProp)
        } catch {}
    }
    
    for (const { pattern, replace } of COMPLEX_PATTERNS) {
        try {
            converted = converted.replace(pattern, replace)
        } catch {}
    }
    
    converted = converted.replace(/conn\./g, 'sock.')
    converted = converted.replace(/this\./g, 'sock.')
    
    converted = converted.replace(/([^a-zA-Z])m\.reply\s*\(/g, '$1await m.reply(')
    converted = converted.replace(/([^a-zA-Z])sock\.sendMessage\s*\(/g, '$1await sock.sendMessage(')
    converted = converted.replace(/([^a-zA-Z])sock\.groupMetadata\s*\(/g, '$1await sock.groupMetadata(')
    converted = converted.replace(/([^a-zA-Z])sock\.profilePictureUrl\s*\(/g, '$1await sock.profilePictureUrl(')
    converted = converted.replace(/^m\.reply\s*\(/gm, 'await m.reply(')
    converted = converted.replace(/^sock\.sendMessage\s*\(/gm, 'await sock.sendMessage(')
    
    converted = converted.replace(/await\s+await\s+/g, 'await ')
    
    converted = converted.replace(/m\.react\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g, "await m.react('$1')")
    
    converted = converted.replace(/if\s*\(\s*!args\s*\)/g, 'if (!m.args?.length)')
    converted = converted.replace(/if\s*\(\s*!args\[0\]\s*\)/g, 'if (!m.args?.[0])')
    converted = converted.replace(/([^.])args\.join\(/g, '$1m.args?.join(')
    converted = converted.replace(/([^.])args\[(\d+)\]/g, '$1m.args?.[$2]')
    converted = converted.replace(/([^.])args\.slice\(/g, '$1m.args?.slice(')
    
    converted = converted.replace(/(\s|=|,|\()text(\s|;|,|\)|\.)/g, '$1m.text$2')
    
    converted = converted.replace(/\?\.\?/g, '?')
    converted = converted.replace(/\.\?/g, '?.')
    converted = converted.replace(/\?\?\./g, '?.')
    
    return converted
}

function detectNeededImports(code) {
    const imports = []
    
    if (code.includes('axios')) imports.push("const { default: axios } = await import('axios')")
    if (code.includes('fs.') || code.includes("fs'")) imports.push("const { default: fs } = await import('fs')")
    if (code.includes('path.') || code.includes("path'")) imports.push("const { default: path } = await import('path')")
    if (code.includes('cheerio')) imports.push("const cheerio = await import('cheerio')")
    if (code.includes('sharp')) imports.push("const { default: sharp } = await import('sharp')")
    if (code.includes('fetch(') && !code.includes('node-fetch')) imports.push("const { default: fetch } = await import('node-fetch')")
    if (code.includes('jimp') || code.includes('Jimp')) imports.push("const { default: Jimp } = await import('jimp')")
    if (code.includes('FormData')) imports.push("const { default: FormData } = await import('form-data')")
    if (code.includes('crypto.')) imports.push("const { default: crypto } = await import('crypto')")
    if (code.includes('child_process')) imports.push("const { exec, spawn } = await import('child_process')")
    if (code.includes('util.promisify')) imports.push("const { default: util } = await import('util')")
    
    return imports
}

function convertToScravBotFormat(code, info, handlerData, utilityCode) {
    const name = info.commands[0] || 'unnamed'
    const aliases = info.commands.slice(1)
    const category = info.tags || 'other'
    
    const imports = detectNeededImports(code)
    
    let converted = imports.length > 0 ? imports.join('\n') + '\n\n' : ''
    
    // Add utility code if exists
    if (utilityCode && utilityCode.length > 10) {
        let cleanUtility = utilityCode
        // Remove duplicate require statements that we already added
        cleanUtility = cleanUtility.replace(/^const\s+\w+\s*=\s*require\([^)]+\)\s*;?\s*$/gm, '')
        cleanUtility = cleanUtility.trim()
        
        if (cleanUtility) {
            converted += `// ═══════════════════════════════════════\n`
            converted += `// UTILITY FUNCTIONS (Auto-extracted)\n`
            converted += `// ═══════════════════════════════════════\n\n`
            converted += cleanUtility + '\n\n'
        }
    }
    
    // Plugin config
    converted += `const pluginConfig = {\n`
    converted += `    name: '${name}',\n`
    converted += `    alias: [${aliases.map(a => `'${a}'`).join(', ')}],\n`
    converted += `    category: '${category}',\n`
    converted += `    description: '${info.description || 'Converted plugin'}',\n`
    converted += `    usage: '.${name}',\n`
    converted += `    example: '.${name}',\n`
    converted += `    isOwner: ${info.owner},\n`
    converted += `    isPremium: ${info.premium},\n`
    converted += `    isGroup: ${info.group},\n`
    converted += `    isPrivate: ${info.private},\n`
    converted += `    isAdmin: ${info.admin},\n`
    converted += `    cooldown: 5,\n`
    converted += `    limit: ${info.limit ? '1' : '0'},\n`
    converted += `    isEnabled: true\n`
    converted += `}\n\n`
    
    // Handler
    const { neededParams, localVars } = convertHandlerParams(handlerData.params)
    
    // Check if db is used
    const needsDb = code.includes('db.') || code.includes('global.db')
    if (needsDb && !neededParams.includes('db')) neededParams.push('db')
    
    let handlerBody = convertHandlerBody(handlerData.body, needsDb)
    
    // Build local vars
    let localVarCode = ''
    for (const { name, value } of localVars) {
        localVarCode += `    const ${name} = ${value}\n`
    }
    
    converted += `async function handler(m, { ${neededParams.join(', ')} }) {\n`
    if (localVarCode) {
        converted += localVarCode + '\n'
    }
    converted += `    ${handlerBody}\n`
    converted += `}\n\n`
    
    converted += `export default  {\n`
    converted += `    config: pluginConfig,\n`
    converted += `    handler\n`
    converted += `}\n`
    
    return converted
}

async function handler(m, { sock }) {
    const quoted = m.quoted
    
    if (!quoted) {
        return m.reply(
            `🔄 *ᴏᴜʀɪɴ ᴄᴏɴᴠᴇʀᴛ ᴠ𝟱*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ 1. Kirim code plugin format lama\n` +
            `┃ 2. Reply dengan command ini\n` +
            `╰┈┈⬡\n\n` +
            `> *Features:*\n` +
            `> ◦ ESM → CJS auto convert\n` +
            `> ◦ Parameter auto mapping\n` +
            `> ◦ Utility extraction\n\n` +
            `> *Format:*\n` +
            `\`${m.prefix}ScravBotconvert\` - Convert\n` +
            `\`${m.prefix}ScravBotconvert namafile\` - Custom name\n` +
            `\`${m.prefix}ScravBotconvert namafile folder\` - Custom folder`
        )
    }
    
    let code = quoted.text || quoted.body || ''
    
    if (quoted.mimetype === 'application/javascript' || quoted.filename?.endsWith('.js')) {
        try {
            code = (await quoted.download()).toString()
        } catch (e) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gagal download file`)
        }
    }
    
    if (!code || code.length < 50) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Code terlalu pendek atau tidak valid`)
    }
    
    // Check for ESM and convert
    const isEsm = /import\s+.+\s+from\s+['"]/.test(code) || /export\s+(default|{)/.test(code)
    if (isEsm) {
        code = convertEsmToCjs(code)
    }
    
    // Check format
    const hasOldFormat = /handler\s*=\s*async\s*\(/i.test(code) && 
                         (/handler\.command\s*=/i.test(code) || /handler\.help\s*=/i.test(code) || /command:\s*\[/i.test(code)) &&
                         /module\.exports\s*=\s*handler/i.test(code)
    
    if (!hasOldFormat) {
        return m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> Format tidak dikenali\n\n` +
            `> Format yang didukung:\n` +
            `\`\`\`\nvar handler = async (m, {...}) => {\n  ...\n}\nhandler.command = ['cmd']\nexport default  handler\n\`\`\``
        )
    }
    
    await m.react('🕕')
    
    const args = m.args || []
    const cleanArgs = args
    
    let convertedCode = null
    
    if (!convertedCode) {
        try {
            const { utilities, beforeHandler } = extractUtilityFunctions(code)
            const info = extractHandlerInfo(code)
            const handlerData = extractHandlerBody(code)
            
            if (!handlerData) {
                await m.react('❌')
                return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gagal mengekstrak handler body`)
            }
            
            if (info.commands.length === 0) {
                await m.react('❌')
                return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak ditemukan handler.command`)
            }
            
            convertedCode = convertToScravBotFormat(code, info, handlerData, beforeHandler)
            
            let fileName = cleanArgs[0] || info.commands[0]
            let folderName = cleanArgs[1] || info.tags || 'other'
            
            fileName = fileName.toLowerCase().replace(/[^a-z0-9]/g, '')
            folderName = folderName.toLowerCase().replace(/[^a-z0-9]/g, '')
            
            if (!fileName) {
                await m.react('❌')
                return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Nama file tidak valid`)
            }
            
            const pluginsDir = path.join(process.cwd(), 'plugins')
            const folderPath = path.join(pluginsDir, folderName)
            const filePath = path.join(folderPath, `${fileName}.js`)
        
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true })
        }
        
        if (fs.existsSync(filePath)) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> File \`${fileName}.js\` sudah ada di \`${folderName}\``)
        }
        
        fs.writeFileSync(filePath, convertedCode)
        
        await m.react('✅')
        
        let utilInfo = utilities.length > 0 ? `┃ 🔧 ᴜᴛɪʟɪᴛʏ: \`${utilities.length} functions\`\n` : ''
        let modeInfo = `┃ 🔧 ᴍᴏᴅᴇ: \`Regex\`\n`
        
        await m.reply(
            `✅ *ᴘʟᴜɢɪɴ ᴅɪᴄᴏɴᴠᴇʀᴛ*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📝 ɴᴀᴍᴀ: \`${fileName}.js\`\n` +
            `┃ 📁 ꜰᴏʟᴅᴇʀ: \`${folderName}\`\n` +
            `┃ 🎯 ᴄᴏᴍᴍᴀɴᴅ: \`${info.commands.join(', ')}\`\n` +
            utilInfo +
            modeInfo +
            `┃ 📊 sɪᴢᴇ: \`${convertedCode.length} bytes\`\n` +
            `┃ 🔄 ᴇsᴍ: \`${isEsm ? 'Converted' : 'No'}\`\n` +
            `╰┈┈⬡\n\n` +
            `> Plugin akan auto-reload`
        )
        
        } catch (error) {
            await m.react('☢')
            await m.reply(te(m.prefix, m.command, m.pushName))
        }
    }
}

export default  {
    config: pluginConfig,
    handler
}
