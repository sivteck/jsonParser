const parser = require('./json-parser.js')
const valueParser = parser.valueParser

const path = require('path')
const fs = require('fs')

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
