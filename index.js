const tsc = require('typescript')
const p = require('process')
const PORT = 8192
let image = []
const net = require('net')

// https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#transpiling-a-single-file
const tsOpts = {
  compilerOptions: {
    strict: true
  },
  reportDiagnostics: true,
}

const server = net.createServer((c) => {
  console.log('Listening on: ', PORT)

  // 'connection' listener
  if (c.remoteAddress === '::ffff:127.0.0.1') {
    console.log('client connected')
    console.log(c.remoteAddress)

    c.on('end', () => {
      console.log('client disconnected')
    })

    c.on('data', (r) => {
      console.log('rec: ', r.toString('ascii'))
      let js = r.toString('ascii')
      // Redeclaration of a const can crash the eval process, so
      // just force them to be lets.
      js = js.replace(/(const|let) /ig, 'var ')

      try {
        const imagePending = image.slice(0)
        imagePending.push(js)
        let cmd = tsc.transpileModule(imagePending.join(''), tsOpts)
        console.log(cmd)
        cmd = cmd.outputText
        console.log(cmd)
        const result = eval(cmd)
        c.write(Buffer.from(String(result)))
        image = imagePending
      } catch (reason) {
        c.write(Buffer.from(String(reason)))
      }
    })

    c.write('hello\r\n')
    c.pipe(c)
  } else {
    console.log(
      'Only localhost connections allowed, ignoring attempt from: ',
      c.remoteAddress
    )
  }
})

server.on('error', (err) => {
  throw err
})

server.listen(PORT, () => {
  console.log('server bound')
})
