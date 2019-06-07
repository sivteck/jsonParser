const path = require('path')
const fs = require('fs')
const parsers = [stringParser, numberParser, nullParser, booleanParser, arrayParser, objectParser]

function nullParser (s) {
  if (!s.startsWith('null')) return null
  return [null, s.slice(4)]
}

function booleanParser (s) {
  if (s.startsWith('true')) return [true, s.slice(4)]
  if (s.startsWith('false')) return [false, s.slice(5)]
  return null
}

function isSigned (inp) {
  if (!(inp[0] === '-' || inp[0] === '+')) return null
  else return [inp[0], inp.slice(1)]
}

function isNegative (inp) {
  if (!(inp[0] === '-')) return null
  else return [inp[0], inp.slice(1)]
}

function isDigit (inp) {
  if (inp[0] === undefined) return null
  let codeC = inp[0].charCodeAt()
  if (!((codeC >= 48) && (codeC <= 57))) return null
  else return [inp[0], inp.slice(1)]
}

function isDecimalPoint (inp) {
  if (inp[0] === undefined) return null
  let codeC = inp[0]
  if (!(codeC === '.')) return null
  else return [codeC, inp.slice(1)]
}

function isExponential (inp) {
  if (!(inp[0] === 'E' || inp[0] === 'e')) return null
  else return [inp[0], inp.slice(1)]
}

function isZero (inp) {
  if (!(inp[0] === '0')) return null
  else return [inp[0], inp.slice(1)]
}

const returnsNull = (s) => null

// Transition Functions
const initFuncs = [isNegative, isZero, isDigit, returnsNull, returnsNull]
const afterSigned = [returnsNull, isZero, isDigit, returnsNull, returnsNull]
const afterZero = [returnsNull, returnsNull, returnsNull, isDecimalPoint, returnsNull]
const afterDigit = [returnsNull, returnsNull, isDigit, isDecimalPoint, isExponential]
const afterDecimalPoint = [returnsNull, returnsNull, isDigit, returnsNull, returnsNull]
const afterExponential = [isSigned, returnsNull, isDigit, returnsNull, returnsNull]
const afterFuncs = [afterSigned, afterZero, afterDigit, afterDecimalPoint, afterExponential]

function applyFuncs (arrF, inpS) {
  let ret = new Array(arrF.length).fill(null)
  let i = 0
  for (i; i < arrF.length; i++) {
    let F = arrF[i]
    let res = F(inpS)
    ret[i] = res
    if (res) return ret
  }
  if (i === arrF.length) return null
}

function pickFuncs (currState, loc) {
  if (loc === 0) return initFuncs
  for (let i = 0; i < currState.length; i++) {
    if (currState[i] !== null) return afterFuncs[i]
  }
  return null
}

function getResult (arrR) {
  for (let i = 0; i < arrR.length; i++) {
    if (arrR[i] != null) return arrR[i]
  }
  return null
}

