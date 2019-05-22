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
  if (inp[0] === '-' || inp[0] === '+') {
    return [inp[0], inp.slice(1)]
  } else return null
}

function isNegative (inp) {
  if (inp[0] === '-') {
    return [inp[0], inp.slice(1)]
  } else return null
}

function isDigit (inp) {
  let codeC = inp[0].charCodeAt()
  if ((codeC >= 48) && (codeC <= 57)) {
    return [inp[0], inp.slice(1)]
  } else return null
}

function isDecimalPoint (inp) {
  let codeC = inp[0]
  if (codeC === '.') {
    return [codeC, inp.slice(1)]
  } else return null
}

function isExponential (inp) {
  if (inp[0] === 'E' || inp[0] === 'e') {
    return [inp[0], inp.slice(1)]
  } else return null
}

function isZero (inp) {
  if (inp[0] === '0') {
    return [inp[0], inp.slice(1)]
  }
  return null
}

function returnsNull (inp) {
  return null
}

// Transition Functions
const funcs = [isNegative, isZero, isDigit, returnsNull, returnsNull]
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
  if (loc === 0) return funcs

  for (let i = 0; i < currState.length; i++) {
    if (currState[i] !== null) {
      return afterFuncs[i]
    }
  }
  return null
}

function getResult (arrR) {
  for (let i = 0; i < arrR.length; i++) {
    if (arrR[i] != null) {
      return arrR[i]
    }
  }
  return null
}

function numberParser (s) {
  let state = new Array(funcs.length).fill(null)

  let parsed = ''
  let ind = 0
  let remainingString = s.slice(ind)
  let expParsed = 0
  let signParsed = 0
  let startZeroesParsed = 0
  let decimalPointsParsed = 0

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
    var [v, rest] = getResult(state)
    if ((ind < 2) && (isZero(v) !== null)) startZeroesParsed++
    // Handle recurring "E/e"
    if (isExponential(remainingString)) expParsed++
    // Handle recurring "+/-"
    if (isSigned(remainingString)) signParsed++
    // Handle recurring "." and decimal after "E/e"
    if (isDecimalPoint(remainingString)) {
      if (expParsed > 0) {
        decimalPointsParsed += 2
      } else decimalPointsParsed++
    }
    // Handle starting zeroes
    if (startZeroesParsed > 0 && (decimalPointsParsed === 0)) {
      if (rest.length >= 1 && rest[0] !== '.') return null
    }
    // Check and return parsed string if there is unwanted "e/E/+/-/."
    if ((expParsed > 1) || (signParsed > 2) || (decimalPointsParsed > 1)) {
      if (isNaN(parsed * 1)) return null
      return [parsed * 1, v + rest]
    }
    // Check and return parsed string if "." occures after "e/E"
    if (expParsed > 1 && v === '.') return [parsed * 1, v + rest]
    parsed += v
    ind++
    remainingString = rest
    if (remainingString.length === 0) {
      if (isNaN(parsed * 1)) return null
      return [parsed * 1, '']
    }
  }
}

// isChar :: Char -> Parser Char
function isChar (c) {
  return function charParser (s) {
    if (s[0] === c) return [c, s.slice(1)]
    else return null
  }
}

function unicodeParser (s) {
  const unicodeParse = isChar('u')
  let uPR = unicodeParse(s)
  if (uPR === null) return null
  for (let i = 0; i < 4; i++) {
    // TODO: fix for unicode >9999
    if (numberParser(s.slice(i + 1)) != null) continue
    else return null
  }
  return [s.slice(0, 5), s.slice(6)]
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

  const specialParsers = [quoteParser, solidusParser, backspaceParser, formfeedParser, newlineParser, crParser, htabParser, unicodeParser]

  function applyParsers (s) {
    for (let i = 0; i < specialParsers.length; i++) {
      let aresP = specialParsers[i](s)
      if (aresP !== null) return aresP
    }
    return null
  }

  let parsed = ''
  let ind = 0
  let remainingString = s.slice(ind)
  let quotesParsed = 0

  if (ind === 0) {
    let initC = justQuoteP(s)
    if (initC === null) {
      return null
    }
  }
  quotesParsed++
  ind++

  while (true) {
    remainingString = s.slice(ind)
    if (quotesParsed === 2) return [parsed, remainingString]
    let checkBackslash = rSolidusParser(remainingString)
    if (checkBackslash !== null) {
      let resP = applyParsers(remainingString.slice(1))

      if (resP === null) return null
      else {
        parsed += checkBackslash[0]
        parsed += resP[0]
        remainingString = resP[1]
        if (resP[0].length > 1) ind += (resP[0].length + 1)
        else ind++
      }
    }
    let qRes = justQuoteP(remainingString)
    if (qRes !== null) {
      quotesParsed++
    }
    ind++
    if (qRes === null) parsed += remainingString[0]
  }
}

function consumeSpaces (s) {
  while (s[0] === ' ' || s[0] === '\n') {
    s = s.slice(1)
  }
  return s
}

function arrayParser (s) {
  if (s[0] !== '[') return null
  const parsers = [stringParser, numberParser, nullParser, booleanParser, arrayParser, objectParser]
  s = consumeSpaces(s.slice(1))
  let arrR = []
  while (true) {
    for (let i = 0; i < parsers.length; i++) {
      var resHLP = parsers[i](s)
      if (resHLP !== null) {
        arrR.push(resHLP[0])
        break
      }
    }
    if (resHLP === null) return null
    s = consumeSpaces(resHLP[1])
    if (s[0] === ']') return [arrR, s.slice(1)]
    if (s[0] === ',') s = s.slice(1)
    s = consumeSpaces(s)
  }
}

function valueParser (s) {
  const parsers = [stringParser, numberParser, nullParser, booleanParser, arrayParser, objectParser]
  s = consumeSpaces(s)
  for (let i = 0; i < parsers.length; i++) {
    let resHLP = parsers[i](s)
    if (resHLP !== null) return resHLP
  }
  return null
}

function objectParser (s) {
  if (s[0] !== '{') return null
  let objR = {}
  s = consumeSpaces(s.slice(1))
  while (true) {
    if (s[0] === '}') return [objR, s.slice(1)]
    let key = stringParser(s)
    if (key === null) return null
    let remS = key[1]
    s = consumeSpaces(remS)
    if (s[0] !== ':') return null
    s = consumeSpaces(s.slice(1))
    let value = valueParser(s)
    if (value === null) return null
    objR[key[0]] = value[0]
    s = consumeSpaces(value[1])
    if (s[0] === ',') s = s.slice(1)
    s = consumeSpaces(s)
  }
}

const path = require('path')
const fs = require('fs')

function getFiles (dirName) {
  let dirPath = path.join(dirName)
  let fileL = fs.readdirSync(dirPath)
  fileL = fileL.map(file => path.join(dirName, file))
  return fileL
}

function readFile (fileNum) {
  let dirName = './testParsers'
  let files = getFiles(dirName)
  return [files[fileNum - 1], fs.readFileSync(files[fileNum - 1])]
}

function testInfo (fileNum) {
  let [fileName, fileContent] = readFile(fileNum)
  console.log('=======FILENAME=======================')
  console.log(fileName)
  console.log('=======FILE CONTENT (STRING)==========')
  console.log(String(fileContent))
  console.log('=======FILE CONTENT (RAW)=============')
  console.log(fileContent)
  console.log('=======IS VALID JSON?=================')
  console.log('=======PARSED JSON====================')
  console.log('\n')
}

// let count = getFiles('./test').length
//
// for (let j = 0; j < count; j++) {
//   testInfo(j + 1)
// }
