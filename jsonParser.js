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
}

function returnsNull (inp) {
  return null
}

var funcs = [isSigned, isDigit, isDecimalPoint, isExponential]
var afterSigned = [returnsNull, isDigit, returnsNull, returnsNull]
var afterDigit = [returnsNull, isDigit, isDecimalPoint, isExponential]
var afterDecimalPoint = [returnsNull, isDigit, returnsNull, returnsNull]
var afterExponential = [isSigned, isDigit, returnsNull, returnsNull]
var afterFuncs = [afterSigned, afterDigit, afterDecimalPoint, afterExponential]

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

  while (true) {
    var transitionF = pickFuncs(state, ind)
    if (transitionF !== null) state = applyFuncs(transitionF, remainingString)
    else if (transitionF === null) return [parsed, remainingString]
    // console.log('State after applying Functions')
    // console.log(state)
    if (state === null && ind !== 0) return [parsed, remainingString]
    else if (state === null && ind === 0) return null

    // console.log('Transition Functions')
    // console.log(transitionF)
    // console.log('getResult Function')
    // console.log(getResult(state))
    var [v, rest] = getResult(state)
    parsed += v
    ind++
    remainingString = rest
    if (remainingString.length === 0) return [parsed, '']
  }
}