function numberParser (s) {
  let state = new Array(initFuncs.length).fill(null)
  let parsed = ''
  let ind = 0
  let remainingString = s.slice(ind)
  let expParsed = 0
  let signParsed = 0
  let startZeroesParsed = 0
  let decimalPointsParsed = 0
  // Handle single occurence of zero
  if (s[0] === '0') {
    let tempR = s.slice(1).trimStart()
    if (tempR[0] === ',' || tempR[0] === '}' || tempR[0] === ']') return [s[0] * 1, tempR]
  }
  while (true) {
    // Pick transition functions based on state
    let transitionF = pickFuncs(state, ind)
    if (transitionF !== null) state = applyFuncs(transitionF, remainingString)
    else if (transitionF === null) return [parsed * 1, remainingString]
    // State after applying Functions
    if (state === null && ind !== 0) {
      if (isNaN(parsed * 1)) return null
      return [parsed * 1, remainingString]
    } else if (state === null && ind === 0) return null
    // using var here for code brevity
    var [v, rest] = getResult(state)
    if ((ind < 1) && (isZero(v) !== null)) startZeroesParsed++
    // Handle recurring "E/e"
    if (isExponential(remainingString)) expParsed++
    // Handle recurring "+/-"
    if (isSigned(remainingString)) signParsed++
    // Handle recurring "." and decimal after "E/e"
    if (isDecimalPoint(remainingString)) {
      if (expParsed > 0) decimalPointsParsed += 2
      else decimalPointsParsed++
    }
    // Handle starting zeroes
    if (startZeroesParsed > 0 && (decimalPointsParsed === 0)) {
      if (rest.length >= 1 && rest[0] !== '.') return null
    }
    // Check and return parsed string if there is unwanted "e/E/+/-/."
    if ((expParsed > 1) || (signParsed > 2) || (decimalPointsParsed > 1)) {
      if (isNaN(parsed * 1)) return null
    }
    // Check and return parsed string if "." occures after "e/E"
    if (expParsed > 1 && v === '.') return [parsed * 1, v + rest]
    parsed += v
    ind += 2
    remainingString = rest
    if (remainingString.length === 0 || remainingString === '0') {
      if (isNaN(parsed * 1)) return null
      return [parsed * 1, '']
    }
  }
}

const escapeChar = { '"': '"', '\\': '\\', '/': '/', 'b': '\b', 'f': '\f', 'n': '\n', 'r': '\r', 't': '\t' }

// isChar :: Char -> Parser Char
function isChar (c) {
  return function charParser (s) {
    if (s[0] === c) return [escapeChar[c], s.slice(1)]
    else return null
  }
}

function hexParser (s) {
  let fChar = s[0].charCodeAt()
  if (((fChar >= 48) && (fChar <= 57)) || fChar >= 97 || fChar <= 102 || fChar >= 65 || fChar <= 70) { return [fChar, s.slice(1)] } else return null
}

function unicodeParser (s) {
  // if (s[0] === '\\') s = s.slice(1)
  const unicodeParse = isChar('u')
  let uPR = unicodeParse(s)
  if (uPR === null) return null
  let codePoint = ''
  for (let i = 0; i < 4; i++) {
    if (hexParser(s.slice(i + 1)) != null) {
      codePoint += s[i + 1]
      continue
    } else return null
  }
  let val = String.fromCodePoint(parseInt(codePoint, 16))
  return [val, s.slice(5)]
}

function stringParser (s) {
  const justQuoteP = isChar('"')
  const quoteParser = isChar('"')
  const rSolidusParser = isChar('\\')
  const solidusParser = isChar('/')
  const backspaceParser = isChar('b')
  const formfeedParser = isChar('f')
  const newlineParser = isChar('n')
  const crParser = isChar('r')
  const htabParser = isChar('t')
  const specialParsers = [quoteParser, solidusParser, backspaceParser, formfeedParser, newlineParser, crParser, htabParser, unicodeParser, rSolidusParser]
  function applyParsers (s) {
    for (let i = 0; i < specialParsers.length; i++) {
      let aresP = specialParsers[i](s)
      if (aresP !== null) return aresP
    }
    return null
  }
  let parsed = ''
  let ind = 0
  let remainingString = s
  let quotesParsed = 0
  if (justQuoteP(s) === null) return null
  quotesParsed++
  ind++
  let flagQ = 0
  remainingString = s.slice(ind)
  while (true) {
    if (remainingString.length === 0 && quotesParsed === 2) return [parsed, remainingString]
    if (quotesParsed === 2) {
      if (flagQ === 1) {
        parsed += '"'
        flagQ -= 1
      } else return [parsed, remainingString]
    }
    let iniC = remainingString[0]
    if (iniC === '\n' || iniC === '\t' || iniC === '\r' || iniC === '\f' || iniC === '\b') return null
    let checkBackslash = rSolidusParser(remainingString)
    if (checkBackslash !== null) {
      let resP = applyParsers(remainingString.slice(1))
      if (resP === null) return null
      else {
        flagQ = 1
        parsed += resP[0]
        remainingString = resP[1]
        if (quotesParsed === 2) quotesParsed -= 1
        if (remainingString.length === 0) return null
        continue
      }
    } else flagQ = 0
    let qRes = justQuoteP(remainingString)
    if (qRes !== null) quotesParsed++
    ind++
    if (qRes === null && remainingString.length !== 0) parsed += remainingString[0]
    remainingString = remainingString.slice(1)
  }
}

