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
    var out = inp[0]
    return [out, inp.slice(1)]
  } else return null
}

function isNegative (inp) {
  if (inp[0] === '-') {
    return [inp[0], inp.slice(1)]
  } else return null
}

function isDigit (inp) {
  var codeC = inp[0].charCodeAt()
  if ((codeC >= 48) && (codeC <= 57)) {
    return [inp[0], inp.slice(1)]
  } else return null
}

function isDecimalPoint (inp) {
  var codeC = inp[0]
  if (codeC === '.') {
    var out = inp[0]
    return [out, inp.slice(1)]
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

function manyParser (inp, parseF) {
  var resp = parseF(inp)
  var failed = 0
  if (resp !== null) failed = 1
  var respV = ''
  var respS = ''
  while (resp !== null) {
    var [v, rem] = resp
    respV += v
    respS += rem
    resp = parseF(inp)
  }

  if (failed !== 0) return [respV, respS]
  else return null
}

var funcs = [isNegative, isZero, isDigit, isDecimalPoint, isExponential]
var afterSigned = [returnsNull, isZero, isDigit, returnsNull, returnsNull]
var afterZero = [returnsNull, returnsNull, returnsNull, isDecimalPoint, returnsNull]
var afterDigit = [returnsNull, returnsNull, isDigit, isDecimalPoint, isExponential]
var afterDecimalPoint = [returnsNull, returnsNull, isDigit, returnsNull, returnsNull]
var afterExponential = [isSigned, returnsNull, isDigit, returnsNull, returnsNull]
var afterFuncs = [afterSigned, afterZero, afterDigit, afterDecimalPoint, afterExponential]

function applyFuncs (arrF, inpS) {
  var ret = new Array(arrF.length).fill(null)
  for (var i = 0; i < arrF.length; i++) {
    var F = arrF[i]
    var res = F(inpS)
    ret[i] = res
    if (res) return ret
  }
  if (i === arrF.length) return null
}

function pickFuncs (currState, loc) {
  if (loc === 0) return funcs

  for (var i = 0; i < currState.length; i++) {
    if (currState[i] !== null) {
      // console.log('From pickFuncs()')
      // console.log(currState)

      return afterFuncs[i]
    }
  }
  return null
}

function getResult (arrR) {
  for (var i = 0; i < arrR.length; i++) {
    if (arrR[i] != null) {
      return arrR[i]
    }
  }
  return null
}

function numberParser (s) {
  var state = new Array(funcs.length).fill(null)

  var parsed = ''
  var ind = 0
  var remainingString = s.slice(ind)
  var expParsed = 0
  var signParsed = 0
  var startZeroesParsed = 0
  var decimalPointsParsed = 0

  while (true) {
    // Pick transition functions based on state
    var transitionF = pickFuncs(state, ind)
    if (transitionF !== null) state = applyFuncs(transitionF, remainingString)
    else if (transitionF === null) return [parsed * 1, remainingString]
    // State after applying Functions
    if (state === null && ind !== 0) return [parsed * 1, remainingString]
    else if (state === null && ind === 0) return null

    var [v, rest] = getResult(state)
    if ((ind < 2) && (isZero(v) !== null)) startZeroesParsed++
    // Handle starting zeroes
    if (startZeroesParsed > 1) return [parsed * 1, v + rest]
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
    // Check and return parsed string if there is unwanted "e/E/+/-/."
    if ((expParsed > 1) || (signParsed > 2) || (decimalPointsParsed > 1)) {
      return [parsed * 1, v + rest]
    }
    // Check and return parsed string if "." occures after "e/E"
    if (expParsed > 1 && v === '.') return [parsed * 1, v + rest]
    parsed += v
    ind++
    remainingString = rest
    if (remainingString.length === 0) return [parsed * 1, '']
  }
}

function stringParser (s) {

}