function arrayParser (s) {
  if (s[0] !== '[') return null
  s = s.slice(1).trimStart()
  let arrR = []
  while (true) {
    if (s[0] === ']') return [arrR, s.slice(1)]
    for (let i = 0; i < parsers.length; i++) {
      var resHLP = parsers[i](s)
      if (resHLP !== null) {
        arrR.push(resHLP[0])
        break
      }
    }
    if (resHLP === null) return null
    s = resHLP[1].trimStart()
    if (s[0] === ']') return [arrR, s.slice(1)]
    if (s[0] === ',') {
      s = s.slice(1).trimStart()
      // Check if it is extra comma
      if (s[0] === ']') return null
    }
    s = s.trimStart()
  }
}

function valueParser (s) {
  s = s.trimStart()
  for (let i = 0; i < parsers.length; i++) {
    let resHLP = parsers[i](s)
    if (resHLP !== null) return resHLP
  }
  return null
}

function objectParser (s) {
  s = s.trimStart()
  if (s[0] !== '{') return null
  let objR = {}
  s = s.slice(1).trimStart()
  while (true) {
    s = s.trimStart()
    if (s[0] === '}') return [objR, s.slice(1)]
    let key = stringParser(s)
    if (key === null) return null
    let remS = key[1]
    s = remS.trimStart()
    if (s[0] !== ':') return null
    s = s.slice(1).trimStart()
    let value = valueParser(s)
    if (value === null) return null
    objR[key[0]] = value[0]
    s = value[1].trimStart()
    if (s[0] === ',') {
      s = s.slice(1)
      s = s.trimStart()
      // Check if it is extra comma
      if (s[0] === '}') return null
    }
    s = s.trimStart()
  }
}

function factoryParser (s) {
  return s => {
    let parseResult = valueParser(s)
    if (parseResult !== null) {
      if (parseResult[1].length > 0 && parseResult[1][0] !== '\n') return null
      else return parseResult[0]
    } else return null
  }
}

function getFiles (dirName) {
  let dirPath = path.join(dirName)
  let fileL = fs.readdirSync(dirPath)
  fileL = fileL.map(file => path.join(dirName, file))
  return fileL
}

function readFile (fileNum) {
  let dirName = './test'
  let files = getFiles(dirName)
  return [files[fileNum - 1], fs.readFileSync(files[fileNum - 1])]
}

function testInfo (fileNum) {
  let [fileName, fileContent] = readFile(fileNum)
  let mess = String.raw`
  ==Filename=====: ${fileName}
  ==FileContent==: ${String(fileContent)}`

  console.log(mess.slice(0, 300))
  console.log('=======IS VALID JSON?=================')
  console.time('custom_impl' + String(fileNum))
  let parsed = valueParser(String(fileContent))
  console.timeEnd('custom_impl' + String(fileNum))
  console.log('^^^^^^Time Taken for this implementation')
  console.time('JSimpl' + String(fileNum))
  try {
    let parseJS = JSON.parse(String(fileContent))
    console.timeEnd('JSimpl' + String(fileNum))
    console.log('^^^^^^Time taken for JSON.parse')
  } catch (err) {
    console.log('JSON.parse failed')
  }
  if (parsed !== null) {
    let s = parsed[1].trimStart()
    if (s.length > 0) {
      console.log('NO')
      return
    }
    console.log('YES')
    console.log('=======PARSED JSON====================')
    console.log(JSON.stringify(parsed[0]))
  } else console.log('NO')
  console.log('\n')
}

let count = getFiles('./test').length

for (let j = 0; j < count; j++) {
  testInfo(j + 1)
}
